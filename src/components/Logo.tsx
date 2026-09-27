import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
  imageSrc?: string;
}

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  showText = true,
  className = '',
  imageSrc,
}) => {
  const sizeMap = {
    sm: { symbol: 'w-7 h-7', text: 'text-sm' },
    md: { symbol: 'w-9 h-9', text: 'text-base' },
    lg: { symbol: 'w-14 h-14', text: 'text-xl' },
    xl: { symbol: 'w-20 h-20', text: 'text-2xl' },
  };

  const currentSize = sizeMap[size];

  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      {/* Official Symbol Container */}
      <div className={`relative flex items-center justify-center shrink-0 ${currentSize.symbol}`}>
        {imageSrc ? (
          <img
            src={imageSrc}
            alt="Casa de Deus Logo"
            className="w-full h-full object-contain"
          />
        ) : (
          /* Official Casa de Deus Vector Mark matching 326715209_3238138439771191_7438841350391625519_n.jpg */
          <svg
            viewBox="0 0 1000 1000"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full text-white drop-shadow-sm"
          >
            {/* Clean Gable Roof (45-degree slope, perpendicular end cuts) */}
            <polygon
              points="500,115 815,430 762,483 500,221 238,483 185,430"
              fill="currentColor"
            />

            {/* Upper-Left Interlocking Bracket */}
            <path
              d="M334 370 H546 V442 H406 V724 H546 V796 H334 Z"
              fill="currentColor"
            />

            {/* Lower-Right Interlocking Bracket */}
            <path
              d="M472 480 H684 V906 H472 V834 H612 V552 H472 Z"
              fill="currentColor"
            />

            {/* Central Wheat Ear Motif (Trigo) */}
            <g fill="currentColor">
              {/* Vertical center stem */}
              <line
                x1="509"
                y1="570"
                x2="509"
                y2="706"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
              />
              {/* Top central grain */}
              <path
                d="M509 568 C503 578 509 598 509 598 C509 598 515 578 509 568 Z"
                fill="currentColor"
              />
              {/* Pair 1 */}
              <ellipse
                cx="493"
                cy="608"
                rx="6.5"
                ry="14"
                transform="rotate(-38 493 608)"
                fill="currentColor"
              />
              <ellipse
                cx="525"
                cy="608"
                rx="6.5"
                ry="14"
                transform="rotate(38 525 608)"
                fill="currentColor"
              />
              {/* Pair 2 */}
              <ellipse
                cx="491"
                cy="638"
                rx="7"
                ry="15"
                transform="rotate(-40 491 638)"
                fill="currentColor"
              />
              <ellipse
                cx="527"
                cy="638"
                rx="7"
                ry="15"
                transform="rotate(40 527 638)"
                fill="currentColor"
              />
              {/* Pair 3 */}
              <ellipse
                cx="490"
                cy="668"
                rx="7"
                ry="15"
                transform="rotate(-42 490 668)"
                fill="currentColor"
              />
              <ellipse
                cx="528"
                cy="668"
                rx="7"
                ry="15"
                transform="rotate(42 528 668)"
                fill="currentColor"
              />
            </g>
          </svg>
        )}
      </div>

      {showText && (
        <span
          className={`font-semibold tracking-[0.24em] text-white font-heading uppercase leading-none ${currentSize.text}`}
        >
          CASA DE DEUS
        </span>
      )}
    </div>
  );
};
