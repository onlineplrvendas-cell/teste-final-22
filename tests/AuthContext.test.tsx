import React from 'react';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  auth: { currentUser: null as any },
  configured: true,
  observer: null as any,
  unsubscribe: vi.fn(),
  signIn: vi.fn(), signOut: vi.fn(), getDoc: vi.fn(), provision: vi.fn(), createUser: vi.fn(),
  reauthenticate: vi.fn(), updatePassword: vi.fn(),
  demoUsers: [{ uid: 'demo', name: 'Demo', email: 'demo@example.com', username: 'demo', password: '123456', role: 'admin', assignedCongregations: ['Recreio'], active: true }],
}));
vi.mock('../src/services/firebaseConfig', () => ({ auth: mocks.auth, db: {}, get isFirebaseConfigured() { return mocks.configured; }, createFirebaseAuthUser: mocks.provision }));
vi.mock('../src/services/storage', () => ({ demoManager: { getUsers: () => mocks.demoUsers, addUser: vi.fn(), updateUser: vi.fn() }, CRMService: { createUser: mocks.createUser } }));
vi.mock('firebase/firestore', () => ({ doc: (_db: unknown, name: string, uid: string) => ({ name, uid }), getDocFromServer: mocks.getDoc }));
vi.mock('firebase/auth', () => ({
  onAuthStateChanged: vi.fn((_auth, observer) => { mocks.observer = observer; return mocks.unsubscribe; }),
  signInWithEmailAndPassword: mocks.signIn,
  signOut: mocks.signOut,
  sendPasswordResetEmail: vi.fn(),
  EmailAuthProvider: { credential: (email: string, password: string) => ({ email, password }) },
  reauthenticateWithCredential: mocks.reauthenticate,
  updatePassword: mocks.updatePassword,
}));
import { AuthProvider, useAuth } from '../src/context/AuthContext';
const wrapper = ({ children }: { children: React.ReactNode }) => <AuthProvider>{children}</AuthProvider>;
const profile = { name: 'Líder', role: 'lider_conexao', active: true, assignedCongregations: ['Recreio', 'Curicica', 'Guaratiba'] };
const fbUser = { uid: 'real-leader', email: 'lider@example.com' };
const emit = async (user: any) => { await act(async () => { mocks.auth.currentUser = user; mocks.observer(user); }); };

beforeEach(() => {
  localStorage.clear(); sessionStorage.clear(); mocks.auth.currentUser = null; mocks.configured = true;
  mocks.getDoc.mockReset().mockResolvedValue({ exists: () => true, data: () => profile });
  mocks.signIn.mockReset(); mocks.provision.mockReset(); mocks.createUser.mockReset();
  mocks.signOut.mockReset().mockImplementation(async () => { mocks.auth.currentUser = null; mocks.observer(null); });
});
afterEach(cleanup);

