import React from 'react';
import { Modal } from './Modal';
import { Shield, Key, Database, CheckCircle2, AlertCircle } from 'lucide-react';

interface SetupInstructionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SetupInstructionsModal: React.FC<SetupInstructionsModalProps> = ({
  isOpen,
  onClose,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Guia de Configuração & Implantação Firebase"
      subtitle="Instruções para conectar o CRM à infraestrutura real de produção"
      maxWidth="2xl"
    >
      <div className="space-y-6 text-xs text-[#CCCCCC]">
        {/* Intro */}
        <div className="p-3.5 bg-[#121212] border border-[#222222] rounded-xl space-y-2">
          <div className="flex items-center gap-2 text-white font-semibold">
            <Shield className="w-4 h-4 text-white" />
            <span>Duas Modalidades Prontas no CRM</span>
          </div>
          <p className="leading-relaxed text-[#AAAAAA]">
            O sistema já opera com <strong>Modo Demonstração isolado</strong> (com ~30 contatos distribuídos em Recreio, Curicica e Guaratiba, 6 meses de histórico e tarefas completas) e suporte nativo ao <strong>Firebase (Auth + Cloud Firestore)</strong>.
          </p>
        </div>

        {/* Passo 1: Firebase Auth */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-white font-semibold text-sm">
            <Key className="w-4 h-4 text-white" />
            <span>1. Habilitação do Firebase Authentication</span>
          </div>
          <ol className="list-decimal pl-5 space-y-1.5 text-[#AAAAAA] leading-relaxed">
            <li>Acesse o <strong>Firebase Console</strong> (console.firebase.google.com) no seu projeto.</li>
            <li>No menu lateral, clique em <strong>Authentication &gt; Sign-in method</strong>.</li>
            <li>Habilite o provedor <strong>E-mail/senha</strong> (Email/Password).</li>
          </ol>
        </div>

        {/* Passo 2: Criação Segura do Primeiro Administrador */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-white font-semibold text-sm">
            <Database className="w-4 h-4 text-white" />
            <span>2. Criação Segura do Primeiro Administrador</span>
          </div>
          <div className="p-3 bg-[#141414] border border-[#262626] rounded-xl space-y-2 text-[#AAAAAA] leading-relaxed">
            <p>
              Por segurança, o sistema <strong>não possui auto-cadastro público</strong> para impedir acessos não autorizados aos dados da igreja.
            </p>
            <p>
              Para criar o primeiro administrador:
            </p>
            <ol className="list-decimal pl-5 space-y-1">
              <li>Crie o usuário administrador na aba <strong>Users</strong> do Firebase Auth (ex: <code className="text-white bg-[#1F1F1F] px-1 py-0.5 rounded">onlineplrvendas@gmail.com</code>).</li>
              <li>No <strong>Cloud Firestore</strong>, acesse a coleção <code className="text-white bg-[#1F1F1F] px-1 py-0.5 rounded">users</code> e adicione o documento com o ID correspondente ao <code className="text-white bg-[#1F1F1F] px-1 py-0.5 rounded">uid</code> gerado no Auth.</li>
              <li>Defina os campos: <code className="text-white bg-[#1F1F1F] px-1 py-0.5 rounded">role: &quot;admin&quot;</code>, <code className="text-white bg-[#1F1F1F] px-1 py-0.5 rounded">active: true</code>, <code className="text-white bg-[#1F1F1F] px-1 py-0.5 rounded">assignedCongregations: &quot;Recreio,Curicica,Guaratiba&quot;</code>.</li>
            </ol>
          </div>
        </div>

        {/* Passo 3: Regras do Firestore */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-white font-semibold text-sm">
            <CheckCircle2 className="w-4 h-4 text-white" />
            <span>3. Regras de Segurança Hardened (firestore.rules)</span>
          </div>
          <p className="text-[#AAAAAA] leading-relaxed">
            O arquivo <code className="text-white bg-[#141414] px-1 py-0.5 rounded">firestore.rules</code> do projeto já foi gerado e implementa <strong>ABAC (Attribute-Based Access Control)</strong>:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-[#888888]">
            <li>Bloqueio default de todas as leituras e gravações não autorizadas.</li>
            <li>Restrição de acesso da equipe estritamente às congregações designadas.</li>
            <li>Proteção contra escalação de privilégios (usuários comuns não podem alterar o próprio papel nem a congregação de contatos).</li>
            <li>Exclusão definitiva restrita exclusivamente ao Administrador Geral.</li>
          </ul>
        </div>

        {/* Botão de Fechar */}
        <div className="flex justify-end pt-3 border-t border-[#1C1C1C]">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white text-black font-semibold text-xs rounded-lg hover:bg-neutral-200 transition-colors"
          >
            Entendido
          </button>
        </div>
      </div>
    </Modal>
  );
};
