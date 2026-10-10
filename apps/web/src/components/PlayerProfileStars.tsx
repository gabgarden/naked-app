'use client';

import { useState } from 'react';
import { Sparkles, Check } from 'lucide-react';
import { playersService } from '../services/players.service';
import { StarRating } from './StarRating';

interface PlayerProfileStarsProps {
  playerId: string;
  initialStars: number;
}

export function PlayerProfileStars({ playerId, initialStars }: PlayerProfileStarsProps) {
  const [stars, setStars] = useState(initialStars);
  const [updating, setUpdating] = useState(false);
  const [feedback, setFeedback] = useState(false);

  async function handleSetStars(newStars: number) {
    if (stars === newStars || updating) return;
    const previousStars = stars;
    setUpdating(true);
    setStars(newStars);
    try {
      await playersService.update(playerId, { stars: newStars });
      setFeedback(true);
      setTimeout(() => setFeedback(false), 2000);
    } catch (err) {
      console.error('Erro ao atualizar estrelas do jogador:', err);
      setStars(previousStars);
      alert('Erro ao atualizar estrelas do jogador no servidor.');
    } finally {
      setUpdating(false);
    }
  }

  return (
    <div
      className="mt-3 py-2 px-3.5 rounded-xl border flex flex-col sm:flex-row items-center justify-between gap-2.5 transition-all max-w-sm mx-auto w-full"
      style={{
        background: 'rgba(103, 61, 230, 0.08)',
        borderColor: 'rgba(139, 92, 246, 0.3)',
      }}
    >
      <div className="flex items-center gap-1.5 text-xs font-bold text-white">
        <Sparkles className="w-3.5 h-3.5 text-purple-400" />
        <span>Nível Técnico:</span>
        {feedback && (
          <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-0.5 animate-fade-in">
            <Check className="w-3 h-3" /> Salvo!
          </span>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        {[1, 2, 3].map((starVal) => {
          const isSelected = stars === starVal;
          return (
            <button
              key={starVal}
              type="button"
              onClick={() => handleSetStars(starVal)}
              disabled={updating}
              title={`Definir como nível ${starVal}`}
              className={`px-2.5 py-1 rounded-lg border text-xs font-extrabold flex items-center gap-1 transition-all cursor-pointer ${
                isSelected
                  ? 'ring-2 ring-[var(--accent)] shadow-md shadow-purple-900/40 scale-105'
                  : 'opacity-70 hover:opacity-100'
              }`}
              style={{
                background: isSelected ? 'var(--accent)' : 'var(--surface-2)',
                borderColor: isSelected ? 'var(--accent)' : 'var(--border-color)',
                color: isSelected ? '#ffffff' : 'var(--muted-light)',
              }}
            >
              <StarRating stars={starVal} size={12} />
              <span className="text-[10px] ml-0.5 font-bold">
                {starVal === 1 ? '1' : starVal === 2 ? '2' : '3'}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