describe('sessão verificada', () => {
  it('restaura o líder com sua função verdadeira', async () => {
    const { result } = renderHook(useAuth, { wrapper });
    await emit(fbUser);
    await waitFor(() => expect(result.current.currentUser?.role).toBe('lider_conexao'));
    expect(result.current.isLoading).toBe(false);
    expect(result.current.authError).toBeNull();
  });
  it('não transforma falha do Firestore em acesso master', async () => {
    mocks.getDoc.mockRejectedValue(Object.assign(new Error('denied'), { code: 'permission-denied' }));
    const { result } = renderHook(useAuth, { wrapper });
    await emit(fbUser);
    await waitFor(() => expect(result.current.authError).toContain('Firebase recusou'));
    expect(result.current.currentUser).toBeNull();
    expect(sessionStorage.getItem('casadedeus_real_user_profile')).toBeNull();
    expect(mocks.signOut).toHaveBeenCalled();
  });
  it.each(['missing', 'inactive'])('recusa perfil %s sem restaurar sessão antiga', async kind => {
    mocks.getDoc.mockResolvedValue({ exists: () => kind !== 'missing', data: () => ({ ...profile, active: false }) });
    sessionStorage.setItem('casadedeus_real_user_profile', JSON.stringify({ role: 'admin' }));
    const { result } = renderHook(useAuth, { wrapper });
    await emit(fbUser);
    await waitFor(() => expect(result.current.authError).not.toBeNull());
    expect(result.current.currentUser).toBeNull();
  });
  it('ignora perfil salvo no navegador quando o Firebase não tem sessão', async () => {
    sessionStorage.setItem('casadedeus_real_user_profile', JSON.stringify({ role: 'admin' }));
    const { result } = renderHook(useAuth, { wrapper });
    await emit(null);
    expect(result.current.currentUser).toBeNull();
  });
  it('descarta verificação pendente quando a conta sai', async () => {
    let finish!: (value: unknown) => void;
    mocks.getDoc.mockImplementation(() => new Promise(resolve => { finish = resolve; }));
    const { result } = renderHook(useAuth, { wrapper });
    await emit(fbUser); await emit(null);
    await act(async () => finish({ exists: () => true, data: () => profile }));
    expect(result.current.currentUser).toBeNull();
    expect(sessionStorage.getItem('casadedeus_active_user_uid')).toBeNull();
  });
  it('remove o listener ao entrar no demo e valida novamente ao voltar', async () => {
    const { result } = renderHook(useAuth, { wrapper });
    await emit(fbUser);
    await act(async () => result.current.enterDemoMode());
    expect(mocks.unsubscribe).toHaveBeenCalled();
    expect(result.current.currentUser?.uid).toBe('demo');
    await act(async () => result.current.setDemoMode(false));
    expect(result.current.currentUser).toBeNull();
    await emit(fbUser);
    expect(result.current.currentUser?.role).toBe('lider_conexao');
  });
  it('senha fixa não cria nem libera master após falha de login', async () => {
    mocks.signIn.mockRejectedValue(Object.assign(new Error('wrong'), { code: 'auth/invalid-credential' }));
    const { result } = renderHook(useAuth, { wrapper }); await emit(null);
    await act(async () => { await expect(result.current.login('Pastorbruno', '123456')).rejects.toThrow(); });
    expect(result.current.currentUser).toBeNull(); expect(mocks.provision).not.toHaveBeenCalled();
  });
  it('envia a senha ao Auth sem cortar espaços', async () => {
    mocks.signIn.mockResolvedValue({ user: fbUser });
    const { result } = renderHook(useAuth, { wrapper }); await emit(null);
    await act(async () => result.current.login(' Pessoa@Example.com ', ' senha 123 '));
    expect(mocks.signIn).toHaveBeenCalledWith(mocks.auth, 'pessoa@example.com', ' senha 123 ');
  });
  it('não permite cadastro real sem Firebase configurado', async () => {
    mocks.configured = false;
    const { result } = renderHook(useAuth, { wrapper });
    await expect(result.current.registerRealUser({ ...profile, email: 'novo@example.com' } as any, '123456')).rejects.toThrow('administrador');
    expect(mocks.provision).not.toHaveBeenCalled();
  });
  it('falha de cadastro não vira usuário local', async () => {
    mocks.getDoc.mockResolvedValue({ exists: () => true, data: () => ({ ...profile, role: 'admin' }) });
    mocks.provision.mockRejectedValue(new Error('E-mail já cadastrado'));
    const { result } = renderHook(useAuth, { wrapper }); await emit(fbUser);
    await expect(result.current.registerRealUser({ ...profile, email: 'novo@example.com' } as any, '123456')).rejects.toThrow('já cadastrado');
    expect(mocks.createUser).not.toHaveBeenCalled();
  });
  it('salva o perfil sem senha com o UID devolvido pelo Authentication', async () => {
    mocks.getDoc.mockResolvedValue({ exists: () => true, data: () => ({ ...profile, role: 'admin' }) });
    mocks.provision.mockImplementation(async (_email, _password, save) => { await save('new-auth-uid'); return 'new-auth-uid'; });
    mocks.createUser.mockImplementation(async user => user);
    const { result } = renderHook(useAuth, { wrapper }); await emit(fbUser);
    const created = await result.current.registerRealUser({ ...profile, email: 'Novo@Example.com', password: 'segredo' } as any, '123456');
    expect(created.uid).toBe('new-auth-uid'); expect(created.password).toBeUndefined();
    expect(mocks.createUser.mock.calls[0][0].email).toBe('novo@example.com');
    expect(result.current.currentUser?.uid).toBe(fbUser.uid);
  });
  it('altera a senha somente após reautenticar', async () => {
    const { result } = renderHook(useAuth, { wrapper }); await emit(fbUser);
    await result.current.changePassword('atual123', 'nova123');
    expect(mocks.reauthenticate).toHaveBeenCalledWith(fbUser, { email: fbUser.email, password: 'atual123' });
    expect(mocks.updatePassword).toHaveBeenCalledWith(fbUser, 'nova123');
  });
});
