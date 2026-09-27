import { ConexaoColor, ConexaoRole } from '../types';

export interface ConexaoColorConfig {
  id: ConexaoColor;
  name: string;
  displayName: string;
  hex: string;
  gradientBg: string;
  borderClass: string;
  textClass: string;
  badgeBg: string;
  dotBg: string;
  glowClass: string;
  motto?: string;
  accentBar: string;
}

export const CONEXAO_COLORS: ConexaoColor[] = [
  'azul',
  'vermelho',
  'amarelo',
  'laranja',
  'turquesa',
  'rosa',
  'roxo',
  'bege',
];

export const CONEXAO_COLOR_CONFIGS: Record<ConexaoColor, ConexaoColorConfig> = {
  azul: {
    id: 'azul',
    name: 'Azul',
    displayName: 'Equipe Azul',
    hex: '#3B82F6',
    gradientBg: 'from-blue-950/40 via-[#0b1b36]/60 to-[#061021]/90',
    borderClass: 'border-blue-500/40 hover:border-blue-400/70',
    textClass: 'text-blue-400',
    badgeBg: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
    dotBg: 'bg-blue-500',
    glowClass: 'shadow-[0_0_30px_rgba(59,130,246,0.22)]',
    accentBar: 'bg-blue-500',
  },
  vermelho: {
    id: 'vermelho',
    name: 'Vermelho',
    displayName: 'Equipe Vermelha',
    hex: '#EF4444',
    gradientBg: 'from-rose-950/40 via-[#2e0909]/60 to-[#1a0505]/90',
    borderClass: 'border-rose-500/40 hover:border-rose-400/70',
    textClass: 'text-rose-400',
    badgeBg: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    dotBg: 'bg-rose-500',
    glowClass: 'shadow-[0_0_30px_rgba(239,68,68,0.22)]',
    accentBar: 'bg-rose-500',
  },
  amarelo: {
    id: 'amarelo',
    name: 'Amarelo',
    displayName: 'Equipe Amarela',
    hex: '#EAB308',
    gradientBg: 'from-amber-950/40 via-[#2d1f05]/60 to-[#1a1203]/90',
    borderClass: 'border-amber-500/40 hover:border-amber-400/70',
    textClass: 'text-amber-400',
    badgeBg: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    dotBg: 'bg-amber-400',
    glowClass: 'shadow-[0_0_30px_rgba(234,179,8,0.22)]',
    accentBar: 'bg-amber-400',
  },
  laranja: {
    id: 'laranja',
    name: 'Laranja',
    displayName: 'Equipe Laranja',
    hex: '#F97316',
    gradientBg: 'from-orange-950/40 via-[#2e1307]/60 to-[#1a0b04]/90',
    borderClass: 'border-orange-500/40 hover:border-orange-400/70',
    textClass: 'text-orange-400',
    badgeBg: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
    dotBg: 'bg-orange-500',
    glowClass: 'shadow-[0_0_30px_rgba(249,115,22,0.22)]',
    accentBar: 'bg-orange-500',
  },
  turquesa: {
    id: 'turquesa',
    name: 'Turquesa',
    displayName: 'Equipe Turquesa',
    hex: '#06B6D4',
    gradientBg: 'from-cyan-950/40 via-[#07252f]/60 to-[#03151b]/90',
    borderClass: 'border-cyan-500/40 hover:border-cyan-400/70',
    textClass: 'text-cyan-400',
    badgeBg: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
    dotBg: 'bg-cyan-400',
    glowClass: 'shadow-[0_0_30px_rgba(6,182,212,0.22)]',
    accentBar: 'bg-cyan-400',
  },
  rosa: {
    id: 'rosa',
    name: 'Rosa',
    displayName: 'Equipe Rosa',
    hex: '#EC4899',
    gradientBg: 'from-pink-950/40 via-[#2e091b]/60 to-[#1a0510]/90',
    borderClass: 'border-pink-500/40 hover:border-pink-400/70',
    textClass: 'text-pink-400',
    badgeBg: 'bg-pink-500/15 text-pink-300 border-pink-500/30',
    dotBg: 'bg-pink-500',
    glowClass: 'shadow-[0_0_30px_rgba(236,72,153,0.22)]',
    accentBar: 'bg-pink-500',
  },
  roxo: {
    id: 'roxo',
    name: 'Roxo',
    displayName: 'Equipe Roxa',
    hex: '#A855F7',
    gradientBg: 'from-purple-950/40 via-[#1f092e]/60 to-[#12051a]/90',
    borderClass: 'border-purple-500/40 hover:border-purple-400/70',
    textClass: 'text-purple-400',
    badgeBg: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
    dotBg: 'bg-purple-500',
    glowClass: 'shadow-[0_0_30px_rgba(168,85,247,0.22)]',
    accentBar: 'bg-purple-500',
  },
  bege: {
    id: 'bege',
    name: 'Bege',
    displayName: 'Equipe Bege',
    hex: '#D4A373',
    gradientBg: 'from-amber-950/30 via-[#261f17]/60 to-[#140f0a]/90',
    borderClass: 'border-[#D4A373]/40 hover:border-[#D4A373]/70',
    textClass: 'text-[#D4A373]',
    badgeBg: 'bg-amber-100/15 text-amber-200 border-amber-200/30',
    dotBg: 'bg-[#D4A373]',
    glowClass: 'shadow-[0_0_30px_rgba(212,163,115,0.22)]',
    accentBar: 'bg-[#D4A373]',
  },
};

export const CONEXAO_ROLE_META: Record<
  ConexaoRole,
  { label: string; shortLabel: string; badgeClass: string; description: string }
> = {
  lider: {
    label: 'Líder da Cor',
    shortLabel: 'Líder',
    badgeClass: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    description: 'Líder geral responsável por toda a equipe da cor',
  },
  sublider_base: {
    label: 'Sub-líder (Base)',
    shortLabel: 'Base / Sub-líder',
    badgeClass: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    description: 'Responsável pela Base jovem e acolhimento direto de liderados',
  },
  membro: {
    label: 'Membro da Equipe',
    shortLabel: 'Membro',
    badgeClass: 'bg-zinc-800 text-zinc-300 border-zinc-700',
    description: 'Jovem ativo integrado na equipe',
  },
  convidado: {
    label: 'Convidado / Visitante',
    shortLabel: 'Convidado',
    badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    description: 'Novo convidado trazido para os cultos e encontros do Conexão',
  },
};

export function getConexaoColorConfig(color: ConexaoColor): ConexaoColorConfig {
  return CONEXAO_COLOR_CONFIGS[color] || CONEXAO_COLOR_CONFIGS.azul;
}

export function getConexaoRoleMeta(role: ConexaoRole) {
  return CONEXAO_ROLE_META[role] || CONEXAO_ROLE_META.membro;
}
