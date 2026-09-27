import type { Congregation, UserProfile, UserRole } from '../types';

const CONGREGATIONS: Congregation[] = ['Recreio', 'Curicica', 'Guaratiba'];
const ROLES: UserRole[] = ['admin', 'equipe', 'lider_equipe', 'lider_conexao', 'lider_familia', 'admin_curicica'];
const TEAMS = ['azul', 'vermelho', 'amarelo', 'laranja', 'turquesa', 'rosa', 'roxo', 'bege'];

export function normalizeCongregations(value: unknown): Congregation[] {
  const values = typeof value === 'string' ? value.split(',') : Array.isArray(value) ? value : [];
  return CONGREGATIONS.filter(congregation => values.some(item => typeof item === 'string' && item.trim() === congregation));
}

// Missing fields must never turn a user into an admin.
export function verifyUserProfile(data: Record<string, unknown>, uid: string, email: string | null): UserProfile {
  if (data.active !== true) throw new Error('Este acesso está desativado. Contate o administrador.');
  if (!ROLES.includes(data.role as UserRole)) throw new Error('O perfil está sem uma função válida. Peça ao administrador para corrigir o cadastro.');
  const role = data.role as UserRole;
  const assignedCongregations = role === 'admin' ? [...CONGREGATIONS] : normalizeCongregations(data.assignedCongregations);
  if (!assignedCongregations.length) throw new Error('O perfil está sem congregação autorizada. Contate o administrador.');
  if (role === 'lider_equipe' && !TEAMS.includes(data.assignedTeam as string)) throw new Error('O líder está sem equipe do Conexão definida. Contate o administrador.');
  if (role === 'lider_familia' && !['familia_1', 'familia_2', 'familia_3'].includes(data.assignedCuricicaFamily as string)) throw new Error('O líder está sem família definida. Contate o administrador.');
  const { password: _password, ...profile } = data;
  return {
    ...profile, uid,
    name: typeof data.name === 'string' && data.name.trim() ? data.name : email || 'Usuário',
    email: email || (typeof data.email === 'string' ? data.email : ''),
    role, active: true, assignedCongregations,
  } as UserProfile;
}

export function loginEmail(input: string): string {
  const value = input.trim().toLowerCase();
  return value.includes('@') ? value : `${value}@casadedeus.org`;
}

export function firebaseErrorMessage(error: unknown): string {
  const code = (error as { code?: string })?.code;
  if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') return 'Login ou senha incorretos. Se o cadastro possui e-mail próprio, entre com esse e-mail.';
  if (code === 'auth/email-already-in-use') return 'Este e-mail já possui uma conta. Edite o acesso existente ou confira o cadastro no Firebase.';
  if (code === 'auth/invalid-email') return 'Informe um e-mail ou login válido.';
  if (code === 'auth/weak-password') return 'A senha deve ter no mínimo 6 caracteres.';
  if (code === 'auth/too-many-requests') return 'Muitas tentativas de acesso. Aguarde alguns minutos e tente novamente.';
  if (code === 'auth/user-disabled') return 'Este acesso foi desativado. Contate o administrador.';
  if (code === 'permission-denied') return 'O Firebase recusou a operação. Peça ao administrador para conferir as permissões do seu perfil e as regras do banco.';
  if (code === 'unavailable' || code === 'auth/network-request-failed') return 'Não foi possível conectar ao Firebase. Confira sua conexão e tente novamente.';
  return error instanceof Error ? error.message : 'Não foi possível concluir a operação. Tente novamente.';
}
