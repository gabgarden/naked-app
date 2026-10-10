'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { matchesService, MatchDetails, MatchTeamPlayer } from '../services/matches.service';
import {
  ArrowLeft,
  Plus,
  Clock,
  Trophy,
  Trash2,
  Play,
  Pause,
  RotateCcw,
  X,
  Shield,
  RefreshCw,
  Shirt,
  Palette,
} from 'lucide-react';
import Link from 'next/link';
import { getDisplayName } from '../lib/utils';
import { StarRating } from './StarRating';
import { roundsService, RoundWithDetails } from '../services/rounds.service';
import {
  determinePeladaState,
  PELADA_MATCH_DURATION_MINUTES,
  PELADA_GOAL_LIMIT,
} from '../lib/peladaRules';
import { BibColorPickerModal } from './BibColorPickerModal';
import { findBibColor, BibColor } from '../lib/teamColors';

interface MatchLiveBoardProps {
  initialMatch: MatchDetails;
  matchDuration?: number; // duration in minutes (default 7)
}

function getFirstNameOnly(name?: string | null, nickname?: string | null): string {
  if (nickname && nickname.trim()) return nickname.trim();
  if (!name) return 'Jogador';
  return name.trim().split(/\s+/)[0] || name;
}

export function MatchLiveBoard({ initialMatch, matchDuration = PELADA_MATCH_DURATION_MINUTES }: MatchLiveBoardProps) {
  const router = useRouter();
  const [match, setMatch] = useState<MatchDetails>(initialMatch);
  const [roundDetails, setRoundDetails] = useState<RoundWithDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [creatingNextMatch, setCreatingNextMatch] = useState(false);
  const [error, setError] = useState('');

  // Timer state (7 minutes default)
  const initialSeconds = matchDuration * 60;
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(match.status === 'in_progress');

  const isFinished = match.status === 'finished';

  // Regra de 2 gols
  const hasReachedTwoGoals = match.score_a >= PELADA_GOAL_LIMIT || match.score_b >= PELADA_GOAL_LIMIT;
  const leadingTeam = match.score_a > match.score_b ? match.team_a : match.score_b > match.score_a ? match.team_b : null;

  // Carrega detalhes da rodada ao finalizar para calcular a cerca e quem fica
  useEffect(() => {
    if (isFinished && match.round_id) {
      roundsService.getById(match.round_id).then(setRoundDetails).catch(console.error);
    }
  }, [isFinished, match.round_id]);

  // Se atingir 2 gols, pausa o cronômetro automaticamente
  useEffect(() => {
    if (hasReachedTwoGoals && isRunning && !isFinished) {
      setIsRunning(false);
    }
  }, [hasReachedTwoGoals, isRunning, isFinished]);

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

  // Goalkeeper Switcher modal state
  const [gkModal, setGkModal] = useState<{
    open: boolean;
    team: 'A' | 'B';
  }>({ open: false, team: 'A' });

  // Colete Color Picker modal state
  const [bibColorModal, setBibColorModal] = useState<{
    open: boolean;
    teamId: string;
    teamName: string;
    currentColor?: string;
  }>({ open: false, teamId: '', teamName: '', currentColor: '' });

  async function handleSelectBibColor(newBib: BibColor, updatedName?: string) {
    if (!bibColorModal.teamId) return;
    const teamId = bibColorModal.teamId;

    // Optimistically update local match state
    setMatch((prev) => {
      const next = { ...prev };
      if (next.team_a?.id === teamId) {
        next.team_a = {
          ...next.team_a,
          color: newBib.hex,
          name: updatedName || next.team_a.name,
        };
      } else if (next.team_b?.id === teamId) {
        next.team_b = {
          ...next.team_b,
          color: newBib.hex,
          name: updatedName || next.team_b.name,
        };
      }
      return next;
    });

    try {
      await roundsService.updateTeam(match.round_id, teamId, {
        color: newBib.hex,
        name: updatedName,
      });
    } catch (err) {
      console.error('Erro ao atualizar cor do colete:', err);
    }
  }

  async function handleFinish() {
    if (
      !confirm('Tem certeza que deseja finalizar esta partida? Os pontos serão computados no ranking e a cerca será atualizada!')
    ) {
      return;
    }

    setLoading(true);
    try {
      await matchesService.finish(match.id);
      setIsRunning(false);
      const updatedMatch = await matchesService.getDetails(match.id);
      setMatch(updatedMatch);

      // Atualiza os dados da rodada para computar quem fica e quem entra da cerca
      const updatedRound = await roundsService.getById(match.round_id);
      setRoundDetails(updatedRound);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao finalizar partida.');
    } finally {
      setLoading(false);
    }
  }

  // Pelada state: quem ganha fica / empate desafiante da cerca fica
  const peladaState = roundDetails ? determinePeladaState(roundDetails.teams, roundDetails.matches) : null;

  async function handleStartNextMatch() {
    if (!peladaState?.teamStaying || !peladaState?.teamEntering) return;
    setCreatingNextMatch(true);
    try {
      const res = await matchesService.create({
        roundId: match.round_id,
        teamAId: peladaState.teamStaying.id,
        teamBId: peladaState.teamEntering.id,
        matchOrder: peladaState.nextMatchOrder,
        goalkeeperAId: peladaState.suggestedGkAId || null,
        goalkeeperBId: peladaState.suggestedGkBId || null,
      });

      router.push(`/rounds/${match.round_id}/matches/${res.matchId}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao criar próxima partida.');
    } finally {
      setCreatingNextMatch(false);
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
    if (!confirm('Deseja cancelar este gol?')) return;

    setLoading(true);
    try {
      await matchesService.deleteGoal(match.id, eventId, teamId);
      const updated = await matchesService.getDetails(match.id);
      setMatch(updated);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao remover gol.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSelectGoalkeeper(playerId: string) {
    const isTeamA = gkModal.team === 'A';
    const newGkA = isTeamA ? playerId : match.goalkeeper_a_id;
    const newGkB = !isTeamA ? playerId : match.goalkeeper_b_id;

    setLoading(true);
    try {
      await matchesService.updateGoalkeepers(match.id, {
        goalkeeperAId: newGkA,
        goalkeeperBId: newGkB,
      });
      setMatch((prev) => ({
        ...prev,
        goalkeeper_a_id: newGkA,
        goalkeeper_b_id: newGkB,
      }));
      setGkModal({ open: false, team: 'A' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao trocar goleiro.');
    } finally {
      setLoading(false);
    }
  }

  // Active team in goal modal
  const activeTeam = match.team_a?.id === goalModal.teamId ? match.team_a : match.team_b;
  const activePlayers: MatchTeamPlayer[] = activeTeam?.players || [];
  const otherPlayers = activePlayers.filter((p) => p.id !== goalModal.scorerId);

  // Goalkeeper helpers
  const currentGkAPlayer = match.team_a?.players?.find((p) => p.id === match.goalkeeper_a_id);
  const currentGkBPlayer = match.team_b?.players?.find((p) => p.id === match.goalkeeper_b_id);

  const gkModalTeamObj = gkModal.team === 'A' ? match.team_a : match.team_b;
  const gkModalPlayers = gkModalTeamObj?.players || [];
  const activeGkId = gkModal.team === 'A' ? match.goalkeeper_a_id : match.goalkeeper_b_id;

  const bibA = findBibColor(match.team_a?.color);
  const bibB = findBibColor(match.team_b?.color);

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <Link
          href={`/rounds/${match.round_id}`}
          className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors"
          style={{ background: 'var(--surface-hover)', color: 'var(--muted)' }}
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>

        <div
          className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"
          style={{
            background: isFinished ? 'var(--surface-hover)' : 'rgba(103,61,230,0.18)',
            color: isFinished ? 'var(--muted)' : 'var(--accent)',
          }}
        >
          {!isFinished && <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />}
          {isFinished ? 'Finalizada' : match.status === 'in_progress' ? 'Ao Vivo' : 'Pendente'}
        </div>
      </div>

      {/* Alerta de 2 Gols Atingidos */}
      {hasReachedTwoGoals && !isFinished && (
        <div
          className="p-4 rounded-xl border flex items-center justify-between gap-3 animate-pulse"
          style={{
            background: 'rgba(16, 185, 129, 0.12)',
            borderColor: 'rgba(16, 185, 129, 0.4)',
          }}
        >
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">⚽⚽</span>
            <div>
              <span className="text-xs font-black text-emerald-400 uppercase tracking-wide block">
                Regra de 2 Gols Atingida!
              </span>
              <span className="text-xs text-white font-semibold">
                {leadingTeam ? leadingTeam.name : 'Um time'} fez 2 gols! Finalize a partida.
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleFinish}
            disabled={loading}
            className="btn btn-primary text-xs py-2 px-3 flex-shrink-0 cursor-pointer shadow-md"
          >
            Finalizar Agora
          </button>
        </div>
      )}

      {/* Alerta de Tempo Esgotado (7 Minutos) */}
      {secondsLeft === 0 && !hasReachedTwoGoals && !isFinished && (
        <div
          className="p-4 rounded-xl border flex items-center justify-between gap-3 animate-pulse"
          style={{
            background: 'rgba(234, 179, 8, 0.12)',
            borderColor: 'rgba(234, 179, 8, 0.4)',
          }}
        >
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">⏱️</span>
            <div>
              <span className="text-xs font-black text-amber-400 uppercase tracking-wide block">
                Fim dos 7 Minutos!
              </span>
              <span className="text-xs text-white font-semibold">
                Tempo esgotado. Finalize para definir quem fica.
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleFinish}
            disabled={loading}
            className="btn btn-primary text-xs py-2 px-3 flex-shrink-0 cursor-pointer shadow-md"
          >
            Finalizar Partida
          </button>
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
            <button
              type="button"
              onClick={() =>
                setBibColorModal({
                  open: true,
                  teamId: match.team_a?.id || '',
                  teamName: match.team_a?.name || 'Time A',
                  currentColor: match.team_a?.color,
                })
              }
              className="group flex flex-col items-center gap-1.5 cursor-pointer transition-transform active:scale-95 focus:outline-none"
              title="Clique para alterar a cor do colete deste time"
            >
              {/* Modern Bib Emblem */}
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center relative shadow-lg transition-all group-hover:scale-105"
                style={{
                  background: bibA.bgGradient,
                  color: bibA.textColor,
                  border: `2px solid ${bibA.borderColor}`,
                  boxShadow: `0 0 22px ${bibA.glowColor}`,
                }}
              >
                <Shirt className="w-8 h-8 drop-shadow-md" />
                <div
                  className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center shadow-md border border-white/20 transition-transform group-hover:scale-110"
                  style={{ background: 'rgba(15, 18, 28, 0.9)', color: 'var(--accent-light)' }}
                >
                  <Palette className="w-3 h-3" />
                </div>
              </div>

              {/* Team Name outside the box, bold and clear */}
              <div className="flex flex-col items-center max-w-[130px] px-1">
                <span className="text-xs font-black uppercase tracking-wider text-white truncate max-w-full text-center">
                  {match.team_a?.name || 'Time A'}
                </span>
                <span
                  className="text-[10px] font-bold tracking-tight opacity-90 truncate max-w-full text-center"
                  style={{ color: bibA.hex }}
                >
                  {bibA.name}
                </span>
              </div>
            </button>

            <span
              className="stat-number text-5xl font-black my-1"
              style={{ color: 'var(--foreground)' }}
            >
              {match.score_a}
            </span>

            {/* Goalkeeper indicator & switcher for Team A */}
            <button
              type="button"
              onClick={() => !isFinished && setGkModal({ open: true, team: 'A' })}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border transition-all active:scale-95 cursor-pointer max-w-full truncate"
              style={{
                background: 'rgba(103,61,230,0.12)',
                borderColor: 'rgba(139,92,246,0.35)',
                color: 'var(--accent)',
              }}
              title="Clique para trocar o goleiro deste time"
            >
              <span className="text-xs">🧤</span>
              <span className="truncate">
                {getFirstNameOnly(currentGkAPlayer?.name, currentGkAPlayer?.nickname)}
              </span>
              {!isFinished && <span className="text-[10px] opacity-70 underline">trocar</span>}
            </button>

            {!isFinished && (
              <button
                type="button"
                onClick={() =>
                  setGoalModal({ open: true, teamId: match.team_a?.id || '', scorerId: null })
                }
                disabled={loading}
                className="mt-2 w-11 h-11 rounded-full flex items-center justify-center transition-transform active:scale-95 disabled:opacity-50"
                style={{
                  background: 'rgba(103,61,230,0.18)',
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
            <button
              type="button"
              onClick={() =>
                setBibColorModal({
                  open: true,
                  teamId: match.team_b?.id || '',
                  teamName: match.team_b?.name || 'Time B',
                  currentColor: match.team_b?.color,
                })
              }
              className="group flex flex-col items-center gap-1.5 cursor-pointer transition-transform active:scale-95 focus:outline-none"
              title="Clique para alterar a cor do colete deste time"
            >
              {/* Modern Bib Emblem */}
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center relative shadow-lg transition-all group-hover:scale-105"
                style={{
                  background: bibB.bgGradient,
                  color: bibB.textColor,
                  border: `2px solid ${bibB.borderColor}`,
                  boxShadow: `0 0 22px ${bibB.glowColor}`,
                }}
              >
                <Shirt className="w-8 h-8 drop-shadow-md" />
                <div
                  className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center shadow-md border border-white/20 transition-transform group-hover:scale-110"
                  style={{ background: 'rgba(15, 18, 28, 0.9)', color: 'var(--accent-light)' }}
                >
                  <Palette className="w-3 h-3" />
                </div>
              </div>

              {/* Team Name outside the box, bold and clear */}
              <div className="flex flex-col items-center max-w-[130px] px-1">
                <span className="text-xs font-black uppercase tracking-wider text-white truncate max-w-full text-center">
                  {match.team_b?.name || 'Time B'}
                </span>
                <span
                  className="text-[10px] font-bold tracking-tight opacity-90 truncate max-w-full text-center"
                  style={{ color: bibB.hex }}
                >
                  {bibB.name}
                </span>
              </div>
            </button>

            <span
              className="stat-number text-5xl font-black my-1"
              style={{ color: 'var(--foreground)' }}
            >
              {match.score_b}
            </span>

            {/* Goalkeeper indicator & switcher for Team B */}
            <button
              type="button"
              onClick={() => !isFinished && setGkModal({ open: true, team: 'B' })}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border transition-all active:scale-95 cursor-pointer max-w-full truncate"
              style={{
                background: 'rgba(0,240,255,0.08)',
                borderColor: 'rgba(0,240,255,0.35)',
                color: 'var(--secondary)',
              }}
              title="Clique para trocar o goleiro deste time"
            >
              <span className="text-xs">🧤</span>
              <span className="truncate">
                {getFirstNameOnly(currentGkBPlayer?.name, currentGkBPlayer?.nickname)}
              </span>
              {!isFinished && <span className="text-[10px] opacity-70 underline">trocar</span>}
            </button>

            {!isFinished && (
              <button
                type="button"
                onClick={() =>
                  setGoalModal({ open: true, teamId: match.team_b?.id || '', scorerId: null })
                }
                disabled={loading}
                className="mt-2 w-11 h-11 rounded-full flex items-center justify-center transition-transform active:scale-95 disabled:opacity-50"
                style={{
                  background: 'rgba(0,240,255,0.15)',
                  border: '1px solid var(--secondary)',
                  color: 'var(--secondary)',
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
          <Clock className="w-4 h-4" /> Linha do Tempo de Gols
        </h2>

        <div className="space-y-2">
          {!match.match_events || match.match_events.length === 0 ? (
            <div className="card p-5 text-center text-xs" style={{ color: 'var(--muted)' }}>
              Nenhum gol registrado nesta partida ainda.
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
                        {getFirstNameOnly(ev.player?.name, ev.player?.nickname)}
                      </p>
                      {ev.assist_player && (
                        <p className="text-[11px]" style={{ color: 'var(--muted)' }}>
                          Assistência:{' '}
                          <span style={{ color: 'var(--foreground)' }}>
                            {getFirstNameOnly(ev.assist_player.name, ev.assist_player.nickname)}
                          </span>
                        </p>
                      )}
                    </div>

                    {!isFinished && (
                      <button
                        type="button"
                        onClick={() => handleDeleteEvent(ev.id, ev.team_id)}
                        disabled={loading}
                        className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-[rgba(244,63,94,0.15)] disabled:opacity-50"
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
        <div className="pt-2">
          <button
            type="button"
            onClick={handleFinish}
            disabled={loading}
            className="btn btn-secondary w-full py-4 text-sm font-bold flex items-center justify-center gap-2 cursor-pointer shadow-lg hover:border-[var(--accent)]"
          >
            <Trophy className="w-5 h-5 text-amber-400" />
            <span>Finalizar Partida ({PELADA_MATCH_DURATION_MINUTES} min ou 2 gols)</span>
          </button>
        </div>
      )}

      {/* POST-MATCH REI DA MESA ACTION CARD */}
      {isFinished && (
        <div
          className="card p-5 space-y-4 border-2 border-[var(--accent)] shadow-2xl animate-fade-in text-center relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(103, 61, 230, 0.12), rgba(17, 18, 30, 0.95))',
            boxShadow: '0 0 30px rgba(103, 61, 230, 0.35)',
          }}
        >
          <div className="flex flex-col items-center gap-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-[var(--accent-light)]">
              🏆 Fim de Partida • Rei da Mesa
            </span>
            <h3 className="text-lg font-black text-white">
              {match.score_a > match.score_b
                ? `${match.team_a?.name} venceu!`
                : match.score_b > match.score_a
                ? `${match.team_b?.name} venceu!`
                : 'Partida Empatada!'}
            </h3>
            <p className="text-xs text-muted max-w-sm mt-0.5">
              {peladaState?.reason || 'Regra da Pelada: Quem ganha fica. No empate, quem entrou da cerca por último fica.'}
            </p>
          </div>

          {/* Quem Fica x Quem Entra */}
          {peladaState?.teamStaying && peladaState?.teamEntering && (
            <div className="p-3.5 rounded-xl border flex items-center justify-between gap-3 bg-[var(--surface-2)] border-[var(--border-color)]">
              <div className="flex flex-col items-center flex-1 min-w-0">
                <span className="text-[10px] font-extrabold uppercase text-emerald-400">Fica em Campo</span>
                <span className="text-sm font-black text-white mt-0.5 truncate max-w-full">
                  {peladaState.teamStaying.name}
                </span>
              </div>

              <div className="text-xs font-black text-muted px-2">VS</div>

              <div className="flex flex-col items-center flex-1 min-w-0">
                <span className="text-[10px] font-extrabold uppercase text-[var(--accent-light)]">Entra da Cerca</span>
                <span className="text-sm font-black text-white mt-0.5 truncate max-w-full">
                  {peladaState.teamEntering.name}
                </span>
              </div>
            </div>
          )}

          {/* Ações pós-jogo */}
          <div className="space-y-2 pt-1">
            {peladaState?.teamStaying && peladaState?.teamEntering ? (
              <button
                type="button"
                onClick={handleStartNextMatch}
                disabled={creatingNextMatch}
                className="btn btn-primary btn-lg w-full flex items-center justify-center gap-2 shadow-xl cursor-pointer"
              >
                <Play className="w-5 h-5 fill-current" />
                <span>
                  {creatingNextMatch
                    ? 'Iniciando...'
                    : `Iniciar Próxima Partida (${PELADA_MATCH_DURATION_MINUTES} min)`}
                </span>
              </button>
            ) : null}

            <Link
              href={`/rounds/${match.round_id}`}
              className="btn btn-secondary w-full text-xs py-2.5 flex items-center justify-center gap-1.5"
            >
              <span>Voltar para a Rodada</span>
            </Link>
          </div>
        </div>
      )}

      {/* GOALKEEPER SWITCHER MODAL */}
      {gkModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="card w-full max-w-sm overflow-hidden flex flex-col max-h-[85vh] animate-scale-in border-2 border-[var(--accent)] shadow-2xl">
            <div
              className="p-4 flex items-center justify-between"
              style={{ background: 'var(--surface-hover)', borderBottom: '1px solid var(--border-color)' }}
            >
              <div>
                <span className="text-[10px] uppercase font-bold text-muted">Troca durante o jogo</span>
                <h3 className="font-extrabold text-sm text-white flex items-center gap-1.5">
                  <span>🧤 Escolher Goleiro - {gkModalTeamObj?.name}</span>
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setGkModal({ open: false, team: 'A' })}
                className="p-1 rounded-lg text-muted hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-2 flex-1">
              {gkModalPlayers.map((player) => {
                const isCurrentGk = activeGkId === player.id;
                return (
                  <button
                    key={player.id}
                    type="button"
                    onClick={() => handleSelectGoalkeeper(player.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left ${
                      isCurrentGk ? 'ring-2 ring-[var(--accent)]' : 'hover:scale-[1.01]'
                    }`}
                    style={{
                      background: isCurrentGk ? 'rgba(103,61,230,0.15)' : 'var(--surface-2)',
                      borderColor: isCurrentGk ? 'var(--accent)' : 'var(--border-color)',
                    }}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-base">🧤</span>
                      <div>
                        <span className="font-bold text-xs text-white block">
                          {getFirstNameOnly(player.name, player.nickname)}
                        </span>
                        <StarRating stars={player.stars ?? 2} size={11} />
                      </div>
                    </div>
                    {isCurrentGk && (
                      <span className="text-[10px] font-bold text-[var(--accent)] uppercase tracking-wider">
                        No Gol
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* GOAL REGISTRATION MODAL */}
      {goalModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="card w-full max-w-sm overflow-hidden flex flex-col max-h-[85vh] animate-scale-in border-2 border-[var(--accent)] shadow-2xl">
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
                className="p-1 rounded-lg text-muted hover:text-white"
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
                  activePlayers.map((player) => {
                    const isGk =
                      (goalModal.teamId === match.team_a?.id && player.id === match.goalkeeper_a_id) ||
                      (goalModal.teamId === match.team_b?.id && player.id === match.goalkeeper_b_id);

                    return (
                      <button
                        key={player.id}
                        type="button"
                        onClick={() => setGoalModal((prev) => ({ ...prev, scorerId: player.id }))}
                        className="w-full flex items-center justify-between p-3 rounded-xl transition-all text-left border"
                        style={{
                          background: 'var(--surface-hover)',
                          borderColor: 'var(--border-color)',
                        }}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="font-bold text-xs text-white">
                            {getFirstNameOnly(player.name, player.nickname)}
                          </span>
                          <StarRating stars={player.stars ?? 2} size={11} />
                          {isGk && <span className="text-xs" title="Goleiro">🧤</span>}
                        </div>
                        <span className="text-xl">⚽</span>
                      </button>
                    );
                  })
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
                    Gol Individual (Sem assistência)
                  </button>

                  <p className="text-[11px] font-bold uppercase tracking-wider mb-2 px-1" style={{ color: 'var(--muted)' }}>
                    Ou selecione o autor do passe:
                  </p>

                  {otherPlayers.map((player) => (
                    <button
                      key={player.id}
                      type="button"
                      onClick={() => handleRegisterGoal(player.id)}
                      disabled={loading}
                      className="w-full flex items-center justify-between p-3 rounded-xl transition-all text-left border"
                      style={{
                        background: 'var(--surface-hover)',
                        borderColor: 'var(--border-color)',
                      }}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="font-bold text-xs text-white">
                          {getFirstNameOnly(player.name, player.nickname)}
                        </span>
                        <StarRating stars={player.stars ?? 2} size={11} />
                      </div>
                      <span className="text-xl">🎯</span>
                    </button>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Colete Color Picker Modal */}
      <BibColorPickerModal
        isOpen={bibColorModal.open}
        onClose={() => setBibColorModal((prev) => ({ ...prev, open: false }))}
        currentColor={bibColorModal.currentColor}
        teamName={bibColorModal.teamName}
        onSelectColor={handleSelectBibColor}
      />
    </div>
  );
}
