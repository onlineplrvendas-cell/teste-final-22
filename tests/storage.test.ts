import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { UserProfile } from '../src/types';

const state = vi.hoisted(() => ({ auth: { currentUser: { uid: 'admin' } as { uid: string } | null }, configured: true }));
const firestore = vi.hoisted(() => ({ setDoc: vi.fn(), getDocsFromServer: vi.fn(), deleteDoc: vi.fn() }));
const batch = vi.hoisted(() => ({ set: vi.fn(), delete: vi.fn(), commit: vi.fn() }));
vi.mock('../src/services/firebaseConfig', () => ({ auth: state.auth, db: {}, get isFirebaseConfigured() { return state.configured; } }));
vi.mock('firebase/firestore', () => ({
  ...firestore,
  collection: (_db: unknown, name: string) => ({ name }),
  doc: (_db: unknown, name: string, id: string) => ({ name, id }),
  query: (collection: unknown, ...constraints: unknown[]) => ({ collection, constraints }),
  where: (field: string, operator: string, value: unknown) => ({ field, operator, value }),
  updateDoc: vi.fn(), writeBatch: () => batch,
}));
import { cleanFirestoreData, CRMService, PersistentDataManager, realManager } from '../src/services/storage';

const admin: UserProfile = { uid: 'admin', name: 'Admin', email: 'admin@example.com', role: 'admin', assignedCongregations: ['Recreio', 'Curicica', 'Guaratiba'], active: true };
const contact = { id: 'saved', name: 'Pessoa', phone: '21999999999', congregation: 'Recreio', category: 'Visitante', stage: 'Aguardando primeiro contato', source: 'Culto', normalizedPhone: '5521999999999', isArchived: false, createdBy: 'admin', createdAt: '2026-09-27', updatedAt: '2026-09-27' } as const;
const participant = { name: 'Jovem', phone: '21999999999', congregation: 'Recreio', color: 'azul', role: 'convidado' } as const;
const denied = Object.assign(new Error('Missing permissions'), { code: 'permission-denied' });

