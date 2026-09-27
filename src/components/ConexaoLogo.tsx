import React from 'react';

interface ConexaoLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  showText?: boolean;
  layout?: 'horizontal' | 'vertical' | 'icon-only';
  className?: string;
}

export const ConexaoLogo: React.FC<ConexaoLogoProps> = ({
  size = 'md',
  showText = false,
  layout = 'icon-only',
  className = '',
}) => {
  const pixelSizes = {
    xs: 18,
    sm: 24,
    md: 36,
    lg: 48,
    xl: 72,
    '2xl': 120,
  };

  const px = pixelSizes[size] || 36;

  // Authentic representation of the uploaded circular paint-splatter Conexão Jovem 'C' with inner church icon
  const emblem = (
    <svg
      width={px}
      height={px}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0 transition-transform duration-200 select-none"
    >
      <defs>
        {/* Multicolored gradient representing the Conexão colors: Verde, Vermelho, Laranja, Azul, Amarelo, Turquesa */}
        <radialGradient id="splatterGrad1" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#EF4444" />
          <stop offset="25%" stopColor="#F97316" />
          <stop offset="50%" stopColor="#EAB308" />
          <stop offset="75%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#06B6D4" />
        </radialGradient>
        <radialGradient id="splatterGrad2" cx="70%" cy="75%" r="65%">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="35%" stopColor="#8B5CF6" />
          <stop offset="70%" stopColor="#EC4899" />
          <stop offset="100%" stopColor="#EF4444" />
        </radialGradient>
        <linearGradient id="cArcGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F43F5E" />
          <stop offset="20%" stopColor="#FB923C" />
          <stop offset="40%" stopColor="#FBBF24" />
          <stop offset="60%" stopColor="#34D399" />
          <stop offset="80%" stopColor="#38BDF8" />
          <stop offset="100%" stopColor="#818CF8" />
        </linearGradient>
        <filter id="glowEffect" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <clipPath id="circleClip">
          <circle cx="100" cy="100" r="95" />
        </clipPath>
      </defs>

      {/* Dark backdrop ring for contrast */}
      <circle cx="100" cy="100" r="95" fill="#000000" />

      {/* Main vibrant multi-colored 'C' crescent with artistic splatter edges */}
      <g clipPath="url(#circleClip)">
        {/* Artistic paint splashes around the 'C' */}
        <circle cx="130" cy="40" r="8" fill="#F43F5E" opacity="0.85" />
        <circle cx="145" cy="55" r="5" fill="#FB923C" opacity="0.9" />
        <circle cx="150" cy="140" r="9" fill="#06B6D4" opacity="0.85" />
        <circle cx="138" cy="160" r="7" fill="#3B82F6" opacity="0.9" />
        <circle cx="55" cy="45" r="6" fill="#10B981" opacity="0.8" />
        <circle cx="40" cy="120" r="8" fill="#8B5CF6" opacity="0.75" />
        <circle cx="48" cy="155" r="6" fill="#F59E0B" opacity="0.85" />

        {/* Splatter particles */}
        <circle cx="70" cy="24" r="3" fill="#EAB308" />
        <circle cx="115" cy="20" r="3.5" fill="#EF4444" />
        <circle cx="160" cy="85" r="4" fill="#38BDF8" />
        <circle cx="158" cy="115" r="3" fill="#10B981" />
        <circle cx="95" cy="178" r="4.5" fill="#F97316" />
        <circle cx="120" cy="175" r="3" fill="#8B5CF6" />

        {/* Prominent stylized 'C' body */}
        <path
          d="M 135 48 C 85 20, 25 55, 25 102 C 25 152, 85 182, 138 152 C 122 135, 115 130, 105 138 C 70 160, 48 135, 48 102 C 48 68, 72 45, 110 58 C 120 62, 128 55, 135 48 Z"
          fill="url(#cArcGrad)"
        />

        {/* Inner paint splash overlay textures */}
        <path
          d="M 132 46 C 105 32, 60 45, 40 85 C 48 95, 60 70, 95 62 C 115 58, 125 52, 132 46 Z"
          fill="url(#splatterGrad1)"
          opacity="0.9"
        />
        <path
          d="M 135 154 C 108 170, 62 160, 42 120 C 48 110, 62 135, 98 142 C 118 146, 128 150, 135 154 Z"
          fill="url(#splatterGrad2)"
          opacity="0.9"
        />

        {/* Additional fine paint textures */}
        <path
          d="M 28 85 C 22 98, 24 112, 32 125 C 38 115, 36 95, 28 85 Z"
          fill="#10B981"
        />
        <path
          d="M 75 168 C 88 175, 105 174, 120 166 C 108 160, 92 163, 75 168 Z"
          fill="#3B82F6"
        />
        <path
          d="M 75 32 C 90 26, 108 28, 122 35 C 110 40, 92 38, 75 32 Z"
          fill="#EF4444"
        />
      </g>

      {/* Central circular core: Black inner backdrop */}
      <circle cx="106" cy="100" r="42" fill="#000000" stroke="#111111" strokeWidth="2" />

      {/* Circular white dynamic brush-stroke swirl ring inside the 'C' */}
      <path
        d="M 132 82 C 138 92, 136 108, 128 120 C 118 134, 98 138, 84 132 C 72 126, 68 112, 72 98 C 76 84, 90 72, 105 72 C 118 72, 126 76, 132 82"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="9"
        strokeLinecap="round"
        strokeDasharray="180"
        strokeDashoffset="10"
      />
      {/* Dynamic brush accent */}
      <path
        d="M 125 76 C 115 70, 98 70, 86 78 C 75 86, 72 98, 76 110"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="4"
        strokeLinecap="round"
        opacity="0.75"
      />

      {/* Inner White Casa de Deus House Icon in the exact center */}
      <g transform="translate(106, 100)">
        {/* House roof */}
        <path
          d="M -13 0 L 0 -13 L 13 0 L 9 0 L 0 -9 L -9 0 Z"
          fill="#FFFFFF"
        />
        {/* House body */}
        <path
          d="M -9 2 L -9 13 L 9 13 L 9 2 L 6 2 L 6 10 L -6 10 L -6 2 Z"
          fill="#FFFFFF"
        />
        {/* Inner geometric door / cross structure */}
        <path
          d="M -2 5 L 2 5 L 2 10 L -2 10 Z"
          fill="#FFFFFF"
        />
      </g>
    </svg>
  );

  if (layout === 'icon-only' || !showText) {
    return <div className={`inline-flex items-center justify-center ${className}`}>{emblem}</div>;
  }

  if (layout === 'horizontal') {
    return (
      <div className={`inline-flex items-center gap-2.5 ${className}`}>
        {emblem}
        <div className="flex flex-col leading-none">
          <span className="font-black tracking-tight text-white uppercase font-sans text-sm sm:text-base">
            CONEXÃO JOVEM
          </span>
          <span className="text-[10px] text-zinc-400 font-semibold tracking-wider uppercase mt-0.5">
            Casa de Deus
          </span>
        </div>
      </div>
    );
  }

  // Vertical layout
  return (
    <div className={`flex flex-col items-center text-center gap-2 ${className}`}>
      {emblem}
      <span className="font-black tracking-wide text-white uppercase text-xs sm:text-sm font-sans drop-shadow-sm">
        CONEXÃO JOVEM
      </span>
    </div>
  );
};
