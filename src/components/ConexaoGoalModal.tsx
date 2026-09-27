import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { ConexaoColor, ConexaoTeamGoal } from '../types';
import { CONEXAO_COLOR_CONFIGS } from '../utils/conexaoConfig';
import { Target, CheckCircle2, Shield, Users, Sparkles, Building2 } from 'lucide-react';

interface ConexaoGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  color: ConexaoColor;
  currentGoal?: ConexaoTeamGoal;
  onSave: (color: ConexaoColor, updates: Partial<ConexaoTeamGoal>) => Promise<void>;
}

export const ConexaoGoalModal: React.FC<ConexaoGoalModalProps> = ({
  isOpen,
  onClose,
  color,
  currentGoal,
  onSave,
}) => {
  const config = CONEXAO_COLOR_CONFIGS[color];

  const [targetGuests, setTargetGuests] = useState<number>(100);
  const [targetGuestsMonth, setTargetGuestsMonth] = useState<number>(10);
  const [targetMembers, setTargetMembers] = useState<number>(40);
  const [targetBases, setTargetBases] = useState<number>(4);
  const [targetWeeklyAttendance, setTargetWeeklyAttendance] = useState<number>(45);
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (currentGoal) {
      setTargetGuests(currentGoal.targetGuests || 100);
      setTargetGuestsMonth(currentGoal.targetGuestsMonth || 10);
      setTargetMembers(currentGoal.targetMembers || 40);
      setTargetBases(currentGoal.targetBases || 4);
      setTargetWeeklyAttendance(currentGoal.targetWeeklyAttendance || 45);
      setNotes(currentGoal.notes || '');
    } else {
      setTargetGuests(100);
      setTargetGuestsMonth(10);
      setTargetMembers(40);
      setTargetBases(4);
      setTargetWeeklyAttendance(45);
      setNotes('');
    }
    setSuccessMessage(null);
  }, [currentGoal, color, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSave(color, {
        targetGuests: Number(targetGuests),
        targetGuestsMonth: Number(targetGuestsMonth),
        targetMembers: Number(targetMembers),
        targetBases: Number(targetBases),
        targetWeeklyAttendance: Number(targetWeeklyAttendance),
        notes: notes.trim(),
        updatedAt: new Date().toISOString(),
      });
      setSuccessMessage(`Metas da ${config.displayName} salvas com sucesso!`);
      setTimeout(() => {
        setIsSubmitting(false);
        onClose();
      }, 700);
    } catch (err) {
      setIsSubmitting(false);
      console.error(err);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Definir Metas da ${config.displayName}`}
      subtitle="Exclusivo Admin Master: Definição de alvos estratégicos para a equipe"
      maxWidth="md"
    >
      {successMessage ? (
        <div className="py-8 flex flex-col items-center justify-center text-center space-y-2">
          <CheckCircle2 className="w-10 h-10 text-emerald-400" />
          <p className="text-sm font-semibold text-white">{successMessage}</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div
            className="p-3 rounded-xl border flex items-center gap-3"
            style={{
              backgroundColor: `${config.hex}15`,
              borderColor: `${config.hex}40`,
            }}
          >
            <span
              className="w-4 h-4 rounded-full shrink-0 shadow-sm"
              style={{ backgroundColor: config.hex }}
            />
            <div>
              <span className="font-bold text-white text-xs block">{config.displayName}</span>
              <span className="text-[11px] text-zinc-400 capitalize">Equipe da Cor {config.name}</span>
            </div>
          </div>

          {/* Grid de Metas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Meta Anual de Convidados (Jan - Dez)
              </label>
              <div className="relative">
                <Sparkles className="w-4 h-4 text-amber-400 absolute left-3 top-2.5" />
                <input
                  type="number"
                  min="0"
                  value={targetGuests}
                  onChange={e => setTargetGuests(Number(e.target.value))}
                  className="w-full pl-9 pr-3 py-2 bg-[#121212] border border-[#2B2B2B] rounded-xl text-white text-xs focus:outline-none focus:border-white transition-colors"
                  required
                />
              </div>
              <span className="text-[10px] text-zinc-500 mt-0.5 block">Alvo total no ano de 2026</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Meta Mensal de Convidados
              </label>
              <div className="relative">
                <Target className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
                <input
                  type="number"
                  min="0"
                  value={targetGuestsMonth}
                  onChange={e => setTargetGuestsMonth(Number(e.target.value))}
                  className="w-full pl-9 pr-3 py-2 bg-[#121212] border border-[#2B2B2B] rounded-xl text-white text-xs focus:outline-none focus:border-white transition-colors"
                  required
                />
              </div>
              <span className="text-[10px] text-zinc-500 mt-0.5 block">Média mensal esperada</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Meta de Membros Integrados
              </label>
              <div className="relative">
                <Users className="w-4 h-4 text-emerald-400 absolute left-3 top-2.5" />
                <input
                  type="number"
                  min="0"
                  value={targetMembers}
                  onChange={e => setTargetMembers(Number(e.target.value))}
                  className="w-full pl-9 pr-3 py-2 bg-[#121212] border border-[#2B2B2B] rounded-xl text-white text-xs focus:outline-none focus:border-white transition-colors"
                  required
                />
              </div>
              <span className="text-[10px] text-zinc-500 mt-0.5 block">Jovens firmes na equipe</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Meta de Bases Ativas (Células)
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-indigo-400 absolute left-3 top-2.5" />
                <input
                  type="number"
                  min="0"
                  value={targetBases}
                  onChange={e => setTargetBases(Number(e.target.value))}
                  className="w-full pl-9 pr-3 py-2 bg-[#121212] border border-[#2B2B2B] rounded-xl text-white text-xs focus:outline-none focus:border-white transition-colors"
                  required
                />
              </div>
              <span className="text-[10px] text-zinc-500 mt-0.5 block">Sub-líderes com base ativa</span>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Meta Média de Presença nos Cultos (Sábados)
              </label>
              <div className="relative">
                <Shield className="w-4 h-4 text-purple-400 absolute left-3 top-2.5" />
                <input
                  type="number"
                  min="0"
                  value={targetWeeklyAttendance}
                  onChange={e => setTargetWeeklyAttendance(Number(e.target.value))}
                  className="w-full pl-9 pr-3 py-2 bg-[#121212] border border-[#2B2B2B] rounded-xl text-white text-xs focus:outline-none focus:border-white transition-colors"
                  required
                />
              </div>
              <span className="text-[10px] text-zinc-500 mt-0.5 block">Média de jovens da cor presentes por culto</span>
            </div>
          </div>

          {/* Orientações Pastorais / Notas */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Orientações Pastorais & Estratégia para a Equipe
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Ex: Foco no evangelismo das escolas e universidades da região, fortalecer o discipulado de terça..."
              className="w-full p-3 bg-[#121212] border border-[#2B2B2B] rounded-xl text-white text-xs placeholder-zinc-600 focus:outline-none focus:border-white transition-colors"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#1F1F1F]">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-3.5 py-2 text-xs font-medium text-zinc-400 hover:text-white bg-[#141414] rounded-lg border border-[#262626] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-bold text-black bg-white hover:bg-neutral-200 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
            >
              {isSubmitting ? (
                <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : (
                <Target className="w-3.5 h-3.5" />
              )}
              <span>Salvar Metas da Equipe</span>
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
};
