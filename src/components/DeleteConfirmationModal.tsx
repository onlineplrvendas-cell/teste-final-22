import React from 'react';
import { Modal } from './Modal';
import { Contact } from '../types';
import { AlertTriangle, Trash2, Archive, RefreshCw } from 'lucide-react';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  contact: Contact | null;
  actionType: 'archive' | 'restore' | 'deletePermanent';
  onConfirm: () => Promise<void>;
  isSubmitting: boolean;
}

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  onClose,
  contact,
  actionType,
  onConfirm,
  isSubmitting,
}) => {
  if (!contact) return null;

  const config = {
    archive: {
      title: 'Arquivar Contato',
      subtitle: 'Retirar da rotina ativa sem perder o histórico',
      icon: Archive,
      iconColor: 'text-amber-400',
      description: `Tem certeza que deseja arquivar o cadastro de ${contact.name}? Ele deixará de aparecer na lista principal e nas estatísticas ativas, mas seu histórico permanecerá seguro e poderá ser restaurado a qualquer momento.`,
      confirmText: 'Sim, Arquivar',
      confirmClass: 'bg-neutral-800 text-white hover:bg-neutral-700 border border-neutral-600',
    },
    restore: {
      title: 'Restaurar Contato',
      subtitle: 'Reativar pessoa para a lista operacional',
      icon: RefreshCw,
      iconColor: 'text-emerald-400',
      description: `Deseja reativar o cadastro de ${contact.name}? A pessoa voltará a ser exibida nas consultas normais e suas tarefas em aberto voltarão a constar na rotina de acompanhamento.`,
      confirmText: 'Restaurar Cadastro',
      confirmClass: 'bg-white text-black hover:bg-neutral-200',
    },
    deletePermanent: {
      title: 'Excluir Definitivamente',
      subtitle: 'Ação restrita a Administradores (irreversível)',
      icon: Trash2,
      iconColor: 'text-red-500',
      description: `ATENÇÃO: Você está prestes a excluir permanentemente o cadastro de ${contact.name} e todas as suas interações e tarefas vinculadas. Esta ação não poderá ser desfeita.`,
      confirmText: 'Excluir Definitivamente',
      confirmClass: 'bg-red-600 text-white hover:bg-red-700 font-semibold',
    },
  }[actionType];

  const Icon = config.icon;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={config.title}
      subtitle={config.subtitle}
      maxWidth="md"
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-3.5 bg-[#141414] border border-[#262626] rounded-xl">
          <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${config.iconColor}`} />
          <p className="text-xs text-[#CCCCCC] leading-relaxed">
            {config.description}
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#1C1C1C]">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-xs font-medium text-[#CCCCCC] hover:text-white bg-[#141414] border border-[#262626] rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className={`px-5 py-2 text-xs rounded-lg transition-colors shadow-sm disabled:opacity-50 ${config.confirmClass}`}
          >
            {isSubmitting ? 'Processando...' : config.confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
};
