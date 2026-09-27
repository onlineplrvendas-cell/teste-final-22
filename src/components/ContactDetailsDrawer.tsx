import React, { useState } from 'react';
import { useCRM } from '../context/CRMContext';
import { useAuth } from '../context/AuthContext';
import { Contact, Interaction, Task } from '../types';
import { formatDateBR, formatDateTimeBR, getTaskDueState } from '../utils/date';
import { getWhatsAppUrl } from '../utils/phone';
import {
  X,
  MessageSquare,
  Phone,
  Calendar,
  CheckCircle2,
  Clock,
  User,
  MapPin,
  Mail,
  Edit2,
  Archive,
  RefreshCw,
  Trash2,
  Plus,
  Send,
  ExternalLink,
  Info,
  CheckCheck,
  Crown,
  GraduationCap,
  Sparkles,
} from 'lucide-react';
import { ConexaoLogo } from './ConexaoLogo';
import { UniReinoBadge } from './UniReinoBadge';
import { EnrollUniReinoModal } from './EnrollUniReinoModal';
import { ConexaoColorBadge } from './ConexaoColorBadge';
import { EnrollConexaoModal } from './EnrollConexaoModal';

interface ContactDetailsDrawerProps {
  contact: Contact | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenEdit: (contact: Contact) => void;
  onOpenNewInteraction: (contact: Contact) => void;
  onOpenNewTask: (contact: Contact) => void;
  onRequestArchive: (contact: Contact) => void;
  onRequestRestore: (contact: Contact) => void;
  onRequestDeletePermanent: (contact: Contact) => void;
}

