import {
  Contact,
  Interaction,
  Task,
  UserProfile,
  UniReinoEnrollment,
  UniReinoSemester,
  UniReinoStatus,
  ConexaoParticipant,
  ConexaoInteraction,
  ConexaoMembership,
  ConexaoColor,
  ConexaoTeamGoal,
  ConexaoMonthlyResult,
  WeeklyConfirmationReport,
  WeeklyConfirmationEntry,
  CongregationFilter,
} from '../types';
import { normalizePhone } from '../utils/phone';
import {
  generateInitialDemoData,
  DEMO_USERS,
  generateInitialConexaoParticipants,
  generateInitialConexaoGoals,
  generateInitialConexaoMonthlyResults,
  generateEmptyConexaoMonthlyResults,
  generateInitialWeeklyReports,
} from '../data/mockData';
import {
  db,
  auth,
  isFirebaseConfigured,
  handleFirestoreError,
  OperationType,
} from './firebaseConfig';
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
} from 'firebase/firestore';

const DEMO_STORAGE_KEY = 'casadedeus_crm_demo_data_v5';
const REAL_STORAGE_KEY = 'casadedeus_crm_real_data_v3';

interface DataStore {
  contacts: Contact[];
  interactions: Interaction[];
  tasks: Task[];
  users: UserProfile[];
  conexaoParticipants: ConexaoParticipant[];
  conexaoGoals?: Record<ConexaoColor, ConexaoTeamGoal>;
  conexaoMonthlyResults?: Record<ConexaoColor, ConexaoMonthlyResult[]>;
  weeklyReports?: WeeklyConfirmationReport[];
}

export class PersistentDataManager {
  private storageKey: string;
  private listeners: Set<() => void> = new Set();
  private data: DataStore;
  private initialFactory: () => DataStore;

  constructor(storageKey: string, initialFactory: () => DataStore) {
    this.storageKey = storageKey;
    this.initialFactory = initialFactory;
    this.data = this.loadFromStorage();
  }

