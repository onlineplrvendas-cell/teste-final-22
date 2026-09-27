import React, { useRef } from 'react';
import { ConexaoColor, ConexaoParticipant } from '../types';
import { getConexaoColorConfig, CONEXAO_ROLE_META } from '../utils/conexaoConfig';
import { formatDateBR } from '../utils/date';
import {
  X,
  Printer,
  Crown,
  Shield,
  Users,
  Sparkles,
  CheckCircle2,
  Clock,
  Award,
} from 'lucide-react';

interface ConexaoColorReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  color: ConexaoColor;
  participants: ConexaoParticipant[];
}

export const ConexaoColorReportModal: React.FC<ConexaoColorReportModalProps> = ({
  isOpen,
  onClose,
  color,
  participants,
}) => {
  const reportRef = useRef<HTMLDivElement>(null);
  const config = getConexaoColorConfig(color);

  if (!isOpen) return null;

  // Filter participants of this color
  const colorParticipants = participants.filter(p => p.color === color);

  // Group by role
  const leader = colorParticipants.find(p => p.role === 'lider');
  const bases = colorParticipants.filter(p => p.role === 'sublider_base');
  const members = colorParticipants.filter(p => p.role === 'membro');
  const guests = colorParticipants.filter(p => p.role === 'convidado');

  const confirmedGuests = guests.filter(g => g.confirmedNextCulto);
  const totalPoints = colorParticipants.reduce((sum, p) => sum + (p.points || 0), 0);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-[#0E0E0E] border border-[#2B2B2B] rounded-2xl shadow-2xl overflow-hidden my-6 flex flex-col max-h-[90vh]">
        {/* Modal Top Bar */}
        <div className="p-4 bg-[#141414] border-b border-[#262626] flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: config.hex }}
            />
            <h3 className="text-sm font-bold text-white">
              Relatório Oficial • {config.displayName}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-white text-black hover:bg-zinc-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              Imprimir / Salvar PDF
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-[#202020] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div
          ref={reportRef}
          className="p-6 md:p-8 overflow-y-auto bg-[#0A0A0A] text-white space-y-6 print:bg-white print:text-black print:p-4"
        >
          {/* Official Letterhead */}
          <div className="border-b border-[#262626] pb-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] uppercase tracking-widest font-extrabold text-zinc-400">
                  CASA DE DEUS • MINISTÉRIO DE JOVENS
                </span>
              </div>
              <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
                <span
                  className="w-4 h-4 rounded-full inline-block"
                  style={{ backgroundColor: config.hex }}
                />
                RELATÓRIO OFICIAL: {config.displayName.toUpperCase()}
              </h1>
              <p className="text-xs text-zinc-400 mt-1">
                Data de Emissão: {formatDateBR(new Date().toISOString())}
              </p>
            </div>

            <div className="p-3 bg-[#141414] border border-[#2B2B2B] rounded-xl text-right">
              <span className="text-[10px] text-zinc-500 uppercase tracking-widest block font-bold">
                LÍDER DA COR
              </span>
              <p className="text-sm font-bold text-white flex items-center gap-1 justify-end">
                <Crown className="w-3.5 h-3.5 text-purple-400" />
                {leader ? leader.name : 'A Definir'}
              </p>
              {leader && (
                <span className="text-xs text-zinc-400">{leader.phone}</span>
              )}
            </div>
          </div>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 bg-[#121212] border border-[#222222] rounded-xl">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] uppercase font-bold text-zinc-400">Sub-líderes (Bases)</span>
                <Shield className="w-4 h-4 text-indigo-400" />
              </div>
              <p className="text-2xl font-black text-white">{bases.length}</p>
              <p className="text-[10px] text-zinc-500">Células / Bases ativas</p>
            </div>

            <div className="p-3.5 bg-[#121212] border border-[#222222] rounded-xl">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] uppercase font-bold text-zinc-400">Membros Ativos</span>
                <Users className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-2xl font-black text-white">{members.length}</p>
              <p className="text-[10px] text-zinc-500">Jovens integrados</p>
            </div>

            <div className="p-3.5 bg-[#121212] border border-[#222222] rounded-xl">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] uppercase font-bold text-zinc-400">Convidados</span>
                <Sparkles className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-2xl font-black text-amber-300">{guests.length}</p>
              <p className="text-[10px] text-zinc-500">
                {confirmedGuests.length} confirmados no próximo culto
              </p>
            </div>

            <div className="p-3.5 bg-[#121212] border border-[#222222] rounded-xl">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] uppercase font-bold text-zinc-400">Total Integrados</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-2xl font-black text-emerald-300">{members.length + bases.length}</p>
              <p className="text-[10px] text-zinc-500">Jovens fixos na equipe</p>
            </div>
          </div>

          {/* Section 1: Bases (Sub-líderes) */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5 border-b border-[#222222] pb-2">
              <Shield className="w-4 h-4" />
              1. Bases da Equipe (Sub-líderes) — {bases.length} Cadastradas
            </h3>

            {bases.length === 0 ? (
              <p className="text-xs text-zinc-500 italic p-3 bg-[#111111] rounded-lg">
                Nenhum sub-líder de base cadastrado ainda para esta cor.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {bases.map(b => {
                  const baseMembers = members.filter(
                    m => m.baseLeaderId === b.id || (m.baseName && m.baseName === b.baseName)
                  );
                  const baseGuests = guests.filter(
                    g => g.baseLeaderId === b.id || (g.baseName && g.baseName === b.baseName)
                  );
                  return (
                    <div
                      key={b.id}
                      className="p-3.5 bg-[#111111] border border-[#222222] rounded-xl flex flex-col justify-between"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">
                            {b.baseName || 'Base sem nome'}
                          </span>
                          <h4 className="text-sm font-bold text-white mt-1">{b.name}</h4>
                          <p className="text-xs text-zinc-400">{b.phone} • {b.congregation}</p>
                        </div>
                        <span className="text-xs font-semibold text-indigo-300 bg-indigo-500/10 px-2 py-1 rounded border border-indigo-500/20">
                          Sub-líder
                        </span>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-[#1C1C1C] flex items-center justify-between text-[11px] text-zinc-400">
                        <span>Liderados: <strong className="text-white">{baseMembers.length} membros</strong></span>
                        <span>Convidados: <strong className="text-amber-300">{baseGuests.length}</strong></span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 2: Convidados (Foco Principal do Conexão Jovem) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-[#222222] pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                2. Convidados & Visitantes (Foco do Conexão Jovem) — {guests.length} Registrados
              </h3>
              <span className="text-xs text-amber-300 font-semibold">
                {confirmedGuests.length} de {guests.length} confirmados no próximo culto
              </span>
            </div>

            {guests.length === 0 ? (
              <p className="text-xs text-zinc-500 italic p-3 bg-[#111111] rounded-lg">
                Nenhum jovem convidado registrado até o momento para esta cor.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-[#222222]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#141414] text-zinc-400 font-semibold border-b border-[#222222]">
                    <tr>
                      <th className="p-3">Convidado</th>
                      <th className="p-3">WhatsApp</th>
                      <th className="p-3">Quem Convidou</th>
                      <th className="p-3">Base</th>
                      <th className="p-3">Data Visita</th>
                      <th className="p-3 text-center">Presença Culto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1C1C1C]">
                    {guests.map(g => (
                      <tr key={g.id} className="hover:bg-[#141414]/50">
                        <td className="p-3 font-semibold text-white">
                          {g.name}
                          {g.notes && (
                            <span className="block text-[10px] text-zinc-400 font-normal truncate max-w-xs">
                              {g.notes}
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-zinc-300">{g.phone}</td>
                        <td className="p-3 text-zinc-300">
                          {g.invitedByName ? (
                            <span className="text-white font-medium">{g.invitedByName}</span>
                          ) : (
                            <span className="text-zinc-600">Não informado</span>
                          )}
                        </td>
                        <td className="p-3 text-zinc-400">{g.baseName || 'Geral'}</td>
                        <td className="p-3 text-zinc-400">
                          {g.firstVisitDate ? formatDateBR(g.firstVisitDate) : '-'}
                        </td>
                        <td className="p-3 text-center">
                          {g.confirmedNextCulto ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                              <CheckCircle2 className="w-3 h-3" />
                              Confirmado
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded">
                              <Clock className="w-3 h-3" />
                              Pendente
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Section 3: Membros da Equipe */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5 border-b border-[#222222] pb-2">
              <Users className="w-4 h-4" />
              3. Membros Integrados da Equipe — {members.length} Cadastrados
            </h3>

            {members.length === 0 ? (
              <p className="text-xs text-zinc-500 italic p-3 bg-[#111111] rounded-lg">
                Nenhum membro ativo cadastrado nesta equipe.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {members.map(m => (
                  <div
                    key={m.id}
                    className="p-2.5 bg-[#111111] border border-[#222222] rounded-lg flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-semibold text-white">{m.name}</p>
                      <p className="text-[11px] text-zinc-400">{m.phone} • {m.baseName || 'Sem base'}</p>
                    </div>
                    <span className="text-[10px] text-zinc-400 font-medium bg-zinc-800 px-1.5 py-0.5 rounded">
                      {m.points || 0} pts
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pastoral Sign-off Footer */}
          <div className="pt-6 border-t border-[#222222] flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-500 gap-4">
            <div>
              <span>Casa de Deus • Conexão Jovem</span>
              <p className="text-[11px] text-zinc-600">
                Relatório gerado exclusivamente para a liderança da {config.displayName}.
              </p>
            </div>
            <div className="flex items-center gap-8 text-center">
              <div className="border-t border-zinc-700 pt-1 w-36">
                <span className="text-[10px] text-zinc-400 block font-semibold">Assinatura do Líder</span>
              </div>
              <div className="border-t border-zinc-700 pt-1 w-36">
                <span className="text-[10px] text-zinc-400 block font-semibold">Visto Pastoral</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