beforeEach(() => {
  localStorage.clear(); state.auth.currentUser = { uid: 'admin' }; state.configured = true;
  CRMService.selectRealUser('admin'); realManager.resetData();
  firestore.setDoc.mockReset().mockResolvedValue(undefined);
  batch.set.mockReset(); batch.delete.mockReset(); batch.commit.mockReset().mockResolvedValue(undefined);
  firestore.deleteDoc.mockReset().mockResolvedValue(undefined);
  firestore.getDocsFromServer.mockReset().mockResolvedValue({ docs: [] });
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

describe('cadastros persistentes', () => {
  it('mantém null para apagar campos e remove somente undefined', () => {
    expect(cleanFirestoreData({ confirmedNotes: null, untouched: undefined })).toEqual({ confirmedNotes: null });
  });

  it('transfere tarefas e interações junto com a congregação do contato', () => {
    const manager = new PersistentDataManager('transfer-test', () => ({
      contacts: [contact as any],
      interactions: [{ id: 'interaction-1', contactId: contact.id, congregation: 'Recreio' } as any],
      tasks: [{ id: 'task-1', contactId: contact.id, congregation: 'Recreio' } as any],
      users: [],
      conexaoParticipants: [],
    }));

    manager.updateContact(contact.id, { congregation: 'Curicica' });

    expect(manager.getTasks()[0].congregation).toBe('Curicica');
    expect(manager.getInteractions()[0].congregation).toBe('Curicica');
  });

  it('aguarda confirmação do banco antes de mostrar o contato', async () => {
    let acknowledge!: () => void;
    firestore.setDoc.mockImplementation(() => new Promise<void>(resolve => { acknowledge = resolve; }));
    const creating = CRMService.createContact(contact, false);
    expect(realManager.getContacts()).toEqual([]);
    acknowledge(); const saved = await creating;
    expect(realManager.getContacts()[0].id).toBe(saved.id);
  });
  it('não cria cadastro fantasma quando a gravação de um contato falha', async () => {
    firestore.setDoc.mockRejectedValue(denied);
    await expect(CRMService.createContact(contact, false)).rejects.toThrow('Firebase recusou');
    expect(realManager.getContacts()).toEqual([]);
  });
  it('transfere tarefas e interações reais no mesmo lote do contato', async () => {
    realManager.addContact(contact as any);
    realManager.addTask({ id: 'task-local', contactId: contact.id, congregation: 'Recreio' } as any);
    realManager.addInteraction({ id: 'interaction-local', contactId: contact.id, congregation: 'Recreio' } as any);
    firestore.getDocsFromServer.mockImplementation(async ({ collection }) => ({
      docs: [{ id: collection.name === 'tasks' ? 'task-remote' : 'interaction-remote' }],
    }));

    await CRMService.updateContact(contact.id, { congregation: 'Curicica' }, false);

    expect(batch.set.mock.calls.map(([ref]) => ref.name)).toEqual(['contacts', 'tasks', 'interactions']);
    expect(realManager.getTasks()[0].congregation).toBe('Curicica');
    expect(realManager.getInteractions()[0].congregation).toBe('Curicica');
    expect(batch.commit).toHaveBeenCalledTimes(1);
  });

  it('exclui registros dependentes no mesmo lote da exclusão definitiva', async () => {
    realManager.addContact(contact as any);
    firestore.getDocsFromServer.mockImplementation(async ({ collection }) => ({
      docs: collection.name === 'contacts' ? [] : [{ id: `${collection.name}-1` }],
    }));

    await CRMService.deleteContactPermanent(contact.id, false);

    expect(batch.delete.mock.calls.map(([ref]) => ref.name)).toEqual([
      'tasks', 'interactions', 'conexao_participants', 'contacts',
    ]);
    expect(realManager.getContacts()).toEqual([]);
    expect(batch.commit).toHaveBeenCalledTimes(1);
  });

  it('persiste atualizações de resultados mensais no Firestore', async () => {
    await CRMService.updateConexaoMonthlyResult('azul', 0, { guests: 4 }, false);

    expect(firestore.setDoc).toHaveBeenCalledWith(
      { name: 'conexao_monthly_results', id: 'azul' },
      expect.objectContaining({ color: 'azul', results: expect.arrayContaining([expect.objectContaining({ guests: 4 })]) }),
      { merge: true },
    );
    expect(realManager.getConexaoMonthlyResults().azul[0].guests).toBe(4);
  });
  it('não cria acesso local quando o perfil é recusado', async () => {
    firestore.setDoc.mockRejectedValue(denied);
    await expect(CRMService.createUser({ ...admin, uid: 'new-user', password: '123456' }, false)).rejects.toThrow('Firebase recusou');
    expect(realManager.getUsers()).toEqual([]);
  });
  it('salva o UID verdadeiro e exclui a senha do banco e do cache', async () => {
    await CRMService.createUser({ ...admin, uid: 'auth-uid', password: 'senha-secreta' }, false);
    expect(firestore.setDoc.mock.calls[0][0]).toEqual({ name: 'users', id: 'auth-uid' });
    expect(firestore.setDoc.mock.calls[0][1].password).toBeUndefined();
    expect(realManager.getUsers()[0].password).toBeUndefined();
    expect(localStorage.getItem('casadedeus_crm_real_data_v3:admin')).not.toContain('senha-secreta');
  });
  it('recusa gravar perfil sem UID do Authentication', async () => {
    const { uid: _uid, ...user } = admin;
    await expect(CRMService.createUser(user, false)).rejects.toThrow('Authentication');
    expect(firestore.setDoc).not.toHaveBeenCalled();
  });
  it('não mostra participante do Conexão cuja gravação falhou', async () => {
    firestore.setDoc.mockRejectedValue(denied);
    await expect(CRMService.addConexaoParticipant(participant, false)).rejects.toThrow('Firebase recusou');
    expect(realManager.getConexaoParticipants()).toEqual([]);
  });
  it('não altera e-mail ou senha somente no documento de perfil', async () => {
    realManager.addUser(admin);
    await expect(CRMService.updateUser('admin', { email: 'other@example.com' }, false)).rejects.toThrow('Authentication');
    expect(firestore.setDoc).not.toHaveBeenCalled();
  });
  it('recusa gravações reais sem sessão ou configuração', async () => {
    state.auth.currentUser = null;
    await expect(CRMService.createContact(contact, false)).rejects.toThrow('sessão expirou');
    state.configured = false;
    await expect(CRMService.addConexaoParticipant(participant, false)).rejects.toThrow('não está configurado');
    expect(firestore.setDoc).not.toHaveBeenCalled();
  });
});

describe('sincronização sem zerar o painel', () => {
  it('preserva contatos quando a leitura falha e comunica o erro', async () => {
    realManager.addContact(contact);
    firestore.getDocsFromServer.mockImplementation(async ({ collection }) => {
      if (collection.name === 'contacts') throw denied;
      return { docs: [] };
    });
    await expect(CRMService.loadRealDataFromFirestore(admin)).rejects.toThrow('Contatos');
    expect(realManager.getContacts()[0].id).toBe('saved');
  });
  it('aceita uma coleção realmente vazia, sem reinserir master fictício', async () => {
    realManager.addContact(contact);
    await CRMService.loadRealDataFromFirestore(admin);
    expect(realManager.getContacts()).toEqual([]);
    expect(realManager.getUsers()).toEqual([]);
  });
  it('carrega o Conexão sem exigir acesso às coleções de outras áreas', async () => {
    const leader = { ...admin, role: 'lider_equipe', assignedTeam: 'azul' } as UserProfile;
    await CRMService.loadRealDataFromFirestore(leader);
    expect(firestore.getDocsFromServer.mock.calls.map(([q]) => q.collection.name)).toEqual(['conexao_participants', 'conexao_goals', 'conexao_monthly_results']);
    expect(firestore.getDocsFromServer.mock.calls[0][0].constraints).toEqual([{ field: 'color', operator: '==', value: 'azul' }]);
  });
  it('ignora resposta recebida depois de sair da conta', async () => {
    realManager.addContact(contact);
    let finish!: (result: unknown) => void;
    firestore.getDocsFromServer.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
    const loading = CRMService.loadRealDataFromFirestore(admin);
    state.auth.currentUser = null; finish({ docs: [] }); await loading;
    expect(realManager.getContacts()[0].id).toBe('saved');
  });
  it('não sobrescreve cadastro confirmado enquanto a consulta estava em andamento', async () => {
    let finish!: (result: unknown) => void;
    firestore.getDocsFromServer.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
    const loading = CRMService.loadRealDataFromFirestore(admin);
    await CRMService.createContact(contact, false);
    finish({ docs: [] });
    await expect(loading).rejects.toThrow('alterados durante a consulta');
    expect(realManager.getContacts()).toHaveLength(1);
  });
  it('isola o cache por conta e preserva o cache anterior', () => {
    realManager.addContact(contact);
    CRMService.selectRealUser('other');
    expect(realManager.getContacts()).toEqual([]);
    CRMService.selectRealUser('admin');
    expect(realManager.getContacts()[0].id).toBe('saved');
  });
});

describe('matrículas persistentes', () => {
  it('não altera matrícula Uni Reino após falha de gravação', async () => {
    realManager.addContact(contact); firestore.setDoc.mockRejectedValue(denied);
    await expect(CRMService.enrollInUniReino(contact.id, { semester: 1 }, false)).rejects.toThrow('Firebase recusou');
    expect(realManager.getContacts()[0].uniReino).toBeUndefined();
  });
  it('matricula o contato e o participante do Conexão no mesmo lote', async () => {
    realManager.addContact(contact);
    await CRMService.enrollInConexao(contact.id, { color: 'azul', role: 'membro' }, false);
    expect(batch.set.mock.calls.map(([ref]) => ref.name)).toEqual(['contacts', 'conexao_participants']);
    expect(batch.commit).toHaveBeenCalledTimes(1);
    expect(realManager.getConexaoParticipants()[0].id).toBe(batch.set.mock.calls[1][0].id);
    expect(realManager.getContacts()[0].conexaoJovem?.color).toBe('azul');
  });
  it('reutiliza participante existente por telefone normalizado', async () => {
    realManager.addContact(contact as any);
    realManager.addConexaoParticipant({ ...participant, phone: '(21) 99999-9999' } as any);
    const existingParticipantId = realManager.getConexaoParticipants()[0].id;

    await CRMService.enrollInConexao(contact.id, { color: 'azul', role: 'membro' }, false);

    expect(realManager.getConexaoParticipants()).toHaveLength(1);
    expect(batch.set.mock.calls[1][0].id).toBe(existingParticipantId);
  });
  it('não cria participante fantasma se o lote do Conexão falhar', async () => {
    realManager.addContact(contact); batch.commit.mockRejectedValue(denied);
    await expect(CRMService.enrollInConexao(contact.id, { color: 'azul', role: 'membro' }, false)).rejects.toThrow('Firebase recusou');
    expect(realManager.getConexaoParticipants()).toEqual([]);
    expect(realManager.getContacts()[0].conexaoJovem).toBeUndefined();
  });
  it('mantém a matrícula se o banco recusar a remoção', async () => {
    realManager.addContact(contact);
    await CRMService.enrollInConexao(contact.id, { color: 'azul', role: 'membro' }, false);
    batch.commit.mockRejectedValue(denied);
    await expect(CRMService.unenrollFromConexao(contact.id, false)).rejects.toThrow('Firebase recusou');
    expect(realManager.getConexaoParticipants()).toHaveLength(1);
    expect(realManager.getContacts()[0].conexaoJovem?.color).toBe('azul');
  });
});

describe('proteção contra bloquear o próprio acesso master', () => {
  it('recusa desativar ou rebaixar o administrador conectado', async () => {
    realManager.addUser(admin);
    await expect(CRMService.updateUser('admin', { active: false }, false)).rejects.toThrow('próprio acesso');
    await expect(CRMService.updateUser('admin', { role: 'lider_conexao' }, false)).rejects.toThrow('próprio acesso');
    expect(firestore.setDoc).not.toHaveBeenCalled();
  });
  it('recusa excluir o administrador conectado', async () => {
    await expect(CRMService.deleteUser('admin', false)).rejects.toThrow('próprio acesso');
    expect(firestore.deleteDoc).not.toHaveBeenCalled();
  });
});
