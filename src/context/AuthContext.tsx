import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { auth, db, isFirebaseConfigured, createFirebaseAuthUser } from '../services/firebaseConfig';
import { demoManager, CRMService } from '../services/storage';
import {
  signInWithEmailAndPassword, signOut, sendPasswordResetEmail, onAuthStateChanged,
  EmailAuthProvider, reauthenticateWithCredential, updatePassword,
} from 'firebase/auth';
import { doc, getDocFromServer } from 'firebase/firestore';
import { firebaseErrorMessage, loginEmail, verifyUserProfile } from '../utils/userProfile';

interface AuthContextType {
  currentUser: UserProfile | null;
  isDemoMode: boolean;
  isLoading: boolean;
  authError: string | null;
  login: (emailOrUsername: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  sendResetPassword: (email: string) => Promise<void>;
  enterDemoMode: (asUserUidOrRole?: string) => void;
  switchDemoUser: (uid: string) => void;
  clearAuthError: () => void;
  toggleDemoMode: () => void;
  setDemoMode: (enabled: boolean) => void;
  registerRealUser: (userData: Omit<UserProfile, 'uid' | 'createdAt'>, password: string) => Promise<UserProfile>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const ACTIVE_USER_KEY = 'casadedeus_active_user_uid';
const DEMO_USER_KEY = 'casadedeus_demo_user_uid';
const DEMO_MODE_ACTIVE_KEY = 'casadedeus_is_demo_mode';
const SESSION_ACTIVE_KEY = 'casadedeus_session_active';

function clearRealSession() {
  for (const key of [SESSION_ACTIVE_KEY, ACTIVE_USER_KEY, 'casadedeus_real_user_uid', 'casadedeus_real_user_profile']) sessionStorage.removeItem(key);
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(() => localStorage.getItem(DEMO_MODE_ACTIVE_KEY) === 'true');
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    let disposed = false;
    let revision = 0;
    setIsLoading(true);
    setCurrentUser(null);
    if (isDemoMode) {
      const uid = sessionStorage.getItem(DEMO_USER_KEY) || sessionStorage.getItem(ACTIVE_USER_KEY);
      const user = demoManager.getUsers().find(item => item.uid === uid);
      setCurrentUser(sessionStorage.getItem(SESSION_ACTIVE_KEY) === 'true' && user?.active ? user : null);
      setIsLoading(false);
      return;
    }
    // Cached profiles are never credentials, including when leaving the demo.
    clearRealSession();
    if (!isFirebaseConfigured || !auth || !db) {
      setIsLoading(false);
      return;
    }
    const realAuth = auth;
    const realDb = db;
    const unsubscribe = onAuthStateChanged(realAuth, fbUser => {
      const requestRevision = ++revision;
      if (disposed) return;
      setCurrentUser(null);
      if (!fbUser) {
        clearRealSession();
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      const isCurrent = () => !disposed && requestRevision === revision && realAuth.currentUser?.uid === fbUser.uid;
      void (async () => {
        try {
          const snapshot = await getDocFromServer(doc(realDb, 'users', fbUser.uid));
          if (!isCurrent()) return;
          if (!snapshot.exists()) throw new Error('Sua conta foi autenticada, mas o perfil de acesso não foi cadastrado. Peça ao administrador para conferir users/' + fbUser.uid + '.');
          const profile = verifyUserProfile(snapshot.data(), fbUser.uid, fbUser.email);
          sessionStorage.setItem(SESSION_ACTIVE_KEY, 'true');
          sessionStorage.setItem(ACTIVE_USER_KEY, fbUser.uid);
          setCurrentUser(profile);
          setAuthError(null);
          setIsLoading(false);
        } catch (error) {
          if (!isCurrent()) return;
          clearRealSession();
          setCurrentUser(null);
          setAuthError(firebaseErrorMessage(error));
          setIsLoading(false);
          // No default admin, local login, or automatic account creation on failure.
          try { await signOut(realAuth); } catch (signOutError) { console.warn('Falha ao encerrar sessão:', signOutError); }
        }
      })();
    }, error => {
      if (disposed) return;
      ++revision;
      clearRealSession();
      setCurrentUser(null);
      setAuthError(firebaseErrorMessage(error));
      setIsLoading(false);
    });
    return () => { disposed = true; ++revision; unsubscribe(); };
  }, [isDemoMode]);

  const enterDemoMode = (uidOrRole = 'admin') => {
    const users = demoManager.getUsers();
    const user = users.find(item => item.uid === uidOrRole) || users.find(item => item.role === uidOrRole) || users[0];
    if (!user) return;
    sessionStorage.setItem(SESSION_ACTIVE_KEY, 'true');
    sessionStorage.setItem(DEMO_USER_KEY, user.uid);
    sessionStorage.setItem(ACTIVE_USER_KEY, user.uid);
    localStorage.setItem(DEMO_MODE_ACTIVE_KEY, 'true');
    setIsDemoMode(true);
    setCurrentUser(user);
    setAuthError(null);
    setIsLoading(false);
  };

  const switchDemoUser = (uid: string) => {
    if (!isDemoMode) return;
    const user = demoManager.getUsers().find(item => item.uid === uid && item.active);
    if (user) {
      sessionStorage.setItem(DEMO_USER_KEY, uid);
      sessionStorage.setItem(ACTIVE_USER_KEY, uid);
      sessionStorage.setItem(SESSION_ACTIVE_KEY, 'true');
      setCurrentUser(user);
    }
  };

  const login = async (input: string, password: string) => {
    setAuthError(null);
    setIsLoading(true);
    try {
      if (isDemoMode) {
        const value = input.trim().toLowerCase();
        const user = demoManager.getUsers().find(item => item.username?.toLowerCase() === value || item.email.toLowerCase() === value);
        if (!user || password !== (user.password || (user.role === 'admin' ? '123456' : '123'))) throw new Error('Login ou senha de demonstração incorretos.');
        if (!user.active) throw new Error('Este acesso de demonstração está desativado.');
        switchDemoUser(user.uid);
        setIsLoading(false);
        return;
      }
      if (!isFirebaseConfigured || !auth || !db) throw new Error('O Firebase não está configurado. Configure a conexão para acessar os dados reais.');
      await signInWithEmailAndPassword(auth, loginEmail(input), password);
      // The single auth observer verifies the profile and finishes loading.
    } catch (error) {
      setAuthError(firebaseErrorMessage(error));
      setIsLoading(false);
      throw error;
    }
  };

  const registerRealUser = async (userData: Omit<UserProfile, 'uid' | 'createdAt'>, password: string): Promise<UserProfile> => {
    if (isDemoMode) return demoManager.addUser({ ...userData, password });
    if (!isFirebaseConfigured || !auth?.currentUser || !db) throw new Error('Entre novamente com a conta do administrador para cadastrar um acesso.');
    if (currentUser?.uid !== auth.currentUser.uid || currentUser.role !== 'admin') throw new Error('Somente o administrador pode cadastrar acessos.');
    if (password.length < 6) throw new Error('A senha deve ter no mínimo 6 caracteres.');
    const { password: _password, ...data } = userData;
    const email = data.email.trim().toLowerCase();
    let createdProfile: UserProfile | undefined;
    await createFirebaseAuthUser(email, password, async uid => {
      createdProfile = await CRMService.createUser({ ...data, email, uid }, false);
    });
    return createdProfile!;
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    if (!currentUser) throw new Error('Nenhum usuário conectado.');
    if (newPassword.length < 6) throw new Error('A nova senha deve ter no mínimo 6 caracteres.');
    if (isDemoMode) {
      if (currentPassword !== (currentUser.password || (currentUser.role === 'admin' ? '123456' : '123'))) throw new Error('Senha atual incorreta.');
      setCurrentUser(demoManager.updateUser(currentUser.uid, { password: newPassword }));
      return;
    }
    if (!auth?.currentUser?.email || auth.currentUser.uid !== currentUser.uid) throw new Error('Entre novamente para alterar sua senha.');
    try {
      await reauthenticateWithCredential(auth.currentUser, EmailAuthProvider.credential(auth.currentUser.email, currentPassword));
      await updatePassword(auth.currentUser, newPassword);
    } catch (error) { throw new Error(firebaseErrorMessage(error)); }
  };

  const logout = async () => {
    clearRealSession();
    sessionStorage.removeItem(DEMO_USER_KEY);
    setCurrentUser(null);
    setAuthError(null);
    setIsLoading(false);
    if (auth) await signOut(auth);
  };

  const sendResetPassword = async (email: string) => {
    if (!email.trim()) throw new Error('Informe o e-mail cadastrado para recuperação.');
    if (isDemoMode) return;
    if (!isFirebaseConfigured || !auth) throw new Error('O Firebase não está configurado.');
    try { await sendPasswordResetEmail(auth, loginEmail(email)); }
    catch (error) { throw new Error(firebaseErrorMessage(error)); }
  };

  const setDemoMode = (enabled: boolean) => {
    if (enabled === isDemoMode) return;
    if (enabled) { enterDemoMode(); return; }
    localStorage.setItem(DEMO_MODE_ACTIVE_KEY, 'false');
    setCurrentUser(null);
    setIsLoading(true);
    setIsDemoMode(false);
  };

  return <AuthContext.Provider value={{
    currentUser, isDemoMode, isLoading, authError, login, logout, changePassword, sendResetPassword,
    enterDemoMode, switchDemoUser, registerRealUser, setDemoMode,
    toggleDemoMode: () => setDemoMode(!isDemoMode), clearAuthError: () => setAuthError(null),
  }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
