'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { matchesService, MatchDetails, MatchTeamPlayer } from '../services/matches.service';
import { ArrowLeft, Plus, Clock, Trophy, Trash2, Play, Pause, RotateCcw, X, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import { getInitials, getDisplayName } from '../lib/utils';

interface MatchLiveBoardProps {
  initialMatch: MatchDetails;
  matchDuration?: number; // duration in minutes (default 10)
}

export function MatchLiveBoard({ initialMatch, matchDuration = 10 }: MatchLiveBoardProps) {
  const router = useRouter();
  const [match, setMatch] = useState<MatchDetails>(initialMatch);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Timer state
  const initialSeconds = matchDuration * 60;
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(match.status === 'in_progress');

  const isFinished = match.status === 'finished';

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning && secondsLeft > 0 && !isFinished) {
      interval = setInterval(() => {
        setSecondsLeft((prev) => prev - 1);
      }, 1000);
    } else if (secondsLeft === 0) {
      setIsRunning(false);
    }
    return () => clearInterval(interval);
  }, [isRunning, secondsLeft, isFinished]);

  const toggleTimer = async () => {
    if (match.status === 'pending') {
      try {
        await matchesService.start(match.id);
        setMatch((prev) => ({ ...prev, status: 'in_progress' }));
      } catch (err) {
        console.error(err);
      }
    }
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setSecondsLeft(initialSeconds);
  };

  const formatTime = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Goal modal state
  const [goalModal, setGoalModal] = useState<{
    open: boolean;
    teamId: string;
    scorerId: string | null;
  }>({ open: false, teamId: '', scorerId: null });

  async function handleFinish() {
    if (
      !confirm('Tem certeza que deseja encerrar esta partida? O resultado computará pontos no ranking!')
    ) {
      return;
    }

    setLoading(true);
    try {
      await matchesService.finish(match.id);
      setIsRunning(false);
      setMatch((prev) => ({ ...prev, status: 'finished' }));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao finalizar partida.');
    } finally {
      setLoading(false);
    }
  }

  async function handleRegisterGoal(assistPlayerId: string | null = null) {
    if (!goalModal.scorerId || !goalModal.teamId) return;

    setLoading(true);
    setError('');

    const minute = Math.max(1, Math.floor((initialSeconds - secondsLeft) / 60));

    try {
      await matchesService.registerGoal(match.id, {
        teamId: goalModal.teamId,
        playerId: goalModal.scorerId,
        assistPlayerId: assistPlayerId || null,
        minute,
      });

      // Refresh match state from API
      const updated = await matchesService.getDetails(match.id);
      setMatch(updated);
      setGoalModal({ open: false, teamId: '', scorerId: null });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao registrar gol.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteEvent(eventId: string, teamId: string) {
    if (isFinished) return;
    if (!confirm('Deseja anular este gol?')) return;

    setLoading(true);
    try {
      await matchesService.deleteGoal(match.id, eventId, teamId);
      const updated = await matchesService.getDetails(match.id);
      setMatch(updated);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao remover evento.');
    } finally {
      setLoading(false);
    }
  }

  // Active team in modal
  const activeTeam = match.team_a?.id === goalModal.teamId ? match.team_a : match.team_b;
  const activePlayers: MatchTeamPlayer[] = activeTeam?.players || [];
  const otherPlayers = activePlayers.filter((p) => p.id !== goalModal.scorerId);

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <Link
          href={`/peladas/${match.round_id}`}
          className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors"
          style={{ background: 'var(--surface-hover)', color: 'var(--muted)' }}
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>

        <div
          className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"
          style={{
            background: isFinished ? 'var(--surface-hover)' : 'rgba(249,115,22,0.15)',
            color: isFinished ? 'var(--muted)' : 'var(--accent)',
          }}
        >
          {!isFinished && <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />}
          {isFinished ? 'Finalizada' : match.status === 'in_progress' ? 'Em Andamento' : 'Aguardando'}
        </div>
      </div>

      {error && (
        <div
          className="p-3.5 rounded-xl text-xs font-semibold text-center"
          style={{
            background: 'rgba(239,68,68,0.12)',
            color: 'var(--danger)',
            border: '1px solid rgba(239,68,68,0.2)',
          }}
        >
          {error}
        </div>
      )}

      {/* Scoreboard and Timer */}
      <div className="card p-6 flex flex-col items-center">
        {/* Timer section */}
        {!isFinished && (
          <div className="flex flex-col items-center mb-6 w-full">
            <div
              className={`text-4xl font-black font-mono tracking-wider ${
                secondsLeft <= 60 && secondsLeft > 0 ? 'text-red-500 animate-pulse' : ''
              }`}
              style={{ color: secondsLeft <= 60 && secondsLeft > 0 ? 'var(--danger)' : 'var(--foreground)' }}
            >
              {formatTime(secondsLeft)}
            </div>

            <div className="flex items-center gap-3 mt-3">
              <button
                type="button"
                onClick={toggleTimer}
                className="w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-95"
                style={{
                  background: 'var(--surface-hover)',
                  border: '1px solid var(--border-color)',
                  color: isRunning ? 'var(--warning)' : 'var(--accent)',
                }}
              >
                {isRunning ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
              </button>
              <button
                type="button"
                onClick={resetTimer}
                className="w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-95"
                style={{
                  background: 'var(--surface-hover)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--muted)',
                }}
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            <div className="w-full h-px my-4" style={{ background: 'var(--border-color)' }} />
          </div>
        )}

        {/* Score display */}
        <div className="flex items-center justify-between w-full">
          {/* Team A */}
          <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-xs font-bold border-2 shadow-sm text-center px-1"
              style={{
                borderColor: match.team_a?.color || 'var(--accent)',
                background: 'var(--surface-hover)',
                color: 'var(--foreground)',
              }}
            >
              <span className="truncate">{match.team_a?.name || 'Time A'}</span>
            </div>
            <span
              className="stat-number text-5xl font-black my-1"
              style={{ color: 'var(--foreground)' }}
            >
              {match.score_a}
            </span>

            {!isFinished && (
              <button
                type="button"
                onClick={() =>
                  setGoalModal({ open: true, teamId: match.team_a?.id || '', scorerId: null })
                }
                disabled={loading}
                className="mt-1 w-11 h-11 rounded-full flex items-center justify-center transition-transform active:scale-95 disabled:opacity-50"
                style={{
                  background: 'rgba(249,115,22,0.15)',
                  border: '1px solid var(--accent)',
                  color: 'var(--accent)',
                }}
              >
                <Plus className="w-6 h-6" />
              </button>
            )}
          </div>

          <div className="text-2xl font-black px-4" style={{ color: 'var(--muted)' }}>
            ×
          </div>

          {/* Team B */}
          <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-xs font-bold border-2 shadow-sm text-center px-1"
              style={{
                borderColor: match.team_b?.color || 'var(--accent)',
                background: 'var(--surface-hover)',
                color: 'var(--foreground)',
              }}
            >
              <span className="truncate">{match.team_b?.name || 'Time B'}</span>
            </div>
            <span
              className="stat-number text-5xl font-black my-1"
              style={{ color: 'var(--foreground)' }}
            >
              {match.score_b}
            </span>

            {!isFinished && (
              <button
                type="button"
                onClick={() =>
                  setGoalModal({ open: true, teamId: match.team_b?.id || '', scorerId: null })
                }
                disabled={loading}
                className="mt-1 w-11 h-11 rounded-full flex items-center justify-center transition-transform active:scale-95 disabled:opacity-50"
                style={{
                  background: 'rgba(249,115,22,0.15)',
                  border: '1px solid var(--accent)',
                  color: 'var(--accent)',
                }}
              >
                <Plus className="w-6 h-6" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Events Timeline */}
      <section className="space-y-3">
        <h2
          className="text-xs font-bold uppercase tracking-wider px-1 flex items-center gap-1.5"
          style={{ color: 'var(--muted)' }}
        >
          <Clock className="w-4 h-4" /> Timeline de Gols
        </h2>

        <div className="space-y-2">
          {(!match.match_events || match.match_events.length === 0) ? (
            <div className="card p-5 text-center text-xs" style={{ color: 'var(--muted)' }}>
              Nenhum gol anotado nesta partida ainda.
            </div>
          ) : (
            match.match_events.map((ev) => {
              const isTeamA = ev.team_id === match.team_a?.id;
              const teamColor = isTeamA ? match.team_a?.color : match.team_b?.color;

              return (
                <div
                  key={ev.id}
                  className="card p-3 flex items-center gap-3 relative overflow-hidden"
                >
                  <div
                    className={`absolute top-0 bottom-0 w-1.5 ${isTeamA ? 'left-0' : 'right-0'}`}
                    style={{ backgroundColor: teamColor || 'var(--accent)' }}
                  />

                  <div
                    className={`flex items-center gap-3 w-full ${
                      isTeamA ? 'flex-row' : 'flex-row-reverse text-right'
                    }`}
                  >
                    <span className="text-xl">⚽</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate" style={{ color: 'var(--foreground)' }}>
                        {getDisplayName(ev.player?.name || 'Jogador', ev.player?.nickname)}
                      </p>
                      {ev.assist_player && (
                        <p className="text-[11px]" style={{ color: 'var(--muted)' }}>
                          Passe:{' '}
                          <span style={{ color: 'var(--foreground)' }}>
                            {getDisplayName(ev.assist_player.name, ev.assist_player.nickname)}
                          </span>
                        </p>
                      )}
                    </div>

                    {!isFinished && (
                      <button
                        type="button"
                        onClick={() => handleDeleteEvent(ev.id, ev.team_id)}
                        disabled={loading}
                        className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-[rgba(239,68,68,0.15)] disabled:opacity-50"
                        style={{ color: 'var(--muted)' }}
                      >
                        <Trash2 className="w-4 h-4 hover:text-[var(--danger)]" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* Finish match button */}
      {!isFinished && (
        <div className="pt-4">
          <button
            type="button"
            onClick={handleFinish}
            disabled={loading}
            className="btn btn-secondary w-full py-4 text-sm font-bold"
            style={{ color: 'var(--danger)', borderColor: 'rgba(239,68,68,0.3)' }}
          >
            <Trophy className="w-5 h-5" />
            Encerrar Partida
          </button>
        </div>
      )}

      {/* GOAL REGISTRATION MODAL */}
      {goalModal.open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
          <div className="card w-full max-w-sm overflow-hidden flex flex-col max-h-[85vh] animate-slide-in-bottom">
            <div
              className="p-4 flex items-center justify-between"
              style={{ background: 'var(--surface-hover)', borderBottom: '1px solid var(--border-color)' }}
            >
              <h3 className="font-bold text-sm" style={{ color: 'var(--foreground)' }}>
                {goalModal.scorerId ? 'Quem deu a assistência?' : 'Quem marcou o gol?'}
              </h3>
              <button
                type="button"
                onClick={() => setGoalModal({ open: false, teamId: '', scorerId: null })}
                className="p-1 rounded-lg"
                style={{ color: 'var(--muted)' }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-2 flex-1">
              {!goalModal.scorerId ? (
                // Step 1: Select scorer
                activePlayers.length === 0 ? (
                  <div className="p-4 text-center text-xs" style={{ color: 'var(--muted)' }}>
                    Nenhum jogador encontrado neste time.
                  </div>
                ) : (
                  activePlayers.map((player) => (
                    <button
                      key={player.id}
                      type="button"
                      onClick={() => setGoalModal((prev) => ({ ...prev, scorerId: player.id }))}
                      className="w-full flex items-center gap-3 p-3 rounded-xl transition-colors text-left"
                      style={{
                        background: 'var(--surface-hover)',
                        border: '1px solid var(--border-color)',
                      }}
                    >
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold"
                        style={{
                          background: 'linear-gradient(135deg, var(--accent-dark), var(--accent))',
                          color: '#fff',
                        }}
                      >
                        {getInitials(player.name)}
                      </div>
                      <span className="font-bold text-xs flex-1 truncate" style={{ color: 'var(--foreground)' }}>
                        {getDisplayName(player.name, player.nickname)}
                      </span>
                      <span className="text-xl">⚽</span>
                    </button>
                  ))
                )
              ) : (
                // Step 2: Select assist or solo goal
                <>
                  <button
                    type="button"
                    onClick={() => handleRegisterGoal(null)}
                    disabled={loading}
                    className="btn btn-primary w-full py-3 text-xs mb-3"
                  >
                    Gol individual (Sem assistência)
                  </button>

                  <p className="text-[11px] font-bold uppercase tracking-wider mb-2 px-1" style={{ color: 'var(--muted)' }}>
                    Ou escolha o passador:
                  </p>

                  {otherPlayers.map((player) => (
                    <button
                      key={player.id}
                      type="button"
                      onClick={() => handleRegisterGoal(player.id)}
                      disabled={loading}
                      className="w-full flex items-center gap-3 p-3 rounded-xl transition-colors text-left"
                      style={{
                        background: 'var(--surface-hover)',
                        border: '1px solid var(--border-color)',
                      }}
                    >
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold"
                        style={{ background: 'var(--surface)', color: 'var(--foreground)' }}
                      >
                        {getInitials(player.name)}
                      </div>
                      <span className="font-bold text-xs flex-1 truncate" style={{ color: 'var(--foreground)' }}>
                        {getDisplayName(player.name, player.nickname)}
                      </span>
                      <span className="text-xl">🎯</span>
                    </button>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
