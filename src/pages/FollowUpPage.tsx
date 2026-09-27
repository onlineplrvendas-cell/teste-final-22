import React, { useState, useMemo } from 'react';
import { useCRM } from '../context/CRMContext';
import { Task, Contact } from '../types';
import { formatDateBR, getTaskDueState } from '../utils/date';
import {
  CalendarCheck,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  Filter,
  Calendar,
  User,
  Trash2,
  Edit2,
  ArrowRight,
} from 'lucide-react';

interface FollowUpPageProps {
  onOpenNewTask: (contact?: Contact) => void;
  onOpenContactDetails: (contact: Contact) => void;
  onEditTask: (task: Task) => void;
}

export const FollowUpPage: React.FC<FollowUpPageProps> = ({
  onOpenNewTask,
  onOpenContactDetails,
  onEditTask,
}) => {
  const {
    tasks,
    contacts,
    toggleTaskStatus,
    deleteTask,
    teamMembers,
    selectedCongregation,
  } = useCRM();

  // Local filter states
  const [selectedResponsible, setSelectedResponsible] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'overdue' | 'today' | 'upcoming' | 'completed'>('today');

  // Active contact IDs (exclude archived contacts from active routine)
  const activeContactsMap = useMemo(() => {
    const map = new Map<string, Contact>();
    contacts.forEach(c => {
      if (!c.isArchived) {
        map.set(c.id, c);
      }
    });
    return map;
  }, [contacts]);

  // Filter tasks belonging to active contacts and congregation
  const scopedTasks = useMemo(() => {
    return tasks.filter(t => {
      // Must belong to non-archived contact
      if (!activeContactsMap.has(t.contactId)) return false;

      // Global congregation filter
      if (selectedCongregation !== 'all' && t.congregation !== selectedCongregation) {
        return false;
      }

      // Responsible filter
      if (selectedResponsible !== 'all') {
        if (t.assignedToId !== selectedResponsible && t.assignedToName !== selectedResponsible) {
          return false;
        }
      }

      return true;
    });
  }, [tasks, activeContactsMap, selectedCongregation, selectedResponsible]);

  // Categorize tasks into 4 groups
  const categorizedTasks = useMemo(() => {
    const overdue: Task[] = [];
    const today: Task[] = [];
    const upcoming: Task[] = [];
    const completed: Task[] = [];

    scopedTasks.forEach(task => {
      if (task.status === 'completed') {
        completed.push(task);
      } else {
        const state = getTaskDueState(task.dueDate);
        if (state === 'overdue') overdue.push(task);
        else if (state === 'today') today.push(task);
        else upcoming.push(task);
      }
    });

    // Sort by due date
    overdue.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
    today.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
    upcoming.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
    completed.sort((a, b) => (b.completedAt || b.updatedAt).localeCompare(a.completedAt || a.updatedAt));

    return { overdue, today, upcoming, completed };
  }, [scopedTasks]);

  const tabs = [
    {
      id: 'today' as const,
      label: 'Hoje',
      count: categorizedTasks.today.length,
      badgeClass: 'bg-white text-black font-bold',
    },
    {
      id: 'overdue' as const,
      label: 'Atrasados',
      count: categorizedTasks.overdue.length,
      badgeClass: categorizedTasks.overdue.length > 0 ? 'bg-neutral-800 text-white border border-neutral-600' : 'bg-[#161616] text-[#666666]',
    },
    {
      id: 'upcoming' as const,
      label: 'Próximos',
      count: categorizedTasks.upcoming.length,
      badgeClass: 'bg-[#1A1A1A] text-[#AAAAAA] border border-[#262626]',
    },
    {
      id: 'completed' as const,
      label: 'Concluídos',
      count: categorizedTasks.completed.length,
      badgeClass: 'bg-[#141414] text-[#777777]',
    },
  ];

  const currentTaskList = categorizedTasks[activeTab];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#1F1F1F]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white font-heading tracking-tight">
            Rotina de Acompanhamento
          </h1>
          <p className="text-xs sm:text-sm text-[#888888] mt-0.5">
            Organização diária de retornos, ligações e cuidado pastoral
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onOpenNewTask()}
            className="flex items-center gap-1.5 px-4 py-2 bg-white text-black font-semibold text-xs sm:text-sm rounded-lg hover:bg-neutral-200 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Agendar Retorno</span>
          </button>
        </div>
      </div>

      {/* Filter and Tabs Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-[#0B0B0B] border border-[#262626] rounded-xl">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-[#181818] text-white border border-[#333333]'
                  : 'text-[#888888] hover:text-white hover:bg-[#121212]'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] ${tab.badgeClass}`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Filter by Responsible */}
        <div className="flex items-center gap-2 shrink-0">
          <label className="text-xs text-[#888888] flex items-center gap-1">
            <User className="w-3.5 h-3.5" />
            <span>Responsável:</span>
          </label>
          <select
            value={selectedResponsible}
            onChange={e => setSelectedResponsible(e.target.value)}
            className="px-2.5 py-1.5 bg-[#141414] border border-[#262626] rounded-lg text-white text-xs focus:outline-none focus:border-white"
          >
            <option value="all">Todos os responsáveis</option>
            {teamMembers.map(u => (
              <option key={u.uid} value={u.uid}>
                {u.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Task List / Board */}
      <div className="space-y-3">
        {currentTaskList.length === 0 ? (
          <div className="p-12 text-center bg-[#0B0B0B] border border-[#262626] rounded-xl text-xs text-[#777777] space-y-2">
            <CalendarCheck className="w-8 h-8 text-[#444444] mx-auto" />
            <p className="text-sm font-medium text-[#CCCCCC]">
              Nenhuma tarefa nesta categoria no momento.
            </p>
            <p className="text-[#666666]">
              Parabéns! Sua rotina de retornos está em dia.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {currentTaskList.map(task => {
              const contact = activeContactsMap.get(task.contactId);
              const isDone = task.status === 'completed';
              const state = getTaskDueState(task.dueDate);

              return (
                <div
                  key={task.id}
                  className={`p-4 rounded-xl border flex flex-col justify-between transition-colors ${
                    isDone
                      ? 'bg-[#080808] border-[#1C1C1C] opacity-75'
                      : state === 'overdue'
                      ? 'bg-[#120D0D] border-[#381F1F]'
                      : state === 'today'
                      ? 'bg-[#111111] border-[#333333]'
                      : 'bg-[#0B0B0B] border-[#222222]'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Top row: Checkbox + Contact Name + Congregation */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5 truncate">
                        <button
                          onClick={() => toggleTaskStatus(task.id)}
                          className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                            isDone
                              ? 'bg-white border-white text-black'
                              : 'border-[#444444] hover:border-white'
                          }`}
                          aria-label="Marcar como concluída"
                        >
                          {isDone && <CheckCircle2 className="w-3.5 h-3.5" />}
                        </button>
                        <div className="truncate">
                          <button
                            onClick={() => contact && onOpenContactDetails(contact)}
                            className="text-xs font-semibold text-white hover:underline truncate block text-left"
                          >
                            {task.contactName}
                          </button>
                          {contact && (
                            <span className="text-[10px] text-[#888888]">
                              {contact.stage} • {contact.category}
                            </span>
                          )}
                        </div>
                      </div>

                      <span className="text-[10px] font-medium px-2 py-0.5 bg-[#141414] text-[#CCCCCC] border border-[#2B2B2B] rounded shrink-0">
                        {task.congregation}
                      </span>
                    </div>

                    {/* Task Description */}
                    <p className={`text-xs leading-relaxed ${isDone ? 'line-through text-[#777777]' : 'text-[#EEEEEE]'}`}>
                      {task.description}
                    </p>
                  </div>

                  {/* Footer details & actions */}
                  <div className="pt-3 mt-3 border-t border-[#1C1C1C] flex items-center justify-between text-[11px] text-[#888888]">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 text-white font-medium">
                        <Calendar className="w-3 h-3 text-[#777777]" />
                        <span>{formatDateBR(task.dueDate)}</span>
                        {task.dueTime && <span>às {task.dueTime}</span>}
                      </div>
                      <span className="text-[10px] text-[#777777]">
                        Resp: {task.assignedToName || 'Não atribuído'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onEditTask(task)}
                        className="p-1.5 text-[#777777] hover:text-white rounded hover:bg-[#1A1A1A] transition-colors"
                        title="Editar ou reagendar"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="p-1.5 text-[#777777] hover:text-red-400 rounded hover:bg-[#1A1A1A] transition-colors"
                        title="Excluir tarefa"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
