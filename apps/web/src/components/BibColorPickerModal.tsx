'use client';

import { useState } from 'react';
import { X, Check, Shirt } from 'lucide-react';
import { BIB_COLORS, BibColor, findBibColor } from '../lib/teamColors';

interface BibColorPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentColor?: string;
  teamName: string;
  onSelectColor: (color: BibColor, updatedName?: string) => void;
}

export function BibColorPickerModal({
  isOpen,
  onClose,
  currentColor,
  teamName,
  onSelectColor,
}: BibColorPickerModalProps) {
  const [selectedBib, setSelectedBib] = useState<BibColor>(() => findBibColor(currentColor));

  if (!isOpen) return null;

  function handleConfirm(bib: BibColor) {
    setSelectedBib(bib);
    // Automaticamente renomeia o time para o nome da cor do colete (ex: "Time Laranja", "Time Azul")
    const newName = `Time ${bib.shortName}`;
    onSelectColor(bib, newName);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
      <div
        className="card w-full max-w-md border-2 border-[var(--border-color)] shadow-2xl p-5 space-y-4 animate-scale-in relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(15, 18, 28, 0.98), rgba(22, 17, 38, 0.98))',
          boxShadow: `0 0 35px ${selectedBib.glowColor}`,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-2.5">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg transition-all"
              style={{
                background: selectedBib.bgGradient,
                color: selectedBib.textColor,
                boxShadow: `0 0 16px ${selectedBib.glowColor}`,
                border: `1.5px solid ${selectedBib.borderColor}`,
              }}
            >
              <Shirt className="w-5 h-5 drop-shadow-sm" />
            </div>
            <div>
              <h3 className="font-black text-base text-white">Cor do Colete</h3>
              <p className="text-[11px] text-muted truncate max-w-[220px]">
                {teamName || 'Configurar Time'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 text-muted hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 8 Bib Colors Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
          {BIB_COLORS.map((bib) => {
            const isSelected = selectedBib.hex.toLowerCase() === bib.hex.toLowerCase();

            return (
              <button
                key={bib.id}
                type="button"
                onClick={() => handleConfirm(bib)}
                className={`relative group p-3 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 ${
                  isSelected ? 'ring-2 ring-white scale-102 shadow-xl' : 'hover:scale-103'
                }`}
                style={{
                  background: bib.bgGradient,
                  color: bib.textColor,
                  border: `2px solid ${bib.borderColor}`,
                  boxShadow: isSelected
                    ? `0 0 20px ${bib.glowColor}`
                    : '0 4px 10px rgba(0,0,0,0.25)',
                }}
              >
                {/* Check badge */}
                {isSelected && (
                  <div
                    className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center shadow-md"
                    style={{ background: 'rgba(0,0,0,0.7)', color: '#FFFFFF' }}
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                )}

                {/* Jersey Icon */}
                <Shirt className="w-7 h-7 drop-shadow-md transition-transform group-hover:scale-110" />

                {/* Color Label */}
                <span
                  className="text-xs font-black tracking-wide drop-shadow-sm text-center leading-tight"
                  style={{ color: bib.textColor }}
                >
                  {bib.shortName}
                </span>
              </button>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="pt-2 text-center">
          <p className="text-[11px] text-muted">
            Ao escolher a cor, o time é renomeado automaticamente para a cor do colete.
          </p>
        </div>
      </div>
    </div>
  );
}