export const ContactDetailsDrawer: React.FC<ContactDetailsDrawerProps> = ({
  contact,
  isOpen,
  onClose,
  onOpenEdit,
  onOpenNewInteraction,
  onOpenNewTask,
  onRequestArchive,
  onRequestRestore,
  onRequestDeletePermanent,
}) => {
  const {
    interactions,
    tasks,
    toggleTaskStatus,
    deleteTask,
    toggleWeeklyConfirmation,
    advanceUniReinoSemester,
  } = useCRM();
  const { currentUser, isDemoMode } = useAuth();
  const [demoNotice, setDemoNotice] = useState<string | null>(null);
  const [isUniReinoModalOpen, setIsUniReinoModalOpen] = useState(false);
  const [isConexaoModalOpen, setIsConexaoModalOpen] = useState(false);
  const [advanceFeedback, setAdvanceFeedback] = useState<string | null>(null);

  if (!isOpen || !contact) return null;

  const isAdmin = currentUser?.role === 'admin';

  // Contact's interactions sorted chronologically (latest first)
  const contactInteractions = interactions
    .filter(i => i.contactId === contact.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Contact's tasks sorted by dueDate
  const contactTasks = tasks
    .filter(t => t.contactId === contact.id)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  const openTasks = contactTasks.filter(t => t.status === 'pending');
  const completedTasks = contactTasks.filter(t => t.status === 'completed');

  // Computed last contact & next return
  const lastInteraction = contactInteractions[0];
  const nextTask = openTasks[0];

  const handleWhatsAppClick = () => {
    if (isDemoMode) {
      setDemoNotice(
        'Modo demonstração: o disparo de WhatsApp externo é desativado para proteger números reais de terceiros.'
      );
      setTimeout(() => setDemoNotice(null), 5000);
      return;
    }

    const url = getWhatsAppUrl(contact.phone);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const channelIcons: Record<string, React.ElementType> = {
    WhatsApp: MessageSquare,
    Ligação: Phone,
    Presencial: User,
    Outro: Clock,
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Slide-over panel */}
      <div className="fixed inset-y-0 right-0 max-w-xl w-full bg-[#0A0A0A] border-l border-[#262626] shadow-2xl flex flex-col z-50 overflow-hidden text-white">
        {/* Header */}
        <div className="p-5 border-b border-[#262626] bg-[#0E0E0E] shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#1F1F1F] border border-[#333333] text-white">
                  {contact.congregation}
                </span>
                <span className="text-xs font-medium px-2 py-0.5 rounded bg-[#161616] text-[#CCCCCC] border border-[#2B2B2B]">
                  {contact.category}
                </span>
                {contact.uniReino && contact.uniReino.isEnrolled && (
                  <UniReinoBadge
                    enrollment={contact.uniReino}
                    semester={contact.uniReino.semester}
                    size="sm"
                    showSemester={true}
                  />
                )}
                {contact.isArchived && (
                  <span className="text-xs font-medium px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 border border-neutral-600">
                    Arquivado
                  </span>
                )}
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight font-heading mt-2">
                {contact.name}
              </h2>
              <p className="text-xs text-[#888888]">
                Cadastrado em {formatDateBR(contact.createdAt)} por {contact.assignedToName || 'Equipe'}
              </p>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#888888] hover:text-white hover:bg-[#1A1A1A] transition-colors"
              aria-label="Fechar detalhes"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Action Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 pt-3 border-t border-[#1C1C1C]">
            <button
              onClick={handleWhatsAppClick}
              className="flex items-center justify-center gap-1.5 py-2 px-2.5 bg-[#141414] hover:bg-[#1C1C1C] border border-[#2B2B2B] rounded-lg text-xs font-medium text-white transition-colors"
              title="Abrir WhatsApp direto"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>

            <button
              onClick={() => onOpenNewInteraction(contact)}
              className="flex items-center justify-center gap-1.5 py-2 px-2.5 bg-[#141414] hover:bg-[#1C1C1C] border border-[#2B2B2B] rounded-lg text-xs font-medium text-white transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Interação</span>
            </button>

            <button
              onClick={() => onOpenNewTask(contact)}
              className="flex items-center justify-center gap-1.5 py-2 px-2.5 bg-[#141414] hover:bg-[#1C1C1C] border border-[#2B2B2B] rounded-lg text-xs font-medium text-white transition-colors"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Retorno</span>
            </button>

            <button
              onClick={() => onOpenEdit(contact)}
              className="flex items-center justify-center gap-1.5 py-2 px-2.5 bg-[#141414] hover:bg-[#1C1C1C] border border-[#2B2B2B] rounded-lg text-xs font-medium text-white transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Editar</span>
            </button>
          </div>

          {/* Demo notice alert */}
          {demoNotice && (
            <div className="mt-3 p-2.5 bg-[#18150D] border border-[#443818] rounded-lg text-xs text-amber-200 flex items-start gap-2">
              <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
              <span>{demoNotice}</span>
            </div>
          )}
        </div>

        {/* Scrollable Body */}
        <div className="grow overflow-y-auto p-5 space-y-6">
          {/* Status & Timing KPI Strip */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-[#0F0F0F] border border-[#222222] rounded-xl space-y-1">
              <span className="text-[10px] text-[#777777] uppercase font-bold tracking-wider block">
                Último Contato
              </span>
              <span className="text-xs font-semibold text-white">
                {lastInteraction ? formatDateTimeBR(lastInteraction.date) : 'Nenhum contato registrado'}
              </span>
            </div>

            <div className="p-3 bg-[#0F0F0F] border border-[#222222] rounded-xl space-y-1">
              <span className="text-[10px] text-[#777777] uppercase font-bold tracking-wider block">
                Próximo Retorno
              </span>
              <span className="text-xs font-semibold text-white">
                {nextTask ? formatDateBR(nextTask.dueDate) : 'Nenhum agendado'}
              </span>
            </div>
          </div>

          {/* Card: Confirmação de Presença no Culto da Semana */}
          <div className="p-3.5 bg-[#0F0F0F] border border-[#222222] rounded-xl flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                <CheckCheck className="w-3.5 h-3.5 text-white" />
                <span>Culto deste Fim de Semana</span>
              </span>
              <p className="text-[11px] text-[#888888]">
                {contact.confirmedThisWeek
                  ? 'Presença confirmada para o culto com a equipe'
                  : 'Ainda não confirmou presença para o próximo culto'}
              </p>
            </div>

            <button
              onClick={() => toggleWeeklyConfirmation(contact.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shrink-0 ${
                contact.confirmedThisWeek
                  ? 'bg-white text-black shadow-sm'
                  : 'bg-[#141414] hover:bg-[#1A1A1A] text-white border border-[#2B2B2B]'
              }`}
            >
              {contact.confirmedThisWeek ? 'Confirmado ✓' : 'Confirmar Presença'}
            </button>
          </div>

          {/* Card: Uni Reino - Formação Ministerial (8 Semestres) */}
          <div className="p-4 bg-gradient-to-r from-[#120F05] via-[#161206] to-[#0A0A0A] border border-amber-500/30 rounded-xl space-y-3.5 shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-400 fill-amber-400/20" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-200">
                  Uni Reino • Curso Ministerial (8 Semestres)
                </h3>
              </div>
              {contact.uniReino && contact.uniReino.isEnrolled ? (
                <UniReinoBadge
                  enrollment={contact.uniReino}
                  semester={contact.uniReino.semester}
                  size="xs"
                />
              ) : (
                <span className="text-[10px] text-[#777777] bg-[#141414] px-2 py-0.5 rounded border border-[#222222]">
                  Não matriculado
                </span>
              )}
            </div>

            {advanceFeedback && (
              <div className="p-2.5 bg-amber-950/70 border border-amber-500/40 rounded-lg text-amber-200 text-xs flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                <span>{advanceFeedback}</span>
              </div>
            )}

            {contact.uniReino && contact.uniReino.isEnrolled ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                  <div>
                    <span className="text-[#888888] block text-[10px]">Período Atual:</span>
                    <span className="font-extrabold text-amber-300">
                      {contact.uniReino.semester}º Semestre
                    </span>
                  </div>
                  <div>
                    <span className="text-[#888888] block text-[10px]">Situação:</span>
                    <span className="font-medium text-white capitalize">
                      {contact.uniReino.status === 'concluido' ? 'Graduado' : contact.uniReino.status}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#888888] block text-[10px]">Matrícula:</span>
                    <span className="font-mono text-white text-[11px]">
                      {contact.uniReino.matricula || '-'}
                    </span>
                  </div>
                </div>

                {/* Progress bar across the 8 semesters */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-[#888888]">
                      Progresso: {contact.uniReino.semester} de 8 semestres
                    </span>
                    <span className="font-bold text-amber-300">
                      {Math.round((contact.uniReino.semester / 8) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-[#1A1A1A] h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-amber-500 to-yellow-400 h-full rounded-full transition-all"
                      style={{ width: `${Math.round((contact.uniReino.semester / 8) * 100)}%` }}
                    />
                  </div>
                </div>

                {contact.uniReino.notes && (
                  <p className="text-[11px] text-[#A89874] italic bg-black/40 p-2 rounded border border-amber-900/30">
                    "{contact.uniReino.notes}"
                  </p>
                )}

                <div className="flex items-center justify-between gap-2 pt-1 border-t border-amber-500/20">
                  {contact.uniReino.status !== 'concluido' && (
                    <button
                      onClick={async () => {
                        try {
                          await advanceUniReinoSemester(contact.id);
                          setAdvanceFeedback(
                            contact.uniReino!.semester >= 7
                              ? 'Aluno avançado para o 8º Semestre!'
                              : `Aluno avançado para o ${contact.uniReino!.semester + 1}º Semestre!`
                          );
                          setTimeout(() => setAdvanceFeedback(null), 3500);
                        } catch (e) {
                          console.error(e);
                        }
                      }}
                      className="px-3 py-1.5 bg-gradient-to-r from-amber-400 to-yellow-400 text-black font-extrabold rounded-lg text-xs hover:brightness-110 shadow-sm transition-all"
                    >
                      {contact.uniReino.semester === 8 ? 'Graduar Aluno' : 'Avançar (+1 Semestre)'}
                    </button>
                  )}
                  <button
                    onClick={() => setIsUniReinoModalOpen(true)}
                    className="px-3 py-1.5 bg-[#141414] hover:bg-[#1E1E1E] text-white border border-[#2B2B2B] rounded-lg text-xs font-medium ml-auto"
                  >
                    Gerenciar Matrícula
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                <p className="text-[11px] text-[#888888]">
                  Este membro ainda não está inscrito no curso ministerial de 8 semestres da Casa de Deus.
                </p>
                <button
                  onClick={() => setIsUniReinoModalOpen(true)}
                  className="px-3 py-1.5 bg-gradient-to-r from-amber-400 to-yellow-400 text-black font-extrabold rounded-lg text-xs hover:brightness-110 shadow-sm shrink-0"
                >
                  + Matricular no Uni Reino
                </button>
              </div>
            )}
          </div>

          {/* Card: Conexão Jovem - Ministério Jovem por Cores */}
          <div className="p-4 bg-gradient-to-r from-[#140E04] via-[#1A1208] to-[#0A0A0A] border border-amber-500/30 rounded-xl space-y-3.5 shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ConexaoLogo size="xs" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-200">
                  Conexão Jovem • Ministério Jovem (Cores)
                </h3>
              </div>
              {contact.conexaoJovem ? (
                <ConexaoColorBadge
                  color={contact.conexaoJovem.color}
                  role={contact.conexaoJovem.role}
                  size="xs"
                  showRole={true}
                />
              ) : (
                <span className="text-[10px] text-[#777777] bg-[#141414] px-2 py-0.5 rounded border border-[#222222]">
                  Não vinculado
                </span>
              )}
            </div>

            {contact.conexaoJovem ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                  <div>
                    <span className="text-[#888888] block text-[10px]">Equipe / Cor:</span>
                    <span className="font-extrabold text-white capitalize">
                      {contact.conexaoJovem.color}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#888888] block text-[10px]">Função:</span>
                    <span className="font-medium text-amber-300 capitalize">
                      {contact.conexaoJovem.role === 'sublider_base' ? 'Sub-líder de Base' : contact.conexaoJovem.role}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#888888] block text-[10px]">Base:</span>
                    <span className="text-white text-[11px]">
                      {contact.conexaoJovem.baseName || 'Sem base atribuída'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1 border-t border-amber-500/20">
                  <span className="text-[11px] text-zinc-400">
                    Membro ativo na equipe do Conexão Jovem
                  </span>
                  <button
                    onClick={() => setIsConexaoModalOpen(true)}
                    className="px-3 py-1.5 bg-[#141414] hover:bg-[#1E1E1E] text-white border border-[#2B2B2B] rounded-lg text-xs font-medium ml-auto"
                  >
                    Gerenciar Participação
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                <p className="text-[11px] text-[#888888]">
                  Este membro ainda não está vinculado a uma equipe do Conexão Jovem.
                </p>
                <button
                  onClick={() => setIsConexaoModalOpen(true)}
                  className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-rose-500 text-black font-extrabold rounded-lg text-xs hover:brightness-110 shadow-sm shrink-0 flex items-center gap-1.5"
                >
                  <ConexaoLogo size="xs" />
                  <span>+ Vincular ao Conexão</span>
                </button>
              </div>
            )}
          </div>

          {/* Card: Detalhes do Perfil */}
          <div className="p-4 bg-[#0F0F0F] border border-[#222222] rounded-xl space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#777777]">
              Ficha de Contato
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[#888888] block text-[11px]">Telefone/WhatsApp:</span>
                <span className="font-medium text-white">{contact.phone}</span>
              </div>

              <div>
                <span className="text-[#888888] block text-[11px]">Etapa do Acompanhamento:</span>
                <span className="font-medium text-white">{contact.stage}</span>
              </div>

              {contact.email && (
                <div>
                  <span className="text-[#888888] block text-[11px]">E-mail:</span>
                  <span className="font-medium text-white truncate block">{contact.email}</span>
                </div>
              )}

              {contact.neighborhood && (
                <div>
                  <span className="text-[#888888] block text-[11px]">Bairro:</span>
                  <span className="font-medium text-white">{contact.neighborhood}</span>
                </div>
              )}

              <div>
                <span className="text-[#888888] block text-[11px]">Origem:</span>
                <span className="font-medium text-white">{contact.source || 'Não especificada'}</span>
              </div>

              <div>
                <span className="text-[#888888] block text-[11px]">Responsável:</span>
                <span className="font-medium text-white">{contact.assignedToName || 'Não atribuído'}</span>
              </div>

              {contact.firstVisitDate && (
                <div>
                  <span className="text-[#888888] block text-[11px]">Primeira Visita:</span>
                  <span className="font-medium text-white">{formatDateBR(contact.firstVisitDate)}</span>
                </div>
              )}

              {contact.memberSinceDate && (
                <div>
                  <span className="text-[#888888] block text-[11px]">Entrada como Membro:</span>
                  <span className="font-medium text-white">{formatDateBR(contact.memberSinceDate)}</span>
                </div>
              )}
            </div>

            {contact.initialNotes && (
              <div className="pt-2 border-t border-[#1C1C1C]">
                <span className="text-[#888888] block text-[11px] mb-1">Observações Iniciais:</span>
                <p className="text-xs text-[#CCCCCC] bg-[#141414] p-2.5 rounded-lg border border-[#1F1F1F] leading-relaxed">
                  {contact.initialNotes}
                </p>
              </div>
            )}
          </div>

          {/* Section: Tarefas & Retornos Vinculados */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#777777]">
                Tarefas & Retornos ({contactTasks.length})
              </h3>
              <button
                onClick={() => onOpenNewTask(contact)}
                className="text-xs text-[#CCCCCC] hover:text-white flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar</span>
              </button>
            </div>

            {contactTasks.length === 0 ? (
              <div className="p-4 text-center bg-[#0F0F0F] border border-[#222222] rounded-xl text-xs text-[#777777]">
                Nenhum retorno agendado para esta pessoa.
              </div>
            ) : (
              <div className="space-y-2">
                {contactTasks.map(task => {
                  const state = getTaskDueState(task.dueDate);
                  const isDone = task.status === 'completed';

                  return (
                    <div
                      key={task.id}
                      className={`p-3 rounded-xl border transition-colors flex items-start gap-3 ${
                        isDone
                          ? 'bg-[#0A0A0A] border-[#1C1C1C] opacity-60'
                          : state === 'overdue'
                          ? 'bg-[#140F0F] border-[#381F1F]'
                          : state === 'today'
                          ? 'bg-[#141414] border-[#333333]'
                          : 'bg-[#0E0E0E] border-[#222222]'
                      }`}
                    >
                      <button
                        onClick={() => toggleTaskStatus(task.id)}
                        className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                          isDone
                            ? 'bg-white border-white text-black'
                            : 'border-[#444444] hover:border-white'
                        }`}
                        aria-label="Alternar status da tarefa"
                      >
                        {isDone && <CheckCircle2 className="w-3.5 h-3.5" />}
                      </button>

                      <div className="grow space-y-1">
                        <p className={`text-xs ${isDone ? 'line-through text-[#777777]' : 'text-white'}`}>
                          {task.description}
                        </p>
                        <div className="flex items-center gap-3 text-[10px] text-[#888888]">
                          <span>Vencimento: {formatDateBR(task.dueDate)}</span>
                          {task.assignedToName && <span>Resp: {task.assignedToName}</span>}
                          {!isDone && state === 'overdue' && (
                            <span className="text-red-400 font-semibold">Atrasado</span>
                          )}
                          {!isDone && state === 'today' && (
                            <span className="text-white font-semibold">Vence Hoje</span>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => deleteTask(task.id)}
                        className="text-[#666666] hover:text-red-400 p-1 rounded transition-colors"
                        title="Remover tarefa"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section: Histórico de Interações */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#777777]">
                Histórico de Cuidado ({contactInteractions.length})
              </h3>
              <button
                onClick={() => onOpenNewInteraction(contact)}
                className="text-xs text-[#CCCCCC] hover:text-white flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Registrar</span>
              </button>
            </div>

            {contactInteractions.length === 0 ? (
              <div className="p-4 text-center bg-[#0F0F0F] border border-[#222222] rounded-xl text-xs text-[#777777]">
                Nenhuma interação registrada ainda.
              </div>
            ) : (
              <div className="space-y-3">
                {contactInteractions.map(int => {
                  const ChannelIcon = channelIcons[int.channel] || Clock;
                  return (
                    <div
                      key={int.id}
                      className="p-3.5 bg-[#0F0F0F] border border-[#222222] rounded-xl space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between text-[#888888] text-[11px]">
                        <div className="flex items-center gap-1.5 font-medium text-white">
                          <ChannelIcon className="w-3.5 h-3.5 text-[#AAAAAA]" />
                          <span>{int.channel}</span>
                          <span className="text-[#666666]">•</span>
                          <span className="text-[#AAAAAA]">{int.userName}</span>
                        </div>
                        <span>{formatDateTimeBR(int.date)}</span>
                      </div>

                      <p className="text-white/90 leading-relaxed font-sans">
                        {int.notes}
                      </p>

                      {int.stageAtInteraction && (
                        <div className="text-[10px] text-[#777777]">
                          Etapa na época: <span className="text-[#AAAAAA]">{int.stageAtInteraction}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section: Ações de Gestão & Arquivamento */}
          <div className="pt-4 border-t border-[#1C1C1C] flex items-center justify-between gap-3">
            {contact.isArchived ? (
              <button
                onClick={() => onRequestRestore(contact)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-white hover:bg-[#141414] border border-[#333333] rounded-lg transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Restaurar Cadastro</span>
              </button>
            ) : (
              <button
                onClick={() => onRequestArchive(contact)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#AAAAAA] hover:text-white hover:bg-[#141414] border border-[#262626] rounded-lg transition-colors"
              >
                <Archive className="w-3.5 h-3.5" />
                <span>Arquivar</span>
              </button>
            )}

            {isAdmin && (
              <button
                onClick={() => onRequestDeletePermanent(contact)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-red-400 hover:text-red-300 hover:bg-red-950/40 border border-red-900/50 rounded-lg transition-colors ml-auto"
                title="Excluir definitivamente (somente administrador)"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Excluir Definitivo</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <EnrollUniReinoModal
        isOpen={isUniReinoModalOpen}
        onClose={() => setIsUniReinoModalOpen(false)}
        contactToEdit={contact}
      />

      <EnrollConexaoModal
        isOpen={isConexaoModalOpen}
        onClose={() => setIsConexaoModalOpen(false)}
        contactToEdit={contact}
      />
    </div>
  );
};
