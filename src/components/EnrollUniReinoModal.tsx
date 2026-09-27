import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { useCRM } from '../context/CRMContext';
import { Contact, UniReinoSemester, UniReinoStatus } from '../types';
import { UniReinoBadge } from './UniReinoBadge';
import {
  GraduationCap,
  Crown,
  Search,
  CheckCircle2,
  Calendar,
  BookOpen,
  ArrowRight,
  AlertTriangle,
  User,
  Sparkles,
  Award,
} from 'lucide-react';

interface EnrollUniReinoModalProps {
  isOpen: boolean;
  onClose: () => void;
  contactToEdit?: Contact | null;
  defaultSemester?: UniReinoSemester;
}

export const EnrollUniReinoModal: React.FC<EnrollUniReinoModalProps> = ({
  isOpen,
  onClose,
  contactToEdit,
  defaultSemester = 1,
}) => {
  const { contacts, enrollInUniReino, updateUniReino, unenrollFromUniReino } = useCRM();

  const isEditing = !!contactToEdit && !!contactToEdit.uniReino?.isEnrolled;

  // Selected student
  const [selectedContactId, setSelectedContactId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  // Course fields
  const [semester, setSemester] = useState<UniReinoSemester>(defaultSemester);
  const [status, setStatus] = useState<UniReinoStatus>('matriculado');
  const [matricula, setMatricula] = useState('');
  const [turma, setTurma] = useState('');
  const [notes, setNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [confirmUnenroll, setConfirmUnenroll] = useState(false);

  useEffect(() => {
    if (contactToEdit) {
      setSelectedContactId(contactToEdit.id);
      if (contactToEdit.uniReino) {
        setSemester(contactToEdit.uniReino.semester || 1);
        setStatus(contactToEdit.uniReino.status || 'matriculado');
        setMatricula(contactToEdit.uniReino.matricula || '');
        setTurma(contactToEdit.uniReino.turma || '');
        setNotes(contactToEdit.uniReino.notes || '');
      } else {
        setSemester(defaultSemester);
        setStatus('matriculado');
        setMatricula(`UN-${Math.floor(1000 + Math.random() * 9000)}`);
        setTurma(`Turma ${new Date().getFullYear()}.${new Date().getMonth() < 6 ? 1 : 2}`);
        setNotes('');
      }
    } else {
      setSelectedContactId('');
      setSearchQuery('');
      setSemester(defaultSemester);
      setStatus('matriculado');
      setMatricula(`UN-${Math.floor(1000 + Math.random() * 9000)}`);
      setTurma(`Turma ${new Date().getFullYear()}.${new Date().getMonth() < 6 ? 1 : 2}`);
      setNotes('');
    }
    setConfirmUnenroll(false);
    setErrorMsg(null);
    setSuccessMsg(null);
  }, [contactToEdit, isOpen, defaultSemester]);

  if (!isOpen) return null;

  // Candidate contacts for new enrollment (not yet enrolled in Uni Reino)
  const candidateContacts = contacts.filter(c => {
    if (c.isArchived) return false;
    if (c.uniReino?.isEnrolled) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.phone.toLowerCase().includes(q) ||
      c.congregation.toLowerCase().includes(q)
    );
  });

  const selectedContact = contacts.find(c => c.id === selectedContactId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContactId) {
      setErrorMsg('Por favor, selecione um membro para matricular.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      if (isEditing) {
        await updateUniReino(selectedContactId, {
          semester,
          status,
          matricula,
          turma,
          notes,
        });
        setSuccessMsg('Dados da matrícula no Uni Reino atualizados com sucesso!');
      } else {
        await enrollInUniReino(selectedContactId, {
          semester,
          status,
          matricula: matricula.trim() || `UN-${Math.floor(1000 + Math.random() * 9000)}`,
          turma: turma.trim() || `Turma ${new Date().getFullYear()}.${new Date().getMonth() < 6 ? 1 : 2}`,
          notes,
        });
        setSuccessMsg('Membro matriculado com sucesso no Uni Reino!');
      }

      setTimeout(() => {
        setIsSubmitting(false);
        onClose();
      }, 900);
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMsg(err.message || 'Erro ao processar matrícula.');
    }
  };

  const handleUnenroll = async () => {
    if (!selectedContactId) return;
    setIsSubmitting(true);
    try {
      await unenrollFromUniReino(selectedContactId);
      setSuccessMsg('Matrícula removida com sucesso.');
      setTimeout(() => {
        setIsSubmitting(false);
        onClose();
      }, 800);
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMsg('Erro ao desmatricular.');
    }
  };

  const semestersList: UniReinoSemester[] = [1, 2, 3, 4, 5, 6, 7, 8];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Gerenciar Matrícula • Uni Reino' : 'Matricular Membro no Uni Reino'}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5 text-xs text-white">
        {/* Banner with prestigious golden identity */}
        <div className="p-3.5 bg-gradient-to-r from-[#181408] via-[#120F06] to-[#0D0B05] border border-amber-500/30 rounded-xl flex items-center justify-between gap-3 shadow-inner">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center text-black font-black shadow-md shadow-amber-500/20">
              <Crown className="w-5 h-5 fill-black" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-amber-200">Uni Reino • 8 Semestres</span>
                <UniReinoBadge semester={semester} size="xs" />
              </div>
              <p className="text-[11px] text-[#A89874]">
                Curso Ministerial da Casa de Deus com 8 semestres de formação e selo dourado UN.
              </p>
            </div>
          </div>
          <div className="hidden sm:block text-right">
            <span className="text-[10px] uppercase font-bold text-[#887A5B] block">Progresso</span>
            <span className="text-sm font-extrabold text-amber-300">
              {Math.round((semester / 8) * 100)}%
            </span>
          </div>
        </div>

        {/* Success / Error Alerts */}
        {successMsg && (
          <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}
        {errorMsg && (
          <div className="p-3 bg-rose-950/60 border border-rose-500/40 rounded-xl text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Member Selector (if not editing an existing enrolled student) */}
        {!isEditing ? (
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-[#CCCCCC]">
              Selecione o Membro da Igreja <span className="text-amber-400">*</span>
            </label>

            {/* Candidate search filter */}
            <div className="relative">
              <Search className="w-4 h-4 text-[#777777] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Buscar membro por nome ou congregação..."
                className="w-full pl-9 pr-3 py-2 bg-[#121212] border border-[#262626] rounded-lg text-white text-xs placeholder-[#555555] focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* List of candidates */}
            <div className="max-h-40 overflow-y-auto border border-[#222222] rounded-lg divide-y divide-[#1A1A1A] bg-[#0E0E0E]">
              {candidateContacts.length === 0 ? (
                <div className="p-4 text-center text-[#777777] text-xs">
                  Nenhum membro encontrado disponível para matrícula.
                </div>
              ) : (
                candidateContacts.slice(0, 15).map(c => {
                  const isSelected = selectedContactId === c.id;
                  return (
                    <button
                      type="button"
                      key={c.id}
                      onClick={() => setSelectedContactId(c.id)}
                      className={`w-full flex items-center justify-between p-2.5 text-left transition-colors ${
                        isSelected
                          ? 'bg-amber-950/40 border-l-2 border-amber-400 text-white'
                          : 'hover:bg-[#141414] text-[#CCCCCC]'
                      }`}
                    >
                      <div>
                        <span className="font-semibold text-xs text-white block">{c.name}</span>
                        <span className="text-[11px] text-[#777777]">
                          {c.congregation} • {c.phone} • {c.category}
                        </span>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          isSelected
                            ? 'bg-amber-400 text-black'
                            : 'bg-[#1C1C1C] text-[#888888]'
                        }`}
                      >
                        {isSelected ? 'Selecionado' : 'Selecionar'}
                      </span>
                    </button>
                  );
                })
              )}
            </div>

            {selectedContact && (
              <div className="p-2.5 bg-[#141414] border border-[#2B2B2B] rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 font-bold text-xs">
                    {selectedContact.name.charAt(0)}
                  </div>
                  <div>
                    <span className="font-bold text-white text-xs">{selectedContact.name}</span>
                    <span className="text-[10px] text-[#888888] block">
                      {selectedContact.congregation} • {selectedContact.phone}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] text-amber-300 bg-amber-950/60 border border-amber-800/50 px-2 py-0.5 rounded font-semibold">
                  Membro Confirmado
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="p-3 bg-[#121212] border border-[#262626] rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 font-bold text-sm">
                {selectedContact?.name.charAt(0) || 'U'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white">{selectedContact?.name}</span>
                  <UniReinoBadge semester={semester} size="sm" />
                </div>
                <p className="text-xs text-[#888888]">
                  {selectedContact?.congregation} • {selectedContact?.phone}
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-[#888888] block">Matrícula</span>
              <span className="font-mono text-xs font-bold text-amber-300">
                {matricula || 'UN-0000'}
              </span>
            </div>
          </div>
        )}

        {/* 8 Semesters Selection Grid */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold text-[#CCCCCC]">
              Período / Semestre do Aluno (8 Semestres de Curso) <span className="text-amber-400">*</span>
            </label>
            <span className="text-[11px] font-bold text-amber-300">
              Semestre Atual: {semester}º Semestre
            </span>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
            {semestersList.map(s => {
              const isCurrent = semester === s;
              const isPast = semester > s;
              return (
                <button
                  type="button"
                  key={s}
                  onClick={() => setSemester(s)}
                  className={`p-2.5 rounded-lg border text-center transition-all ${
                    isCurrent
                      ? 'bg-gradient-to-b from-amber-400 to-yellow-500 text-black border-amber-200 font-extrabold shadow-md shadow-amber-500/20 scale-105'
                      : isPast
                      ? 'bg-amber-950/20 border-amber-800/40 text-amber-200/80 hover:bg-amber-950/40'
                      : 'bg-[#121212] border-[#262626] text-[#888888] hover:text-white hover:bg-[#1A1A1A]'
                  }`}
                >
                  <span className="block text-xs font-bold">{s}º Sem</span>
                  <span className="block text-[9px] opacity-80 mt-0.5">
                    {Math.round((s / 8) * 100)}%
                  </span>
                </button>
              );
            })}
          </div>

          <div className="w-full bg-[#181818] h-1.5 rounded-full overflow-hidden mt-1.5">
            <div
              className="bg-gradient-to-r from-amber-500 to-yellow-400 h-full transition-all duration-300"
              style={{ width: `${(semester / 8) * 100}%` }}
            />
          </div>
        </div>

        {/* Details: Status, Turma, Matrícula */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-[#AAAAAA] mb-1">
              Situação da Matrícula
            </label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value as UniReinoStatus)}
              className="w-full px-3 py-2 bg-[#121212] border border-[#262626] rounded-lg text-white text-xs focus:outline-none focus:border-amber-400"
            >
              <option value="matriculado">Ativo (Cursando)</option>
              <option value="trancado">Trancado / Pausado</option>
              <option value="concluido">Graduado (Concluído)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#AAAAAA] mb-1">
              Código de Matrícula
            </label>
            <input
              type="text"
              value={matricula}
              onChange={e => setMatricula(e.target.value)}
              placeholder="Ex: UN-1042"
              className="w-full px-3 py-2 bg-[#121212] border border-[#262626] rounded-lg text-white font-mono text-xs focus:outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#AAAAAA] mb-1">
              Turma / Ano Letivo
            </label>
            <input
              type="text"
              value={turma}
              onChange={e => setTurma(e.target.value)}
              placeholder="Ex: Turma 2026.1"
              className="w-full px-3 py-2 bg-[#121212] border border-[#262626] rounded-lg text-white text-xs focus:outline-none focus:border-amber-400"
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-medium text-[#AAAAAA] mb-1">
            Observações Acadêmicas / Ministeriais
          </label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={2}
            placeholder="Anotações sobre frequência, liderança, matérias em andamento ou orientador..."
            className="w-full px-3 py-2 bg-[#121212] border border-[#262626] rounded-lg text-white text-xs focus:outline-none focus:border-amber-400"
          />
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-[#1F1F1F] flex flex-col sm:flex-row items-center justify-between gap-3">
          {isEditing ? (
            <div>
              {!confirmUnenroll ? (
                <button
                  type="button"
                  onClick={() => setConfirmUnenroll(true)}
                  className="text-xs text-rose-400 hover:text-rose-300 underline underline-offset-4 transition-colors"
                >
                  Remover do Uni Reino
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-rose-300">Confirmar remoção?</span>
                  <button
                    type="button"
                    onClick={handleUnenroll}
                    disabled={isSubmitting}
                    className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded text-[11px] font-bold"
                  >
                    Sim, desmatricular
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmUnenroll(false)}
                    className="px-2 py-1 bg-[#1A1A1A] text-[#999999] hover:text-white rounded text-[11px]"
                  >
                    Cancelar
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="w-1/2 sm:w-auto px-4 py-2 bg-[#141414] hover:bg-[#1A1A1A] text-[#CCCCCC] hover:text-white border border-[#2B2B2B] rounded-lg text-xs font-semibold transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !selectedContactId}
              className="w-1/2 sm:w-auto px-5 py-2 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:brightness-110 text-black font-extrabold rounded-lg text-xs transition-all shadow-md shadow-amber-500/20 disabled:opacity-50"
            >
              {isSubmitting
                ? 'Salvando...'
                : isEditing
                ? 'Atualizar Matrícula'
                : 'Confirmar Matrícula (UN)'}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
