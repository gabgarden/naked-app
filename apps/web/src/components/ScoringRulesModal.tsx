'use client';

import { useState } from 'react';
import { HelpCircle, X, Trophy, Shield, Target, Award, Sparkles, Check } from 'lucide-react';

export function ScoringRulesModal() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Botão de Abrir */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-sm"
        style={{
          background: 'rgba(103, 61, 230, 0.12)',
          borderColor: 'rgba(103, 61, 230, 0.35)',
          color: 'var(--accent-light)',
        }}
        title="Ver como funciona o cálculo de pontos do ranking"
      >
        <HelpCircle className="w-3.5 h-3.5 text-purple-400" />
        <span>Como funciona a pontuação?</span>
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div
            className="card w-full max-w-md max-h-[90vh] overflow-y-auto border-2 border-[var(--accent)] shadow-2xl p-5 space-y-4 animate-scale-in relative"
            style={{
              background: 'linear-gradient(135deg, rgba(15, 18, 28, 0.98), rgba(22, 17, 38, 0.98))',
              boxShadow: '0 0 35px rgba(103, 61, 230, 0.4)',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
              <div className="flex items-center gap-2">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shadow-md"
                  style={{ background: 'rgba(103, 61, 230, 0.25)', color: 'var(--accent)' }}
                >
                  <Trophy className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-white">Regras de Pontuação</h3>
                  <p className="text-[11px] text-muted">Como os pontos do ranking são calculados</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-white/10 text-muted hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabela de Pesos */}
            <div className="space-y-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-muted pl-1">
                Pontos por Ação em Partida
              </span>

              <div className="grid grid-cols-1 gap-2 text-xs">
                {/* Vitória */}
                <div className="p-3 rounded-xl border flex items-center justify-between bg-[var(--surface-2)] border-emerald-500/20">
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg">🏆</span>
                    <div>
                      <span className="font-bold text-white block">Vitória em Partida</span>
                      <span className="text-[10px] text-muted">Para todos os jogadores da equipe</span>
                    </div>
                  </div>
                  <span className="font-black text-sm text-emerald-400 px-2 py-0.5 rounded-lg bg-emerald-950/60 border border-emerald-500/30">
                    +3 pts
                  </span>
                </div>

                {/* Empate */}
                <div className="p-3 rounded-xl border flex items-center justify-between bg-[var(--surface-2)] border-amber-500/20">
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg">⚖️</span>
                    <div>
                      <span className="font-bold text-white block">Empate em Partida</span>
                      <span className="text-[10px] text-muted">Para todos os jogadores de ambos os times</span>
                    </div>
                  </div>
                  <span className="font-black text-sm text-amber-300 px-2 py-0.5 rounded-lg bg-amber-950/60 border border-amber-500/30">
                    +1 pt
                  </span>
                </div>

                {/* Gol */}
                <div className="p-3 rounded-xl border flex items-center justify-between bg-[var(--surface-2)] border-purple-500/20">
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg">⚽</span>
                    <div>
                      <span className="font-bold text-white block">Gol Marcado</span>
                      <span className="text-[10px] text-muted">Bônus individual para o autor do gol</span>
                    </div>
                  </div>
                  <span className="font-black text-sm text-purple-300 px-2 py-0.5 rounded-lg bg-purple-950/60 border border-purple-500/30">
                    +2 pts
                  </span>
                </div>

                {/* Assistência */}
                <div className="p-3 rounded-xl border flex items-center justify-between bg-[var(--surface-2)] border-blue-500/20">
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg">🎯</span>
                    <div>
                      <span className="font-bold text-white block">Assistência</span>
                      <span className="text-[10px] text-muted">Bônus individual para o passe do gol</span>
                    </div>
                  </div>
                  <span className="font-black text-sm text-blue-300 px-2 py-0.5 rounded-lg bg-blue-950/60 border border-blue-500/30">
                    +1 pt
                  </span>
                </div>

                {/* Goleiro Sem Gols */}
                <div className="p-3 rounded-xl border flex items-center justify-between bg-[var(--surface-2)] border-cyan-500/20">
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg">🧤</span>
                    <div>
                      <span className="font-bold text-white block">Goleiro Sem Sofrer Gols (SG)</span>
                      <span className="text-[10px] text-muted">Bônus quando o time não leva gols no jogo</span>
                    </div>
                  </div>
                  <span className="font-black text-sm text-cyan-300 px-2 py-0.5 rounded-lg bg-cyan-950/60 border border-cyan-500/30">
                    +3 pts
                  </span>
                </div>
              </div>
            </div>

            {/* Fórmula em destaque */}
            <div
              className="p-3 rounded-xl border space-y-1 text-center"
              style={{
                background: 'rgba(103, 61, 230, 0.1)',
                borderColor: 'rgba(103, 61, 230, 0.3)',
              }}
            >
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-300 block">
                Fórmula de Pontos Totais
              </span>
              <p className="text-xs font-black text-white">
                PTS = (Vitórias × 3) + (Empates × 1) + (Gols × 2) + (Assists × 1) + (SG × 3)
              </p>
            </div>

            {/* Critérios de Desempate */}
            <div className="space-y-1 pt-1">
              <span className="text-[11px] font-black uppercase tracking-wider text-muted pl-1">
                Critérios de Desempate no Ranking
              </span>
              <ol className="text-xs text-muted space-y-1 pl-4 list-decimal">
                <li><strong className="text-white">Pontos Totais (PTS)</strong></li>
                <li><strong className="text-white">Total de Gols Marcados (G)</strong></li>
                <li><strong className="text-white">Total de Vitórias (W)</strong></li>
                <li><strong className="text-white">Ordem Alfabética</strong></li>
              </ol>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="btn btn-primary w-full py-2.5 text-xs font-bold"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
}
