import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { useCRM } from '../context/CRMContext';
import { Task, Contact } from '../types';
import { getTodayString } from '../utils/date';
import { CheckCircle2 } from 'lucide-react';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  contact?: Contact | null;
  taskToEdit?: Task | null;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  contact,
  taskToEdit,
}) => {
  const { createTask, updateTask, teamMembers, contacts } = useCRM();

  const isEditing = !!taskToEdit;

  const [contactId, setContactId] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [assignedToId, setAssignedToId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (taskToEdit) {
      setContactId(taskToEdit.contactId);
      setDescription(taskToEdit.description);
      setDueDate(taskToEdit.dueDate);
      setDueTime(taskToEdit.dueTime || '');
      setAssignedToId(taskToEdit.assignedToId || '');
    } else if (contact) {
      setContactId(contact.id);
      setDescription('');
      setDueDate(getTodayString());
      setDueTime('');
      setAssignedToId(contact.assignedToId || '');
    } else {
      setContactId(contacts[0]?.id || '');
      setDescription('');
      setDueDate(getTodayString());
      setDueTime('');
      setAssignedToId('');
    }
    setError('');
    setSuccess(false);
  }, [taskToEdit, contact, isOpen, contacts]);

  const targetContact = contact || contacts.find(c => c.id === contactId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setError('Informe a descrição da tarefa de retorno.');
      return;
    }
    if (!dueDate) {
      setError('Selecione a data de vencimento.');
      return;
    }
    if (!targetContact) {
      setError('Vincule a tarefa a um contato.');
      return;
    }

    setIsSubmitting(true);
    try {
      const assignedUser = teamMembers.find(u => u.uid === assignedToId);

      if (isEditing && taskToEdit) {
        await updateTask(taskToEdit.id, {
          description: description.trim(),
          dueDate,
          dueTime: dueTime || undefined,
          assignedToId: assignedToId || undefined,
          assignedToName: assignedUser?.name || undefined,
        });
      } else {
        await createTask({
          contactId: targetContact.id,
          contactName: targetContact.name,
          congregation: targetContact.congregation,
          description: description.trim(),
          dueDate,
          dueTime: dueTime || undefined,
          assignedToId: assignedToId || undefined,
          assignedToName: assignedUser?.name || undefined,
        });
      }

      setSuccess(true);
      setTimeout(() => {
        setIsSubmitting(false);
        onClose();
      }, 600);
    } catch (err: unknown) {
      setIsSubmitting(false);
      const msg = err instanceof Error ? err.message : 'Falha ao salvar retorno';
      setError(msg);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Tarefa de Retorno' : 'Agendar Próximo Retorno'}
      subtitle={
        targetContact
          ? `Acompanhamento pastoral para ${targetContact.name}`
          : 'Organize uma ação de contato ou acolhimento'
      }
      maxWidth="md"
    >
      {success ? (
        <div className="py-8 flex flex-col items-center justify-center text-center space-y-2">
          <CheckCircle2 className="w-10 h-10 text-white" />
          <p className="text-sm font-semibold text-white">
            {isEditing ? 'Retorno atualizado!' : 'Retorno agendado com sucesso!'}
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-950/60 border border-red-800 rounded-lg text-xs text-red-200">
              {error}
            </div>
          )}

          {/* Contato Vinculado */}
          {!contact && (
            <div>
              <label className="block text-xs font-medium text-[#CCCCCC] mb-1.5">
                Pessoa Vinculada <span className="text-white">*</span>
              </label>
              <select
                value={contactId}
                onChange={e => setContactId(e.target.value)}
                className="w-full px-3 py-2 bg-[#141414] border border-[#262626] rounded-lg text-white text-sm focus:outline-none focus:border-white transition-colors"
              >
                {contacts
                  .filter(c => !c.isArchived)
                  .map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.congregation} - {c.category})
                    </option>
                  ))}
              </select>
            </div>
          )}

          {/* Descrição */}
          <div>
            <label className="block text-xs font-medium text-[#CCCCCC] mb-1.5">
              Descrição da Ação <span className="text-white">*</span>
            </label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Ex: Ligar para saber se virá no culto de quarta"
              className="w-full px-3 py-2 bg-[#141414] border border-[#262626] rounded-lg text-white text-sm focus:outline-none focus:border-white transition-colors"
            />
          </div>

          {/* Data e Hora */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#CCCCCC] mb-1.5">
                Data do Retorno <span className="text-white">*</span>
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full px-3 py-2 bg-[#141414] border border-[#262626] rounded-lg text-white text-sm focus:outline-none focus:border-white transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#CCCCCC] mb-1.5">
                Horário (opcional)
              </label>
              <input
                type="time"
                value={dueTime}
                onChange={e => setDueTime(e.target.value)}
                className="w-full px-3 py-2 bg-[#141414] border border-[#262626] rounded-lg text-white text-sm focus:outline-none focus:border-white transition-colors"
              />
            </div>
          </div>

          {/* Responsável */}
          <div>
            <label className="block text-xs font-medium text-[#CCCCCC] mb-1.5">
              Responsável pela Tarefa
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

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#1C1C1C]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-[#CCCCCC] hover:text-white bg-[#141414] border border-[#262626] rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-semibold text-black bg-white hover:bg-neutral-200 rounded-lg transition-colors shadow-sm disabled:opacity-50"
            >
              {isSubmitting ? 'Salvando...' : isEditing ? 'Atualizar Retorno' : 'Agendar Retorno'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
};
