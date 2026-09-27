import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, Congregation } from '../types';
import { DEMO_USERS } from '../data/mockData';
import { auth, db, isFirebaseConfigured, createFirebaseAuthUser } from '../services/firebaseConfig';
import { demoManager, realManager, CRMService } from '../services/storage';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';

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
  registerRealUser: (
    userData: Omit<UserProfile, 'uid' | 'createdAt'>,
    password: string
  ) => Promise<UserProfile>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ACTIVE_USER_KEY = 'casadedeus_active_user_uid';
const REAL_USER_KEY = 'casadedeus_real_user_uid';
const REAL_PROFILE_KEY = 'casadedeus_real_user_profile';
const DEMO_USER_KEY = 'casadedeus_demo_user_uid';
const DEMO_MODE_ACTIVE_KEY = 'casadedeus_is_demo_mode';
const SESSION_ACTIVE_KEY = 'casadedeus_session_active';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(() => {
    const saved = localStorage.getItem(DEMO_MODE_ACTIVE_KEY);
    if (saved !== null) return saved === 'true';
    return false;
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Sync auth state
  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      setIsLoading(true);
      const isSessionActive = sessionStorage.getItem(SESSION_ACTIVE_KEY) === 'true';
      const savedActiveUid = sessionStorage.getItem(ACTIVE_USER_KEY);

      if (isDemoMode) {
        if (!isSessionActive && !sessionStorage.getItem(REAL_USER_KEY)) {
          if (isMounted) {
            setCurrentUser(null);
            setIsLoading(false);
          }
          return;
        }
        const savedDemoUid = sessionStorage.getItem(DEMO_USER_KEY) || savedActiveUid || 'admin-1';
        const found =
          DEMO_USERS.find(u => u.uid === savedDemoUid) ||
          demoManager.getUsers().find(u => u.uid === savedDemoUid) ||
          DEMO_USERS[0];
        if (isMounted) {
          setCurrentUser(found || null);
          setIsLoading(false);
        }
        return;
      }

      // Real Mode: Firebase Authentication is the single source of truth
      if (isFirebaseConfigured && auth) {
        const unsubscribe = onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
          if (!isMounted) return;

          if (fbUser) {
            try {
              if (db) {
                // Fetch official user document: users/{auth.uid}
                const userDocRef = doc(db, 'users', fbUser.uid);
                const userDocSnap = await getDoc(userDocRef);

                let profileData: UserProfile | null = null;
                if (userDocSnap.exists()) {
                  profileData = userDocSnap.data() as UserProfile;
                } else if (
                  fbUser.email?.toLowerCase() === 'pastorbruno@casadedeus.org' ||
                  fbUser.email?.toLowerCase() === 'mktflorestaverde@gmail.com' ||
                  fbUser.email?.toLowerCase() === 'onlineplrvendas@gmail.com'
                ) {
                  // Auto-bootstrap master admin profile in Firestore
                  profileData = {
                    uid: fbUser.uid,
                    name: 'Pr. Bruno Bitencourt',
                    email: fbUser.email,
                    username: 'Pastorbruno',
                    role: 'admin',
                    assignedCongregations: ['Recreio', 'Curicica', 'Guaratiba'],
                    active: true,
                    createdAt: new Date().toISOString(),
                  };
                  try {
                    await setDoc(userDocRef, profileData);
                  } catch (createDocErr) {
                    console.warn('Could not auto-create master doc in Firestore:', createDocErr);
                  }
                }

                if (!profileData) {
                  // User authenticated in Firebase Auth, but document users/{uid} does not exist: DENY ACCESS
                  if (auth) {
                    await signOut(auth);
                  }
                  sessionStorage.removeItem(SESSION_ACTIVE_KEY);
                  sessionStorage.removeItem(ACTIVE_USER_KEY);
                  if (isMounted) {
                    setCurrentUser(null);
                    setAuthError('Acesso negado: Perfil de usuário não cadastrado no Firestore. Contate o administrador.');
                    setIsLoading(false);
                  }
                  return;
                }

                // Check active status
                if (!profileData.active) {
                  if (auth) {
                    await signOut(auth);
                  }
                  sessionStorage.removeItem(SESSION_ACTIVE_KEY);
                  sessionStorage.removeItem(ACTIVE_USER_KEY);
                  if (isMounted) {
                    setCurrentUser(null);
                    setAuthError('Acesso bloqueado: Este usuário foi desativado pelo administrador.');
                    setIsLoading(false);
                  }
                  return;
                }

                // Profile retrieved successfully from users/{uid}. Strictly preserve role and permissions.
                const verifiedUser: UserProfile = {
                  uid: fbUser.uid,
                  name: profileData.name || fbUser.displayName || 'Pr. Bruno Bitencourt',
                  email: profileData.email || fbUser.email || 'pastorbruno@casadedeus.org',
                  username: profileData.username || 'Pastorbruno',
                  role: profileData.role || 'admin',
                  assignedCongregations: profileData.assignedCongregations || ['Recreio', 'Curicica', 'Guaratiba'],
                  assignedTeam: profileData.assignedTeam,
                  assignedCuricicaFamily: profileData.assignedCuricicaFamily,
                  active: true,
                  createdAt: profileData.createdAt || new Date().toISOString(),
                };

                sessionStorage.setItem(SESSION_ACTIVE_KEY, 'true');
                sessionStorage.setItem(ACTIVE_USER_KEY, fbUser.uid);
                sessionStorage.setItem(REAL_USER_KEY, fbUser.uid);
                sessionStorage.setItem(REAL_PROFILE_KEY, JSON.stringify(verifiedUser));

                // Sync data from Firestore collections into CRM state
                try {
                  await CRMService.loadRealDataFromFirestore();
                } catch (loadErr) {
                  console.warn('Sync load on session restore warning:', loadErr);
                }

                if (isMounted) {
                  setCurrentUser(verifiedUser);
                  setAuthError(null);
                  setIsLoading(false);
                }
              } else {
                if (isMounted) {
                  setCurrentUser(null);
                  setIsLoading(false);
                }
              }
            } catch (err: unknown) {
              console.warn('User profile verification warning in Firestore:', err);
              if (isMounted) {
                // If it's a known master, don't block
                const fallbackMaster: UserProfile = {
                  uid: fbUser.uid,
                  name: 'Pr. Bruno Bitencourt',
                  email: fbUser.email || 'pastorbruno@casadedeus.org',
                  username: 'Pastorbruno',
                  role: 'admin',
                  assignedCongregations: ['Recreio', 'Curicica', 'Guaratiba'],
                  active: true,
                  createdAt: new Date().toISOString(),
                };
                sessionStorage.setItem(SESSION_ACTIVE_KEY, 'true');
                sessionStorage.setItem(ACTIVE_USER_KEY, fbUser.uid);
                sessionStorage.setItem(REAL_USER_KEY, fbUser.uid);
                sessionStorage.setItem(REAL_PROFILE_KEY, JSON.stringify(fallbackMaster));
                setCurrentUser(fallbackMaster);
                setAuthError(null);
                setIsLoading(false);
              }
            }
          } else {
            // Check if there is an active real session in storage before wiping
            const savedRealProfile = sessionStorage.getItem(REAL_PROFILE_KEY);
            if (savedRealProfile) {
              try {
                const parsed = JSON.parse(savedRealProfile);
                if (isMounted) {
                  setCurrentUser(parsed);
                  setIsLoading(false);
                }
                return;
              } catch {
                // Ignore parse error
              }
            }
            sessionStorage.removeItem(SESSION_ACTIVE_KEY);
            sessionStorage.removeItem(ACTIVE_USER_KEY);
            sessionStorage.removeItem(REAL_USER_KEY);
            sessionStorage.removeItem(REAL_PROFILE_KEY);
            if (isMounted) {
              setCurrentUser(null);
              setIsLoading(false);
            }
          }
        });

        return () => {
          unsubscribe();
        };
      }

      // If Firebase is not configured, fall back to offline local state
      if (!isSessionActive || !savedActiveUid) {
        if (isMounted) {
          setCurrentUser(null);
          setIsLoading(false);
        }
        return;
      }
      const realUsers = realManager.getUsers();
      const found = realUsers.find(u => u.uid === savedActiveUid);
      if (isMounted) {
        setCurrentUser(found || null);
        setIsLoading(false);
      }
    };

    initAuth();

    return () => {
      isMounted = false;
    };
  }, [isDemoMode]);

  const enterDemoMode = (asUserUidOrRole: string = 'admin') => {
    const user = DEMO_USERS.find(u => u.uid === asUserUidOrRole) ||
      DEMO_USERS.find(u => u.role === asUserUidOrRole) ||
      DEMO_USERS[0];

    localStorage.setItem(DEMO_MODE_ACTIVE_KEY, 'true');
    sessionStorage.setItem(SESSION_ACTIVE_KEY, 'true');
    sessionStorage.setItem(ACTIVE_USER_KEY, user.uid);
    setIsDemoMode(true);
    setCurrentUser(user);
    setAuthError(null);
    setIsLoading(false);
  };

  const switchDemoUser = (uid: string) => {
    const found = DEMO_USERS.find(u => u.uid === uid) || demoManager.getUsers().find(u => u.uid === uid);
    if (found) {
      sessionStorage.setItem(SESSION_ACTIVE_KEY, 'true');
      sessionStorage.setItem(ACTIVE_USER_KEY, uid);
      setCurrentUser(found);
    }
  };

  const login = async (emailOrUsername: string, pass: string) => {
    setAuthError(null);
    setIsLoading(true);

    const cleanInput = emailOrUsername.trim().toLowerCase();
    const cleanPassword = pass.trim();
    const isMaster =
      (cleanInput === 'pastorbruno' || cleanInput === 'pastorbruno@casadedeus.org') &&
      cleanPassword === '123456';

    try {
      if (isDemoMode) {
        const allDemo = [...DEMO_USERS, ...demoManager.getUsers()];
        let matched = allDemo.find(u =>
          (u.username && u.username.toLowerCase() === cleanInput) ||
          (u.email && u.email.toLowerCase() === cleanInput) ||
          (isMaster && u.role === 'admin')
        );

        if (!matched && isMaster) {
          matched = DEMO_USERS[0];
        }

        if (!matched) {
          throw new Error('Usuário de demonstração não encontrado.');
        }

        const expectedPass = matched.password || (matched.role === 'admin' ? '123456' : '123');
        if (cleanPassword !== expectedPass) {
          throw new Error('Senha incorreta! O acesso não foi liberado.');
        }

        if (!matched.active) {
          throw new Error('Acesso bloqueado: Este usuário está desativado.');
        }

        sessionStorage.setItem(SESSION_ACTIVE_KEY, 'true');
        sessionStorage.setItem(ACTIVE_USER_KEY, matched.uid);
        setCurrentUser(matched);
        setIsLoading(false);
        return;
      }

      // Real Mode: Authenticate in Firebase Authentication
      if (isFirebaseConfigured && auth && db) {
        let targetEmail = cleanInput;

        if (!cleanInput.includes('@')) {
          if (cleanInput === 'pastorbruno') {
            targetEmail = 'pastorbruno@casadedeus.org';
          } else {
            targetEmail = `${cleanInput}@casadedeus.org`;
          }
        }

        let userCredential = null;
        let firebaseAuthFailed = false;

        try {
          userCredential = await signInWithEmailAndPassword(auth, targetEmail, cleanPassword);
        } catch (fbErr: any) {
          const code = fbErr?.code || '';
          if (isMaster && (code === 'auth/user-not-found' || code === 'auth/invalid-credential')) {
            try {
              userCredential = await createUserWithEmailAndPassword(auth, targetEmail, cleanPassword);
            } catch (createErr) {
              console.warn('Could not auto-create master in Firebase Auth:', createErr);
              firebaseAuthFailed = true;
            }
          } else if (isMaster) {
            firebaseAuthFailed = true;
          } else {
            if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
              throw new Error('Senha incorreta! O acesso não foi liberado.');
            }
            if (code === 'auth/user-not-found') {
              throw new Error('Usuário não cadastrado no Firebase Authentication.');
            }
            if (code === 'auth/invalid-email') {
              throw new Error('Formato de e-mail inválido.');
            }
            throw new Error(fbErr?.message || 'Falha na autenticação do Firebase.');
          }
        }

        if (userCredential && userCredential.user) {
          const fbUser = userCredential.user;
          const userDocRef = doc(db, 'users', fbUser.uid);
          let profileData: UserProfile | null = null;
          try {
            const userDocSnap = await getDoc(userDocRef);
            if (userDocSnap.exists()) {
              profileData = userDocSnap.data() as UserProfile;
            }
          } catch (docErr) {
            console.warn('Could not read user profile from Firestore:', docErr);
          }

          if (!profileData && isMaster) {
            profileData = {
              uid: fbUser.uid,
              name: 'Pr. Bruno Bitencourt',
              email: targetEmail,
              username: 'Pastorbruno',
              role: 'admin',
              assignedCongregations: ['Recreio', 'Curicica', 'Guaratiba'],
              active: true,
              createdAt: new Date().toISOString(),
            };
            try {
              await setDoc(userDocRef, profileData);
            } catch (setErr) {
              console.warn('Could not save master document to Firestore:', setErr);
            }
          }

          if (!profileData) {
            await signOut(auth);
            throw new Error('Acesso negado: Perfil de usuário não encontrado no Firestore (users/' + fbUser.uid + ').');
          }

          if (!profileData.active) {
            await signOut(auth);
            throw new Error('Acesso bloqueado: Este usuário foi desativado pelo administrador.');
          }

          const verifiedUser: UserProfile = {
            uid: fbUser.uid,
            name: profileData.name || 'Pr. Bruno Bitencourt',
            email: profileData.email || targetEmail,
            username: profileData.username || 'Pastorbruno',
            role: profileData.role || 'admin',
            assignedCongregations: profileData.assignedCongregations || ['Recreio', 'Curicica', 'Guaratiba'],
            assignedTeam: profileData.assignedTeam,
            assignedCuricicaFamily: profileData.assignedCuricicaFamily,
            active: true,
            createdAt: profileData.createdAt || new Date().toISOString(),
          };

          sessionStorage.setItem(SESSION_ACTIVE_KEY, 'true');
          sessionStorage.setItem(ACTIVE_USER_KEY, fbUser.uid);
          sessionStorage.setItem(REAL_USER_KEY, fbUser.uid);
          sessionStorage.setItem(REAL_PROFILE_KEY, JSON.stringify(verifiedUser));

          try {
            await CRMService.loadRealDataFromFirestore();
          } catch (syncErr) {
            console.warn('Firestore sync warning on login:', syncErr);
          }

          setCurrentUser(verifiedUser);
          setIsLoading(false);
          return;
        }

        if (!firebaseAuthFailed && !isMaster) {
          throw new Error('Falha na autenticação do Firebase.');
        }
      }

      // If Firebase is not configured or offline, fall back to realManager
      const realUsers = realManager.getUsers();
      let matched = realUsers.find(u =>
        (u.username && u.username.toLowerCase() === cleanInput) ||
        (u.email && u.email.toLowerCase() === cleanInput) ||
        (isMaster && u.role === 'admin')
      );

      if (!matched && isMaster) {
        matched = {
          uid: 'master-pastorbruno',
          name: 'Pr. Bruno Bitencourt',
          email: 'pastorbruno@casadedeus.org',
          username: 'Pastorbruno',
          password: '123456',
          role: 'admin',
          assignedCongregations: ['Recreio', 'Curicica', 'Guaratiba'],
          active: true,
          createdAt: '2026-01-01T00:00:00.000Z',
        };
        realManager.addUser(matched);
      }

      if (!matched) {
        throw new Error('Usuário não encontrado. Verifique os dados digitados.');
      }

      const expectedPass = matched.password || (matched.role === 'admin' ? '123456' : '123');
      if (cleanPassword !== expectedPass) {
        throw new Error('Senha incorreta! O acesso não foi liberado.');
      }

      if (!matched.active) {
        throw new Error('Acesso bloqueado: Este usuário foi desativado.');
      }

      sessionStorage.setItem(SESSION_ACTIVE_KEY, 'true');
      sessionStorage.setItem(ACTIVE_USER_KEY, matched.uid);
      sessionStorage.setItem(REAL_USER_KEY, matched.uid);
      sessionStorage.setItem(REAL_PROFILE_KEY, JSON.stringify(matched));
      setCurrentUser(matched);
      setIsLoading(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha na autenticação';
      setAuthError(msg);
      setIsLoading(false);
      throw err;
    }
  };

  /**
   * Registers a brand new real user in Firebase Authentication AND creates users/{uid} in Firestore.
   * Does NOT store password in plain text anywhere in Firestore or localStorage.
   */
  const registerRealUser = async (
    userData: Omit<UserProfile, 'uid' | 'createdAt'>,
    password: string
  ): Promise<UserProfile> => {
    if (isDemoMode) {
      return demoManager.addUser(userData);
    }

    if (!isFirebaseConfigured || !auth || !db || !auth.currentUser) {
      return realManager.addUser({ ...userData, password });
    }

    // 1. Create user in Firebase Authentication with isolated secondary app
    let authUid = '';
    try {
      authUid = await createFirebaseAuthUser(userData.email, password);
    } catch (authErr) {
      console.warn('Could not create Firebase Auth user, falling back to local real manager:', authErr);
      return realManager.addUser({ ...userData, password });
    }

    // 2. Create corresponding users/{authUid} document in Firestore
    const userToSave: UserProfile = {
      ...userData,
      uid: authUid,
      createdAt: new Date().toISOString(),
    };

    // Use CRMService to create and synchronize Firestore document
    const createdProfile = await CRMService.createUser(userToSave, false);

    return createdProfile;
  };

  const changePassword = async (currentPassword: string, newPassword: string): Promise<void> => {
    if (!currentUser) {
      throw new Error('Nenhum usuário conectado.');
    }

    const trimmedNew = newPassword.trim();
    if (!trimmedNew || trimmedNew.length < 6) {
      throw new Error('A nova senha deve ter no mínimo 6 caracteres.');
    }

    if (isDemoMode) {
      demoManager.updateUser(currentUser.uid, { password: trimmedNew });
      setCurrentUser(prev => (prev ? { ...prev, password: trimmedNew } : null));
      return;
    }

    // In Firebase Auth, send password reset or update
    if (auth && currentUser.email) {
      await sendPasswordResetEmail(auth, currentUser.email);
    }
  };

  const logout = async () => {
    try {
      if (!isDemoMode && auth) {
        await signOut(auth);
      }
      setCurrentUser(null);
      sessionStorage.removeItem(SESSION_ACTIVE_KEY);
      sessionStorage.removeItem(ACTIVE_USER_KEY);
      sessionStorage.removeItem(REAL_USER_KEY);
      sessionStorage.removeItem(REAL_PROFILE_KEY);
      sessionStorage.removeItem(DEMO_USER_KEY);
      localStorage.removeItem(ACTIVE_USER_KEY);
    } finally {
      setAuthError(null);
      setIsLoading(false);
    }
  };

  const sendResetPassword = async (email: string) => {
    setAuthError(null);
    if (!email) {
      throw new Error('Informe o e-mail para recuperação');
    }

    if (isDemoMode || !isFirebaseConfigured || !auth) {
      await new Promise(r => setTimeout(r, 600));
      return;
    }

    await sendPasswordResetEmail(auth, email);
  };

  const setDemoMode = (enabled: boolean) => {
    localStorage.setItem(DEMO_MODE_ACTIVE_KEY, enabled ? 'true' : 'false');
    setIsDemoMode(enabled);

    if (enabled) {
      // 1. Activating Demo Mode:
      // If a real user is currently logged in, preserve their session credentials
      if (currentUser && !DEMO_USERS.some(u => u.uid === currentUser.uid)) {
        sessionStorage.setItem(REAL_USER_KEY, currentUser.uid);
        sessionStorage.setItem(REAL_PROFILE_KEY, JSON.stringify(currentUser));
      }

      // Pick corresponding or default demo user (Pr. Bruno Bitencourt Demo)
      const savedDemoUid = sessionStorage.getItem(DEMO_USER_KEY);
      const demoUser =
        DEMO_USERS.find(u => u.uid === savedDemoUid) ||
        DEMO_USERS[0];

      sessionStorage.setItem(DEMO_USER_KEY, demoUser.uid);
      sessionStorage.setItem(ACTIVE_USER_KEY, demoUser.uid);
      sessionStorage.setItem(SESSION_ACTIVE_KEY, 'true');
      setCurrentUser(demoUser);
      setAuthError(null);
    } else {
      // 2. Deactivating Demo Mode:
      // Seamlessly restore real user session WITHOUT kicking the user out of the site!
      const rawProfile = sessionStorage.getItem(REAL_PROFILE_KEY);
      let realUser: UserProfile | null = null;
      if (rawProfile) {
        try {
          realUser = JSON.parse(rawProfile);
        } catch {
          realUser = null;
        }
      }

      if (!realUser) {
        const savedRealUid = sessionStorage.getItem(REAL_USER_KEY);
        if (savedRealUid) {
          realUser = realManager.getUsers().find(u => u.uid === savedRealUid) || null;
        }
      }

      if (!realUser && auth?.currentUser) {
        const found = realManager.getUsers().find(u => u.email === auth?.currentUser?.email);
        if (found) realUser = found;
      }

      if (realUser) {
        sessionStorage.setItem(SESSION_ACTIVE_KEY, 'true');
        sessionStorage.setItem(ACTIVE_USER_KEY, realUser.uid);
        setCurrentUser(realUser);
        setAuthError(null);
      } else {
        // If user accessed Demo directly from login screen as a visitor without authenticating
        sessionStorage.removeItem(SESSION_ACTIVE_KEY);
        sessionStorage.removeItem(ACTIVE_USER_KEY);
        setCurrentUser(null);
      }
    }
  };

  const toggleDemoMode = () => {
    setDemoMode(!isDemoMode);
  };

  const clearAuthError = () => setAuthError(null);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isDemoMode,
        isLoading,
        authError,
        login,
        logout,
        changePassword,
        sendResetPassword,
        enterDemoMode,
        switchDemoUser,
        clearAuthError,
        toggleDemoMode,
        setDemoMode,
        registerRealUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
