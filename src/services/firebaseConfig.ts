import { initializeApp, getApps, FirebaseApp, deleteApp } from 'firebase/app';
import { getAuth, Auth, User, createUserWithEmailAndPassword, signOut, deleteUser, setPersistence, inMemoryPersistence } from 'firebase/auth';
import { getFirestore, Firestore, doc, getDocFromServer } from 'firebase/firestore';
import { firebaseErrorMessage } from '../utils/userProfile';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null,
  authInstance?: Auth
): never {
  const currentAuth = authInstance || auth;
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: currentAuth?.currentUser?.uid,
      email: currentAuth?.currentUser?.email,
      emailVerified: currentAuth?.currentUser?.emailVerified,
      isAnonymous: currentAuth?.currentUser?.isAnonymous,
      tenantId: currentAuth?.currentUser?.tenantId,
      providerInfo:
        currentAuth?.currentUser?.providerData?.map(provider => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export let app: FirebaseApp | null = null;
export let auth: Auth | null = null;
export let db: Firestore | null = null;
export let isFirebaseConfigured = false;

// Attempt to load from environment or config
// Hostinger builds this Vite app without automatically injecting local .env files.
// Keep env vars as the first choice, but fall back to this Firebase Web App config so
// the production build can initialize Firebase. These client-side Firebase values are
// expected to be public; access control must remain enforced by Firebase Auth/Firestore rules.
export const envConfig = {
 apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyCt_dhTpJQ2UJfDZOCaNsw8pcI67YJ15d4',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'crm-casa-3732b.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'crm-casa-3732b',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'crm-casa-3732b.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '875685647400',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:875685647400:web:a4546a412248579d53111d',
};

if (envConfig.apiKey && envConfig.projectId) {
  try {
    if (!getApps().length) {
      app = initializeApp(envConfig);
    } else {
      app = getApps()[0];
    }
    auth = getAuth(app);
    db = getFirestore(app);
    isFirebaseConfigured = true;

    // Test connection on boot per Firebase guidelines
    testConnection();
  } catch (err) {
    console.warn('Firebase initialization warning:', err);
  }
}

async function testConnection() {
  if (!db) return;
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore offline check: please verify network or Firebase setup.');
    }
  }
}

/**
 * Creates a new user in Firebase Authentication without disturbing the currently logged-in Master session.
 * Uses an isolated secondary Firebase app instance.
 */
export async function createFirebaseAuthUser(email: string, pass: string, saveProfile: (uid: string) => Promise<void>): Promise<string> {
  if (!envConfig.apiKey || !envConfig.projectId) {
    throw new Error('Firebase Authentication não está configurado. Verifique as credenciais no .env.');
  }

  const tempAppName = `auth-worker-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const secondaryApp = initializeApp(envConfig, tempAppName);
  let secondaryAuth: Auth | undefined;
  let createdUser: User | undefined;
  try {
    secondaryAuth = getAuth(secondaryApp);
    await setPersistence(secondaryAuth, inMemoryPersistence);
    const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email.trim().toLowerCase(), pass);
    createdUser = userCredential.user;
    await saveProfile(createdUser.uid);
    return createdUser.uid;
  } catch (err: unknown) {
    // Roll back only the account created by this attempt if its profile could not be saved.
    if (createdUser) {
      try {
        await deleteUser(createdUser);
      } catch (rollbackError) {
        console.error('Falha ao desfazer cadastro incompleto:', rollbackError);
        throw new Error('O perfil não foi salvo e a conta ficou pendente no Firebase Authentication. Peça ao administrador para conferir o UID ' + createdUser.uid + ' antes de tentar novamente. ' + firebaseErrorMessage(err));
      }
    }
    throw new Error(firebaseErrorMessage(err));
  } finally {
    try { if (secondaryAuth) await signOut(secondaryAuth); } catch (error) { console.warn('Falha ao encerrar sessão de cadastro:', error); }
    try { await deleteApp(secondaryApp); } catch (error) { console.warn('Falha ao liberar sessão de cadastro:', error); }
  }
}
