'use client';

import { Star } from 'lucide-react';

interface StarRatingProps {
  stars?: number;
  max?: number;
  size?: number;
  className?: string;
  showText?: boolean;
  interactive?: boolean;
  onChange?: (val: number) => void;
}

export function StarRating({
  stars = 2,
  max = 3,
  size = 14,
  className = '',
  showText = false,
  interactive = false,
  onChange,
}: StarRatingProps) {
  const currentRating = Math.max(1, Math.min(max, Number(stars) || 1));

  return (
    <div className={`inline-flex items-center gap-1 ${className}`}>
      {Array.from({ length: max }).map((_, idx) => {
        const starVal = idx + 1;
        const isFilled = starVal <= currentRating;

        return (
          <button
            key={starVal}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && onChange?.(starVal)}
            className={`transition-all ${
              interactive
                ? 'cursor-pointer hover:scale-125 active:scale-95 p-0.5'
                : 'cursor-default pointer-events-none'
            }`}
            title={`Nível ${starVal}`}
          >
            <Star
              style={{ width: size, height: size }}
              className={`transition-all ${
                isFilled
                  ? 'fill-[#A855F7] text-[#C084FC] drop-shadow-[0_0_6px_rgba(168,85,247,0.7)]'
                  : 'fill-transparent text-[#6B21A8]/40'
              }`}
            />
          </button>
        );
      })}

      {showText && (
        <span className="text-[11px] font-bold text-[#C084FC] ml-1">
          {currentRating === 1 ? 'Nível 1' : currentRating === 2 ? 'Nível 2' : 'Nível 3'}
        </span>
      )}
    </div>
  );
}
