import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { useCRM } from '../context/CRMContext';
import { useAuth } from '../context/AuthContext';
import {
  Contact,
  Congregation,
  ContactCategory,
  ContactStage,
  ContactSource,
  UniReinoSemester,
  UniReinoStatus,
  ConexaoColor,
  ConexaoRole,
  CuricicaFamily,
} from '../types';
import { maskPhoneBR, isValidPhoneBR, normalizePhone, getOnlyDigits } from '../utils/phone';
import { getTodayString } from '../utils/date';
import { AlertTriangle, AlertCircle, Calendar, UserCheck, CheckCircle2, Crown, Shield, Users, Sparkles } from 'lucide-react';
import { ConexaoLogo } from './ConexaoLogo';
import { UniReinoBadge } from './UniReinoBadge';
import { ConexaoColorBadge } from './ConexaoColorBadge';
import { CONEXAO_COLORS, CONEXAO_COLOR_CONFIGS, CONEXAO_ROLE_META } from '../utils/conexaoConfig';

interface ContactFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  contactToEdit?: Contact | null;
  initialFamily?: CuricicaFamily;
}

export const ContactFormModal: React.FC<ContactFormModalProps> = ({
  isOpen,
  onClose,
  contactToEdit,
  initialFamily,
}) => {
  const {
    selectedCongregation,
    authorizedCongregations,
    createContact,
    updateContact,
    checkDuplicatePhone,
    teamMembers,
  } = useCRM();
  const { currentUser } = useAuth();

  const isEditing = !!contactToEdit;
  const isAdmin = currentUser?.role === 'admin';

  // Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [congregation, setCongregation] = useState<Congregation>('Recreio');
  const [curicicaFamily, setCuricicaFamily] = useState<CuricicaFamily>('familia_1');
  const [category, setCategory] = useState<ContactCategory>('Novo contato');
  const [stage, setStage] = useState<ContactStage>('Aguardando primeiro contato');
  const [email, setEmail] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [source, setSource] = useState<ContactSource>('Culto');
  const [assignedToId, setAssignedToId] = useState('');
  const [firstVisitDate, setFirstVisitDate] = useState('');
  const [memberSinceDate, setMemberSinceDate] = useState('');
  const [initialNotes, setInitialNotes] = useState('');

  // Uni Reino course enrollment state
  const [enrollInCourse, setEnrollInCourse] = useState(false);
  const [courseSemester, setCourseSemester] = useState<UniReinoSemester>(1);
  const [courseStatus, setCourseStatus] = useState<UniReinoStatus>('matriculado');
  const [courseMatricula, setCourseMatricula] = useState('');
  const [courseTurma, setCourseTurma] = useState('');
  const [courseNotes, setCourseNotes] = useState('');

  // Conexão Jovem youth team membership
  const [enrollInConexao, setEnrollInConexao] = useState(false);
  const [conexaoColor, setConexaoColor] = useState<ConexaoColor>('azul');
  const [conexaoRole, setConexaoRole] = useState<ConexaoRole>('membro');
  const [conexaoBaseName, setConexaoBaseName] = useState('');

  // First return schedule (optional)
  const [scheduleFirstReturn, setScheduleFirstReturn] = useState(false);
  const [firstReturnDesc, setFirstReturnDesc] = useState('');
  const [firstReturnDate, setFirstReturnDate] = useState('');

  // Feedback and validation
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [duplicateWarning, setDuplicateWarning] = useState<Contact | null>(null);
  const [allowDuplicateException, setAllowDuplicateException] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Initialize or reset form values
  useEffect(() => {
    if (contactToEdit) {
      setName(contactToEdit.name);
      setPhone(contactToEdit.phone);
      setCongregation(contactToEdit.congregation);
      setCuricicaFamily(contactToEdit.curicicaFamily || 'familia_1');
      setCategory(contactToEdit.category);
      setStage(contactToEdit.stage);
      setEmail(contactToEdit.email || '');
      setNeighborhood(contactToEdit.neighborhood || '');
      setSource(contactToEdit.source || 'Culto');
      setAssignedToId(contactToEdit.assignedToId || '');
      setFirstVisitDate(contactToEdit.firstVisitDate || '');
      setMemberSinceDate(contactToEdit.memberSinceDate || '');
      setInitialNotes(contactToEdit.initialNotes || '');
      setScheduleFirstReturn(false);

      if (contactToEdit.uniReino && contactToEdit.uniReino.isEnrolled) {
        setEnrollInCourse(true);
        setCourseSemester(contactToEdit.uniReino.semester || 1);
        setCourseStatus(contactToEdit.uniReino.status || 'matriculado');
        setCourseMatricula(contactToEdit.uniReino.matricula || '');
        setCourseTurma(contactToEdit.uniReino.turma || '');
        setCourseNotes(contactToEdit.uniReino.notes || '');
      } else {
        setEnrollInCourse(false);
        setCourseSemester(1);
        setCourseStatus('matriculado');
        setCourseMatricula(`UN-${Math.floor(1000 + Math.random() * 9000)}`);
        setCourseTurma(`Turma ${new Date().getFullYear()}.${new Date().getMonth() < 6 ? 1 : 2}`);
        setCourseNotes('');
      }

      if (contactToEdit.conexaoJovem) {
        setEnrollInConexao(true);
        setConexaoColor(contactToEdit.conexaoJovem.color || 'azul');
        setConexaoRole(contactToEdit.conexaoJovem.role || 'membro');
        setConexaoBaseName(contactToEdit.conexaoJovem.baseName || '');
      } else {
        setEnrollInConexao(false);
        setConexaoColor('azul');
        setConexaoRole(contactToEdit.category === 'Membro' ? 'membro' : 'convidado');
        setConexaoBaseName('');
      }
    } else {
      setName('');
      setPhone('');
      const defaultCong: Congregation =
        initialFamily ? 'Curicica' :
        selectedCongregation !== 'all'
          ? (selectedCongregation as Congregation)
          : authorizedCongregations[0] || 'Recreio';
      setCongregation(defaultCong);
      setCuricicaFamily(
        initialFamily ||
        currentUser?.assignedCuricicaFamily ||
        'familia_1'
      );
      setCategory('Novo contato');
      setStage('Aguardando primeiro contato');
      setEmail('');
      setNeighborhood('');
      setSource('Culto');
      setAssignedToId('');
      setFirstVisitDate('');
      setMemberSinceDate('');
      setInitialNotes('');
      setScheduleFirstReturn(false);
      setFirstReturnDesc('Fazer primeiro contato de acolhimento');
      setFirstReturnDate(getTodayString());
      setEnrollInCourse(false);
      setCourseSemester(1);
      setCourseStatus('matriculado');
      setCourseMatricula(`UN-${Math.floor(1000 + Math.random() * 9000)}`);
      setCourseTurma(`Turma ${new Date().getFullYear()}.${new Date().getMonth() < 6 ? 1 : 2}`);
      setCourseNotes('');
      setEnrollInConexao(false);
      setConexaoColor('azul');
      setConexaoRole('convidado');
      setConexaoBaseName('');
    }
    setErrors({});
    setDuplicateWarning(null);
    setAllowDuplicateException(false);
    setSuccessMessage(null);
  }, [contactToEdit, isOpen, selectedCongregation, authorizedCongregations, initialFamily, currentUser]);

  // Handle phone changes with mask & duplicate detection
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    const masked = maskPhoneBR(rawVal);
    setPhone(masked);

    if (errors.phone) {
      setErrors(prev => ({ ...prev, phone: '' }));
    }

    if (isValidPhoneBR(masked)) {
      const duplicate = checkDuplicatePhone(masked, contactToEdit?.id);
      if (duplicate) {
        setDuplicateWarning(duplicate);
      } else {
        setDuplicateWarning(null);
      }
    } else {
      setDuplicateWarning(null);
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Nome completo é obrigatório';
    }

    const cleanDigits = getOnlyDigits(phone);
    if (!phone.trim()) {
      newErrors.phone = 'Telefone/WhatsApp é obrigatório';
    } else if (cleanDigits.length < 10) {
      newErrors.phone = 'Informe um telefone válido com DDD (mínimo 10 dígitos)';
    }

    if (!congregation) {
      newErrors.congregation = 'Selecione a congregação';
    }

    if (email && email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = 'E-mail em formato inválido';
    }

    if (scheduleFirstReturn && !firstReturnDesc.trim()) {
      newErrors.firstReturnDesc = 'Descreva a tarefa do primeiro retorno';
    }

    if (scheduleFirstReturn && !firstReturnDate) {
      newErrors.firstReturnDate = 'Informe a data do retorno';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    if (duplicateWarning && !allowDuplicateException) {
      setErrors(prev => ({
        ...prev,
        duplicate: 'Número já cadastrado. Marque a caixa de confirmação de familiar para continuar.',
      }));
      return;
    }

    setIsSubmitting(true);

    try {
      const assignedUser = teamMembers.find(u => u.uid === assignedToId);

      const resolvedMemberSinceDate =
        category === 'Membro'
          ? memberSinceDate || contactToEdit?.memberSinceDate || new Date().toISOString().split('T')[0]
          : undefined;

      const uniReinoData = enrollInCourse
        ? {
            isEnrolled: true,
            semester: courseSemester,
            status: courseStatus,
            matricula: courseMatricula.trim() || `UN-${Math.floor(1000 + Math.random() * 9000)}`,
            turma: courseTurma.trim() || `Turma ${new Date().getFullYear()}.${new Date().getMonth() < 6 ? 1 : 2}`,
            notes: courseNotes.trim() || undefined,
            enrolledAt: contactToEdit?.uniReino?.enrolledAt || new Date().toISOString(),
            completedAt:
              courseStatus === 'concluido'
                ? contactToEdit?.uniReino?.completedAt || new Date().toISOString()
                : undefined,
          }
        : undefined;

      const conexaoData = enrollInConexao
        ? {
            color: conexaoColor,
            role: conexaoRole,
            baseName: conexaoBaseName.trim() || undefined,
          }
        : undefined;

      if (isEditing && contactToEdit) {
        await updateContact(contactToEdit.id, {
          name: name.trim(),
          phone: phone.trim(),
          congregation,
          category,
          stage,
          email: email.trim() || undefined,
          neighborhood: neighborhood.trim() || undefined,
          source,
          assignedToId: assignedToId || undefined,
          assignedToName: assignedUser?.name || undefined,
          firstVisitDate: firstVisitDate || undefined,
          memberSinceDate: resolvedMemberSinceDate,
          curicicaFamily: congregation === 'Curicica' ? curicicaFamily : undefined,
          initialNotes: initialNotes.trim() || undefined,
          uniReino: uniReinoData,
          conexaoJovem: conexaoData,
        });

        setSuccessMessage('Contato atualizado com sucesso!');
      } else {
        await createContact(
          {
            name: name.trim(),
            phone: phone.trim(),
            congregation,
            category,
            stage,
            email: email.trim() || undefined,
            neighborhood: neighborhood.trim() || undefined,
            source,
            assignedToId: assignedToId || undefined,
            assignedToName: assignedUser?.name || undefined,
            firstVisitDate: firstVisitDate || undefined,
            memberSinceDate: resolvedMemberSinceDate,
            curicicaFamily: congregation === 'Curicica' ? curicicaFamily : undefined,
            initialNotes: initialNotes.trim() || undefined,
            uniReino: uniReinoData,
            conexaoJovem: conexaoData,
          },
          scheduleFirstReturn
            ? {
                description: firstReturnDesc.trim(),
                dueDate: firstReturnDate,
                assignedToId: assignedToId || currentUser?.uid,
                assignedToName: assignedUser?.name || currentUser?.name,
              }
            : undefined
        );

        setSuccessMessage('Contato cadastrado com sucesso!');
      }

      setTimeout(() => {
        setIsSubmitting(false);
        onClose();
      }, 700);
    } catch (err: unknown) {
      setIsSubmitting(false);
      const msg = err instanceof Error ? err.message : 'Falha ao salvar contato. Tente novamente.';
      setErrors(prev => ({ ...prev, submit: msg }));
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Cadastro' : 'Novo Contato'}
      subtitle={
        isEditing
          ? 'Atualize os dados e acompanhamento da pessoa'
          : 'Cadastre um novo visitante, contato ou membro na igreja'
      }
      maxWidth="2xl"
    >
      {successMessage ? (
        <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
          <CheckCircle2 className="w-12 h-12 text-white animate-bounce" />
          <p className="text-lg font-semibold text-white">{successMessage}</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {errors.submit && (
            <div className="p-3 bg-red-950/60 border border-red-800 rounded-lg text-xs text-red-200">
              {errors.submit}
            </div>
          )}

          {/* Section: Dados Pessoais */}
          <div className="space-y-4">
            <h3 className="text-xs uppercase font-bold tracking-wider text-[#777777] border-b border-[#1A1A1A] pb-1">
              Dados Principais
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Nome Completo */}
              <div>
                <label className="block text-xs font-medium text-[#CCCCCC] mb-1.5">
                  Nome Completo <span className="text-white font-bold">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Ex: Gabriel Menezes Silva"
                  className={`w-full px-3 py-2 bg-[#141414] border ${
                    errors.name ? 'border-red-500' : 'border-[#262626]'
                  } rounded-lg text-white text-sm focus:outline-none focus:border-white transition-colors`}
                />
                {errors.name && <p className="text-[11px] text-red-400 mt-1">{errors.name}</p>}
              </div>

              {/* Telefone/WhatsApp */}
              <div>
                <label className="block text-xs font-medium text-[#CCCCCC] mb-1.5">
                  Telefone / WhatsApp com DDD <span className="text-white font-bold">*</span>
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={handlePhoneChange}
                  placeholder="(21) 98765-4321"
                  className={`w-full px-3 py-2 bg-[#141414] border ${
                    errors.phone ? 'border-red-500' : 'border-[#262626]'
                  } rounded-lg text-white text-sm focus:outline-none focus:border-white transition-colors`}
                />
                {errors.phone && <p className="text-[11px] text-red-400 mt-1">{errors.phone}</p>}
              </div>
            </div>

            {/* Duplicate phone warning box */}
            {duplicateWarning && (
              <div className="p-3 bg-[#17140B] border border-[#443513] rounded-lg text-xs space-y-2">
                <div className="flex items-start gap-2 text-amber-200">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                  <div>
                    <span className="font-semibold block">Aviso: Número de telefone já cadastrado</span>
                    <span className="text-amber-300/80">
                      Este número pertence a <strong>{duplicateWarning.name}</strong> ({duplicateWarning.congregation}).
                    </span>
                  </div>
                </div>
                <label className="flex items-center gap-2 pt-1 text-[#CCCCCC] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowDuplicateException}
                    onChange={e => {
                      setAllowDuplicateException(e.target.checked);
                      if (e.target.checked) {
                        setErrors(prev => {
                          const copy = { ...prev };
                          delete copy.duplicate;
                          return copy;
                        });
                      }
                    }}
                    className="rounded bg-[#1A1A1A] border-[#333333] text-white focus:ring-0"
                  />
                  <span>Confirmar exceção (membro da mesma família / compartilhado)</span>
                </label>
                {errors.duplicate && (
                  <p className="text-[11px] text-red-400">{errors.duplicate}</p>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Congregação */}
              <div>
                <label className="block text-xs font-medium text-[#CCCCCC] mb-1.5">
                  Congregação <span className="text-white font-bold">*</span>
                </label>
                <select
                  value={congregation}
                  onChange={e => setCongregation(e.target.value as Congregation)}
                  disabled={isEditing && !isAdmin}
                  className="w-full px-3 py-2 bg-[#141414] border border-[#262626] rounded-lg text-white text-sm focus:outline-none focus:border-white transition-colors disabled:opacity-50"
                >
                  {authorizedCongregations.map(c => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                {isEditing && !isAdmin && (
                  <p className="text-[10px] text-[#777777] mt-1">
                    Apenas administradores podem transferir o contato entre congregações.
                  </p>
                )}
              </div>

              {/* Família de Curicica (Apenas se a congregação for Curicica) */}
              {congregation === 'Curicica' && (
                <div>
                  <label className="block text-xs font-medium text-[#CCCCCC] mb-1.5">
                    Família de Curicica
                  </label>
                  <select
                    value={curicicaFamily}
                    onChange={e => setCuricicaFamily(e.target.value as CuricicaFamily)}
                    disabled={currentUser?.role === 'lider_familia'}
                    className="w-full px-3 py-2 bg-[#141414] border border-[#262626] rounded-lg text-white text-sm focus:outline-none focus:border-white transition-colors"
                  >
                    <option value="familia_1">Família 1 (Pr. Marcos)</option>
                    <option value="familia_2">Família 2 (Pr. Rodrigo)</option>
                    <option value="familia_3">Família 3 (Pr. Rafael)</option>
                  </select>
                </div>
              )}

              {/* Responsável pelo acompanhamento */}
              <div>
                <label className="block text-xs font-medium text-[#CCCCCC] mb-1.5">
                  Responsável pelo Acompanhamento
                </label>
                <select
                  value={assignedToId}
                  onChange={e => setAssignedToId(e.target.value)}
                  className="w-full px-3 py-2 bg-[#141414] border border-[#262626] rounded-lg text-white text-sm focus:outline-none focus:border-white transition-colors"
                >
                  <option value="">Não atribuído</option>
                  {teamMembers.map(u => (
                    <option key={u.uid} value={u.uid}>
                      {u.name} ({u.role === 'admin' ? 'Admin' : u.assignedCongregations.join(', ')})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section: Classificação e Etapa */}
          <div className="space-y-4 pt-2">
            <h3 className="text-xs uppercase font-bold tracking-wider text-[#777777] border-b border-[#1A1A1A] pb-1">
              Classificação & Acompanhamento
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Categoria */}
              <div>
                <label className="block text-xs font-medium text-[#CCCCCC] mb-1.5">
                  Categoria
                </label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value as ContactCategory)}
                  className="w-full px-3 py-2 bg-[#141414] border border-[#262626] rounded-lg text-white text-sm focus:outline-none focus:border-white transition-colors"
                >
                  <option value="Novo contato">Novo contato</option>
                  <option value="Visitante">Visitante</option>
                  <option value="Membro">Membro</option>
                </select>
              </div>

              {/* Etapa do Acompanhamento */}
              <div>
                <label className="block text-xs font-medium text-[#CCCCCC] mb-1.5">
                  Etapa do Acompanhamento
                </label>
                <select
                  value={stage}
                  onChange={e => setStage(e.target.value as ContactStage)}
                  className="w-full px-3 py-2 bg-[#141414] border border-[#262626] rounded-lg text-white text-sm focus:outline-none focus:border-white transition-colors"
                >
                  <option value="Aguardando primeiro contato">Aguardando primeiro contato</option>
                  <option value="1º contato feito">1º contato feito</option>
                  <option value="Em acompanhamento">Em acompanhamento</option>
                  <option value="Integrado">Integrado</option>
                  <option value="Acompanhamento pausado">Acompanhamento pausado</option>
                </select>
              </div>
            </div>

            {/* Conditional Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {category === 'Visitante' && (
                <div>
                  <label className="block text-xs font-medium text-[#CCCCCC] mb-1.5">
                    Data da Primeira Visita (opcional)
                  </label>
                  <input
                    type="date"
                    value={firstVisitDate}
                    onChange={e => setFirstVisitDate(e.target.value)}
                    className="w-full px-3 py-2 bg-[#141414] border border-[#262626] rounded-lg text-white text-sm focus:outline-none focus:border-white transition-colors"
                  />
                </div>
              )}

              {category === 'Membro' && (
                <div>
                  <label className="block text-xs font-medium text-[#CCCCCC] mb-1.5">
                    Data de Entrada como Membro <span className="text-white font-bold">*</span>
                  </label>
                  <input
                    type="date"
                    value={memberSinceDate}
                    onChange={e => setMemberSinceDate(e.target.value)}
                    className={`w-full px-3 py-2 bg-[#141414] border ${
                      errors.memberSinceDate ? 'border-red-500' : 'border-[#262626]'
                    } rounded-lg text-white text-sm focus:outline-none focus:border-white transition-colors`}
                  />
                  {errors.memberSinceDate && (
                    <p className="text-[11px] text-red-400 mt-1">{errors.memberSinceDate}</p>
                  )}
                </div>
              )}

              {/* Origem */}
              <div>
                <label className="block text-xs font-medium text-[#CCCCCC] mb-1.5">
                  Origem do Contato
                </label>
                <select
                  value={source}
                  onChange={e => setSource(e.target.value as ContactSource)}
                  className="w-full px-3 py-2 bg-[#141414] border border-[#262626] rounded-lg text-white text-sm focus:outline-none focus:border-white transition-colors"
                >
                  <option value="Culto">Culto</option>
                  <option value="Indicação">Indicação</option>
                  <option value="Instagram">Instagram</option>
                  <option value="Site">Site</option>
                  <option value="Evento">Evento</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>

              {/* Bairro */}
              <div>
                <label className="block text-xs font-medium text-[#CCCCCC] mb-1.5">
                  Bairro / Região (opcional)
                </label>
                <input
                  type="text"
                  value={neighborhood}
                  onChange={e => setNeighborhood(e.target.value)}
                  placeholder="Ex: Recreio, Barra, Curicica, Guaratiba"
                  className="w-full px-3 py-2 bg-[#141414] border border-[#262626] rounded-lg text-white text-sm focus:outline-none focus:border-white transition-colors"
                />
              </div>
            </div>

            {/* E-mail */}
            <div>
              <label className="block text-xs font-medium text-[#CCCCCC] mb-1.5">
                E-mail (opcional)
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="exemplo@email.com"
                className={`w-full px-3 py-2 bg-[#141414] border ${
                  errors.email ? 'border-red-500' : 'border-[#262626]'
                } rounded-lg text-white text-sm focus:outline-none focus:border-white transition-colors`}
              />
              {errors.email && <p className="text-[11px] text-red-400 mt-1">{errors.email}</p>}
            </div>

            {/* Observação Inicial */}
            <div>
              <label className="block text-xs font-medium text-[#CCCCCC] mb-1.5">
                Observações Iniciais (opcional)
              </label>
              <textarea
                value={initialNotes}
                onChange={e => setInitialNotes(e.target.value)}
                rows={2}
                placeholder="Detalhes sobre a conversa inicial, pedidos de oração, contexto familiar..."
                className="w-full px-3 py-2 bg-[#141414] border border-[#262626] rounded-lg text-white text-sm focus:outline-none focus:border-white transition-colors resize-none"
              />
            </div>
          </div>

          {/* Section: Agendamento do Primeiro Retorno (apenas no cadastro novo) */}
          {!isEditing && (
            <div className="p-3.5 bg-[#0F0F0F] border border-[#262626] rounded-xl space-y-3">
              <label className="flex items-center gap-2 text-xs font-medium text-white cursor-pointer">
                <input
                  type="checkbox"
                  checked={scheduleFirstReturn}
                  onChange={e => setScheduleFirstReturn(e.target.checked)}
                  className="rounded bg-[#1A1A1A] border-[#333333] text-white focus:ring-0"
                />
                <span>Agendar primeiro retorno para esta pessoa</span>
              </label>

              {scheduleFirstReturn && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] text-[#AAAAAA] mb-1">
                      Data do Retorno <span className="text-white">*</span>
                    </label>
                    <input
                      type="date"
                      value={firstReturnDate}
                      onChange={e => setFirstReturnDate(e.target.value)}
                      className="w-full px-3 py-1.5 bg-[#141414] border border-[#262626] rounded-lg text-white text-xs focus:outline-none focus:border-white"
                    />
                    {errors.firstReturnDate && (
                      <p className="text-[10px] text-red-400 mt-1">{errors.firstReturnDate}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-[11px] text-[#AAAAAA] mb-1">
                      Descrição da Tarefa <span className="text-white">*</span>
                    </label>
                    <input
                      type="text"
                      value={firstReturnDesc}
                      onChange={e => setFirstReturnDesc(e.target.value)}
                      placeholder="Ex: Mandar mensagem de boas-vindas"
                      className="w-full px-3 py-1.5 bg-[#141414] border border-[#262626] rounded-lg text-white text-xs focus:outline-none focus:border-white"
                    />
                    {errors.firstReturnDesc && (
                      <p className="text-[10px] text-red-400 mt-1">{errors.firstReturnDesc}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Section: Matrícula Uni Reino (Curso Ministerial 8 Semestres) */}
          <div className="p-4 bg-gradient-to-r from-[#141005] via-[#161206] to-[#0A0A0A] border border-amber-500/30 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs font-bold text-amber-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enrollInCourse}
                  onChange={e => setEnrollInCourse(e.target.checked)}
                  className="rounded bg-[#1A1A1A] border-amber-500/50 text-amber-500 focus:ring-0 w-4 h-4"
                />
                <span className="flex items-center gap-1.5">
                  <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400/20" />
                  <span>Matricular no Curso Uni Reino (Selo Dourado UN)</span>
                </span>
              </label>

              {enrollInCourse && (
                <UniReinoBadge semester={courseSemester} size="xs" />
              )}
            </div>

            {enrollInCourse && (
              <div className="space-y-3 pt-2 border-t border-amber-500/20 text-xs">
                {/* 8-Semesters Selection */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-semibold text-[#CCCCCC]">
                      Período / Semestre do Aluno (1º ao 8º Semestre)
                    </span>
                    <span className="text-[11px] font-bold text-amber-300">
                      {courseSemester}º Semestre ({Math.round((courseSemester / 8) * 100)}%)
                    </span>
                  </div>
                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-1">
                    {([1, 2, 3, 4, 5, 6, 7, 8] as UniReinoSemester[]).map(s => (
                      <button
                        type="button"
                        key={s}
                        onClick={() => setCourseSemester(s)}
                        className={`py-1.5 px-1 rounded text-center text-xs font-bold transition-all ${
                          courseSemester === s
                            ? 'bg-gradient-to-b from-amber-400 to-yellow-500 text-black border border-amber-200 shadow-sm'
                            : 'bg-[#141414] border border-[#2B2B2B] text-[#888888] hover:text-white'
                        }`}
                      >
                        {s}º Sem
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[11px] text-[#AAAAAA] mb-1">
                      Situação
                    </label>
                    <select
                      value={courseStatus}
                      onChange={e => setCourseStatus(e.target.value as UniReinoStatus)}
                      className="w-full px-2.5 py-1.5 bg-[#141414] border border-[#2B2B2B] rounded-lg text-white text-xs focus:outline-none focus:border-amber-400"
                    >
                      <option value="matriculado">Ativo (Cursando)</option>
                      <option value="trancado">Trancado</option>
                      <option value="concluido">Graduado (Concluído)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] text-[#AAAAAA] mb-1">
                      Matrícula
                    </label>
                    <input
                      type="text"
                      value={courseMatricula}
                      onChange={e => setCourseMatricula(e.target.value)}
                      placeholder="Ex: UN-1042"
                      className="w-full px-2.5 py-1.5 bg-[#141414] border border-[#2B2B2B] rounded-lg text-white font-mono text-xs focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-[#AAAAAA] mb-1">
                      Turma
                    </label>
                    <input
                      type="text"
                      value={courseTurma}
                      onChange={e => setCourseTurma(e.target.value)}
                      placeholder="Ex: Turma 2026.1"
                      className="w-full px-2.5 py-1.5 bg-[#141414] border border-[#2B2B2B] rounded-lg text-white text-xs focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-[#AAAAAA] mb-1">
                    Observações Acadêmicas (opcional)
                  </label>
                  <input
                    type="text"
                    value={courseNotes}
                    onChange={e => setCourseNotes(e.target.value)}
                    placeholder="Anotações sobre matérias, frequência ou liderança..."
                    className="w-full px-2.5 py-1.5 bg-[#141414] border border-[#2B2B2B] rounded-lg text-white text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Section: Conexão Jovem (Ministério Jovem por Cores) */}
          <div className="p-4 bg-gradient-to-r from-[#140E04] via-[#1A1208] to-[#0A0A0A] border border-amber-500/30 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs font-bold text-amber-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enrollInConexao}
                  onChange={e => setEnrollInConexao(e.target.checked)}
                  className="rounded bg-[#1A1A1A] border-amber-500/50 text-amber-500 focus:ring-0 w-4 h-4"
                />
                <span className="flex items-center gap-1.5">
                  <ConexaoLogo size="xs" />
                  <span>Participa do Conexão Jovem (Ministério de Jovens • 6 Cores)</span>
                </span>
              </label>

              {enrollInConexao && (
                <ConexaoColorBadge
                  color={conexaoColor}
                  role={conexaoRole}
                  size="xs"
                  showRole={true}
                />
              )}
            </div>

            {enrollInConexao && (
              <div className="space-y-3 pt-2 border-t border-amber-500/20 text-xs">
                {/* 6 Colors Selection */}
                <div>
                  <label className="block text-[11px] font-semibold text-[#CCCCCC] mb-1.5">
                    Selecione a Cor da Equipe:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {CONEXAO_COLORS.map(cId => {
                      const cfg = CONEXAO_COLOR_CONFIGS[cId];
                      const isSelected = conexaoColor === cId;
                      return (
                        <button
                          type="button"
                          key={cId}
                          onClick={() => setConexaoColor(cId)}
                          className={`p-2.5 rounded-lg border text-left flex items-center gap-2 transition-all ${
                            isSelected
                              ? 'bg-[#181818] border-2 text-white'
                              : 'bg-[#121212] border-[#262626] text-[#888888] hover:text-white'
                          }`}
                          style={{ borderColor: isSelected ? cfg.hex : undefined }}
                        >
                          <span
                            className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm"
                            style={{ backgroundColor: cfg.hex }}
                          />
                          <span className="text-xs font-bold capitalize leading-tight">
                            {cfg.displayName}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Role in Team */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-[#AAAAAA] mb-1">
                      Função na Equipe
                    </label>
                    <select
                      value={conexaoRole}
                      onChange={e => setConexaoRole(e.target.value as ConexaoRole)}
                      className="w-full px-2.5 py-1.5 bg-[#141414] border border-[#2B2B2B] rounded-lg text-white text-xs focus:outline-none focus:border-amber-400"
                    >
                      <option value="membro">Membro da Equipe</option>
                      <option value="sublider_base">Sub-líder de Base</option>
                      <option value="lider">Líder da Cor</option>
                      <option value="convidado">Convidado / Visitante Jovem</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] text-[#AAAAAA] mb-1">
                      Nome da Base / Célula (opcional)
                    </label>
                    <input
                      type="text"
                      value={conexaoBaseName}
                      onChange={e => setConexaoBaseName(e.target.value)}
                      placeholder="Ex: Base Avivamento, Base Leão..."
                      className="w-full px-2.5 py-1.5 bg-[#141414] border border-[#2B2B2B] rounded-lg text-white text-xs focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Validation & Submit Feedback */}
          {Object.keys(errors).length > 0 && (
            <div className="p-3 bg-red-950/70 border border-red-700/60 rounded-lg text-xs text-red-200 space-y-1.5">
              <div className="flex items-center gap-1.5 font-semibold text-red-200">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>Atenção: Revise os dados do cadastro</span>
              </div>
              {Object.entries(errors).map(([key, msg]) => (
                <p key={key} className="text-red-300 pl-5">
                  • {msg}
                </p>
              ))}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#1C1C1C]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs md:text-sm font-medium text-[#CCCCCC] hover:text-white bg-[#141414] hover:bg-[#1A1A1A] border border-[#262626] rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs md:text-sm font-semibold text-black bg-white hover:bg-neutral-200 rounded-lg transition-colors shadow-sm disabled:opacity-50"
            >
              {isSubmitting ? 'Salvando...' : isEditing ? 'Salvar Alterações' : 'Concluir Cadastro'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
};
