import { initializeApp, getApps, FirebaseApp, deleteApp } from 'firebase/app';
import { getAuth, Auth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore, Firestore, doc, getDocFromServer } from 'firebase/firestore';

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
export const envConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
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
export async function createFirebaseAuthUser(email: string, pass: string): Promise<string> {
  if (!envConfig.apiKey || !envConfig.projectId) {
    throw new Error('Firebase Authentication não está configurado. Verifique as credenciais no .env.');
  }

  const tempAppName = `auth-worker-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const secondaryApp = initializeApp(envConfig, tempAppName);
  try {
    const secondaryAuth = getAuth(secondaryApp);
    const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email.trim(), pass.trim());
    const uid = userCredential.user.uid;
    await signOut(secondaryAuth);
    return uid;
  } catch (err: any) {
    const code = err?.code || '';
    if (code === 'auth/email-already-in-use') {
      throw new Error('Este e-mail já está cadastrado no Firebase Authentication.');
    }
    if (code === 'auth/invalid-email') {
      throw new Error('O formato do e-mail informado é inválido.');
    }
    if (code === 'auth/weak-password') {
      throw new Error('A senha informada é fraca. O Firebase exige no mínimo 6 caracteres.');
    }
    throw new Error(err?.message || 'Falha ao registrar usuário no Firebase Authentication.');
  } finally {
    try {
      await deleteApp(secondaryApp);
    } catch {}
  }
}
