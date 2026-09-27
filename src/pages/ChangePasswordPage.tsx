import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Building2,
  User,
  ShieldAlert,
} from 'lucide-react';

export const ChangePasswordPage: React.FC = () => {
  const { currentUser, changePassword, isDemoMode } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const isLengthValid = newPassword.length >= 4;
  const isMatchValid = newPassword.length > 0 && newPassword === confirmPassword;
  const isDifferent = newPassword.length > 0 && newPassword !== currentPassword;
  const canSubmit = currentPassword.length > 0 && isLengthValid && isMatchValid && isDifferent && !isLoading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!currentPassword) {
      setErrorMessage('Informe sua senha atual para continuar.');
      return;
    }
    if (!isLengthValid) {
      setErrorMessage('A nova senha deve ter no mínimo 4 caracteres.');
      return;
    }
    if (!isMatchValid) {
      setErrorMessage('A confirmação da nova senha não confere.');
      return;
    }
    if (!isDifferent) {
      setErrorMessage('A nova senha deve ser diferente da senha atual.');
      return;
    }

    setIsLoading(true);
    try {
      await changePassword(currentPassword, newPassword);
      setSuccessMessage('Sua senha foi alterada com sucesso! Guarde-a com segurança.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao alterar senha';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const isMaster = currentUser?.role === 'admin';

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="pb-3 border-b border-[#1F1F1F]">
        <h1 className="text-xl sm:text-2xl font-bold text-white font-heading tracking-tight flex items-center gap-2.5">
          <KeyRound className="w-6 h-6 text-white" />
          <span>Alterar Senha de Acesso</span>
        </h1>
        <p className="text-xs sm:text-sm text-[#888888] mt-1">
          Atualize sua credencial interna de login. Cada usuário pode redefinir sua própria senha a qualquer momento.
        </p>
      </div>

      {/* User Context Banner */}
      <div className="p-4 sm:p-5 bg-[#0B0B0B] border border-[#262626] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-[#181818] border border-[#333333] flex items-center justify-center text-white font-bold text-base font-heading">
            {currentUser?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white text-sm sm:text-base">
                {currentUser?.name}
              </span>
              <span
                className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded ${
                  isMaster ? 'bg-white text-black' : 'bg-[#1C1C1C] text-[#CCCCCC] border border-[#333333]'
                }`}
              >
                {isMaster ? 'Pastor Master' : 'Equipe'}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-[#888888] mt-0.5">
              <span>Login: <strong className="text-white font-mono">{currentUser?.username || currentUser?.email}</strong></span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Building2 className="w-3 h-3 text-[#777777]" />
                {currentUser?.assignedCongregations?.join(', ') || 'Todas'}
              </span>
            </div>
          </div>
        </div>

        <div className="text-left sm:text-right text-[11px] text-[#777777] border-t sm:border-t-0 pt-2 sm:pt-0 border-[#1C1C1C]">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-white font-medium">
            <ShieldCheck className="w-3 h-3 text-white" />
            <span>Sessão Autenticada</span>
          </span>
          {isDemoMode && (
            <p className="text-[10px] text-[#888888] mt-1">Ambiente de Demonstração</p>
          )}
        </div>
      </div>

      {/* Main Form Container */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-[#0B0B0B] border border-[#262626] rounded-xl p-5 sm:p-6 shadow-xl space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-[#1A1A1A]">
            <Lock className="w-4 h-4 text-white" />
            <h2 className="text-sm font-semibold text-white">Formulário de Nova Senha</h2>
          </div>

          {/* Feedback Banners */}
          {successMessage && (
            <div className="p-3.5 bg-neutral-900 border border-neutral-600 rounded-lg text-white text-xs flex items-start gap-2.5 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-white shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">{successMessage}</p>
                <p className="text-[#AAAAAA] text-[11px] mt-0.5">
                  Nas próximas vezes que fizer login no sistema da Casa de Deus, utilize esta nova senha.
                </p>
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="p-3.5 bg-red-950/60 border border-red-800 rounded-lg text-red-200 text-xs flex items-start gap-2.5 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Erro ao alterar senha</p>
                <p className="text-red-300 text-[11px] mt-0.5">{errorMessage}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Senha Atual */}
            <div>
              <label className="block text-xs font-medium text-[#CCCCCC] mb-1.5" htmlFor="current-pass">
                Senha Atual <span className="text-white font-bold">*</span>
              </label>
              <div className="relative">
                <input
                  id="current-pass"
                  type={showCurrent ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={e => {
                    setCurrentPassword(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="Digite sua senha atual"
                  required
                  className="w-full px-3.5 pr-10 py-2.5 bg-[#141414] border border-[#262626] rounded-lg text-white text-xs sm:text-sm focus:outline-none focus:border-white transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#777777] hover:text-white transition-colors focus:outline-none"
                  aria-label={showCurrent ? 'Ocultar senha atual' : 'Exibir senha atual'}
                >
                  {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[10px] text-[#777777] mt-1">
                Necessário para confirmar sua identidade antes da alteração.
              </p>
            </div>

            {/* Nova Senha */}
            <div>
              <label className="block text-xs font-medium text-[#CCCCCC] mb-1.5" htmlFor="new-pass">
                Nova Senha <span className="text-white font-bold">*</span>
              </label>
              <div className="relative">
                <input
                  id="new-pass"
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={e => {
                    setNewPassword(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="Digite a nova senha (mínimo 4 caracteres)"
                  required
                  className="w-full px-3.5 pr-10 py-2.5 bg-[#141414] border border-[#262626] rounded-lg text-white text-xs sm:text-sm focus:outline-none focus:border-white transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#777777] hover:text-white transition-colors focus:outline-none"
                  aria-label={showNew ? 'Ocultar nova senha' : 'Exibir nova senha'}
                >
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirmar Nova Senha */}
            <div>
              <label className="block text-xs font-medium text-[#CCCCCC] mb-1.5" htmlFor="confirm-pass">
                Confirmar Nova Senha <span className="text-white font-bold">*</span>
              </label>
              <div className="relative">
                <input
                  id="confirm-pass"
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => {
                    setConfirmPassword(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="Repita a nova senha para confirmação"
                  required
                  className="w-full px-3.5 pr-10 py-2.5 bg-[#141414] border border-[#262626] rounded-lg text-white text-xs sm:text-sm focus:outline-none focus:border-white transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#777777] hover:text-white transition-colors focus:outline-none"
                  aria-label={showConfirm ? 'Ocultar confirmação' : 'Exibir confirmação'}
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Checklist de Validação */}
            <div className="p-3 bg-[#111111] border border-[#202020] rounded-lg space-y-1.5 text-xs">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#666666] block mb-1">
                Critérios de Validação:
              </span>
              <div className="flex items-center gap-2">
                <span
                  className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${
                    isLengthValid ? 'bg-white text-black font-bold' : 'bg-[#222222] text-[#666666]'
                  }`}
                >
                  ✓
                </span>
                <span className={isLengthValid ? 'text-white' : 'text-[#777777]'}>
                  Mínimo de 4 caracteres
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${
                    isMatchValid ? 'bg-white text-black font-bold' : 'bg-[#222222] text-[#666666]'
                  }`}
                >
                  ✓
                </span>
                <span className={isMatchValid ? 'text-white' : 'text-[#777777]'}>
                  Confirmação de senha idêntica
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${
                    isDifferent ? 'bg-white text-black font-bold' : 'bg-[#222222] text-[#666666]'
                  }`}
                >
                  ✓
                </span>
                <span className={isDifferent ? 'text-white' : 'text-[#777777]'}>
                  Diferente da senha atual
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#1A1A1A]">
              <button
                type="button"
                onClick={handleReset}
                disabled={isLoading}
                className="px-4 py-2 text-xs text-[#888888] hover:text-white bg-[#141414] hover:bg-[#1A1A1A] border border-[#262626] rounded-lg transition-colors"
              >
                Limpar
              </button>

              <button
                type="submit"
                disabled={!canSubmit}
                className="px-5 py-2 text-xs font-semibold bg-white hover:bg-neutral-200 text-black rounded-lg transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isLoading ? (
                  <span>Salvando...</span>
                ) : (
                  <>
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Salvar Nova Senha</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Informative Side Cards */}
        <div className="space-y-4">
          <div className="p-4 bg-[#0B0B0B] border border-[#262626] rounded-xl space-y-2 text-xs">
            <div className="flex items-center gap-2 text-white font-semibold">
              <ShieldCheck className="w-4 h-4 text-white" />
              <span>Privacidade & Segurança</span>
            </div>
            <p className="text-[#888888] leading-relaxed text-[11px]">
              Sua senha é de uso pessoal e intransferível. Evite utilizar senhas óbvias ou compartilhá-la com terceiros.
            </p>
          </div>

          <div className="p-4 bg-[#0B0B0B] border border-[#262626] rounded-xl space-y-2 text-xs">
            <div className="flex items-center gap-2 text-white font-semibold">
              <ShieldAlert className="w-4 h-4 text-white" />
              <span>Controle pelo Master</span>
            </div>
            <p className="text-[#888888] leading-relaxed text-[11px]">
              O <strong>Pr. Bruno Bitencourt (Master)</strong> possui autoridade administrativa para gerenciar acessos, alterar permissões de congregações ou excluir contas de membros da equipe a qualquer momento.
            </p>
          </div>

          <div className="p-4 bg-[#111111] border border-[#222222] rounded-xl text-xs space-y-1">
            <span className="text-[10px] text-[#777777] uppercase font-bold tracking-wider">
              Segurança no Login
            </span>
            <p className="text-[11px] text-[#999999] leading-relaxed">
              O sistema possui verificação estrita: qualquer tentativa com senha incorreta será prontamente bloqueada.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
