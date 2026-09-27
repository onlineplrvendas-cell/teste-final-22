import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { useCRM } from '../context/CRMContext';
import { UserProfile, Congregation, UserRole, ConexaoColor } from '../types';
import { CONEXAO_COLORS, CONEXAO_COLOR_CONFIGS } from '../utils/conexaoConfig';
import { ConexaoLogo } from './ConexaoLogo';
import {
  Shield,
  Key,
  Eye,
  EyeOff,
  Building2,
  User,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Crown,
  Sparkles,
  Lock,
} from 'lucide-react';

interface TeamMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  userToEdit?: UserProfile | null;
}

export const TeamMemberModal: React.FC<TeamMemberModalProps> = ({
  isOpen,
  onClose,
  userToEdit,
}) => {
  const { createUser, updateUser, deleteUser } = useCRM();

  const isEditing = !!userToEdit;

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [congregationScope, setCongregationScope] = useState<'Recreio' | 'Curicica' | 'Guaratiba' | 'all'>('Recreio');
  const [role, setRole] = useState<UserRole>('lider_equipe');
  const [assignedTeam, setAssignedTeam] = useState<ConexaoColor>('azul');
  const [active, setActive] = useState(true);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isMasterUser = userToEdit?.uid === 'master-pastorbruno' || userToEdit?.uid === 'admin-1';

  useEffect(() => {
    setConfirmDelete(false);
    if (userToEdit) {
      setName(userToEdit.name);
      setUsername(userToEdit.username || userToEdit.email.split('@')[0] || '');
      setEmail(userToEdit.email);
      setPassword(userToEdit.password || '123456');
      if (userToEdit.assignedCongregations.length >= 3) {
        setCongregationScope('all');
      } else {
        setCongregationScope(userToEdit.assignedCongregations[0] || 'Recreio');
      }
      setRole(userToEdit.role || 'equipe');
      setAssignedTeam(userToEdit.assignedTeam || 'azul');
      setActive(userToEdit.active);
    } else {
      setName('');
      setUsername('');
      setEmail('');
      setPassword('');
      setCongregationScope('Recreio');
      setRole('lider_equipe');
      setAssignedTeam('azul');
      setActive(true);
    }
    setErrors({});
    setSuccessMessage(null);
  }, [userToEdit, isOpen]);

  const validate = (): boolean => {
    const err: Record<string, string> = {};
    if (!name.trim()) err.name = 'Nome completo é obrigatório';
    if (!username.trim()) err.username = 'Login/Usuário é obrigatório';
    if (!isEditing && (!password || password.length < 6)) {
      err.password = 'A senha deve ter no mínimo 6 caracteres (exigência do Firebase Auth)';
    } else if (password && password.length < 6) {
      err.password = 'A senha deve ter no mínimo 6 caracteres';
    }

    if (role === 'lider_equipe' && !assignedTeam) {
      err.assignedTeam = 'Selecione a equipe do Conexão Jovem';
    }

    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const assignedCongregations: Congregation[] =
        congregationScope === 'all' || role === 'admin' || role === 'lider_conexao'
          ? ['Recreio', 'Curicica', 'Guaratiba']
          : [congregationScope as Congregation];

      const cleanUsername = username.trim().replace(/\s+/g, '').toLowerCase();
      const userEmail = email.trim() || `${cleanUsername}@casadedeus.org`;

      if (isEditing && userToEdit) {
        await updateUser(userToEdit.uid, {
          name: name.trim(),
          username: cleanUsername,
          email: userEmail,
          password: password.trim() || userToEdit.password,
          role,
          assignedTeam: role === 'lider_equipe' ? assignedTeam : undefined,
          assignedCongregations,
          active,
        });
        setSuccessMessage('Acesso atualizado com sucesso!');
      } else {
        await createUser(
          {
            name: name.trim(),
            username: cleanUsername,
            email: userEmail,
            password: password.trim(),
            role,
            assignedTeam: role === 'lider_equipe' ? assignedTeam : undefined,
            assignedCongregations,
            active,
          },
          password.trim()
        );
        setSuccessMessage('Novo acesso de equipe criado com sucesso!');
      }

      setTimeout(() => {
        setIsSubmitting(false);
        onClose();
      }, 700);
    } catch (err: unknown) {
      setIsSubmitting(false);
      const msg = err instanceof Error ? err.message : 'Falha ao salvar permissões do usuário';
      setErrors({ submit: msg });
    }
  };

  const handleDeleteMember = async () => {
    if (!userToEdit || isMasterUser) return;
    setIsSubmitting(true);
    try {
      await deleteUser(userToEdit.uid);
      setSuccessMessage(`Conta de "${userToEdit.name}" excluída com sucesso!`);
      setTimeout(() => {
        setIsSubmitting(false);
        onClose();
      }, 700);
    } catch (err: unknown) {
      setIsSubmitting(false);
      const msg = err instanceof Error ? err.message : 'Falha ao excluir conta';
      setErrors({ submit: msg });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Acesso da Equipe' : 'Criar Novo Acesso de Equipe'}
      subtitle="Exclusivo Master: Pr. Bruno Bitencourt autoriza e define permissões"
      maxWidth="lg"
    >
      {successMessage ? (
        <div className="py-8 flex flex-col items-center justify-center text-center space-y-2">
          <CheckCircle2 className="w-10 h-10 text-white" />
          <p className="text-sm font-semibold text-white">{successMessage}</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {errors.submit && (
            <div className="p-3 bg-red-950/60 border border-red-800 rounded-lg text-red-200">
              {errors.submit}
            </div>
          )}

          {/* Tipo / Nível de Acesso (Tabs no topo) */}
          <div className="p-3 bg-[#0F0F0F] border border-[#262626] rounded-xl space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-amber-400" />
                Nível de Acesso & Função
              </span>
              <span className="text-[10px] text-zinc-400">Criado pelo Master</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setRole('lider_equipe')}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  role === 'lider_equipe'
                    ? 'bg-amber-500/15 border-amber-400/80 text-amber-300 shadow-sm'
                    : 'bg-[#141414] border-[#222222] text-zinc-400 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-[11px] mb-0.5">
                  <ConexaoLogo size="xs" />
                  <span>Líder de Equipe</span>
                </div>
                <p className="text-[9px] text-zinc-400 leading-tight">
                  Acesso <strong>somente à sua cor</strong>
                </p>
              </button>

              <button
                type="button"
                onClick={() => setRole('lider_conexao')}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  role === 'lider_conexao'
                    ? 'bg-purple-500/15 border-purple-400/80 text-purple-300 shadow-sm'
                    : 'bg-[#141414] border-[#222222] text-zinc-400 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-[11px] mb-0.5">
                  <Crown className="w-3.5 h-3.5 text-purple-400" />
                  <span>Líder do Conexão</span>
                </div>
                <p className="text-[9px] text-zinc-400 leading-tight">
                  Pode ver <strong>todas as 6 equipes</strong>
                </p>
              </button>

              <button
                type="button"
                onClick={() => setRole('admin')}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  role === 'admin'
                    ? 'bg-white text-black border-white font-bold shadow-sm'
                    : 'bg-[#141414] border-[#222222] text-zinc-400 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-[11px] mb-0.5">
                  <Shield className="w-3.5 h-3.5" />
                  <span>Admin Master</span>
                </div>
                <p className="text-[9px] leading-tight opacity-80">
                  Acesso total ao sistema
                </p>
              </button>

              <button
                type="button"
                onClick={() => setRole('equipe')}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  role === 'equipe'
                    ? 'bg-blue-500/15 border-blue-400/80 text-blue-300 shadow-sm'
                    : 'bg-[#141414] border-[#222222] text-zinc-400 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-[11px] mb-0.5">
                  <User className="w-3.5 h-3.5 text-blue-400" />
                  <span>Equipe Geral</span>
                </div>
                <p className="text-[9px] text-zinc-400 leading-tight">
                  Atendimento por sede
                </p>
              </button>
            </div>
          </div>

          {/* Seletor de Equipe quando role é 'lider_equipe' */}
          {role === 'lider_equipe' && (
            <div className="p-3 bg-gradient-to-br from-[#121212] to-[#0A0A0A] border border-amber-500/30 rounded-xl space-y-2.5 animate-fadeIn">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  Selecione a Equipe do Líder (Acesso Exclusivo)
                </span>
                <span className="text-[10px] text-amber-400/80 font-medium">Restrito à cor escolhida</span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Este líder terá acesso restrito às informações, convidados, bases, resultados e metas <strong>apenas da equipe selecionada</strong> abaixo:
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                {CONEXAO_COLORS.map(color => {
                  const cfg = CONEXAO_COLOR_CONFIGS[color];
                  const isSelected = assignedTeam === color;
                  return (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setAssignedTeam(color)}
                      className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                        isSelected
                          ? `${cfg.badgeBg} border-current ring-1 ring-white/30 font-bold scale-[1.02]`
                          : 'bg-[#161616] border-[#262626] text-zinc-300 hover:border-zinc-500'
                      }`}
                    >
                      <span className={`w-3.5 h-3.5 rounded-full ${cfg.dotBg} shrink-0 shadow-sm`} />
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold truncate">{cfg.displayName}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
              {errors.assignedTeam && (
                <p className="text-red-400 text-[10px]">{errors.assignedTeam}</p>
              )}
            </div>
          )}

          {/* Nome */}
          <div>
            <label className="block text-xs font-medium text-[#CCCCCC] mb-1">
              Nome do Membro / Líder <span className="text-white font-bold">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ex: Matheus Lima Rocha, Lucas Martins"
              className={`w-full px-3 py-2 bg-[#141414] border ${
                errors.name ? 'border-red-500' : 'border-[#262626]'
              } rounded-lg text-white text-xs focus:outline-none focus:border-white transition-colors`}
            />
            {errors.name && <p className="text-red-400 text-[10px] mt-1">{errors.name}</p>}
          </div>

          {/* Login e Senha */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#CCCCCC] mb-1">
                Login / Usuário de Acesso <span className="text-white font-bold">*</span>
              </label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="matheus.azul"
                className={`w-full px-3 py-2 bg-[#141414] border ${
                  errors.username ? 'border-red-500' : 'border-[#262626]'
                } rounded-lg text-white text-xs focus:outline-none focus:border-white transition-colors`}
              />
              {errors.username && <p className="text-red-400 text-[10px] mt-1">{errors.username}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-[#CCCCCC] mb-1">
                Senha de Acesso {isEditing ? '(deixe em branco para manter)' : <span className="text-white font-bold">*</span>}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full px-3 pr-8 py-2 bg-[#141414] border ${
                    errors.password ? 'border-red-500' : 'border-[#262626]'
                  } rounded-lg text-white text-xs focus:outline-none focus:border-white transition-colors`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#777777] hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
              {errors.password && <p className="text-red-400 text-[10px] mt-1">{errors.password}</p>}
            </div>
          </div>

          {/* E-mail opcional */}
          <div>
            <label className="block text-xs font-medium text-[#CCCCCC] mb-1">
              E-mail Institucional (opcional)
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="lider@casadedeus.org"
              className="w-full px-3 py-2 bg-[#141414] border border-[#262626] rounded-lg text-white text-xs focus:outline-none focus:border-white transition-colors"
            />
          </div>

          {/* Destinação da Unidade da Igreja (se aplicável) */}
          {role !== 'lider_conexao' && role !== 'admin' && (
            <div className="p-3 bg-[#0F0F0F] border border-[#262626] rounded-xl space-y-2">
              <div className="flex items-center gap-1.5 text-white font-semibold">
                <Building2 className="w-3.5 h-3.5 text-white" />
                <span>Congregação Sede</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                {[
                  { id: 'Recreio', label: 'Recreio' },
                  { id: 'Curicica', label: 'Curicica' },
                  { id: 'Guaratiba', label: 'Guaratiba' },
                  { id: 'all', label: 'Todas as Unidades' },
                ].map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setCongregationScope(opt.id as any)}
                    className={`py-2 px-2 rounded-lg text-xs font-medium border text-center transition-colors ${
                      congregationScope === opt.id
                        ? 'bg-white text-black border-white font-semibold'
                        : 'bg-[#141414] text-[#888888] hover:text-white border-[#262626]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Status Ativo / Inativo */}
          <div className="p-3 bg-[#0F0F0F] border border-[#262626] rounded-xl flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-white block">Status da Autorização</span>
              <span className="text-[10px] text-[#777777]">
                {active ? 'Acesso liberado para operar no sistema' : 'Acesso suspenso (bloqueado)'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setActive(!active)}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                active ? 'bg-white' : 'bg-[#262626]'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full shadow transition duration-200 ease-in-out ${
                  active ? 'translate-x-4 bg-black' : 'translate-x-0 bg-[#666666]'
                }`}
              />
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between gap-2.5 pt-3 border-t border-[#1C1C1C]">
            <div>
              {isEditing && !isMasterUser && (
                confirmDelete ? (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleDeleteMember}
                      disabled={isSubmitting}
                      className="px-2.5 py-1.5 text-[11px] font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                    >
                      Confirmar Exclusão
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(false)}
                      className="px-2 py-1.5 text-[11px] text-[#888888] hover:text-white"
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    className="flex items-center gap-1 text-[11px] text-red-400 hover:text-red-300 py-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Excluir Acesso</span>
                  </button>
                )
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-3.5 py-2 text-xs font-medium text-[#888888] hover:text-white bg-[#141414] hover:bg-[#1A1A1A] border border-[#262626] rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-semibold text-black bg-white hover:bg-neutral-200 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
              >
                {isSubmitting ? (
                  <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Shield className="w-3.5 h-3.5" />
                )}
                <span>{isEditing ? 'Salvar Alterações' : 'Criar Acesso'}</span>
              </button>
            </div>
          </div>
        </form>
      )}
    </Modal>
  );
};
