import React from 'react';
import { Crown, Sparkles, GraduationCap } from 'lucide-react';
import { UniReinoEnrollment, UniReinoSemester } from '../types';

interface UniReinoBadgeProps {
  enrollment?: UniReinoEnrollment;
  semester?: UniReinoSemester;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showSemester?: boolean;
  showIcon?: boolean;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
}

export const UniReinoBadge: React.FC<UniReinoBadgeProps> = ({
  enrollment,
  semester: semesterProp,
  size = 'sm',
  showSemester = false,
  showIcon = true,
  className = '',
  onClick,
}) => {
  const semester = enrollment?.semester ?? semesterProp ?? 1;
  const isConcluido = enrollment?.status === 'concluido';
  const isTrancado = enrollment?.status === 'trancado';

  const tooltipText = isConcluido
    ? 'Uni Reino • Graduado / Formado'
    : isTrancado
    ? `Uni Reino • ${semester}º Semestre (Trancado)`
    : `Uni Reino • Matriculado no ${semester}º Semestre`;

  // Golden styling classes
  const goldStyles =
    'bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-black font-extrabold shadow-[0_0_8px_rgba(245,158,11,0.4)] border border-amber-200/90 tracking-wider';

  if (size === 'xs') {
    return (
      <span
        title={tooltipText}
        onClick={onClick}
        className={`inline-flex items-center gap-0.5 px-1 py-0.2 rounded text-[9px] font-black uppercase select-none transition-transform hover:scale-105 ${goldStyles} ${className} ${
          onClick ? 'cursor-pointer' : ''
        }`}
      >
        {showIcon && <Crown className="w-2.5 h-2.5 fill-black stroke-black shrink-0" />}
        <span>UN</span>
      </span>
    );
  }

  if (size === 'sm') {
    return (
      <span
        title={tooltipText}
        onClick={onClick}
        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-black uppercase select-none transition-transform hover:scale-105 ${goldStyles} ${className} ${
          onClick ? 'cursor-pointer' : ''
        }`}
      >
        {showIcon && <Crown className="w-3 h-3 fill-black stroke-black shrink-0" />}
        <span>UN</span>
        {showSemester && (
          <span className="text-[9px] font-bold opacity-90 pl-0.5 border-l border-black/30">
            {isConcluido ? 'Formado' : `${semester}º Sem`}
          </span>
        )}
      </span>
    );
  }

  if (size === 'md') {
    return (
      <div
        title={tooltipText}
        onClick={onClick}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black uppercase select-none shadow-md ${goldStyles} ${className} ${
          onClick ? 'cursor-pointer hover:brightness-110' : ''
        }`}
      >
        {showIcon && <Crown className="w-3.5 h-3.5 fill-black stroke-black shrink-0" />}
        <span>UN</span>
        <span className="text-[11px] font-bold opacity-90 pl-1 border-l border-black/30 normal-case">
          {isConcluido ? 'Graduado' : `${semester}º Semestre`}
        </span>
      </div>
    );
  }

  // Large banner style
  return (
    <div
      title={tooltipText}
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-black uppercase select-none shadow-lg ${goldStyles} ${className} ${
        onClick ? 'cursor-pointer hover:brightness-110' : ''
      }`}
    >
      <Crown className="w-4 h-4 fill-black stroke-black shrink-0" />
      <span className="tracking-widest">UNI REINO</span>
      <span className="text-xs font-bold opacity-95 pl-1.5 border-l border-black/30 normal-case">
        {isConcluido ? 'Formado / Graduado' : `${semester}º Semestre`}
      </span>
    </div>
  );
};
