import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  mainAuth: { name: 'main' }, secondaryAuth: { name: 'secondary' },
  create: vi.fn(), removeUser: vi.fn(), removeApp: vi.fn(), signOut: vi.fn(), persistence: vi.fn(),
}));
vi.mock('firebase/app', () => ({
  initializeApp: (_config: unknown, name?: string) => ({ name: name || 'main' }),
  getApps: () => [], deleteApp: mocks.removeApp,
}));
vi.mock('firebase/auth', () => ({
  getAuth: (app: { name: string }) => app.name === 'main' ? mocks.mainAuth : mocks.secondaryAuth,
  createUserWithEmailAndPassword: mocks.create,
  deleteUser: mocks.removeUser, signOut: mocks.signOut, setPersistence: mocks.persistence,
  inMemoryPersistence: 'memory',
}));
vi.mock('firebase/firestore', () => ({ getFirestore: () => ({}), doc: vi.fn(), getDocFromServer: vi.fn().mockResolvedValue({}) }));

beforeEach(() => {
  vi.resetModules();
  vi.stubEnv('VITE_FIREBASE_API_KEY', 'test-key'); vi.stubEnv('VITE_FIREBASE_PROJECT_ID', 'demo-test');
  mocks.create.mockReset().mockResolvedValue({ user: { uid: 'created' } });
  mocks.removeUser.mockReset().mockResolvedValue(undefined);
  mocks.signOut.mockReset().mockResolvedValue(undefined);
  mocks.removeApp.mockReset().mockResolvedValue(undefined);
});

describe('cadastro com sessão isolada', () => {
  it('mantém a sessão master e só retorna após salvar o perfil', async () => {
    const { createFirebaseAuthUser, auth } = await import('../src/services/firebaseConfig');
    const save = vi.fn().mockResolvedValue(undefined);
    await expect(createFirebaseAuthUser(' Novo@Example.com ', ' senha123 ', save)).resolves.toBe('created');
    expect(auth).toBe(mocks.mainAuth);
    expect(mocks.create).toHaveBeenCalledWith(mocks.secondaryAuth, 'novo@example.com', ' senha123 ');
    expect(save).toHaveBeenCalledWith('created');
    expect(mocks.signOut).toHaveBeenCalledWith(mocks.secondaryAuth);
    expect(mocks.signOut).not.toHaveBeenCalledWith(mocks.mainAuth);
    expect(mocks.removeUser).not.toHaveBeenCalled();
  });
  it('desfaz a nova conta quando o Firestore recusa seu perfil', async () => {
    const { createFirebaseAuthUser } = await import('../src/services/firebaseConfig');
    await expect(createFirebaseAuthUser('novo@example.com', '123456', async () => { throw new Error('Perfil recusado'); })).rejects.toThrow('Perfil recusado');
    expect(mocks.removeUser).toHaveBeenCalledWith({ uid: 'created' });
    expect(mocks.removeApp).toHaveBeenCalled();
  });
  it('não exclui conta existente quando o e-mail está em uso', async () => {
    mocks.create.mockRejectedValue(Object.assign(new Error('duplicate'), { code: 'auth/email-already-in-use' }));
    const { createFirebaseAuthUser } = await import('../src/services/firebaseConfig'); const save = vi.fn();
    await expect(createFirebaseAuthUser('novo@example.com', '123456', save)).rejects.toThrow('já possui uma conta');
    expect(save).not.toHaveBeenCalled(); expect(mocks.removeUser).not.toHaveBeenCalled();
  });
  it('explica o cadastro pendente se o rollback também falhar', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    mocks.removeUser.mockRejectedValue(new Error('network'));
    const { createFirebaseAuthUser } = await import('../src/services/firebaseConfig');
    await expect(createFirebaseAuthUser('novo@example.com', '123456', async () => { throw new Error('Perfil recusado'); })).rejects.toThrow('UID created');
    expect(mocks.removeApp).toHaveBeenCalled();
  });
});
