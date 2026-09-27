import React, { useState, useMemo } from 'react';
import { useCRM } from '../context/CRMContext';
import { useAuth } from '../context/AuthContext';
import { Contact, UniReinoSemester, UniReinoStatus, CongregationFilter } from '../types';
import { UniReinoBadge } from '../components/UniReinoBadge';
import { EnrollUniReinoModal } from '../components/EnrollUniReinoModal';
import { formatDateBR } from '../utils/date';
import { getWhatsAppUrl } from '../utils/phone';
import {
  GraduationCap,
  Crown,
  Search,
  Filter,
  Plus,
  ArrowRight,
  Download,
  Users,
  CheckCircle2,
  Calendar,
  Sparkles,
  BookOpen,
  Award,
  ChevronRight,
  Phone,
  MessageSquare,
  Clock,
  RotateCcw,
  SlidersHorizontal,
  ChevronLeft,
} from 'lucide-react';

interface UniReinoPageProps {
  onOpenContactDetails: (contact: Contact) => void;
}

type UniReinoSubTab = 'mapping' | 'semesters';

export const UniReinoPage: React.FC<UniReinoPageProps> = ({ onOpenContactDetails }) => {
  const {
    contacts,
    uniReinoStudents,
    selectedCongregation,
    advanceUniReinoSemester,
  } = useCRM();
  const { isDemoMode, currentUser } = useAuth();

  // Sub-tabs: 'mapping' = Mapeamento Geral de Alunos, 'semesters' = Curso & 8 Semestres
  const [activeSubTab, setActiveSubTab] = useState<UniReinoSubTab>('mapping');

  // Modal state
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [contactToEdit, setContactToEdit] = useState<Contact | null>(null);
  const [defaultSemesterForNew, setDefaultSemesterForNew] = useState<UniReinoSemester>(1);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [semesterFilter, setSemesterFilter] = useState<'all' | UniReinoSemester>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | UniReinoStatus>('all');
  const [localCongFilter, setLocalCongFilter] = useState<CongregationFilter>(selectedCongregation);

  // Selected semester in the 8-semesters tab view
  const [selectedSemesterTab, setSelectedSemesterTab] = useState<UniReinoSemester | 'graduados'>(1);
  const [semestersViewLayout, setSemestersViewLayout] = useState<'tabs' | 'kanban'>('tabs');

  // Feedback notifications
  const [advanceNotice, setAdvanceNotice] = useState<string | null>(null);

  // Filtered enrolled students list
  const filteredStudents = useMemo(() => {
    return uniReinoStudents.filter(student => {
      const enrollment = student.uniReino;
      if (!enrollment || !enrollment.isEnrolled) return false;

      // Congregation filter
      if (localCongFilter !== 'all' && student.congregation !== localCongFilter) {
        return false;
      }

      // Semester filter
      if (semesterFilter !== 'all' && enrollment.semester !== semesterFilter) {
        return false;
      }

      // Status filter
      if (statusFilter !== 'all' && enrollment.status !== statusFilter) {
        return false;
      }

      // Search query (name, phone, matricula, turma)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = student.name.toLowerCase().includes(q);
        const matchesPhone = student.phone.includes(q);
        const matchesMatricula = enrollment.matricula?.toLowerCase().includes(q) || false;
        const matchesTurma = enrollment.turma?.toLowerCase().includes(q) || false;
        if (!matchesName && !matchesPhone && !matchesMatricula && !matchesTurma) {
          return false;
        }
      }

      return true;
    });
  }, [uniReinoStudents, localCongFilter, semesterFilter, statusFilter, searchQuery]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    const totalEnrolled = uniReinoStudents.length;
    const activeStudents = uniReinoStudents.filter(s => s.uniReino?.status === 'matriculado').length;
    const graduatedStudents = uniReinoStudents.filter(s => s.uniReino?.status === 'concluido').length;
    const pausedStudents = uniReinoStudents.filter(s => s.uniReino?.status === 'trancado').length;

    // Distribution across congregations
    const recreioCount = uniReinoStudents.filter(s => s.congregation === 'Recreio').length;
    const curicicaCount = uniReinoStudents.filter(s => s.congregation === 'Curicica').length;
    const guaratibaCount = uniReinoStudents.filter(s => s.congregation === 'Guaratiba').length;

    // Distribution by semester 1-8
    const bySemester: Record<UniReinoSemester, number> = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
      6: 0,
      7: 0,
      8: 0,
    };
    uniReinoStudents.forEach(s => {
      const sem = s.uniReino?.semester;
      if (sem && sem >= 1 && sem <= 8) {
        bySemester[sem]++;
      }
    });

    return {
      totalEnrolled,
      activeStudents,
      graduatedStudents,
      pausedStudents,
      recreioCount,
      curicicaCount,
      guaratibaCount,
      bySemester,
    };
  }, [uniReinoStudents]);

  // Quick action: Advance student semester
  const handleAdvance = async (student: Contact, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const curSemester = student.uniReino?.semester || 1;
      const isGraduating = curSemester >= 8;
      await advanceUniReinoSemester(student.id);

      if (isGraduating) {
        setAdvanceNotice(`🎉 Parabéns! ${student.name} concluiu o 8º Semestre e foi graduado na Uni Reino!`);
      } else {
        setAdvanceNotice(`✅ ${student.name} avançou para o ${(curSemester + 1)}º Semestre!`);
      }
      setTimeout(() => setAdvanceNotice(null), 4500);
    } catch (err: any) {
      console.error(err);
    }
  };

  // Export Uni Reino enrolled students to CSV
  const handleExportCSV = () => {
    const headers = [
      'Matrícula',
      'Nome Completo',
      'Telefone',
      'Congregação',
      'Semestre',
      'Progresso (%)',
      'Situação',
      'Turma',
      'Data de Matrícula',
      'Observações',
    ];

    const rows = filteredStudents.map(s => {
      const u = s.uniReino;
      const progress = u ? Math.round((u.semester / 8) * 100) : 0;
      return [
        `"${u?.matricula || ''}"`,
        `"${s.name}"`,
        `"${s.phone}"`,
        `"${s.congregation}"`,
        `"${u?.semester || 1}º Semestre"`,
        `"${progress}%"`,
        `"${u?.status || 'matriculado'}"`,
        `"${u?.turma || ''}"`,
        `"${u?.enrolledAt ? formatDateBR(u.enrolledAt) : ''}"`,
        `"${(u?.notes || '').replace(/"/g, '""')}"`,
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Uni_Reino_Alunos_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const semesterThemes: Record<UniReinoSemester, { name: string; focus: string }> = {
    1: { name: '1º Semestre', focus: 'Fundamentos da Fé & Vida Cristã' },
    2: { name: '2º Semestre', focus: 'Vida no Espírito & Oração' },
    3: { name: '3º Semestre', focus: 'Teologia Bíblica & Hermenêutica' },
    4: { name: '4º Semestre', focus: 'Discipulado & Liderança de Células' },
    5: { name: '5º Semestre', focus: 'Ministérios & Dons Espirituais' },
    6: { name: '6º Semestre', focus: 'Aconselhamento & Cuidado Pastoral' },
    7: { name: '7º Semestre', focus: 'Homilética, Pregação & Missões' },
    8: { name: '8º Semestre', focus: 'Estágio Prático & Formatura Ministerial' },
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Royal Golden Theme */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#141005] via-[#1A1406] to-[#0A0A0A] border border-amber-500/30 rounded-2xl p-5 md:p-6 shadow-2xl">
        {/* Ambient gold glow */}
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br from-amber-400 via-yellow-400 to-amber-600 flex items-center justify-center text-black font-black shadow-lg shadow-amber-500/25 shrink-0">
              <Crown className="w-7 h-7 fill-black" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl md:text-2xl font-black tracking-tight text-white">
                  UNI REINO
                </h1>
                <UniReinoBadge size="sm" showSemester={false} />
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  8 Semestres Ministeriais
                </span>
              </div>
              <p className="text-xs md:text-sm text-[#CCCCCC] mt-1 max-w-2xl leading-relaxed">
                Mapeamento completo dos membros matriculados na Uni Reino. Acompanhe em qual período
                cada estudante está ao longo dos 8 semestres de formação ministerial, identificados
                pelo selo dourado <span className="font-extrabold text-amber-300">UN</span>.
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-2 bg-[#141414] hover:bg-[#1E1E1E] text-[#CCCCCC] hover:text-white border border-[#2B2B2B] rounded-xl text-xs font-semibold transition-colors"
              title="Exportar lista de alunos para planilha CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar Alunos</span>
            </button>

            <button
              onClick={() => {
                setContactToEdit(null);
                setDefaultSemesterForNew(1);
                setIsEnrollModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 hover:brightness-110 text-black font-extrabold text-xs rounded-xl shadow-lg shadow-amber-500/25 transition-all"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Matricular Novo Aluno</span>
            </button>
          </div>
        </div>

        {/* Aggregate Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-[#2A2312]">
          <div className="p-3 bg-black/40 border border-amber-500/20 rounded-xl">
            <div className="flex items-center justify-between text-xs text-[#AAAAAA]">
              <span>Total de Inscritos</span>
              <UniReinoBadge size="xs" />
            </div>
            <p className="text-xl md:text-2xl font-black text-amber-300 mt-1">
              {metrics.totalEnrolled}
            </p>
            <p className="text-[10px] text-[#777777] mt-0.5">membros com selo UN</p>
          </div>

          <div className="p-3 bg-black/40 border border-amber-500/20 rounded-xl">
            <div className="flex items-center justify-between text-xs text-[#AAAAAA]">
              <span>Ativos nos Semestres</span>
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <p className="text-xl md:text-2xl font-black text-white mt-1">
              {metrics.activeStudents}
            </p>
            <p className="text-[10px] text-emerald-400 mt-0.5">cursando regularmente</p>
          </div>

          <div className="p-3 bg-black/40 border border-amber-500/20 rounded-xl">
            <div className="flex items-center justify-between text-xs text-[#AAAAAA]">
              <span>Graduados / Formados</span>
              <Award className="w-3.5 h-3.5 text-amber-300" />
            </div>
            <p className="text-xl md:text-2xl font-black text-amber-400 mt-1">
              {metrics.graduatedStudents}
            </p>
            <p className="text-[10px] text-[#888888] mt-0.5">concluíram os 8 semestres</p>
          </div>

          <div className="p-3 bg-black/40 border border-amber-500/20 rounded-xl">
            <div className="flex items-center justify-between text-xs text-[#AAAAAA]">
              <span>Por Congregação</span>
              <Users className="w-3.5 h-3.5 text-neutral-400" />
            </div>
            <div className="flex items-center gap-2 mt-2 text-[11px] font-bold text-white">
              <span title="Recreio">R: {metrics.recreioCount}</span>
              <span className="text-neutral-600">•</span>
              <span title="Curicica">C: {metrics.curicicaCount}</span>
              <span className="text-neutral-600">•</span>
              <span title="Guaratiba">G: {metrics.guaratibaCount}</span>
            </div>
            <p className="text-[10px] text-[#777777] mt-0.5">Recreio, Curicica, Guaratiba</p>
          </div>
        </div>
      </div>

      {/* Advance / Success Notification Banner */}
      {advanceNotice && (
        <div className="p-3.5 bg-gradient-to-r from-amber-950/70 to-emerald-950/70 border border-amber-500/40 rounded-xl text-white text-xs flex items-center justify-between gap-3 shadow-lg animate-in fade-in">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
            <span className="font-semibold">{advanceNotice}</span>
          </div>
          <button
            onClick={() => setAdvanceNotice(null)}
            className="text-[11px] text-[#AAAAAA] hover:text-white"
          >
            Fechar
          </button>
        </div>
      )}

      {/* Primary Sub-Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-[#222222] pb-2 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('mapping')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all ${
              activeSubTab === 'mapping'
                ? 'bg-gradient-to-r from-amber-400 to-yellow-400 text-black shadow-md shadow-amber-500/20 font-black'
                : 'text-[#999999] hover:text-white hover:bg-[#111111]'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Mapeamento Geral de Alunos</span>
            <span
              className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                activeSubTab === 'mapping'
                  ? 'bg-black text-amber-300'
                  : 'bg-[#1C1C1C] text-[#888888]'
              }`}
            >
              {filteredStudents.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('semesters')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all ${
              activeSubTab === 'semesters'
                ? 'bg-gradient-to-r from-amber-400 to-yellow-400 text-black shadow-md shadow-amber-500/20 font-black'
                : 'text-[#999999] hover:text-white hover:bg-[#111111]'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Grade do Curso (8 Semestres)</span>
            <span
              className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                activeSubTab === 'semesters'
                  ? 'bg-black text-amber-300'
                  : 'bg-[#1C1C1C] text-[#888888]'
              }`}
            >
              8 Períodos
            </span>
          </button>
        </div>

        {/* Congregation Switcher / Filter */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-[#777777] hidden sm:inline">Congregação:</span>
          <select
            value={localCongFilter}
            onChange={e => setLocalCongFilter(e.target.value as CongregationFilter)}
            className="px-2.5 py-1.5 bg-[#121212] border border-[#2B2B2B] rounded-lg text-white text-xs focus:outline-none focus:border-amber-400"
          >
            <option value="all">Todas as Congregações</option>
            <option value="Recreio">Recreio</option>
            <option value="Curicica">Curicica</option>
            <option value="Guaratiba">Guaratiba</option>
          </select>
        </div>
      </div>

      {/* ========================================================
          SUB-TAB 1: MAPEAMENTO GERAL DE ALUNOS
         ======================================================== */}
      {activeSubTab === 'mapping' && (
        <div className="space-y-4">
          {/* Search & Filter Toolbar */}
          <div className="p-3.5 bg-[#0B0B0B] border border-[#262626] rounded-xl flex flex-col md:flex-row items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-[#777777] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Buscar por nome, telefone, matrícula..."
                className="w-full pl-9 pr-3 py-2 bg-[#121212] border border-[#262626] rounded-lg text-white text-xs placeholder-[#555555] focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Quick Filters */}
            <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
              {/* Semester Filter */}
              <select
                value={semesterFilter}
                onChange={e =>
                  setSemesterFilter(e.target.value === 'all' ? 'all' : (Number(e.target.value) as UniReinoSemester))
                }
                className="px-2.5 py-2 bg-[#121212] border border-[#262626] rounded-lg text-white text-xs focus:outline-none focus:border-amber-400"
              >
                <option value="all">Todos os Semestres (1º ao 8º)</option>
                {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                  <option key={s} value={s}>
                    {s}º Semestre ({metrics.bySemester[s as UniReinoSemester]} alunos)
                  </option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as any)}
                className="px-2.5 py-2 bg-[#121212] border border-[#262626] rounded-lg text-white text-xs focus:outline-none focus:border-amber-400"
              >
                <option value="all">Todas as Situações</option>
                <option value="matriculado">Ativo (Cursando)</option>
                <option value="concluido">Graduado (Concluído)</option>
                <option value="trancado">Trancado</option>
              </select>

              {(searchQuery || semesterFilter !== 'all' || statusFilter !== 'all') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSemesterFilter('all');
                    setStatusFilter('all');
                  }}
                  className="flex items-center gap-1 px-2.5 py-2 bg-[#141414] hover:bg-[#1E1E1E] text-[#999999] hover:text-white rounded-lg text-xs transition-colors border border-[#262626]"
                  title="Limpar filtros"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Limpar</span>
                </button>
              )}
            </div>
          </div>

          {/* Desktop Table */}
          <div className="hidden lg:block bg-[#0B0B0B] border border-[#262626] rounded-xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0F0F0F] border-b border-[#262626] text-[#888888] uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3.5 px-4">Selo UN</th>
                    <th className="py-3.5 px-4">Aluno / Membro</th>
                    <th className="py-3.5 px-4">Telefone / WhatsApp</th>
                    <th className="py-3.5 px-4">Congregação</th>
                    <th className="py-3.5 px-4">Período / Semestre</th>
                    <th className="py-3.5 px-4">Progresso Geral</th>
                    <th className="py-3.5 px-4">Turma / Matrícula</th>
                    <th className="py-3.5 px-4">Situação</th>
                    <th className="py-3.5 px-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1A1A1A]">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-[#777777]">
                        Nenhum aluno matriculado encontrado com os filtros selecionados.
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map(student => {
                      const u = student.uniReino!;
                      const progress = Math.round((u.semester / 8) * 100);

                      return (
                        <tr
                          key={student.id}
                          onClick={() => onOpenContactDetails(student)}
                          className="hover:bg-[#121212] transition-colors cursor-pointer group"
                        >
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <UniReinoBadge
                              semester={u.semester}
                              enrollment={u}
                              size="sm"
                              showSemester={false}
                            />
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-white">
                            <div className="flex items-center gap-2">
                              <span>{student.name}</span>
                            </div>
                            <span className="text-[10px] text-[#777777] block font-normal">
                              Membro desde {student.memberSinceDate ? formatDateBR(student.memberSinceDate) : '2025'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-[#CCCCCC] whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span>{student.phone}</span>
                              <button
                                onClick={e => {
                                  e.stopPropagation();
                                  window.open(getWhatsAppUrl(student.phone), '_blank');
                                }}
                                className="p-1 hover:bg-[#222222] rounded text-[#888888] hover:text-emerald-400 transition-colors"
                                title="Abrir conversa no WhatsApp"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded text-[11px] bg-[#141414] text-white border border-[#2B2B2B] font-medium">
                              {student.congregation}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <span className="font-extrabold text-amber-300 text-xs">
                                {u.semester}º Semestre
                              </span>
                              <span className="text-[10px] text-[#777777]">
                                ({semesterThemes[u.semester]?.name})
                              </span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 min-w-[120px]">
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-[10px]">
                                <span className="text-[#888888]">{u.semester} de 8 sem</span>
                                <span className="font-bold text-amber-300">{progress}%</span>
                              </div>
                              <div className="w-full bg-[#181818] h-1.5 rounded-full overflow-hidden">
                                <div
                                  className="bg-gradient-to-r from-amber-500 to-yellow-400 h-full rounded-full"
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap text-[#AAAAAA]">
                            <div>
                              <span className="font-mono text-[11px] text-white font-semibold">
                                {u.matricula || '-'}
                              </span>
                              <span className="text-[10px] text-[#666666] block">
                                {u.turma || 'Turma Geral'}
                              </span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                u.status === 'concluido'
                                  ? 'bg-amber-400 text-black font-extrabold'
                                  : u.status === 'trancado'
                                  ? 'bg-neutral-800 text-neutral-400'
                                  : 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/40'
                              }`}
                            >
                              {u.status === 'concluido'
                                ? 'Graduado'
                                : u.status === 'trancado'
                                ? 'Trancado'
                                : 'Ativo'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              {u.status !== 'concluido' && (
                                <button
                                  onClick={e => handleAdvance(student, e)}
                                  className="px-2 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 hover:text-amber-200 border border-amber-500/30 rounded text-[11px] font-bold transition-colors"
                                  title="Avançar para o próximo semestre"
                                >
                                  {u.semester === 8 ? 'Graduar' : '+1 Semestre'}
                                </button>
                              )}
                              <button
                                onClick={e => {
                                  e.stopPropagation();
                                  setContactToEdit(student);
                                  setIsEnrollModalOpen(true);
                                }}
                                className="px-2 py-1 bg-[#161616] hover:bg-[#202020] text-[#CCCCCC] hover:text-white rounded text-[11px] border border-[#2B2B2B] transition-colors"
                              >
                                Editar
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards View */}
          <div className="lg:hidden space-y-3">
            {filteredStudents.length === 0 ? (
              <div className="p-8 text-center bg-[#0B0B0B] border border-[#262626] rounded-xl text-xs text-[#777777]">
                Nenhum aluno matriculado encontrado.
              </div>
            ) : (
              filteredStudents.map(student => {
                const u = student.uniReino!;
                const progress = Math.round((u.semester / 8) * 100);

                return (
                  <div
                    key={student.id}
                    onClick={() => onOpenContactDetails(student)}
                    className="p-4 bg-[#0B0B0B] border border-[#262626] rounded-xl space-y-3 cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-white">{student.name}</h3>
                          <UniReinoBadge semester={u.semester} size="xs" />
                        </div>
                        <p className="text-xs text-[#888888] mt-0.5">{student.phone}</p>
                      </div>
                      <span className="text-[10px] font-semibold px-2 py-0.5 bg-[#141414] text-white border border-[#2B2B2B] rounded">
                        {student.congregation}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-[#1C1C1C]">
                      <div>
                        <span className="text-[10px] text-[#777777] block">Semestre Atual</span>
                        <span className="text-amber-300 font-extrabold">{u.semester}º Semestre</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#777777] block">Situação</span>
                        <span className="text-white font-medium capitalize">{u.status}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#777777] block">Matrícula / Turma</span>
                        <span className="text-[#CCCCCC] font-mono text-[11px]">
                          {u.matricula || '-'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#777777] block">Progresso</span>
                        <span className="text-amber-400 font-bold">{progress}% concluído</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-[#181818] h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-amber-500 to-yellow-400 h-full rounded-full"
                        style={{ width: `${progress}%` }}
                      />
                    </div>

                    {/* Mobile Card Actions */}
                    <div
                      className="pt-2 border-t border-[#1C1C1C] flex items-center justify-between gap-2"
                      onClick={e => e.stopPropagation()}
                    >
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          window.open(getWhatsAppUrl(student.phone), '_blank');
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#141414] hover:bg-[#1E1E1E] text-emerald-400 border border-[#2B2B2B] rounded-lg text-xs"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>WhatsApp</span>
                      </button>

                      <div className="flex items-center gap-1.5">
                        {u.status !== 'concluido' && (
                          <button
                            onClick={e => handleAdvance(student, e)}
                            className="px-2.5 py-1.5 bg-amber-500 text-black font-extrabold rounded-lg text-xs shadow-sm shadow-amber-500/20"
                          >
                            {u.semester === 8 ? 'Graduar' : '+1 Semestre'}
                          </button>
                        )}
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            setContactToEdit(student);
                            setIsEnrollModalOpen(true);
                          }}
                          className="px-2.5 py-1.5 bg-[#161616] text-[#CCCCCC] border border-[#2B2B2B] rounded-lg text-xs"
                        >
                          Editar
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ========================================================
          SUB-TAB 2: GRADE POR PERÍODO (8 SEMESTRES)
         ======================================================== */}
      {activeSubTab === 'semesters' && (
        <div className="space-y-5">
          {/* Header of 8 Semesters */}
          <div className="p-4 bg-[#0B0B0B] border border-[#262626] rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-amber-400" />
                <h2 className="text-sm md:text-base font-bold text-white">
                  Estrutura Curricular e Distribuição por Semestre
                </h2>
              </div>
              <p className="text-xs text-[#888888] mt-0.5">
                Navegue pelos 8 semestres da formação ministerial para visualizar os estudantes em
                cada período e avançá-los na grade acadêmica.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-[#777777]">Visualização:</span>
              <div className="flex items-center bg-[#141414] border border-[#262626] rounded-lg p-0.5">
                <button
                  onClick={() => setSemestersViewLayout('tabs')}
                  className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                    semestersViewLayout === 'tabs'
                      ? 'bg-amber-400 text-black font-extrabold shadow-sm'
                      : 'text-[#888888] hover:text-white'
                  }`}
                >
                  Por Semestre
                </button>
                <button
                  onClick={() => setSemestersViewLayout('kanban')}
                  className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                    semestersViewLayout === 'kanban'
                      ? 'bg-amber-400 text-black font-extrabold shadow-sm'
                      : 'text-[#888888] hover:text-white'
                  }`}
                >
                  Grade Geral (8 Colunas)
                </button>
              </div>
            </div>
          </div>

          {/* 8-Semesters Navigation Bar */}
          <div className="grid grid-cols-4 sm:grid-cols-9 gap-1.5">
            {([1, 2, 3, 4, 5, 6, 7, 8] as UniReinoSemester[]).map(s => {
              const isSelected = selectedSemesterTab === s;
              const count = metrics.bySemester[s];
              return (
                <button
                  key={s}
                  onClick={() => {
                    setSelectedSemesterTab(s);
                    setSemestersViewLayout('tabs');
                  }}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    isSelected && semestersViewLayout === 'tabs'
                      ? 'bg-gradient-to-b from-amber-400 to-yellow-500 text-black border-amber-200 font-black shadow-lg shadow-amber-500/20 scale-105'
                      : 'bg-[#0E0E0E] border-[#222222] text-[#AAAAAA] hover:text-white hover:bg-[#161616]'
                  }`}
                >
                  <span className="block text-xs font-bold">{s}º Semestre</span>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    <span
                      className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-full ${
                        isSelected && semestersViewLayout === 'tabs'
                          ? 'bg-black text-amber-300'
                          : 'bg-[#1C1C1C] text-[#888888]'
                      }`}
                    >
                      {count} alunos
                    </span>
                  </div>
                </button>
              );
            })}

            {/* Graduados Button */}
            <button
              onClick={() => {
                setSelectedSemesterTab('graduados');
                setSemestersViewLayout('tabs');
              }}
              className={`p-2.5 rounded-xl border text-center transition-all ${
                selectedSemesterTab === 'graduados' && semestersViewLayout === 'tabs'
                  ? 'bg-gradient-to-b from-amber-400 to-yellow-500 text-black border-amber-200 font-black shadow-lg shadow-amber-500/20 scale-105'
                  : 'bg-[#0E0E0E] border-[#222222] text-[#AAAAAA] hover:text-white hover:bg-[#161616]'
              }`}
            >
              <span className="block text-xs font-bold">Graduados</span>
              <div className="flex items-center justify-center gap-1 mt-1">
                <span
                  className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-full ${
                    selectedSemesterTab === 'graduados' && semestersViewLayout === 'tabs'
                      ? 'bg-black text-amber-300'
                      : 'bg-[#1C1C1C] text-[#888888]'
                  }`}
                >
                  {metrics.graduatedStudents} formados
                </span>
              </div>
            </button>
          </div>

          {/* VIEW MODE 1: Single Selected Semester Detailed View */}
          {semestersViewLayout === 'tabs' && (
            <div className="space-y-4">
              {/* Semester Header Card */}
              {selectedSemesterTab !== 'graduados' ? (
                <div className="p-4 bg-gradient-to-r from-[#120F05] via-[#161206] to-[#0A0A0A] border border-amber-500/30 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-extrabold text-amber-300">
                        {selectedSemesterTab}º SEMESTRE
                      </span>
                      <UniReinoBadge semester={selectedSemesterTab} size="xs" />
                      <span className="text-xs text-[#888888]">
                        • {semesterThemes[selectedSemesterTab]?.focus}
                      </span>
                    </div>
                    <p className="text-xs text-[#AAAAAA] mt-0.5">
                      {Math.round((selectedSemesterTab / 8) * 100)}% do curso concluído por estes alunos.
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setContactToEdit(null);
                      setDefaultSemesterForNew(selectedSemesterTab);
                      setIsEnrollModalOpen(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-400 to-yellow-400 text-black font-extrabold text-xs rounded-lg shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Matricular no {selectedSemesterTab}º Semestre</span>
                  </button>
                </div>
              ) : (
                <div className="p-4 bg-gradient-to-r from-[#120F05] via-[#161206] to-[#0A0A0A] border border-amber-500/30 rounded-xl flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <Award className="w-5 h-5 text-amber-400" />
                      <span className="text-base font-extrabold text-amber-300">
                        ALUNOS GRADUADOS • UNI REINO
                      </span>
                    </div>
                    <p className="text-xs text-[#AAAAAA] mt-0.5">
                      Membros que concluíram com louvor os 8 semestres da formação ministerial da Casa de Deus.
                    </p>
                  </div>
                </div>
              )}

              {/* Students in this selected semester */}
              {(() => {
                const currentList = uniReinoStudents.filter(s => {
                  if (localCongFilter !== 'all' && s.congregation !== localCongFilter) return false;
                  if (selectedSemesterTab === 'graduados') {
                    return s.uniReino?.status === 'concluido';
                  }
                  return s.uniReino?.semester === selectedSemesterTab && s.uniReino?.status !== 'concluido';
                });

                if (currentList.length === 0) {
                  return (
                    <div className="p-12 text-center bg-[#0B0B0B] border border-[#262626] rounded-xl space-y-3">
                      <GraduationCap className="w-10 h-10 text-neutral-600 mx-auto" />
                      <p className="text-sm font-semibold text-white">
                        Nenhum aluno matriculado neste período no momento.
                      </p>
                      <p className="text-xs text-[#777777]">
                        Use o botão acima para matricular membros no {selectedSemesterTab}º Semestre.
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                    {currentList.map(student => {
                      const u = student.uniReino!;
                      const progress = Math.round((u.semester / 8) * 100);

                      return (
                        <div
                          key={student.id}
                          onClick={() => onOpenContactDetails(student)}
                          className="p-4 bg-[#0B0B0B] hover:bg-[#111111] border border-[#262626] hover:border-amber-500/40 rounded-xl space-y-3 cursor-pointer transition-all shadow-md group"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-9 h-9 rounded-full bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 font-bold text-xs shrink-0">
                                {student.name.charAt(0)}
                              </div>
                              <div>
                                <h3 className="text-sm font-bold text-white group-hover:text-amber-200 transition-colors">
                                  {student.name}
                                </h3>
                                <p className="text-xs text-[#888888]">{student.phone}</p>
                              </div>
                            </div>
                            <UniReinoBadge semester={u.semester} size="xs" />
                          </div>

                          <div className="p-2.5 bg-[#121212] border border-[#1F1F1F] rounded-lg text-xs space-y-1.5">
                            <div className="flex items-center justify-between text-[#888888]">
                              <span>Congregação</span>
                              <span className="text-white font-medium">{student.congregation}</span>
                            </div>
                            <div className="flex items-center justify-between text-[#888888]">
                              <span>Matrícula</span>
                              <span className="font-mono text-amber-300 font-bold">
                                {u.matricula || '-'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-[#888888]">
                              <span>Turma</span>
                              <span className="text-[#CCCCCC]">{u.turma || 'Turma Geral'}</span>
                            </div>
                          </div>

                          {/* Progress bar */}
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[10px]">
                              <span className="text-[#777777]">Progresso dos 8 Semestres</span>
                              <span className="font-extrabold text-amber-300">{progress}%</span>
                            </div>
                            <div className="w-full bg-[#181818] h-1.5 rounded-full overflow-hidden">
                              <div
                                className="bg-gradient-to-r from-amber-500 to-yellow-400 h-full rounded-full"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>

                          {/* Quick Actions */}
                          <div
                            className="pt-2 border-t border-[#1C1C1C] flex items-center justify-between gap-2"
                            onClick={e => e.stopPropagation()}
                          >
                            <button
                              onClick={() => window.open(getWhatsAppUrl(student.phone), '_blank')}
                              className="p-1.5 hover:bg-[#1E1E1E] text-[#888888] hover:text-emerald-400 rounded transition-colors"
                              title="WhatsApp"
                            >
                              <MessageSquare className="w-4 h-4" />
                            </button>

                            <div className="flex items-center gap-1.5">
                              {u.status !== 'concluido' && (
                                <button
                                  onClick={e => handleAdvance(student, e)}
                                  className="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-amber-400 to-yellow-400 hover:brightness-110 text-black font-extrabold rounded-lg text-xs shadow-sm transition-all"
                                  title="Promover para o próximo período"
                                >
                                  <span>{u.semester === 8 ? 'Graduar' : 'Avançar (+1)'}</span>
                                  <ArrowRight className="w-3.5 h-3.5 stroke-[3]" />
                                </button>
                              )}
                              <button
                                onClick={e => {
                                  e.stopPropagation();
                                  setContactToEdit(student);
                                  setIsEnrollModalOpen(true);
                                }}
                                className="px-2.5 py-1 bg-[#161616] hover:bg-[#222222] text-[#CCCCCC] hover:text-white rounded-lg text-xs border border-[#2B2B2B]"
                              >
                                Editar
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          )}

          {/* VIEW MODE 2: Multi-Column 8-Semesters Board / Grid */}
          {semestersViewLayout === 'kanban' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3 overflow-x-auto pb-4">
              {([1, 2, 3, 4, 5, 6, 7, 8] as UniReinoSemester[]).map(s => {
                const semesterStudents = uniReinoStudents.filter(
                  st =>
                    st.uniReino?.semester === s &&
                    (localCongFilter === 'all' || st.congregation === localCongFilter)
                );

                return (
                  <div
                    key={s}
                    className="bg-[#0B0B0B] border border-[#222222] rounded-xl p-3 flex flex-col min-w-[200px] space-y-3"
                  >
                    <div className="flex items-center justify-between border-b border-[#1A1A1A] pb-2">
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-xs text-amber-300">{s}º Sem</span>
                        <UniReinoBadge semester={s} size="xs" showIcon={false} />
                      </div>
                      <span className="text-[10px] font-bold px-1.5 py-0.2 bg-[#1A1A1A] text-white rounded">
                        {semesterStudents.length}
                      </span>
                    </div>

                    <div className="space-y-2 grow">
                      {semesterStudents.length === 0 ? (
                        <div className="py-6 text-center text-[#555555] text-[11px]">
                          Sem alunos
                        </div>
                      ) : (
                        semesterStudents.map(st => (
                          <div
                            key={st.id}
                            onClick={() => onOpenContactDetails(st)}
                            className="p-2.5 bg-[#121212] hover:bg-[#181818] border border-[#1F1F1F] rounded-lg cursor-pointer space-y-1.5 transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-xs text-white truncate max-w-[120px]">
                                {st.name}
                              </span>
                              <span className="text-[9px] text-amber-300 font-mono">
                                {st.congregation.slice(0, 3)}
                              </span>
                            </div>

                            <div
                              className="flex items-center justify-between pt-1 border-t border-[#1C1C1C]"
                              onClick={e => e.stopPropagation()}
                            >
                              <span className="text-[10px] text-[#777777] font-mono">
                                {st.uniReino?.matricula || '-'}
                              </span>
                              <button
                                onClick={e => handleAdvance(st, e)}
                                className="px-1.5 py-0.5 bg-amber-500/20 hover:bg-amber-500/40 text-amber-300 rounded text-[9px] font-bold"
                                title="Avançar semestre"
                              >
                                {s === 8 ? 'Graduar' : '+1 Sem'}
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    <button
                      onClick={() => {
                        setContactToEdit(null);
                        setDefaultSemesterForNew(s);
                        setIsEnrollModalOpen(true);
                      }}
                      className="w-full py-1.5 text-center text-[10px] font-bold text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 rounded border border-amber-500/20 transition-colors"
                    >
                      + Matricular no {s}º
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Enroll / Manage Uni Reino Modal */}
      <EnrollUniReinoModal
        isOpen={isEnrollModalOpen}
        onClose={() => {
          setIsEnrollModalOpen(false);
          setContactToEdit(null);
        }}
        contactToEdit={contactToEdit}
        defaultSemester={defaultSemesterForNew}
      />
    </div>
  );
};
