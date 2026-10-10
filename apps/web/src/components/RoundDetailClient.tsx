'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  RoundWithDetails,
  roundsService,
  TeamWithDetails,
  TeamPlayer,
} from '../services/rounds.service';
import { formatDateBR, getInitials, getDisplayName } from '../lib/utils';
import {
  ArrowLeft,
  Users,
  Swords,
  Plus,
  ArrowRightLeft,
  X,
  ChevronRight,
  Play,
  Trophy,
} from 'lucide-react';
import { MatchCreator } from './MatchCreator';
import { StarRating } from './StarRating';
import { matchesService } from '../services/matches.service';
import {
  determinePeladaState,
  PELADA_MATCH_DURATION_MINUTES,
  PELADA_GOAL_LIMIT,
} from '../lib/peladaRules';

interface RoundDetailClientProps {
  initialRound: RoundWithDetails;
}

export function RoundDetailClient({ initialRound }: RoundDetailClientProps) {
  const router = useRouter();
  const [round, setRound] = useState<RoundWithDetails>(initialRound);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Modals
  const [showMatchCreator, setShowMatchCreator] = useState(false);
  const [showReallocation, setShowReallocation] = useState(false);

  // Reallocation local state
  const [teamsState, setTeamsState] = useState<TeamWithDetails[]>(round.teams);
  const [selectedPlayerForMove, setSelectedPlayerForMove] = useState<{
    player: TeamPlayer;
    fromTeamId: string;
  } | null>(null);

  const isActive = round.status === 'active';
  const isFinished = round.status === 'finished';

  const [creatingNext, setCreatingNext] = useState(false);

  // Regra da Pelada (Rei da Mesa)
  const peladaState = determinePeladaState(round.teams, round.matches);

  async function handleStartSuggestedMatch() {
    if (!peladaState.teamStaying || !peladaState.teamEntering) return;
    setCreatingNext(true);
    try {
      const res = await matchesService.create({
        roundId: round.id,
        teamAId: peladaState.teamStaying.id,
        teamBId: peladaState.teamEntering.id,
        matchOrder: peladaState.nextMatchOrder,
        goalkeeperAId: peladaState.suggestedGkAId || null,
        goalkeeperBId: peladaState.suggestedGkBId || null,
      });
      router.push(`/rounds/${round.id}/matches/${res.matchId}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao criar próxima partida.');
      setCreatingNext(false);
    }
  }

  // Status transitions
  async function handleStatusChange(newStatus: 'active' | 'finished') {
    if (newStatus === 'finished') {
      if (!confirm('Do you want to end this round? No matches can be edited after ending.')) {
        return;
      }
    }

    setLoading(true);
    try {
      await roundsService.updateStatus(round.id, newStatus);
      const updated = await roundsService.getById(round.id);
      setRound(updated);
      setTeamsState(updated.teams);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error updating status.');
    } finally {
      setLoading(false);
    }
  }

  // Open Reallocation
  function openReallocationModal() {
    setTeamsState(JSON.parse(JSON.stringify(round.teams)));
    setSelectedPlayerForMove(null);
    setShowReallocation(true);
  }

  // Move player in reallocation state
  function movePlayer(targetTeamId: string) {
    if (!selectedPlayerForMove || selectedPlayerForMove.fromTeamId === targetTeamId) {
      setSelectedPlayerForMove(null);
      return;
    }

    const { player, fromTeamId } = selectedPlayerForMove;

    setTeamsState((prev) =>
      prev.map((t) => {
        if (t.id === fromTeamId) {
          return { ...t, players: t.players.filter((p) => p.id !== player.id) };
        }
        if (t.id === targetTeamId) {
          return { ...t, players: [...t.players, player] };
        }
        return t;
      }),
    );

    setSelectedPlayerForMove(null);
  }

  // Save reallocation
  async function saveReallocation() {
    setLoading(true);
    setError('');

    try {
      await Promise.all(
        teamsState.map((team) =>
          roundsService.updateTeamPlayers(
            round.id,
            team.id,
            team.players.map((p) => p.id),
          ),
        ),
      );

      const updated = await roundsService.getById(round.id);
      setRound(updated);
      setTeamsState(updated.teams);
      setShowReallocation(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error reallocating squads.');
    } finally {
      setLoading(false);
    }
  }

  // Helper to get team by id
  const getTeam = (id: string) => round.teams.find((t) => t.id === id);

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <Link
          href="/rounds"
          className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors"
          style={{ background: 'var(--surface-hover)', color: 'var(--muted)' }}
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>

        {/* Status button / badge */}
        <div className="flex items-center gap-2">
          {!isFinished && (
            <button
              type="button"
              onClick={() => handleStatusChange(isActive ? 'finished' : 'active')}
              disabled={loading}
              className={`btn text-xs py-1.5 px-3 ${
                isActive ? 'btn-secondary' : 'btn-primary'
              }`}
              style={{
                borderColor: isActive ? 'var(--danger)' : undefined,
                color: isActive ? 'var(--danger)' : undefined,
              }}
            >
              {isActive ? 'End Round' : 'Activate Round'}
            </button>
          )}

          <div
            className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"
            style={{
              background: isActive
                ? 'rgba(249,115,22,0.15)'
                : isFinished
                ? 'rgba(16,185,129,0.12)'
                : 'var(--surface-hover)',
              color: isActive
                ? 'var(--accent)'
                : isFinished
                ? 'var(--success)'
                : 'var(--muted)',
            }}
          >
            {isActive && <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />}
            {isActive ? 'Live' : isFinished ? 'Finished' : 'Draft'}
          </div>
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

      {/* Hero Session Card */}
      <div className="card p-5 relative overflow-hidden">
        {isActive && (
          <div
            className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-15 pointer-events-none"
            style={{ background: 'var(--accent)' }}
          />
        )}

        <div className="flex items-center justify-between">
          <div>
            <span
              className="text-xs font-bold uppercase tracking-wider"
              style={{ color: 'var(--accent)' }}
            >
              Round
            </span>
            <h1
              className="text-2xl font-bold mt-0.5"
              style={{ fontFamily: "'Barlow Condensed', sans-serif", color: 'var(--foreground)' }}
            >
              {formatDateBR(round.date)}
            </h1>
            {round.notes && (
              <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
                {round.notes}
              </p>
            )}
          </div>

          <div className="text-right">
            <span className="text-xs font-bold block" style={{ color: 'var(--foreground)' }}>
              {round.teams.length} Teams
            </span>
            <span className="text-xs block" style={{ color: 'var(--muted)' }}>
              {round.matches.length} Matches
            </span>
          </div>
        </div>
      </div>

      {/* TEAMS SECTION & REALLOCATION */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2
            className="text-sm font-bold uppercase tracking-wider flex items-center gap-2"
            style={{ color: 'var(--muted)' }}
          >
            <Users className="w-4 h-4 text-[var(--accent)]" />
            Times & Elencos ({round.teams.length})
          </h2>

          {!isFinished && (
            <button
              type="button"
              onClick={openReallocationModal}
              className="btn btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5"
              style={{ color: 'var(--accent)', borderColor: 'var(--accent)' }}
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              Reorganizar
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {round.teams.map((team) => {
            const isPlayingNow =
              peladaState.currentMatch &&
              (peladaState.currentMatch.team_a_id === team.id ||
                peladaState.currentMatch.team_b_id === team.id);
            const cercaIndex = peladaState.cercaQueue.findIndex((t) => t.id === team.id);
            const isNaCerca = cercaIndex !== -1 && !isPlayingNow;

            return (
              <div key={team.id} className="card p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-[var(--border-color)]">
                    <span
                      className="w-3.5 h-3.5 rounded-full shadow-sm flex-shrink-0"
                      style={{ backgroundColor: team.color || 'var(--accent)' }}
                    />
                    <span className="font-bold text-sm truncate" style={{ color: 'var(--foreground)' }}>
                      {team.name}
                    </span>

                    <div className="ml-auto flex items-center gap-1.5 flex-shrink-0">
                      {isPlayingNow ? (
                        <span className="text-[10px] font-black uppercase text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded-md border border-emerald-500/30">
                          Em Campo
                        </span>
                      ) : isNaCerca ? (
                        <span className="text-[10px] font-black uppercase text-amber-300 bg-amber-950/50 px-2 py-0.5 rounded-md border border-amber-500/30">
                          Cerca #{cercaIndex + 1}
                        </span>
                      ) : null}

                      <span
                        className="text-[11px] font-bold px-1.5 py-0.5 rounded-md text-muted"
                        style={{ background: 'var(--surface-hover)' }}
                      >
                        {team.players.length} jogs
                      </span>
                    </div>
                  </div>

                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {team.players.length === 0 ? (
                    <p className="text-xs italic py-2" style={{ color: 'var(--muted)' }}>
                      No players assigned
                    </p>
                  ) : (
                    team.players.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs"
                        style={{ background: 'var(--surface-hover)' }}
                      >
                        <span className="font-bold truncate" style={{ color: 'var(--foreground)' }}>
                          {p.nickname?.trim() || p.name.trim().split(/\s+/)[0]}
                        </span>
                        <StarRating stars={p.stars ?? 2} size={11} />
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          );
        })}
        </div>
      </section>

      {/* MATCHES SECTION */}
      <section className="space-y-3 pt-2">
        <div className="flex items-center justify-between px-1">
          <h2
            className="text-sm font-bold uppercase tracking-wider flex items-center gap-2"
            style={{ color: 'var(--muted)' }}
          >
            <Swords className="w-4 h-4 text-[var(--accent)]" />
            Partidas ({round.matches.length})
          </h2>

          {!isFinished && (
            <button
              type="button"
              onClick={() => setShowMatchCreator(true)}
              className="btn btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              Nova Manual
            </button>
          )}
        </div>

        {/* Card inteligente da Próxima Partida (Rei da Mesa) */}
        {!isFinished && !peladaState.currentMatch && peladaState.teamStaying && peladaState.teamEntering && (
          <div
            className="card p-4 border-2 border-[var(--accent)] shadow-xl space-y-3 relative overflow-hidden animate-fade-in"
            style={{
              background: 'linear-gradient(135deg, rgba(103,61,230,0.12), rgba(17,18,30,0.95))',
              boxShadow: '0 0 25px rgba(103, 61, 230, 0.25)',
            }}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-[var(--accent-light)] flex items-center gap-1">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                Rei da Mesa • Próxima Partida ({PELADA_MATCH_DURATION_MINUTES} min ou 2 gols)
              </span>
              <span className="text-[11px] font-extrabold text-muted">Jogo #{peladaState.nextMatchOrder}</span>
            </div>

            <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border-color)]">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="w-3.5 h-3.5 rounded-full flex-shrink-0" style={{ backgroundColor: peladaState.teamStaying.color }} />
                <div className="min-w-0">
                  <span className="text-xs font-black text-white block truncate">{peladaState.teamStaying.name}</span>
                  <span className="text-[9px] text-emerald-400 font-bold uppercase">Fica em Campo</span>
                </div>
              </div>

              <div className="text-xs font-black text-muted px-2">VS</div>

              <div className="flex items-center gap-2 flex-1 justify-end min-w-0 text-right">
                <div className="min-w-0">
                  <span className="text-xs font-black text-white block truncate">{peladaState.teamEntering.name}</span>
                  <span className="text-[9px] text-[var(--accent-light)] font-bold uppercase">Entra da Cerca</span>
                </div>
                <span className="w-3.5 h-3.5 rounded-full flex-shrink-0" style={{ backgroundColor: peladaState.teamEntering.color }} />
              </div>
            </div>

            {peladaState.reason && (
              <p className="text-[11px] text-muted italic px-1">
                ℹ️ {peladaState.reason}
              </p>
            )}

            <button
              type="button"
              onClick={handleStartSuggestedMatch}
              disabled={creatingNext}
              className="btn btn-primary w-full py-2.5 text-xs font-bold flex items-center justify-center gap-2 shadow-lg cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{creatingNext ? 'Iniciando Partida...' : `Iniciar Partida #${peladaState.nextMatchOrder} Agora`}</span>
            </button>
          </div>
        )}

        {round.matches.length === 0 ? (
          <div className="card p-8 text-center space-y-3">
            <p className="text-xs" style={{ color: 'var(--muted)' }}>
              Nenhuma partida registrada nesta rodada ainda.
            </p>
            {!isFinished && peladaState.teamStaying && peladaState.teamEntering && (
              <button
                type="button"
                onClick={handleStartSuggestedMatch}
                disabled={creatingNext}
                className="btn btn-primary text-xs flex items-center justify-center gap-1.5 mx-auto"
              >
                <Play className="w-4 h-4 fill-current" />
                Iniciar Partida 1 (Sorteada)
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2.5">
            {round.matches.map((m) => {
              const teamA = getTeam(m.team_a_id);
              const teamB = getTeam(m.team_b_id);
              const matchIsLive = m.status === 'in_progress';
              const matchIsFinished = m.status === 'finished';

              return (
                <Link
                  key={m.id}
                  href={`/rounds/${round.id}/matches/${m.id}`}
                  className="card card-hover p-4 block transition-all"
                  style={{
                    borderColor: matchIsLive ? 'var(--accent)' : 'var(--border-color)',
                  }}
                >
                  <div className="flex items-center justify-between">
                    {/* Team A */}
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      <span
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: teamA?.color || 'var(--accent)' }}
                      />
                      <span className="font-bold text-xs truncate" style={{ color: 'var(--foreground)' }}>
                        {teamA?.name || 'Team A'}
                      </span>
                    </div>

                    {/* Score & Status */}
                    <div className="flex flex-col items-center px-4">
                      <div className="flex items-center gap-2">
                        <span
                          className="stat-number text-xl font-black"
                          style={{ color: 'var(--foreground)' }}
                        >
                          {m.score_a}
                        </span>
                        <span className="text-xs font-black" style={{ color: 'var(--muted)' }}>
                          ×
                        </span>
                        <span
                          className="stat-number text-xl font-black"
                          style={{ color: 'var(--foreground)' }}
                        >
                          {m.score_b}
                        </span>
                      </div>

                      <span
                        className="text-[9px] font-bold uppercase tracking-wider mt-0.5"
                        style={{
                          color: matchIsLive
                            ? 'var(--accent)'
                            : matchIsFinished
                            ? 'var(--success)'
                            : 'var(--muted)',
                        }}
                      >
                        {matchIsLive ? '● Ao Vivo' : matchIsFinished ? 'Finalizada' : 'Agendada'}
                      </span>
                    </div>

                    {/* Team B */}
                    <div className="flex items-center gap-2.5 flex-1 justify-end min-w-0">
                      <span className="font-bold text-xs truncate text-right" style={{ color: 'var(--foreground)' }}>
                        {teamB?.name || 'Team B'}
                      </span>
                      <span
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: teamB?.color || 'var(--accent)' }}
                      />
                      <ChevronRight className="w-4 h-4 ml-1 flex-shrink-0" style={{ color: 'var(--muted)' }} />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* MATCH CREATOR MODAL */}
      {showMatchCreator && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
          <div className="card w-full max-w-md p-5 relative overflow-hidden animate-slide-in-bottom">
            <button
              type="button"
              onClick={() => setShowMatchCreator(false)}
              className="absolute top-4 right-4 text-xs p-1"
              style={{ color: 'var(--muted)' }}
            >
              <X className="w-5 h-5" />
            </button>

            <MatchCreator round={round} />
          </div>
        </div>
      )}

      {/* TEAM REALLOCATION MODAL */}
      {showReallocation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in">
          <div className="card w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden animate-slide-in-bottom">
            {/* Header */}
            <div
              className="p-4 flex items-center justify-between"
              style={{ background: 'var(--surface-hover)', borderBottom: '1px solid var(--border-color)' }}
            >
              <div>
                <h3 className="font-bold text-sm" style={{ color: 'var(--foreground)' }}>
                  Team Reallocation
                </h3>
                <p className="text-[11px]" style={{ color: 'var(--muted)' }}>
                  Click on a player and select their destination team
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowReallocation(false)}
                className="p-1 rounded-lg"
                style={{ color: 'var(--muted)' }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Selected player indicator */}
            {selectedPlayerForMove && (
              <div
                className="px-4 py-2.5 flex items-center justify-between text-xs font-semibold"
                style={{ background: 'rgba(249,115,22,0.15)', color: 'var(--accent)' }}
              >
                <span>
                  Moving <strong>{getDisplayName(selectedPlayerForMove.player.name, selectedPlayerForMove.player.nickname)}</strong>: select destination team
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedPlayerForMove(null)}
                  className="text-[10px] uppercase font-bold underline"
                >
                  Cancel
                </button>
              </div>
            )}

            {/* Teams buckets in modal */}
            <div className="p-4 overflow-y-auto space-y-3 flex-1">
              {teamsState.map((team) => {
                const isTarget = selectedPlayerForMove && selectedPlayerForMove.fromTeamId !== team.id;

                return (
                  <div
                    key={team.id}
                    className={`card p-3 transition-all ${
                      isTarget ? 'border-dashed border-2 cursor-pointer hover:border-[var(--accent)]' : ''
                    }`}
                    style={{
                      background: isTarget ? 'rgba(249,115,22,0.05)' : 'var(--surface)',
                    }}
                    onClick={() => {
                      if (selectedPlayerForMove && selectedPlayerForMove.fromTeamId !== team.id) {
                        movePlayer(team.id);
                      }
                    }}
                  >
                    <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-[var(--border-color)]">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: team.color || 'var(--accent)' }}
                        />
                        <span className="font-bold text-xs" style={{ color: 'var(--foreground)' }}>
                          {team.name}
                        </span>
                      </div>

                      {isTarget ? (
                        <span className="text-[10px] font-bold text-[var(--accent)]">
                          Tap to transfer here ↵
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold" style={{ color: 'var(--muted)' }}>
                          {team.players.length} players
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-1.5 min-h-[2.5rem]">
                      {team.players.map((p) => {
                        const isSelected = selectedPlayerForMove?.player.id === p.id;

                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isSelected) {
                                setSelectedPlayerForMove(null);
                              } else {
                                setSelectedPlayerForMove({ player: p, fromTeamId: team.id });
                              }
                            }}
                            className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
                              isSelected ? 'ring-2 ring-[var(--accent)]' : ''
                            }`}
                            style={{
                              background: isSelected ? 'var(--accent)' : 'var(--surface-hover)',
                              color: isSelected ? '#fff' : 'var(--foreground)',
                              border: '1px solid var(--border-color)',
                            }}
                          >
                            <span>{p.nickname?.trim() || p.name.trim().split(/\s+/)[0]}</span>
                            <StarRating stars={p.stars ?? 2} size={11} />
                            <ArrowRightLeft className="w-3 h-3 opacity-60" />
                          </button>
                        );
                      })}

                      {team.players.length === 0 && (
                        <span className="text-xs italic py-1" style={{ color: 'var(--muted)' }}>
                          Empty
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal actions */}
            <div
              className="p-3.5 flex gap-2"
              style={{ background: 'var(--surface-hover)', borderTop: '1px solid var(--border-color)' }}
            >
              <button
                type="button"
                onClick={() => setShowReallocation(false)}
                className="btn btn-secondary flex-1 text-xs"
              >
                Discard
              </button>
              <button
                type="button"
                onClick={saveReallocation}
                disabled={loading}
                className="btn btn-primary flex-[2] text-xs"
              >
                {loading ? 'Saving...' : 'Confirm Reallocation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
