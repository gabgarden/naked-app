'use client';

interface NakedLogoProps {
  size?: number;
  className?: string;
  showText?: boolean;
}

export default function NakedLogo({ size = 28, className = '', showText = false }: NakedLogoProps) {
  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <div
        className="relative flex items-center justify-center rounded-xl overflow-hidden shadow-lg transition-transform hover:scale-105"
        style={{
          width: size,
          height: size,
          background: 'linear-gradient(135deg, #0f172a 0%, #050b14 100%)',
          border: '1px solid rgba(204, 255, 0, 0.35)',
          boxShadow: '0 0 16px rgba(204, 255, 0, 0.2)',
        }}
      >
        {/* Ambient neon radial glow */}
        <div
          className="absolute inset-0 pointer-events-none opacity-50"
          style={{
            background: 'radial-gradient(circle at 30% 20%, rgba(204, 255, 0, 0.45) 0%, transparent 70%)',
          }}
        />

        {/* Dynamic Stylized N Vector Icon */}
        <svg
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ width: size * 0.72, height: size * 0.72 }}
        >
          <defs>
            <linearGradient id="voltGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#CCFF00" />
              <stop offset="100%" stopColor="#00F0FF" />
            </linearGradient>
            <linearGradient id="slashGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#CCFF00" />
            </linearGradient>
          </defs>

          {/* Left Vertical Bar */}
          <path
            d="M7 6.5C7 5.67 7.67 5 8.5 5H10.5C11.33 5 12 5.67 12 6.5V25.5C12 26.33 11.33 27 10.5 27H8.5C7.67 27 7 26.33 7 25.5V6.5Z"
            fill="url(#voltGradient)"
          />

          {/* Dynamic Diagonal Slash */}
          <path
            d="M9.8 7.2L22.2 24.8C22.6 25.4 23.4 25.8 24.2 25.8H24.5C25.3 25.8 26 25.1 26 24.3V21.5L13.8 4.2C13.2 3.4 12.2 3 11.2 3H10.2C9.4 3 8.8 3.8 9.1 4.6L9.8 7.2Z"
            fill="url(#slashGradient)"
            opacity="0.95"
          />

          {/* Right Vertical Bar */}
          <path
            d="M20 6.5C20 5.67 20.67 5 21.5 5H23.5C24.33 5 25 5.67 25 6.5V25.5C25 26.33 24.33 27 23.5 27H21.5C20.67 27 20 26.33 20 25.5V6.5Z"
            fill="url(#voltGradient)"
          />

          {/* Subtle Speed Accent Dot */}
          <circle cx="27.5" cy="5.5" r="2" fill="#00F0FF" />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col leading-none">
          <span className="text-lg font-black tracking-wider uppercase text-white font-display">
            NAKED<span className="text-volt">.</span>
          </span>
          <span className="text-[9px] font-semibold tracking-widest uppercase text-muted">
            MATCH HUB
          </span>
        </div>
      )}
    </div>
  );
}
