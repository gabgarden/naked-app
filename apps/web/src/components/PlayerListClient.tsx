'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { UserPlus, ChevronRight, X, Sparkles, Check, ExternalLink } from 'lucide-react';
import { Player, playersService, PlayerProfile } from '../services/players.service';
import { StarRating } from './StarRating';

interface PlayerListClientProps {
  initialPlayers: Player[];
}

export function PlayerListClient({ initialPlayers }: PlayerListClientProps) {
  const [players, setPlayers] = useState<Player[]>(initialPlayers);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [playerDetails, setPlayerDetails] = useState<PlayerProfile | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [updatingStars, setUpdatingStars] = useState(false);
  const [starsUpdatedFeedback, setStarsUpdatedFeedback] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Preserve scroll position when opening and closing the modal
  useEffect(() => {
    if (!selectedPlayer) return;
    const currentScrollY = window.scrollY;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
      window.scrollTo(0, currentScrollY);
    };
  }, [selectedPlayer]);

  // When clicking a player, open the stats card and load details
  async function handleSelectPlayer(player: Player) {
    setSelectedPlayer(player);
    setLoadingDetails(true);
    setStarsUpdatedFeedback(false);
    try {
      const details = await playersService.getById(player.id);
      setPlayerDetails(details);
    } catch {
      setPlayerDetails({
        ...player,
        stats: null,
        history: [],
      });
    } finally {
      setLoadingDetails(false);
    }
  }

  // Discrete star updater: click star 1, 2, or 3 to update on the fly
  async function handleSetStars(newStars: number) {
    if (!selectedPlayer || updatingStars) return;
    if (selectedPlayer.stars === newStars) return;

    const previousStars = selectedPlayer.stars;
    setUpdatingStars(true);
    // Optimistic update
    const updatedPlayer = { ...selectedPlayer, stars: newStars };
    setSelectedPlayer(updatedPlayer);
    setPlayers((prev) => prev.map((p) => (p.id === selectedPlayer.id ? { ...p, stars: newStars } : p)));

    try {
      await playersService.update(selectedPlayer.id, { stars: newStars });
      setStarsUpdatedFeedback(true);
      setTimeout(() => setStarsUpdatedFeedback(false), 2000);
    } catch (err) {
      console.error('Erro ao atualizar estrelas do jogador:', err);
      // Reverte caso a requisição falhe
      setSelectedPlayer((prev) => (prev ? { ...prev, stars: previousStars } : null));
      setPlayers((prev) => prev.map((p) => (p.id === selectedPlayer.id ? { ...p, stars: previousStars } : p)));
      alert('Erro ao atualizar classificação do jogador no servidor.');
    } finally {
      setUpdatingStars(false);
    }
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-2xl font-bold"
            style={{ fontFamily: "'Barlow Condensed', sans-serif", color: 'var(--foreground)' }}
          >
            Jogadores
          </h1>
          <p className="text-xs" style={{ color: 'var(--muted)' }}>
            {players.length} cadastrados • Toque em um jogador para ver stats e ajustar estrelas
          </p>
        </div>
        <Link href="/players/new" id="btn-new-player" className="btn btn-primary">
          <UserPlus className="w-4 h-4" />
          Novo
        </Link>
      </div>

      {players.length === 0 ? (
        <div className="card p-10 flex flex-col items-center gap-4 text-center">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
            style={{ background: 'var(--surface-hover)' }}
          >
            👤
          </div>
          <div>
            <p className="font-bold text-base" style={{ color: 'var(--foreground)' }}>
              Nenhum jogador cadastrado ainda
            </p>
            <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
              Cadastre jogadores para criar partidas e acompanhar os rankings
            </p>
          </div>
          <Link href="/players/new" className="btn btn-primary">
            <UserPlus className="w-4 h-4" />
            Cadastrar primeiro jogador
          </Link>
        </div>
      ) : (
        <div className="card overflow-hidden">
          {players.map((player, i) => (
            <div
              key={player.id}
              onClick={() => handleSelectPlayer(player)}
              className={`flex items-center justify-between px-4 py-3.5 transition-colors cursor-pointer hover:bg-[var(--surface-hover)] active:bg-[var(--surface-hover)] ${
                i < players.length - 1 ? 'border-b border-[var(--border-color)]' : ''
              }`}
            >
              <div className="flex-1 min-w-0 pr-2">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-sm truncate text-white">
                    {player.name}
                  </p>
                  <StarRating stars={player.stars ?? 2} size={12} />
                </div>
                {player.nickname && (
                  <p className="text-xs truncate" style={{ color: 'var(--muted)' }}>
                    {player.nickname}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-[11px] font-semibold text-muted">
                  Stats & Estrelas
                </span>
                <ChevronRight className="w-4 h-4" style={{ color: 'var(--muted)' }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* DYNAMIC VIEWPORT-CENTERED PLAYER STATS & DISCRETE STAR MODAL */}
      {mounted && selectedPlayer && createPortal(
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
          onClick={() => setSelectedPlayer(null)}
        >
          <div
            className="card w-full max-w-md max-h-[90vh] overflow-y-auto flex flex-col p-5 space-y-4 border-2 border-[var(--accent)] shadow-2xl relative animate-scale-in my-auto"
            style={{
              boxShadow: '0 0 35px rgba(103, 61, 230, 0.45)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--border-color)' }}>
              <div className="flex-1 min-w-0 pr-3">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--accent-light)] block">
                  Perfil do Jogador
                </span>
                <h3 className="font-extrabold text-lg text-white truncate">
                  {selectedPlayer.name}
                </h3>
                {selectedPlayer.nickname && (
                  <p className="text-xs text-muted truncate">
                    Apelido: {selectedPlayer.nickname}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => setSelectedPlayer(null)}
                className="p-1.5 rounded-lg text-muted hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Discrete Star Rating Selector with Hostinger Purple Stars */}
            <div
              className="p-3.5 rounded-xl border flex flex-col gap-2 transition-all"
              style={{
                background: 'rgba(103, 61, 230, 0.08)',
                borderColor: 'rgba(139, 92, 246, 0.35)',
              }}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  Nível Técnico (Estrelas):
                </span>
                {starsUpdatedFeedback ? (
                  <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1 animate-fade-in">
                    <Check className="w-3 h-3" /> Atualizado!
                  </span>
                ) : (
                  <span className="text-[10px] text-muted">
                    Toque para alterar
                  </span>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2 pt-1">
                {[1, 2, 3].map((starVal) => {
                  const isCurrent = (selectedPlayer.stars ?? 2) === starVal;
                  return (
                    <button
                      key={starVal}
                      type="button"
                      onClick={() => handleSetStars(starVal)}
                      disabled={updatingStars}
                      className={`py-2 px-2 rounded-xl border text-xs font-extrabold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                        isCurrent
                          ? 'ring-2 ring-[var(--accent)] shadow-lg shadow-purple-900/40 scale-[1.02]'
                          : 'opacity-70 hover:opacity-100 hover:scale-[1.01]'
                      }`}
                      style={{
                        background: isCurrent ? 'var(--accent)' : 'var(--surface-2)',
                        borderColor: isCurrent ? 'var(--accent)' : 'var(--border-color)',
                        color: isCurrent ? '#ffffff' : 'var(--muted-light)',
                      }}
                    >
                      <StarRating stars={starVal} size={14} />
                      <span className="text-[10px] font-bold leading-tight">
                        {starVal === 1 ? 'Básico' : starVal === 2 ? 'Médio' : 'Craque'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Stats Card Grid */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-muted uppercase tracking-wider pl-1">
                Estatísticas Gerais
              </span>

              {loadingDetails ? (
                <div className="p-6 text-center text-xs text-muted">
                  Carregando estatísticas...
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  <div className="card p-2.5 text-center bg-[var(--surface-2)]">
                    <span className="text-[10px] font-bold text-muted uppercase block">Partidas</span>
                    <span className="text-lg font-black text-white stat-number">
                      {playerDetails?.stats?.total_games ?? 0}
                    </span>
                  </div>

                  <div className="card p-2.5 text-center bg-[var(--surface-2)]">
                    <span className="text-[10px] font-bold text-emerald-400 uppercase block">Vitórias</span>
                    <span className="text-lg font-black text-emerald-400 stat-number">
                      {playerDetails?.stats?.total_wins ?? 0}
                    </span>
                  </div>

                  <div className="card p-2.5 text-center bg-[var(--surface-2)]">
                    <span className="text-[10px] font-bold text-purple-300 uppercase block">Pontos</span>
                    <span className="text-lg font-black text-purple-300 stat-number">
                      {(playerDetails?.stats?.total_wins ?? 0) * 3 + (playerDetails?.stats?.total_draws ?? 0)}
                    </span>
                  </div>

                  <div className="card p-2.5 text-center bg-[var(--surface-2)]">
                    <span className="text-[10px] font-bold text-muted uppercase block">Gols ⚽</span>
                    <span className="text-lg font-black text-white stat-number">
                      {playerDetails?.stats?.total_goals ?? 0}
                    </span>
                  </div>

                  <div className="card p-2.5 text-center bg-[var(--surface-2)]">
                    <span className="text-[10px] font-bold text-muted uppercase block">Assistências 🎯</span>
                    <span className="text-lg font-black text-white stat-number">
                      {playerDetails?.stats?.total_assists ?? 0}
                    </span>
                  </div>

                  <div className="card p-2.5 text-center bg-[var(--surface-2)]">
                    <span className="text-[10px] font-bold text-muted uppercase block">Aprov. %</span>
                    <span className="text-lg font-black text-white stat-number">
                      {playerDetails?.stats && playerDetails.stats.total_games > 0
                        ? `${Math.round(((playerDetails.stats.total_wins * 3 + playerDetails.stats.total_draws) / (playerDetails.stats.total_games * 3)) * 100)}%`
                        : '0%'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="flex gap-2 pt-2 border-t" style={{ borderColor: 'var(--border-color)' }}>
              <Link
                href={`/players/${selectedPlayer.id}`}
                className="btn btn-primary flex-1 text-xs py-2.5 flex items-center justify-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Perfil Completo</span>
              </Link>

              <button
                type="button"
                onClick={() => setSelectedPlayer(null)}
                className="btn btn-secondary text-xs py-2.5 px-4 cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
