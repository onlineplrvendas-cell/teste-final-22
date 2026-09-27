import React from 'react';
import { ConexaoColor, ConexaoRole } from '../types';
import { getConexaoColorConfig, getConexaoRoleMeta } from '../utils/conexaoConfig';
import { Crown, Shield, Users, Sparkles } from 'lucide-react';

interface ConexaoColorBadgeProps {
  color: ConexaoColor;
  role?: ConexaoRole;
  baseName?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showRole?: boolean;
  className?: string;
}

export const ConexaoColorBadge: React.FC<ConexaoColorBadgeProps> = ({
  color,
  role,
  baseName,
  size = 'sm',
  showRole = false,
  className = '',
}) => {
  const config = getConexaoColorConfig(color);
  const roleMeta = role ? getConexaoRoleMeta(role) : null;

  const sizeStyles = {
    xs: 'text-[10px] px-1.5 py-0.5 gap-1',
    sm: 'text-xs px-2 py-0.5 gap-1.5',
    md: 'text-sm px-2.5 py-1 gap-2',
    lg: 'text-base px-3.5 py-1.5 gap-2.5',
  };

  const dotSizes = {
    xs: 'w-1.5 h-1.5',
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
  };

  return (
    <div className={`inline-flex items-center gap-1.5 flex-wrap ${className}`}>
      {/* Team Color Pill */}
      <span
        className={`inline-flex items-center font-semibold rounded-md border tracking-wide transition-all ${config.badgeBg} ${sizeStyles[size]}`}
      >
        <span
          className={`rounded-full shadow-sm animate-pulse ${config.dotBg} ${dotSizes[size]}`}
          style={{ boxShadow: `0 0 8px ${config.hex}` }}
        />
        <span>{config.displayName}</span>
      </span>

      {/* Optional Base Name */}
      {baseName && (
        <span
          className={`inline-flex items-center text-zinc-300 bg-zinc-900 border border-zinc-700/60 rounded-md font-medium ${sizeStyles[size]}`}
        >
          <span className="text-zinc-500 font-normal">Base:</span> {baseName}
        </span>
      )}

      {/* Optional Role Pill */}
      {showRole && roleMeta && role && (
        <span
          className={`inline-flex items-center font-medium rounded-md border ${roleMeta.badgeClass} ${sizeStyles[size]}`}
        >
          {role === 'lider' && <Crown className="w-3 h-3 text-purple-300" />}
          {role === 'sublider_base' && <Shield className="w-3 h-3 text-indigo-300" />}
          {role === 'membro' && <Users className="w-3 h-3 text-zinc-400" />}
          {role === 'convidado' && <Sparkles className="w-3 h-3 text-amber-300" />}
          <span>{roleMeta.label}</span>
        </span>
      )}
    </div>
  );
};
