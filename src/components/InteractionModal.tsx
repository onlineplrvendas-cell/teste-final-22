import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { useCRM } from '../context/CRMContext';
import { Contact, InteractionChannel, ContactStage } from '../types';
import { MessageSquare, Phone, Users, MoreHorizontal, CheckCircle2 } from 'lucide-react';
import { getTodayString } from '../utils/date';

interface InteractionModalProps {
  isOpen: boolean;
  onClose: () => void;
  contact: Contact | null;
}

export const InteractionModal: React.FC<InteractionModalProps> = ({
  isOpen,
  onClose,
  contact,
}) => {
  const { addInteraction } = useCRM();

  const [channel, setChannel] = useState<InteractionChannel>('WhatsApp');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState('');
  const [newStage, setNewStage] = useState<ContactStage | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (contact) {
      setChannel('WhatsApp');
      setNotes('');
      setDate(getTodayString());
      setNewStage(contact.stage);
      setError('');
      setSuccess(false);
    }
  }, [contact, isOpen]);

  if (!contact) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notes.trim()) {
      setError('Descreva brevemente a conversa ou interação.');
      return;
    }

    setIsSubmitting(true);
    try {
      await addInteraction(
        {
          contactId: contact.id,
          congregation: contact.congregation,
          channel,
          notes: notes.trim(),
          stageAtInteraction: (newStage || contact.stage) as ContactStage,
          date: new Date(date).toISOString(),
        },
        newStage && newStage !== contact.stage ? (newStage as ContactStage) : undefined
      );

      setSuccess(true);
      setTimeout(() => {
        setIsSubmitting(false);
        onClose();
      }, 600);
    } catch (err: unknown) {
      setIsSubmitting(false);
      const msg = err instanceof Error ? err.message : 'Falha ao registrar interação';
      setError(msg);
    }
  };

  const channelIcons = {
    WhatsApp: MessageSquare,
    Ligação: Phone,
    Presencial: Users,
    Outro: MoreHorizontal,
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Registrar Interação"
      subtitle={`Histórico de cuidado com ${contact.name}`}
      maxWidth="md"
    >
      {success ? (
        <div className="py-8 flex flex-col items-center justify-center text-center space-y-2">
          <CheckCircle2 className="w-10 h-10 text-white" />
          <p className="text-sm font-semibold text-white">Interação registrada com sucesso!</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-950/60 border border-red-800 rounded-lg text-xs text-red-200">
              {error}
            </div>
          )}

          {/* Canal */}
          <div>
            <label className="block text-xs font-medium text-[#CCCCCC] mb-1.5">
              Canal de Contato
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['WhatsApp', 'Ligação', 'Presencial', 'Outro'] as InteractionChannel[]).map(ch => {
                const Icon = channelIcons[ch];
                const isSelected = channel === ch;
                return (
                  <button
                    key={ch}
                    type="button"
                    onClick={() => setChannel(ch)}
                    className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-lg text-xs font-medium border transition-colors ${
                      isSelected
                        ? 'bg-white text-black border-white'
                        : 'bg-[#141414] text-[#999999] hover:text-white border-[#262626]'
                    }`}
                  >
                    <Icon className="w-4 h-4 mb-1" />
                    <span>{ch}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Data */}
          <div>
            <label className="block text-xs font-medium text-[#CCCCCC] mb-1.5">
              Data da Interação
            </label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full px-3 py-2 bg-[#141414] border border-[#262626] rounded-lg text-white text-sm focus:outline-none focus:border-white transition-colors"
            />
          </div>

          {/* Resumo da Conversa */}
          <div>
            <label className="block text-xs font-medium text-[#CCCCCC] mb-1.5">
              Resumo / Notas Pastorais <span className="text-white">*</span>
            </label>
            <textarea
              value={notes}
              onChange={e => {
                setNotes(e.target.value);
                if (error) setError('');
              }}
              rows={4}
              placeholder="Descreva os pontos principais: como a pessoa está, pedidos de oração, impressões do culto..."
              className="w-full px-3 py-2 bg-[#141414] border border-[#262626] rounded-lg text-white text-sm focus:outline-none focus:border-white transition-colors resize-none"
            />
          </div>

          {/* Atualizar Etapa */}
          <div className="p-3 bg-[#111111] border border-[#222222] rounded-lg">
            <label className="block text-xs font-medium text-[#CCCCCC] mb-1">
              Atualizar etapa do acompanhamento:
            </label>
            <select
              value={newStage}
              onChange={e => setNewStage(e.target.value as ContactStage)}
              className="w-full px-3 py-1.5 bg-[#161616] border border-[#2B2B2B] rounded-lg text-white text-xs focus:outline-none focus:border-white"
            >
              <option value="Aguardando primeiro contato">Aguardando primeiro contato</option>
              <option value="1º contato feito">1º contato feito</option>
              <option value="Em acompanhamento">Em acompanhamento</option>
              <option value="Integrado">Integrado</option>
              <option value="Acompanhamento pausado">Acompanhamento pausado</option>
            </select>
            <p className="text-[10px] text-[#777777] mt-1">
              A etapa indica o momento da jornada de acolhimento e é independente da categoria de membro.
            </p>
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
              {isSubmitting ? 'Salvando...' : 'Salvar Interação'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
};
