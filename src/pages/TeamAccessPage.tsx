import React, { useState, useMemo } from 'react';
import { useCRM } from '../context/CRMContext';
import { useAuth } from '../context/AuthContext';
import { UserProfile, Congregation, UserRole, ConexaoColor } from '../types';
import { CONEXAO_COLOR_CONFIGS } from '../utils/conexaoConfig';
import { ConexaoLogo } from '../components/ConexaoLogo';
import {
  Shield,
  ShieldCheck,
  Plus,
  Key,
  Building2,
  UserCheck,
  UserX,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Search,
  CheckCircle2,
  AlertTriangle,
  Crown,
  Lock,
  Users,
} from 'lucide-react';

interface TeamAccessPageProps {
  onOpenNewMember: () => void;
  onEditMember: (user: UserProfile) => void;
}

type RoleFilterTab = 'all' | 'lider_equipe' | 'lider_conexao' | 'admin' | 'equipe';

export const TeamAccessPage: React.FC<TeamAccessPageProps> = ({
  onOpenNewMember,
  onEditMember,
}) => {
  const { users, deleteUser, updateUser } = useCRM();
  const { currentUser } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [activeRoleTab, setActiveRoleTab] = useState<RoleFilterTab>('all');
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<UserProfile | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionSuccessNotice, setActionSuccessNotice] = useState<string | null>(null);

  const isAdmin = currentUser?.role === 'admin';

  const roleCounts = useMemo(() => {
    return {
      all: users.length,
      lider_equipe: users.filter(u => u.role === 'lider_equipe').length,
      lider_conexao: users.filter(u => u.role === 'lider_conexao').length,
      admin: users.filter(u => u.role === 'admin').length,
      equipe: users.filter(u => u.role === 'equipe' || !u.role).length,
    };
  }, [users]);

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      // Role filter
      if (activeRoleTab !== 'all') {
        if (activeRoleTab === 'equipe') {
          if (u.role !== 'equipe' && u.role !== undefined) return false;
        } else if (u.role !== activeRoleTab) {
          return false;
        }
      }

      // Search term
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      const teamMatch = u.assignedTeam && u.assignedTeam.toLowerCase().includes(term);
      return (
        u.name.toLowerCase().includes(term) ||
        (u.username && u.username.toLowerCase().includes(term)) ||
        u.email.toLowerCase().includes(term) ||
        teamMatch ||
        u.assignedCongregations.some(c => c.toLowerCase().includes(term))
      );
    });
  }, [users, searchTerm, activeRoleTab]);

  const togglePasswordReveal = (uid: string) => {
    setRevealedPasswords(prev => ({ ...prev, [uid]: !prev[uid] }));
  };

  const handleToggleActive = async (user: UserProfile) => {
    if (user.uid === 'admin-1' || user.uid === 'master-pastorbruno') return;
    try {
      await updateUser(user.uid, { active: !user.active });
      setActionSuccessNotice(`Status de ${user.name} atualizado para ${!user.active ? 'Ativo' : 'Inativo'}.`);
      setTimeout(() => setActionSuccessNotice(null), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmUser) return;
    const deletedName = deleteConfirmUser.name;
    setIsDeleting(true);
    try {
      await deleteUser(deleteConfirmUser.uid);
      setDeleteConfirmUser(null);
      setActionSuccessNotice(`A conta de "${deletedName}" foi excluída com sucesso pelo Master.`);
      setTimeout(() => setActionSuccessNotice(null), 3500);
    } catch (e) {
      console.error(e);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="p-12 text-center bg-[#0B0B0B] border border-[#262626] rounded-xl text-xs space-y-3">
        <Shield className="w-8 h-8 text-neutral-500 mx-auto" />
        <h2 className="text-sm font-semibold text-white">Acesso Restrito ao Pastor Master</h2>
        <p className="text-[#888888]">
          Apenas o Pr. Bruno Bitencourt tem permissão para gerenciar os acessos da equipe, criar líderes e destinar unidades da igreja.
        </p>
      </div>
    );
  }

  const renderRoleBadge = (user: UserProfile) => {
    if (user.role === 'lider_equipe') {
      const color = user.assignedTeam || 'azul';
      const cfg = CONEXAO_COLOR_CONFIGS[color] || CONEXAO_COLOR_CONFIGS.azul;
      return (
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold border border-amber-500/30 bg-amber-500/10 text-amber-300">
          <span className={`w-2 h-2 rounded-full ${cfg.dotBg} shrink-0`} />
          <span>Líder {cfg.displayName}</span>
          <span className="text-[9px] px-1 py-0.2 bg-black/50 text-zinc-400 rounded">Restrito</span>
        </div>
      );
    }

    if (user.role === 'lider_conexao') {
      return (
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold border border-purple-500/30 bg-purple-500/10 text-purple-300">
          <Crown className="w-3 h-3 text-purple-400" />
          <span>Líder Conexão Jovem</span>
          <span className="text-[9px] px-1 py-0.2 bg-black/50 text-zinc-400 rounded">6 Equipes</span>
        </div>
      );
    }

    if (user.role === 'admin') {
      return (
        <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold border border-white/20 bg-white/10 text-white">
          <Shield className="w-3 h-3" />
          <span>Admin Master</span>
        </div>
      );
    }

    return (
      <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-medium border border-blue-500/20 bg-blue-500/10 text-blue-300">
        <Users className="w-3 h-3" />
        <span>Equipe Geral</span>
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#1F1F1F]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white font-heading tracking-tight flex items-center gap-2">
            <span>Gestão de Acessos & Líderes</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#888888] mt-0.5">
            Criação de logins e definição de líderes autorizados pelo Pr. Bruno Bitencourt
          </p>
        </div>

        <button
          onClick={onOpenNewMember}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white text-black font-semibold text-xs sm:text-sm rounded-lg hover:bg-neutral-200 transition-colors shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Criar Novo Acesso</span>
        </button>
      </div>

      {/* Action Notification */}
      {actionSuccessNotice && (
        <div className="p-3 bg-neutral-900 border border-neutral-600 rounded-xl text-white text-xs flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-white" />
            <span className="font-medium">{actionSuccessNotice}</span>
          </div>
          <button
            onClick={() => setActionSuccessNotice(null)}
            className="text-[#888888] hover:text-white text-sm"
          >
            ×
          </button>
        </div>
      )}

      {/* Notice Banner */}
      <div className="p-4 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-start sm:items-center gap-2.5">
          <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
          <div>
            <span className="text-white font-semibold block sm:inline">Controle Rigoroso de Acessos:</span>{' '}
            <span className="text-zinc-300">
              Líderes de Equipe possuem acesso <strong>estritamente restrito à sua equipe</strong>. Apenas o Master pode criar novos acessos ou nomear o Líder Geral do Conexão.
            </span>
          </div>
        </div>
      </div>

      {/* Role Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-[#1F1F1F]">
        <button
          onClick={() => setActiveRoleTab('all')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
            activeRoleTab === 'all'
              ? 'bg-white text-black shadow-sm'
              : 'bg-[#111111] text-zinc-400 hover:text-white hover:bg-[#1A1A1A]'
          }`}
        >
          <span>Todos os Acessos</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/20">{roleCounts.all}</span>
        </button>

        <button
          onClick={() => setActiveRoleTab('lider_equipe')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
            activeRoleTab === 'lider_equipe'
              ? 'bg-amber-500 text-black shadow-sm'
              : 'bg-[#111111] text-zinc-400 hover:text-white hover:bg-[#1A1A1A]'
          }`}
        >
          <ConexaoLogo size="xs" />
          <span>Líderes de Equipe (Cores)</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeRoleTab === 'lider_equipe' ? 'bg-black/20 text-black' : 'bg-zinc-800 text-zinc-300'}`}>
            {roleCounts.lider_equipe}
          </span>
        </button>

        <button
          onClick={() => setActiveRoleTab('lider_conexao')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
            activeRoleTab === 'lider_conexao'
              ? 'bg-purple-500 text-white shadow-sm'
              : 'bg-[#111111] text-zinc-400 hover:text-white hover:bg-[#1A1A1A]'
          }`}
        >
          <Crown className="w-3.5 h-3.5" />
          <span>Líder do Conexão (Geral)</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeRoleTab === 'lider_conexao' ? 'bg-white/20 text-white' : 'bg-zinc-800 text-zinc-300'}`}>
            {roleCounts.lider_conexao}
          </span>
        </button>

        <button
          onClick={() => setActiveRoleTab('admin')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
            activeRoleTab === 'admin'
              ? 'bg-zinc-200 text-black shadow-sm'
              : 'bg-[#111111] text-zinc-400 hover:text-white hover:bg-[#1A1A1A]'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          <span>Admins Master</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeRoleTab === 'admin' ? 'bg-black/20 text-black' : 'bg-zinc-800 text-zinc-300'}`}>
            {roleCounts.admin}
          </span>
        </button>

        <button
          onClick={() => setActiveRoleTab('equipe')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
            activeRoleTab === 'equipe'
              ? 'bg-blue-500 text-white shadow-sm'
              : 'bg-[#111111] text-zinc-400 hover:text-white hover:bg-[#1A1A1A]'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Equipe Geral</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeRoleTab === 'equipe' ? 'bg-white/20 text-white' : 'bg-zinc-800 text-zinc-300'}`}>
            {roleCounts.equipe}
          </span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#666666] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome, login, equipe ou congregação..."
            className="w-full pl-9 pr-4 py-2 bg-[#0B0B0B] border border-[#262626] rounded-xl text-white text-xs placeholder-[#666666] focus:outline-none focus:border-white transition-colors"
          />
        </div>
        <div className="text-xs text-zinc-400">
          Exibindo <strong>{filteredUsers.length}</strong> de {users.length} usuários
        </div>
      </div>

      {/* Table View (Desktop) */}
      <div className="hidden md:block overflow-x-auto bg-[#0B0B0B] border border-[#262626] rounded-xl shadow-sm">
        <table className="w-full text-left text-xs text-[#CCCCCC]">
          <thead className="bg-[#121212] border-b border-[#262626] text-[#888888] font-medium text-[11px] uppercase tracking-wider">
            <tr>
              <th className="py-3 px-4">Membro / Líder</th>
              <th className="py-3 px-4">Função / Equipe</th>
              <th className="py-3 px-4">Login de Acesso</th>
              <th className="py-3 px-4">Senha</th>
              <th className="py-3 px-4">Sede / Escopo</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1A1A1A]">
            {filteredUsers.map(user => {
              const isMaster = user.uid === 'admin-1' || user.uid === 'master-pastorbruno';
              const isRevealed = revealedPasswords[user.uid];

              return (
                <tr key={user.uid} className="hover:bg-[#121212] transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-white">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-[#1C1C1C] border border-[#333333] flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <span>{user.name}</span>
                        {isMaster && (
                          <span className="ml-2 text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.2 bg-white text-black rounded">
                            Master
                          </span>
                        )}
                        <span className="block text-[10px] text-[#777777] font-normal">{user.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    {renderRoleBadge(user)}
                  </td>
                  <td className="py-3.5 px-4 text-white font-mono text-xs">
                    {user.username || user.email.split('@')[0]}
                  </td>
                  <td className="py-3.5 px-4">
                    {isMaster ? (
                      <span className="text-[#888888] italic text-[11px] font-mono">
                        [Protegido Master]
                      </span>
                    ) : (
                      <div className="flex items-center gap-1.5 font-mono text-xs">
                        <span>{isRevealed ? (user.password || '123') : '••••••••'}</span>
                        <button
                          onClick={() => togglePasswordReveal(user.uid)}
                          className="text-[#666666] hover:text-white p-0.5"
                          title={isRevealed ? 'Ocultar senha' : 'Ver senha'}
                        >
                          {isRevealed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1 flex-wrap">
                      {user.role === 'lider_conexao' || user.assignedCongregations.length >= 3 ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#1C1C1C] text-white border border-[#333333]">
                          Todas as Unidades
                        </span>
                      ) : (
                        user.assignedCongregations.map(c => (
                          <span
                            key={c}
                            className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#141414] text-white border border-[#2B2B2B]"
                          >
                            {c}
                          </span>
                        ))
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <button
                      onClick={() => handleToggleActive(user)}
                      disabled={isMaster}
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                        user.active
                          ? 'bg-neutral-900 text-white border border-neutral-700'
                          : 'bg-red-950/40 text-red-300 border border-red-900/50'
                      } ${isMaster ? 'cursor-default' : 'cursor-pointer hover:border-white'}`}
                      title={isMaster ? 'Acesso Master' : 'Clique para alternar status'}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${user.active ? 'bg-white' : 'bg-red-400'}`} />
                      <span>{user.active ? 'Ativo' : 'Inativo'}</span>
                    </button>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => onEditMember(user)}
                        className="p-1.5 text-[#888888] hover:text-white bg-[#141414] hover:bg-[#1A1A1A] rounded border border-[#262626] transition-colors"
                        title="Editar permissões"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      {!isMaster && (
                        <button
                          onClick={() => setDeleteConfirmUser(user)}
                          className="p-1.5 text-[#888888] hover:text-red-400 bg-[#141414] hover:bg-red-950/40 rounded border border-[#262626] transition-colors"
                          title="Remover acesso"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Cards View (Mobile) */}
      <div className="md:hidden space-y-3">
        {filteredUsers.map(user => {
          const isMaster = user.uid === 'admin-1' || user.uid === 'master-pastorbruno';
          const isRevealed = revealedPasswords[user.uid];

          return (
            <div key={user.uid} className="p-4 bg-[#0B0B0B] border border-[#262626] rounded-xl space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
                    <span>{user.name}</span>
                    {isMaster && (
                      <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.2 bg-white text-black rounded">
                        Master
                      </span>
                    )}
                  </h3>
                  <p className="text-[11px] text-[#888888]">{user.email}</p>
                </div>
                <button
                  onClick={() => handleToggleActive(user)}
                  disabled={isMaster}
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                    user.active ? 'bg-neutral-900 text-white border-neutral-700' : 'bg-red-950/40 text-red-400 border-red-900'
                  }`}
                >
                  {user.active ? 'Ativo' : 'Inativo'}
                </button>
              </div>

              <div className="pt-1">
                {renderRoleBadge(user)}
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-[#1A1A1A]">
                <div>
                  <span className="text-[10px] text-[#777777] block">Login:</span>
                  <span className="font-mono text-white">{user.username || user.email.split('@')[0]}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#777777] block">Senha:</span>
                  {isMaster ? (
                    <span className="text-[#888888] italic text-[10px] font-mono">
                      [Protegido Master]
                    </span>
                  ) : (
                    <div className="flex items-center gap-1 font-mono text-white">
                      <span>{isRevealed ? (user.password || '123') : '••••••'}</span>
                      <button onClick={() => togglePasswordReveal(user.uid)} className="text-[#666666]">
                        {isRevealed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-[#1A1A1A] flex items-center justify-between">
                <div className="flex items-center gap-1">
                  {user.assignedCongregations.map(c => (
                    <span key={c} className="text-[10px] px-2 py-0.5 rounded bg-[#141414] text-white border border-[#2B2B2B]">
                      {c}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  {!isMaster ? (
                    <>
                      <button
                        onClick={() => onEditMember(user)}
                        className="p-1.5 text-white bg-[#141414] rounded border border-[#262626]"
                        title="Editar permissões"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirmUser(user)}
                        className="p-1.5 text-red-400 bg-[#141414] rounded border border-[#262626]"
                        title="Remover acesso"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  ) : (
                    <span className="text-[10px] text-[#666666] px-2 py-0.5 bg-[#141414] rounded border border-[#222222]">
                      Titular Master
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Delete Confirmation Dialog */}
      {deleteConfirmUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm bg-[#0B0B0B] border border-[#262626] rounded-xl p-5 shadow-2xl space-y-4 text-white">
            <div className="flex items-center gap-2 text-red-400 font-semibold text-sm">
              <Trash2 className="w-4 h-4 text-red-400" />
              <span>Excluir Conta da Equipe</span>
            </div>
            <div className="space-y-2 text-xs text-[#AAAAAA] leading-relaxed">
              <p>
                Tem certeza de que deseja excluir a conta de <strong>{deleteConfirmUser.name}</strong>?
              </p>
              <div className="p-2.5 bg-[#141414] rounded-lg border border-[#222222] font-mono text-[11px] text-[#CCCCCC]">
                <div>Login: <span className="text-white">{deleteConfirmUser.username || deleteConfirmUser.email}</span></div>
                <div>Unidade: <span className="text-white">{deleteConfirmUser.assignedCongregations.join(', ')}</span></div>
              </div>
              <p className="text-[11px] text-red-300">
                Esta ação revogará o login imediatamente. Apenas o Master pode recriar este acesso no futuro.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#1C1C1C]">
              <button
                type="button"
                onClick={() => setDeleteConfirmUser(null)}
                className="px-3 py-1.5 text-xs text-[#CCCCCC] bg-[#141414] hover:bg-[#1C1C1C] border border-[#262626] rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-1.5 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors shadow-sm disabled:opacity-50"
              >
                {isDeleting ? 'Excluindo...' : 'Sim, Excluir Conta'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