  private loadFromStorage(): DataStore {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (!parsed.conexaoParticipants) {
          parsed.conexaoParticipants = this.initialFactory().conexaoParticipants || [];
        }
        if (!parsed.conexaoGoals) {
          parsed.conexaoGoals = this.initialFactory().conexaoGoals || generateInitialConexaoGoals();
        }
        if (!parsed.conexaoMonthlyResults) {
          parsed.conexaoMonthlyResults = this.storageKey === REAL_STORAGE_KEY ? generateEmptyConexaoMonthlyResults() : generateInitialConexaoMonthlyResults();
        }
        if (this.storageKey === REAL_STORAGE_KEY && (!parsed.conexaoParticipants || parsed.conexaoParticipants.length === 0)) {
          parsed.conexaoMonthlyResults = generateEmptyConexaoMonthlyResults();
        }
        if (!parsed.weeklyReports) {
          parsed.weeklyReports = this.initialFactory().weeklyReports || [];
        }
        if (this.storageKey === REAL_STORAGE_KEY) {
          if (!parsed.users || !Array.isArray(parsed.users) || parsed.users.length === 0) {
            parsed.users = this.initialFactory().users || [];
          } else {
            const hasMaster = parsed.users.some(
              (u: any) =>
                u.username?.toLowerCase() === 'pastorbruno' ||
                u.email?.toLowerCase() === 'pastorbruno@casadedeus.org'
            );
            if (!hasMaster) {
              parsed.users.unshift({
                uid: 'master-pastorbruno',
                name: 'Pr. Bruno Bitencourt',
                email: 'pastorbruno@casadedeus.org',
                username: 'Pastorbruno',
                password: '123456',
                role: 'admin',
                assignedCongregations: ['Recreio', 'Curicica', 'Guaratiba'],
                active: true,
                createdAt: '2026-01-01T00:00:00.000Z',
              });
            } else {
              // Ensure master has password '123456' and is active admin
              parsed.users = parsed.users.map((u: any) => {
                if (
                  u.username?.toLowerCase() === 'pastorbruno' ||
                  u.email?.toLowerCase() === 'pastorbruno@casadedeus.org'
                ) {
                  return {
                    ...u,
                    username: 'Pastorbruno',
                    password: '123456',
                    role: 'admin',
                    active: true,
                  };
                }
                return u;
              });
            }
          }
        }
        return parsed;
      }
    } catch (e) {
      console.error(`Failed to read data from ${this.storageKey}`, e);
    }
    const initial = this.initialFactory();
    this.saveToStorage(initial);
    return initial;
  }

  private saveToStorage(data: DataStore) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (e) {
      console.error(`Failed to write data to ${this.storageKey}`, e);
    }
  }

  public notify() {
    this.saveToStorage(this.data);
    this.listeners.forEach(fn => fn());
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public setAllData(newData: Partial<DataStore>) {
    this.data = {
      ...this.data,
      ...newData,
    };
    this.notify();
  }

  public resetData() {
    this.data = this.initialFactory();
    this.notify();
  }

  public resetDemoData() {
    this.resetData();
  }

  public getContacts(): Contact[] {
    return [...this.data.contacts];
  }

  public getInteractions(): Interaction[] {
    return [...this.data.interactions];
  }

  public getTasks(): Task[] {
    return [...this.data.tasks];
  }

  public getUsers(): UserProfile[] {
    return [...this.data.users];
  }

  public addContact(contact: Contact | Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>): Contact {
    const newId = 'id' in contact && contact.id ? contact.id : `c-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    const newContact: Contact = {
      ...contact,
      id: newId,
      createdAt: 'createdAt' in contact && contact.createdAt ? contact.createdAt : now,
      updatedAt: 'updatedAt' in contact && contact.updatedAt ? contact.updatedAt : now,
    };
    this.data.contacts = this.data.contacts.filter(c => c.id !== newContact.id);
    this.data.contacts.unshift(newContact);
    this.notify();
    return newContact;
  }

  public updateContact(id: string, updates: Partial<Contact>): Contact {
    const idx = this.data.contacts.findIndex(c => c.id === id);
    if (idx === -1) throw new Error('Contato não encontrado');
    const updated: Contact = {
      ...this.data.contacts[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.data.contacts[idx] = updated;

    if (updates.congregation && updates.congregation !== this.data.contacts[idx].congregation) {
      this.data.tasks = this.data.tasks.map(t =>
        t.contactId === id ? { ...t, congregation: updates.congregation! } : t
      );
      this.data.interactions = this.data.interactions.map(i =>
        i.contactId === id ? { ...i, congregation: updates.congregation! } : i
      );
    }

    this.notify();
    return updated;
  }

  public toggleWeeklyConfirmation(id: string): Contact {
    const idx = this.data.contacts.findIndex(c => c.id === id);
    if (idx === -1) throw new Error('Contato não encontrado');
    const current = this.data.contacts[idx];
    const newStatus = !current.confirmedThisWeek;
    return this.updateContact(id, {
      confirmedThisWeek: newStatus,
      confirmedNotes: newStatus ? 'Confirmou presença para o culto desta semana' : undefined,
    });
  }

  public enrollInUniReino(
    id: string,
    enrollment: {
      semester?: UniReinoSemester;
      matricula?: string;
      turma?: string;
      notes?: string;
      status?: UniReinoStatus;
    }
  ): Contact {
    const idx = this.data.contacts.findIndex(c => c.id === id);
    if (idx === -1) throw new Error('Contato não encontrado');
    const current = this.data.contacts[idx];
    const now = new Date().toISOString();
    const updatedUniReino: UniReinoEnrollment = {
      isEnrolled: true,
      semester: enrollment.semester || 1,
      enrolledAt: current.uniReino?.enrolledAt || now,
      status: enrollment.status || 'matriculado',
      matricula:
        enrollment.matricula ||
        current.uniReino?.matricula ||
        `UN-${Math.floor(1000 + Math.random() * 9000)}`,
      turma:
        enrollment.turma ||
        current.uniReino?.turma ||
        `Turma ${new Date().getFullYear()}.${new Date().getMonth() < 6 ? 1 : 2}`,
      notes: enrollment.notes !== undefined ? enrollment.notes : (current.uniReino?.notes || ''),
    };

    return this.updateContact(id, {
      uniReino: updatedUniReino,
    });
  }

  public updateUniReino(id: string, updates: Partial<UniReinoEnrollment>): Contact {
    const idx = this.data.contacts.findIndex(c => c.id === id);
    if (idx === -1) throw new Error('Contato não encontrado');
    const current = this.data.contacts[idx];
    if (!current.uniReino) {
      return this.enrollInUniReino(id, updates);
    }
    const updatedUniReino: UniReinoEnrollment = {
      ...current.uniReino,
      ...updates,
      isEnrolled: updates.isEnrolled !== undefined ? updates.isEnrolled : true,
    };
    if (updates.status === 'concluido' && !updatedUniReino.completedAt) {
      updatedUniReino.completedAt = new Date().toISOString();
    }
    return this.updateContact(id, { uniReino: updatedUniReino });
  }

  public advanceUniReinoSemester(id: string): Contact {
    const idx = this.data.contacts.findIndex(c => c.id === id);
    if (idx === -1) throw new Error('Contato não encontrado');
    const current = this.data.contacts[idx];
    if (!current.uniReino) {
      return this.enrollInUniReino(id, { semester: 1 });
    }
    const curSemester = current.uniReino.semester;
    if (curSemester < 8) {
      const nextSemester = (curSemester + 1) as UniReinoSemester;
      return this.updateUniReino(id, { semester: nextSemester, status: 'matriculado' });
    } else {
      return this.updateUniReino(id, {
        semester: 8,
        status: 'concluido',
        completedAt: new Date().toISOString(),
      });
    }
  }

  public unenrollFromUniReino(id: string): Contact {
    return this.updateContact(id, {
      uniReino: undefined,
    });
  }

  public enrollInConexao(id: string, membership: ConexaoMembership): Contact {
    const contact = this.data.contacts.find(c => c.id === id);
    if (!contact) throw new Error('Contato não encontrado');

    const updatedContact = this.updateContact(id, {
      conexaoJovem: membership,
    });

    if (!this.data.conexaoParticipants) {
      this.data.conexaoParticipants = [];
    }
    const existingIdx = this.data.conexaoParticipants.findIndex(
      p => p.contactId === id || (p.phone && p.phone === contact.phone)
    );

    if (existingIdx !== -1) {
      this.data.conexaoParticipants[existingIdx] = {
        ...this.data.conexaoParticipants[existingIdx],
        name: contact.name,
        phone: contact.phone,
        color: membership.color,
        role: membership.role,
        baseName: membership.baseName,
        congregation: contact.congregation,
        contactId: id,
        updatedAt: new Date().toISOString(),
      };
    } else {
      this.data.conexaoParticipants.unshift({
        id: `cx-ct-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: contact.name,
        phone: contact.phone,
        color: membership.color,
        role: membership.role,
        congregation: contact.congregation,
        baseName: membership.baseName,
        confirmedNextCulto: false,
        points: membership.role === 'convidado' ? 50 : 100,
        contactId: id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
    this.notify();
    return updatedContact;
  }

  public unenrollFromConexao(id: string): Contact {
    const updated = this.updateContact(id, {
      conexaoJovem: undefined,
    });
    if (this.data.conexaoParticipants) {
      this.data.conexaoParticipants = this.data.conexaoParticipants.filter(p => p.contactId !== id);
      this.notify();
    }
    return updated;
  }

  public archiveContact(id: string): void {
    this.updateContact(id, {
      isArchived: true,
      archivedAt: new Date().toISOString(),
    });
  }

  public restoreContact(id: string): void {
    this.updateContact(id, {
      isArchived: false,
      archivedAt: undefined,
    });
  }

  public deleteContactPermanent(id: string): void {
    this.data.contacts = this.data.contacts.filter(c => c.id !== id);
    this.data.tasks = this.data.tasks.filter(t => t.contactId !== id);
    this.data.interactions = this.data.interactions.filter(i => i.contactId !== id);
    this.notify();
  }

  public addInteraction(interaction: Interaction | Omit<Interaction, 'id' | 'createdAt'>): Interaction {
    const newId = 'id' in interaction && interaction.id ? interaction.id : `int-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    const newInt: Interaction = {
      ...interaction,
      id: newId,
      createdAt: 'createdAt' in interaction && interaction.createdAt ? interaction.createdAt : now,
    };
    this.data.interactions = this.data.interactions.filter(i => i.id !== newInt.id);
    this.data.interactions.unshift(newInt);
    this.notify();
    return newInt;
  }

  public addTask(task: Task | Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Task {
    const newId = 'id' in task && task.id ? task.id : `t-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    const newTask: Task = {
      ...task,
      id: newId,
      createdAt: 'createdAt' in task && task.createdAt ? task.createdAt : now,
      updatedAt: 'updatedAt' in task && task.updatedAt ? task.updatedAt : now,
    };
    this.data.tasks = this.data.tasks.filter(t => t.id !== newTask.id);
    this.data.tasks.unshift(newTask);
    this.notify();
    return newTask;
  }

  public updateTask(id: string, updates: Partial<Task>): Task {
    const idx = this.data.tasks.findIndex(t => t.id === id);
    if (idx === -1) throw new Error('Tarefa não encontrada');
    const updated: Task = {
      ...this.data.tasks[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.data.tasks[idx] = updated;
    this.notify();
    return updated;
  }

  public deleteTask(id: string): void {
    this.data.tasks = this.data.tasks.filter(t => t.id !== id);
    this.notify();
  }

  public addUser(user: UserProfile | Omit<UserProfile, 'uid' | 'createdAt'>): UserProfile {
    const uid = 'uid' in user && user.uid ? user.uid : `user-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();
    const newUser: UserProfile = {
      ...user,
      uid,
      createdAt: 'createdAt' in user && user.createdAt ? user.createdAt : now,
    };
    this.data.users = this.data.users.filter(u => u.uid !== uid);
    this.data.users.push(newUser);
    this.notify();
    return newUser;
  }

  public updateUser(uid: string, updates: Partial<UserProfile>): UserProfile {
    const idx = this.data.users.findIndex(u => u.uid === uid);
    if (idx === -1) throw new Error('Usuário não encontrado');
    const updated: UserProfile = {
      ...this.data.users[idx],
      ...updates,
    };
    this.data.users[idx] = updated;
    this.notify();
    return updated;
  }

  public deleteUser(uid: string): void {
    if (uid === 'admin-1' || uid === 'master-pastorbruno') {
      throw new Error('Não é possível remover o acesso Master do Pastor Bruno Bitencourt.');
    }
    this.data.users = this.data.users.filter(u => u.uid !== uid);
    this.notify();
  }

  // --- CONEXÃO JOVEM METHODS ---
  public getConexaoParticipants(): ConexaoParticipant[] {
    return [...(this.data.conexaoParticipants || [])];
  }

  public addConexaoParticipant(
    participant: ConexaoParticipant | Omit<ConexaoParticipant, 'id' | 'createdAt' | 'updatedAt'>
  ): ConexaoParticipant {
    const newId = 'id' in participant && participant.id ? participant.id : `cx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();
    const dateStr = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    const initialStage = participant.funnelStage || (participant.role === 'convidado' ? 'novo_contato' : 'integrado');
    const resp = participant.responsibleName || participant.baseLeaderName || participant.invitedByName || 'Líder da Equipe';

    const newParticipant: ConexaoParticipant = {
      ...participant,
      id: newId,
      points: participant.points ?? 50,
      confirmedNextCulto: participant.confirmedNextCulto ?? false,
      funnelStage: initialStage,
      responsibleName: resp,
      lastInteraction: participant.lastInteraction || `${dateStr} - Novo contato`,
      nextAction: participant.nextAction || 'Primeiro contato via WhatsApp',
      nextReturnDate: participant.nextReturnDate || '',
      interactions: participant.interactions || [
        {
          id: `cx-int-${Date.now()}`,
          date: dateStr,
          situation: 'Novo contato',
          notes: participant.notes || 'Cadastrado no Conexão Jovem',
          registeredBy: resp,
          createdAt: now,
        },
      ],
      createdAt: 'createdAt' in participant && participant.createdAt ? participant.createdAt : now,
      updatedAt: 'updatedAt' in participant && participant.updatedAt ? participant.updatedAt : now,
    };
    if (!this.data.conexaoParticipants) {
      this.data.conexaoParticipants = [];
    }

    this.data.conexaoParticipants = this.data.conexaoParticipants.filter(p => p.id !== newParticipant.id);
    this.data.conexaoParticipants.unshift(newParticipant);
    this.notify();
    return newParticipant;
  }

  public updateConexaoParticipant(
    id: string,
    updates: Partial<ConexaoParticipant>
  ): ConexaoParticipant {
    if (!this.data.conexaoParticipants) {
      this.data.conexaoParticipants = [];
    }
    const idx = this.data.conexaoParticipants.findIndex(p => p.id === id);
    if (idx === -1) throw new Error('Participante do Conexão Jovem não encontrado');
    const updated: ConexaoParticipant = {
      ...this.data.conexaoParticipants[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.data.conexaoParticipants[idx] = updated;
    this.notify();
    return updated;
  }

  public deleteConexaoParticipant(id: string): void {
    if (!this.data.conexaoParticipants) return;
    this.data.conexaoParticipants = this.data.conexaoParticipants.filter(p => p.id !== id);
    this.notify();
  }

  public toggleConexaoCultoConfirmation(id: string): ConexaoParticipant {
    if (!this.data.conexaoParticipants) {
      this.data.conexaoParticipants = [];
    }
    const idx = this.data.conexaoParticipants.findIndex(p => p.id === id);
    if (idx === -1) throw new Error('Participante não encontrado');
    const current = this.data.conexaoParticipants[idx];
    const newStatus = !current.confirmedNextCulto;
    return this.updateConexaoParticipant(id, {
      confirmedNextCulto: newStatus,
      points: newStatus ? (current.points || 0) + 30 : Math.max(0, (current.points || 0) - 30),
    });
  }

  public addConexaoPoints(id: string, additionalPoints: number): ConexaoParticipant {
    if (!this.data.conexaoParticipants) {
      this.data.conexaoParticipants = [];
    }
    const idx = this.data.conexaoParticipants.findIndex(p => p.id === id);
    if (idx === -1) throw new Error('Participante não encontrado');
    const current = this.data.conexaoParticipants[idx];
    return this.updateConexaoParticipant(id, {
      points: Math.max(0, (current.points || 0) + additionalPoints),
    });
  }

  public getConexaoGoals(): Record<ConexaoColor, ConexaoTeamGoal> {
    if (!this.data.conexaoGoals) {
      this.data.conexaoGoals = generateInitialConexaoGoals();
      this.saveToStorage(this.data);
    }
    return this.data.conexaoGoals;
  }

  public updateConexaoGoal(color: ConexaoColor, updates: Partial<ConexaoTeamGoal>): ConexaoTeamGoal {
    if (!this.data.conexaoGoals) {
      this.data.conexaoGoals = generateInitialConexaoGoals();
    }
    const current = this.data.conexaoGoals[color] || {
      color,
      year: 2026,
      targetGuests: 100,
      targetGuestsMonth: 10,
      targetMembers: 40,
      targetBases: 4,
      targetWeeklyAttendance: 45,
    };
    const updated: ConexaoTeamGoal = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.data.conexaoGoals[color] = updated;
    this.saveToStorage(this.data);
    this.notify();
    return updated;
  }

  public getConexaoMonthlyResults(): Record<ConexaoColor, ConexaoMonthlyResult[]> {
    if (!this.data.conexaoMonthlyResults) {
      this.data.conexaoMonthlyResults = this.storageKey === REAL_STORAGE_KEY ? generateEmptyConexaoMonthlyResults() : generateInitialConexaoMonthlyResults();
      this.saveToStorage(this.data);
    }
    if (this.storageKey === REAL_STORAGE_KEY && (!this.data.conexaoParticipants || this.data.conexaoParticipants.length === 0)) {
      this.data.conexaoMonthlyResults = generateEmptyConexaoMonthlyResults();
    }
    return this.data.conexaoMonthlyResults;
  }

  public updateConexaoMonthlyResult(
    color: ConexaoColor,
    monthIndex: number,
    updates: Partial<ConexaoMonthlyResult>
  ): void {
    if (!this.data.conexaoMonthlyResults) {
      this.data.conexaoMonthlyResults = generateEmptyConexaoMonthlyResults();
    }
    if (this.data.conexaoMonthlyResults[color] && this.data.conexaoMonthlyResults[color][monthIndex]) {
      this.data.conexaoMonthlyResults[color][monthIndex] = {
        ...this.data.conexaoMonthlyResults[color][monthIndex],
        ...updates,
      };
      this.saveToStorage(this.data);
      this.notify();
    }
  }

  public getWeeklyReports(congregation?: CongregationFilter): WeeklyConfirmationReport[] {
    if (!this.data.weeklyReports) {
      this.data.weeklyReports = this.storageKey === REAL_STORAGE_KEY ? [] : generateInitialWeeklyReports();
      this.saveToStorage(this.data);
    }
    if (!congregation || congregation === 'all') {
      return [...this.data.weeklyReports];
    }
    return this.data.weeklyReports.filter(r => r.congregation === congregation || r.congregation === 'all');
  }

  public getWeeklyReport(weekKey: string, congregation: CongregationFilter): WeeklyConfirmationReport | undefined {
    if (!this.data.weeklyReports) {
      this.data.weeklyReports = this.storageKey === REAL_STORAGE_KEY ? [] : generateInitialWeeklyReports();
      this.saveToStorage(this.data);
    }
    return this.data.weeklyReports.find(r => r.weekKey === weekKey && r.congregation === congregation);
  }

  public saveWeeklyReport(report: WeeklyConfirmationReport): WeeklyConfirmationReport {
    if (!this.data.weeklyReports) {
      this.data.weeklyReports = [];
    }
    const idx = this.data.weeklyReports.findIndex(
      r => r.id === report.id || (r.weekKey === report.weekKey && r.congregation === report.congregation)
    );
    if (idx >= 0) {
      this.data.weeklyReports[idx] = report;
    } else {
      this.data.weeklyReports.unshift(report);
    }
    this.saveToStorage(this.data);
    this.notify();
    return report;
  }

  public deleteWeeklyReport(id: string): void {
    if (!this.data.weeklyReports) return;
    this.data.weeklyReports = this.data.weeklyReports.filter(r => r.id !== id);
    this.saveToStorage(this.data);
    this.notify();
  }
}

// 1. Isolated Demo Data Manager
export const demoManager = new PersistentDataManager(DEMO_STORAGE_KEY, () => {
  const initial = generateInitialDemoData();
  return {
    contacts: initial.contacts,
    interactions: initial.interactions,
    tasks: initial.tasks,
    users: DEMO_USERS,
    conexaoParticipants: generateInitialConexaoParticipants(),
    conexaoGoals: generateInitialConexaoGoals(),
    conexaoMonthlyResults: generateInitialConexaoMonthlyResults(),
    weeklyReports: generateInitialWeeklyReports(),
  };
});

// 2. Persistent Real Data Manager - empty starting slate, data strictly populated from Firestore
export const realManager = new PersistentDataManager(REAL_STORAGE_KEY, () => {
  return {
    contacts: [],
    interactions: [],
    tasks: [],
    weeklyReports: [],
    users: [
      {
        uid: 'master-pastorbruno',
        name: 'Pr. Bruno Bitencourt',
        email: 'pastorbruno@casadedeus.org',
        username: 'Pastorbruno',
        password: '123456',
        role: 'admin',
        assignedCongregations: ['Recreio', 'Curicica', 'Guaratiba'],
        active: true,
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    ],
    conexaoParticipants: [],
    conexaoGoals: generateInitialConexaoGoals(),
    conexaoMonthlyResults: generateEmptyConexaoMonthlyResults(),
  };
});

/**
 * Recursively cleans an object to ensure compatibility with Firestore:
 * - Strips any keys whose values are `undefined` (Firestore rejects undefined)
 * - Keeps null, primitives, arrays, and nested objects cleaned
 */
export function cleanFirestoreData<T>(obj: T): T {
  if (obj === null || obj === undefined) return null as unknown as T;
  if (Array.isArray(obj)) {
    return obj
      .filter(item => item !== undefined)
      .map(item => cleanFirestoreData(item)) as unknown as T;
  }
  if (typeof obj === 'object' && !(obj instanceof Date)) {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj as Record<string, any>)) {
      if (value !== undefined) {
        cleaned[key] = cleanFirestoreData(value);
      }
    }
    return cleaned as T;
  }
  return obj;
}

/**
 * Service bridge routing writes to Demo or Real Firestore
 */
export const CRMService = {
  isConfigured(): boolean {
    return isFirebaseConfigured && !!db;
  },

  /**
   * Fetches official data from Cloud Firestore to populate realManager.
   * Enforces zero reliance on previous browser cache.
   */
  async loadRealDataFromFirestore(): Promise<void> {
    if (!db || !auth?.currentUser) return;

    try {
      // 1. Users
      const users: UserProfile[] = [];
      try {
        const usersSnap = await getDocs(collection(db, 'users'));
        usersSnap.forEach(d => {
          users.push(d.data() as UserProfile);
        });
      } catch (err) {
        console.warn('Could not read users collection from Firestore:', err);
      }

      // 2. Contacts
      const contacts: Contact[] = [];
      try {
        const contactsSnap = await getDocs(collection(db, 'contacts'));
        contactsSnap.forEach(d => {
          contacts.push(d.data() as Contact);
        });
      } catch (err) {
        console.warn('Could not read contacts collection from Firestore:', err);
      }

      // 3. Conexao Participants
      const conexaoParticipants: ConexaoParticipant[] = [];
      try {
        const conexaoSnap = await getDocs(collection(db, 'conexao_participants'));
        conexaoSnap.forEach(d => {
          conexaoParticipants.push(d.data() as ConexaoParticipant);
        });
      } catch (err) {
        console.warn('Could not read conexao_participants from Firestore:', err);
      }

      // 4. Tasks
      const tasks: Task[] = [];
      try {
        const tasksSnap = await getDocs(collection(db, 'tasks'));
        tasksSnap.forEach(d => {
          tasks.push(d.data() as Task);
        });
      } catch (err) {
        console.warn('Could not read tasks from Firestore:', err);
      }

      // 5. Interactions
      const interactions: Interaction[] = [];
      try {
        const intSnap = await getDocs(collection(db, 'interactions'));
        intSnap.forEach(d => {
          interactions.push(d.data() as Interaction);
        });
      } catch (err) {
        console.warn('Could not read interactions from Firestore:', err);
      }

      // 6. Weekly reports
      const weeklyReports: WeeklyConfirmationReport[] = [];
      try {
        const reportsSnap = await getDocs(collection(db, 'weekly_confirmations'));
        reportsSnap.forEach(d => {
          weeklyReports.push(d.data() as WeeklyConfirmationReport);
        });
      } catch (err) {
        console.warn('Could not read weekly_confirmations from Firestore:', err);
      }

      // 7. Goals
      const conexaoGoals: Record<ConexaoColor, ConexaoTeamGoal> = generateInitialConexaoGoals();
      try {
        const goalsSnap = await getDocs(collection(db, 'conexao_goals'));
        goalsSnap.forEach(d => {
          const g = d.data() as ConexaoTeamGoal;
          if (g.color) {
            conexaoGoals[g.color] = g;
          }
        });
      } catch (err) {
        console.warn('Could not read conexao_goals from Firestore:', err);
      }

      // Ensure Master user is present
      const currentUsers = realManager.getUsers();
      let mergedUsers = users.length > 0 ? users : currentUsers;
      const hasMaster = mergedUsers.some(
        u => u.username?.toLowerCase() === 'pastorbruno' || u.email?.toLowerCase() === 'pastorbruno@casadedeus.org'
      );
      if (!hasMaster) {
        mergedUsers = [
          {
            uid: 'master-pastorbruno',
            name: 'Pr. Bruno Bitencourt',
            email: 'pastorbruno@casadedeus.org',
            username: 'Pastorbruno',
            password: '123456',
            role: 'admin',
            assignedCongregations: ['Recreio', 'Curicica', 'Guaratiba'],
            active: true,
            createdAt: '2026-01-01T00:00:00.000Z',
          },
          ...mergedUsers,
        ];
      }

      realManager.setAllData({
        users: mergedUsers,
        contacts,
        conexaoParticipants,
        tasks,
        interactions,
        weeklyReports,
        conexaoGoals,
        conexaoMonthlyResults:
          conexaoParticipants.length === 0
            ? generateEmptyConexaoMonthlyResults()
            : realManager.getConexaoMonthlyResults(),
      });
    } catch (err) {
      console.warn('Warning during Firestore synchronization:', err);
    }
  },

  async createContact(
    contact: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>,
    isDemo: boolean
  ): Promise<Contact> {
    if (isDemo) {
      return demoManager.addContact(contact);
    }

    const newId = `c-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    const contactToSave: Contact = {
      ...contact,
      id: newId,
      createdAt: now,
      updatedAt: now,
    };

    if (db && auth?.currentUser) {
      try {
        const docRef = doc(db, 'contacts', newId);
        await setDoc(docRef, cleanFirestoreData(contactToSave));
      } catch (error) {
        console.warn('Firestore write warning for contacts:', error);
      }
    }

    return realManager.addContact(contactToSave);
  },

  async updateContact(
    id: string,
    updates: Partial<Contact>,
    isDemo: boolean
  ): Promise<Contact> {
    if (isDemo) {
      return demoManager.updateContact(id, updates);
    }

    if (db && auth?.currentUser) {
      try {
        const docRef = doc(db, 'contacts', id);
        await setDoc(docRef, cleanFirestoreData({ ...updates, updatedAt: new Date().toISOString() }), { merge: true });
      } catch (error) {
        console.warn('Firestore update warning for contacts:', error);
      }
    }

    return realManager.updateContact(id, updates);
  },

  async toggleWeeklyConfirmation(id: string, isDemo: boolean): Promise<Contact> {
    const manager = isDemo ? demoManager : realManager;
    const current = manager.getContacts().find(c => c.id === id);
    if (!current) throw new Error('Contato não encontrado');
    const newStatus = !current.confirmedThisWeek;

    if (!isDemo && db && auth?.currentUser) {
      try {
        const docRef = doc(db, 'contacts', id);
        await setDoc(docRef, cleanFirestoreData({
          confirmedThisWeek: newStatus,
          confirmedNotes: newStatus ? 'Confirmou presença para o culto desta semana' : null,
          updatedAt: new Date().toISOString(),
        }), { merge: true });
      } catch (e) {
        console.warn('Firestore toggleWeeklyConfirmation warning:', e);
      }
    }

    return manager.toggleWeeklyConfirmation(id);
  },

  async enrollInUniReino(
    id: string,
    enrollment: {
      semester?: UniReinoSemester;
      matricula?: string;
      turma?: string;
      notes?: string;
      status?: UniReinoStatus;
    },
    isDemo: boolean
  ): Promise<Contact> {
    const manager = isDemo ? demoManager : realManager;
    const updated = manager.enrollInUniReino(id, enrollment);

    if (!isDemo && db && auth?.currentUser) {
      try {
        const docRef = doc(db, 'contacts', id);
        await setDoc(docRef, cleanFirestoreData({
          uniReino: updated.uniReino,
          updatedAt: new Date().toISOString(),
        }), { merge: true });
      } catch (e) {
        console.warn('Firestore enrollInUniReino warning:', e);
      }
    }

    return updated;
  },

  async updateUniReino(
    id: string,
    updates: Partial<UniReinoEnrollment>,
    isDemo: boolean
  ): Promise<Contact> {
    const manager = isDemo ? demoManager : realManager;
    const updated = manager.updateUniReino(id, updates);

    if (!isDemo && db && auth?.currentUser) {
      try {
        const docRef = doc(db, 'contacts', id);
        await setDoc(docRef, cleanFirestoreData({
          uniReino: updated.uniReino,
          updatedAt: new Date().toISOString(),
        }), { merge: true });
      } catch (e) {
        console.warn('Firestore updateUniReino warning:', e);
      }
    }

    return updated;
  },

  async advanceUniReinoSemester(id: string, isDemo: boolean): Promise<Contact> {
    const manager = isDemo ? demoManager : realManager;
    const updated = manager.advanceUniReinoSemester(id);

    if (!isDemo && db && auth?.currentUser) {
      try {
        const docRef = doc(db, 'contacts', id);
        await setDoc(docRef, cleanFirestoreData({
          uniReino: updated.uniReino,
          updatedAt: new Date().toISOString(),
        }), { merge: true });
      } catch (e) {
        console.warn('Firestore advanceUniReinoSemester warning:', e);
      }
    }

    return updated;
  },

  async unenrollFromUniReino(id: string, isDemo: boolean): Promise<Contact> {
    const manager = isDemo ? demoManager : realManager;
    const updated = manager.unenrollFromUniReino(id);

    if (!isDemo && db && auth?.currentUser) {
      try {
        const docRef = doc(db, 'contacts', id);
        await setDoc(docRef, cleanFirestoreData({
          uniReino: null,
          updatedAt: new Date().toISOString(),
        }), { merge: true });
      } catch (e) {
        console.warn('Firestore unenrollFromUniReino warning:', e);
      }
    }

    return updated;
  },

  async enrollInConexao(
    id: string,
    membership: ConexaoMembership,
    isDemo: boolean
  ): Promise<Contact> {
    const manager = isDemo ? demoManager : realManager;
    const updated = manager.enrollInConexao(id, membership);

    if (!isDemo && db && auth?.currentUser) {
      try {
        const docRef = doc(db, 'contacts', id);
        await setDoc(docRef, cleanFirestoreData({
          conexaoJovem: updated.conexaoJovem,
          updatedAt: new Date().toISOString(),
        }), { merge: true });
      } catch (e) {
        console.warn('Firestore enrollInConexao warning:', e);
      }
    }

    return updated;
  },

  async unenrollFromConexao(id: string, isDemo: boolean): Promise<Contact> {
    const manager = isDemo ? demoManager : realManager;
    const updated = manager.unenrollFromConexao(id);

    if (!isDemo && db && auth?.currentUser) {
      try {
        const docRef = doc(db, 'contacts', id);
        await setDoc(docRef, cleanFirestoreData({
          conexaoJovem: null,
          updatedAt: new Date().toISOString(),
        }), { merge: true });
      } catch (e) {
        console.warn('Firestore unenrollFromConexao warning:', e);
      }
    }

    return updated;
  },

  async archiveContact(id: string, isDemo: boolean): Promise<void> {
    if (!isDemo && db && auth?.currentUser) {
      try {
        const docRef = doc(db, 'contacts', id);
        await setDoc(docRef, cleanFirestoreData({
          isArchived: true,
          archivedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }), { merge: true });
      } catch (error) {
        console.warn('Firestore archiveContact warning:', error);
      }
    }

    const manager = isDemo ? demoManager : realManager;
    manager.archiveContact(id);
  },

  async restoreContact(id: string, isDemo: boolean): Promise<void> {
    if (!isDemo && db && auth?.currentUser) {
      try {
        const docRef = doc(db, 'contacts', id);
        await setDoc(docRef, cleanFirestoreData({
          isArchived: false,
          archivedAt: null,
          updatedAt: new Date().toISOString(),
        }), { merge: true });
      } catch (error) {
        console.warn('Firestore restoreContact warning:', error);
      }
    }

    const manager = isDemo ? demoManager : realManager;
    manager.restoreContact(id);
  },

  async deleteContactPermanent(id: string, isDemo: boolean): Promise<void> {
    if (!isDemo && db && auth?.currentUser) {
      try {
        const docRef = doc(db, 'contacts', id);
        await deleteDoc(docRef);
      } catch (error) {
        console.warn('Firestore deleteContactPermanent warning:', error);
      }
    }

    const manager = isDemo ? demoManager : realManager;
    manager.deleteContactPermanent(id);
  },

  async createInteraction(
    interaction: Omit<Interaction, 'id' | 'createdAt'>,
    isDemo: boolean
  ): Promise<Interaction> {
    if (isDemo) {
      return demoManager.addInteraction(interaction);
    }

    const newId = `int-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    const interactionToSave: Interaction = {
      ...interaction,
      id: newId,
      createdAt: now,
    };

    if (!isDemo && db && auth?.currentUser) {
      try {
        const colRef = collection(db, 'interactions');
        const docRef = doc(colRef, newId);
        await setDoc(docRef, cleanFirestoreData(interactionToSave));
      } catch (e) {
        console.warn('Firestore write warning for interactions:', e);
      }
    }

    return realManager.addInteraction(interactionToSave);
  },

  async createTask(
    task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>,
    isDemo: boolean
  ): Promise<Task> {
    if (isDemo) {
      return demoManager.addTask(task);
    }

    const newId = `t-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    const taskToSave: Task = {
      ...task,
      id: newId,
      createdAt: now,
      updatedAt: now,
    };

    if (!isDemo && db && auth?.currentUser) {
      try {
        const colRef = collection(db, 'tasks');
        const docRef = doc(colRef, newId);
        await setDoc(docRef, cleanFirestoreData(taskToSave));
      } catch (e) {
        console.warn('Firestore write warning for tasks:', e);
      }
    }

    return realManager.addTask(taskToSave);
  },

  async updateTask(
    id: string,
    updates: Partial<Task>,
    isDemo: boolean
  ): Promise<Task> {
    if (isDemo) {
      return demoManager.updateTask(id, updates);
    }

    if (!isDemo && db && auth?.currentUser) {
      try {
        const docRef = doc(db, 'tasks', id);
        await setDoc(docRef, cleanFirestoreData({ ...updates, updatedAt: new Date().toISOString() }), { merge: true });
      } catch (e) {
        console.warn('Firestore update warning for tasks:', e);
      }
    }

    return realManager.updateTask(id, updates);
  },

  async deleteTask(id: string, isDemo: boolean): Promise<void> {
    if (!isDemo && db && auth?.currentUser) {
      try {
        const docRef = doc(db, 'tasks', id);
        await deleteDoc(docRef);
      } catch (e) {
        console.warn('Firestore delete warning for tasks:', e);
      }
    }

    const manager = isDemo ? demoManager : realManager;
    manager.deleteTask(id);
  },

  async createUser(user: Omit<UserProfile, 'createdAt'> | (Omit<UserProfile, 'createdAt' | 'uid'> & { uid?: string }), isDemo: boolean): Promise<UserProfile> {
    if (isDemo) {
      return demoManager.addUser(user);
    }

    const assignedUid = user.uid || `u-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    // Do NOT store password in Firestore document!
    const { password: _pw, ...cleanProfile } = user as any;
    const now = new Date().toISOString();
    const userDocData: UserProfile = {
      ...cleanProfile,
      uid: assignedUid,
      createdAt: cleanProfile.createdAt || now,
    };

    if (!isDemo && db && auth?.currentUser) {
      try {
        const docRef = doc(db, 'users', assignedUid);
        await setDoc(docRef, cleanFirestoreData(userDocData));
      } catch (e) {
        console.warn('Firestore write warning for users:', e);
      }
    }

    return realManager.addUser({ ...userDocData, password: _pw });
  },

  async updateUser(uid: string, updates: Partial<UserProfile>, isDemo: boolean): Promise<UserProfile> {
    if (!isDemo && db && auth?.currentUser) {
      try {
        const { password: _pw, ...cleanUpdates } = updates as any;
        const docRef = doc(db, 'users', uid);
        await setDoc(docRef, cleanFirestoreData(cleanUpdates), { merge: true });
      } catch (e) {
        console.warn('Firestore update warning for users:', e);
      }
    }

    const manager = isDemo ? demoManager : realManager;
    return manager.updateUser(uid, updates);
  },

  async deleteUser(uid: string, isDemo: boolean): Promise<void> {
    if (!isDemo && db && auth?.currentUser) {
      try {
        const docRef = doc(db, 'users', uid);
        await deleteDoc(docRef);
      } catch (e) {
        console.warn('Firestore delete warning for users:', e);
      }
    }

    const manager = isDemo ? demoManager : realManager;
    manager.deleteUser(uid);
  },

  // --- CONEXÃO JOVEM SERVICE BRIDGES ---
  async addConexaoParticipant(
    participant: Omit<ConexaoParticipant, 'id' | 'createdAt' | 'updatedAt'>,
    isDemo: boolean
  ): Promise<ConexaoParticipant> {
    if (isDemo) {
      return demoManager.addConexaoParticipant(participant);
    }

    const newId = `cx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();
    const dateStr = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    const participantToSave: ConexaoParticipant = {
      ...participant,
      id: newId,
      points: participant.points ?? 50,
      confirmedNextCulto: participant.confirmedNextCulto ?? false,
      funnelStage: participant.funnelStage || (participant.role === 'convidado' ? 'novo_contato' : 'integrado'),
      responsibleName: participant.responsibleName || participant.baseLeaderName || participant.invitedByName || 'Líder da Equipe',
      lastInteraction: participant.lastInteraction || `${dateStr} - Novo contato`,
      nextAction: participant.nextAction || 'Primeiro contato via WhatsApp',
      nextReturnDate: participant.nextReturnDate || '',
      interactions: participant.interactions || [
        {
          id: `cx-int-${Date.now()}`,
          date: dateStr,
          situation: 'Novo contato',
          notes: participant.notes || 'Cadastrado no Conexão Jovem',
          registeredBy: participant.responsibleName || 'Líder da Equipe',
          createdAt: now,
        },
      ],
      createdAt: now,
      updatedAt: now,
    };

    if (!isDemo && db && auth?.currentUser) {
      try {
        const docRef = doc(db, 'conexao_participants', newId);
        await setDoc(docRef, cleanFirestoreData(participantToSave));
      } catch (e) {
        console.warn('Firestore write warning for conexao_participants:', e);
      }
    }

    return realManager.addConexaoParticipant(participantToSave);
  },

  async updateConexaoParticipant(
    id: string,
    updates: Partial<ConexaoParticipant>,
    isDemo: boolean
  ): Promise<ConexaoParticipant> {
    if (!isDemo && db && auth?.currentUser) {
      try {
        const docRef = doc(db, 'conexao_participants', id);
        await setDoc(docRef, cleanFirestoreData({ ...updates, updatedAt: new Date().toISOString() }), { merge: true });
      } catch (e) {
        console.warn('Firestore update warning for conexao_participants:', e);
      }
    }

    const manager = isDemo ? demoManager : realManager;
    return manager.updateConexaoParticipant(id, updates);
  },

  async deleteConexaoParticipant(id: string, isDemo: boolean): Promise<void> {
    if (!isDemo && db && auth?.currentUser) {
      try {
        const docRef = doc(db, 'conexao_participants', id);
        await deleteDoc(docRef);
      } catch (e) {
        console.warn('Firestore delete warning for conexao_participants:', e);
      }
    }

    const manager = isDemo ? demoManager : realManager;
    manager.deleteConexaoParticipant(id);
  },

  async toggleConexaoCultoConfirmation(id: string, isDemo: boolean): Promise<ConexaoParticipant> {
    const manager = isDemo ? demoManager : realManager;
    const current = manager.getConexaoParticipants().find(p => p.id === id);
    if (!current) throw new Error('Participante não encontrado');
    const newStatus = !current.confirmedNextCulto;
    const newPoints = newStatus ? (current.points || 0) + 30 : Math.max(0, (current.points || 0) - 30);
    const now = new Date().toISOString();

    if (!isDemo && db && auth?.currentUser) {
      try {
        const docRef = doc(db, 'conexao_participants', id);
        await setDoc(docRef, cleanFirestoreData({
          confirmedNextCulto: newStatus,
          points: newPoints,
          updatedAt: now,
        }), { merge: true });
      } catch (e) {
        console.warn('Firestore update warning for conexao_participants confirmation:', e);
      }
    }

    return manager.toggleConexaoCultoConfirmation(id);
  },

  async addConexaoPoints(id: string, additionalPoints: number, isDemo: boolean): Promise<ConexaoParticipant> {
    const manager = isDemo ? demoManager : realManager;
    const current = manager.getConexaoParticipants().find(p => p.id === id);
    if (!current) throw new Error('Participante não encontrado');
    const newPoints = Math.max(0, (current.points || 0) + additionalPoints);
    const now = new Date().toISOString();

    if (!isDemo && db && auth?.currentUser) {
      try {
        const docRef = doc(db, 'conexao_participants', id);
        await setDoc(docRef, cleanFirestoreData({
          points: newPoints,
          updatedAt: now,
        }), { merge: true });
      } catch (e) {
        console.warn('Firestore points warning for conexao_participants:', e);
      }
    }

    return manager.addConexaoPoints(id, additionalPoints);
  },

  getConexaoGoals(isDemo: boolean): Record<ConexaoColor, ConexaoTeamGoal> {
    const manager = isDemo ? demoManager : realManager;
    return manager.getConexaoGoals();
  },

  async updateConexaoGoal(
    color: ConexaoColor,
    updates: Partial<ConexaoTeamGoal>,
    isDemo: boolean
  ): Promise<ConexaoTeamGoal> {
    if (!isDemo && db && auth?.currentUser) {
      try {
        const docRef = doc(db, 'conexao_goals', color);
        await setDoc(docRef, cleanFirestoreData({ color, ...updates, updatedAt: new Date().toISOString() }), { merge: true });
      } catch (e) {
        console.warn('Firestore goal warning for conexao_goals:', e);
      }
    }

    const manager = isDemo ? demoManager : realManager;
    return manager.updateConexaoGoal(color, updates);
  },

  getConexaoMonthlyResults(isDemo: boolean): Record<ConexaoColor, ConexaoMonthlyResult[]> {
    const manager = isDemo ? demoManager : realManager;
    return manager.getConexaoMonthlyResults();
  },

  async updateConexaoMonthlyResult(
    color: ConexaoColor,
    monthIndex: number,
    updates: Partial<ConexaoMonthlyResult>,
    isDemo: boolean
  ): Promise<void> {
    const manager = isDemo ? demoManager : realManager;
    manager.updateConexaoMonthlyResult(color, monthIndex, updates);
  },

  getWeeklyReports(congregation: CongregationFilter, isDemo: boolean): WeeklyConfirmationReport[] {
    const manager = isDemo ? demoManager : realManager;
    return manager.getWeeklyReports(congregation);
  },

  async saveWeeklyReport(
    report: WeeklyConfirmationReport,
    isDemo: boolean
  ): Promise<WeeklyConfirmationReport> {
    if (!isDemo && db && auth?.currentUser) {
      try {
        const colRef = collection(db, 'weekly_confirmations');
        const docRef = doc(colRef, report.id);
        await setDoc(docRef, cleanFirestoreData(report));
      } catch (e) {
        console.warn('Firestore weekly report warning:', e);
      }
    }

    const manager = isDemo ? demoManager : realManager;
    return manager.saveWeeklyReport(report);
  },

  async deleteWeeklyReport(id: string, isDemo: boolean): Promise<void> {
    if (!isDemo && db && auth?.currentUser) {
      try {
        const docRef = doc(db, 'weekly_confirmations', id);
        await deleteDoc(docRef);
      } catch (e) {
        console.warn('Firestore delete weekly report warning:', e);
      }
    }

    const manager = isDemo ? demoManager : realManager;
    manager.deleteWeeklyReport(id);
  },
};
