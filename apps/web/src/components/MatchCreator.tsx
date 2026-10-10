'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { matchesService } from '../services/matches.service';
import { Swords, ArrowLeft, Play, Shield, RefreshCw } from 'lucide-react';
import Link from 'next/link';

interface MatchCreatorProps {
  round: {
    id: string;
    date: string;
    teams: {
      id: string;
      name: string;
      color: string;
      players?: { id: string; name: string; nickname?: string | null; stars?: number }[];
    }[];
    matches?: any[];
  };
}

// Algoritmo de Rodízio Justo de Goleiro:
// Todo jogador joga ao menos 1 vez no gol. Ao todos completarem 1 partida,
// o ciclo se repete mantendo a mesma ordem.
function getNextGoalkeeper(
  team?: {
    id: string;
    players?: { id: string; name: string; nickname?: string | null }[];
  },
  matches: any[] = [],
): { id: string; count: number } {
  if (!team || !team.players || team.players.length === 0) {
    return { id: '', count: 0 };
  }

  const players = team.players;
  if (players.length === 1) {
    return { id: players[0].id, count: 0 };
  }

  const gkCounts: Record<string, number> = {};
  for (const p of players) {
    gkCounts[p.id] = 0;
  }

  for (const m of matches) {
    if (m.team_a_id === team.id && m.goalkeeper_a_id) {
      if (gkCounts[m.goalkeeper_a_id] !== undefined) {
        gkCounts[m.goalkeeper_a_id] += 1;
      }
    }
    if (m.team_b_id === team.id && m.goalkeeper_b_id) {
      if (gkCounts[m.goalkeeper_b_id] !== undefined) {
        gkCounts[m.goalkeeper_b_id] += 1;
      }
    }
  }

  const minCount = Math.min(...players.map((p) => gkCounts[p.id] || 0));
  const candidate = players.find((p) => (gkCounts[p.id] || 0) === minCount);

  return {
    id: candidate ? candidate.id : players[0].id,
    count: candidate ? gkCounts[candidate.id] || 0 : 0,
  };
}

export function MatchCreator({ round }: MatchCreatorProps) {
  const router = useRouter();
  const [teamAId, setTeamAId] = useState<string>('');
  const [teamBId, setTeamBId] = useState<string>('');
  const [goalkeeperAId, setGoalkeeperAId] = useState<string>('');
  const [goalkeeperBId, setGoalkeeperBId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const teams = round?.teams || [];
  const matches = round?.matches || [];

  const selectedTeamA = teams.find((t) => t.id === teamAId);
  const selectedTeamB = teams.find((t) => t.id === teamBId);

  // Auto-seleção do goleiro conforme rodízio quando o time é selecionado
  useEffect(() => {
    if (selectedTeamA) {
      const gk = getNextGoalkeeper(selectedTeamA, matches);
      setGoalkeeperAId(gk.id);
    } else {
      setGoalkeeperAId('');
    }
  }, [teamAId]);

  useEffect(() => {
    if (selectedTeamB) {
      const gk = getNextGoalkeeper(selectedTeamB, matches);
      setGoalkeeperBId(gk.id);
    } else {
      setGoalkeeperBId('');
    }
  }, [teamBId]);

  async function handleStart() {
    if (!teamAId || !teamBId) {
      setError('Selecione os dois times para iniciar a partida.');
      return;
    }
    if (teamAId === teamBId) {
      setError('Os times adversários devem ser diferentes.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const order = (matches.length || 0) + 1;
      const res = await matchesService.create({
        roundId: round.id,
        teamAId,
        teamBId,
        matchOrder: order,
        goalkeeperAId: goalkeeperAId || null,
        goalkeeperBId: goalkeeperBId || null,
      });

      router.push(`/rounds/${round.id}/matches/${res.matchId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar partida.');
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Link
          href={`/rounds/${round.id}`}
          className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors"
          style={{ background: 'var(--surface-hover)', color: 'var(--muted)' }}
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1
            className="text-xl font-bold"
            style={{ fontFamily: "'Barlow Condensed', sans-serif", color: 'var(--foreground)' }}
          >
            Nova Partida
          </h1>
          <p className="text-xs" style={{ color: 'var(--muted)' }}>
            Selecione os times e confirme os goleiros sorteados no rodízio
          </p>
        </div>
      </div>

      <div className="card p-5 flex flex-col items-center gap-5">
        {error && (
          <div
            className="w-full p-3 rounded-lg text-xs font-semibold text-center"
            style={{
              background: 'rgba(244,63,94,0.12)',
              color: 'var(--danger)',
              border: '1px solid rgba(244,63,94,0.2)',
            }}
          >
            {error}
          </div>
        )}

        {/* Team A Selection */}
        <div className="w-full space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider pl-1" style={{ color: 'var(--muted)' }}>
            Time 1
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {teams.map((t) => {
              const isSelected = teamAId === t.id;
              const isDisabled = teamBId === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTeamAId(t.id)}
                  disabled={isDisabled}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                    isSelected ? 'ring-2' : ''
                  }`}
                  style={{
                    background: isSelected ? 'rgba(204,255,0,0.12)' : 'var(--surface)',
                    borderColor: isSelected ? 'var(--accent)' : 'var(--border-color)',
                    opacity: isDisabled ? 0.35 : 1,
                    cursor: isDisabled ? 'not-allowed' : 'pointer',
                  }}
                >
                  <div
                    className="w-4 h-4 rounded-full shadow-sm"
                    style={{ backgroundColor: t.color || 'var(--accent)' }}
                  />
                  <span className="text-xs font-bold truncate w-full text-center" style={{ color: 'var(--foreground)' }}>
                    {t.name}
                  </span>
                  <span className="text-[10px] text-muted">
                    {t.players?.length || 0} jogadores
                  </span>
                </button>
              );
            })}
          </div>

          {/* Goalkeeper Team A */}
          {selectedTeamA && selectedTeamA.players && selectedTeamA.players.length > 0 && (
            <div
              className="p-3 rounded-xl mt-2 flex items-center justify-between border"
              style={{
                background: 'rgba(204,255,0,0.05)',
                borderColor: 'rgba(204,255,0,0.25)',
              }}
            >
              <div className="flex items-center gap-2">
                <span className="text-base">🧤</span>
                <div>
                  <span className="text-[10px] font-bold uppercase text-[var(--accent)] block">
                    Goleiro do Time 1 (Rodízio)
                  </span>
                  <span className="text-xs font-bold text-white">
                    {selectedTeamA.players.find((p) => p.id === goalkeeperAId)?.name || 'Nenhum selecionado'}
                  </span>
                </div>
              </div>

              <select
                value={goalkeeperAId}
                onChange={(e) => setGoalkeeperAId(e.target.value)}
                className="input py-1 px-2 text-xs max-w-[130px] rounded-lg cursor-pointer"
                style={{ borderColor: 'var(--accent)' }}
              >
                {selectedTeamA.players.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nickname || p.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* VS badge */}
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center -my-1 shadow-lg"
          style={{ background: 'var(--surface-hover)', border: '2px solid var(--border-color)' }}
        >
          <Swords className="w-5 h-5" style={{ color: 'var(--accent)' }} />
        </div>

        {/* Team B Selection */}
        <div className="w-full space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider pl-1" style={{ color: 'var(--muted)' }}>
            Time 2
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {teams.map((t) => {
              const isSelected = teamBId === t.id;
              const isDisabled = teamAId === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTeamBId(t.id)}
                  disabled={isDisabled}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                    isSelected ? 'ring-2' : ''
                  }`}
                  style={{
                    background: isSelected ? 'rgba(0,240,255,0.12)' : 'var(--surface)',
                    borderColor: isSelected ? 'var(--secondary)' : 'var(--border-color)',
                    opacity: isDisabled ? 0.35 : 1,
                    cursor: isDisabled ? 'not-allowed' : 'pointer',
                  }}
                >
                  <div
                    className="w-4 h-4 rounded-full shadow-sm"
                    style={{ backgroundColor: t.color || 'var(--secondary)' }}
                  />
                  <span className="text-xs font-bold truncate w-full text-center" style={{ color: 'var(--foreground)' }}>
                    {t.name}
                  </span>
                  <span className="text-[10px] text-muted">
                    {t.players?.length || 0} jogadores
                  </span>
                </button>
              );
            })}
          </div>

          {/* Goalkeeper Team B */}
          {selectedTeamB && selectedTeamB.players && selectedTeamB.players.length > 0 && (
            <div
              className="p-3 rounded-xl mt-2 flex items-center justify-between border"
              style={{
                background: 'rgba(0,240,255,0.05)',
                borderColor: 'rgba(0,240,255,0.25)',
              }}
            >
              <div className="flex items-center gap-2">
                <span className="text-base">🧤</span>
                <div>
                  <span className="text-[10px] font-bold uppercase text-[var(--secondary)] block">
                    Goleiro do Time 2 (Rodízio)
                  </span>
                  <span className="text-xs font-bold text-white">
                    {selectedTeamB.players.find((p) => p.id === goalkeeperBId)?.name || 'Nenhum selecionado'}
                  </span>
                </div>
              </div>

              <select
                value={goalkeeperBId}
                onChange={(e) => setGoalkeeperBId(e.target.value)}
                className="input py-1 px-2 text-xs max-w-[130px] rounded-lg cursor-pointer"
                style={{ borderColor: 'var(--secondary)' }}
              >
                {selectedTeamB.players.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nickname || p.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={handleStart}
        disabled={loading || !teamAId || !teamBId}
        className="btn btn-primary btn-lg w-full"
        style={{ opacity: loading || !teamAId || !teamBId ? 0.5 : 1 }}
      >
        <Play className="w-5 h-5 fill-current" />
        {loading ? 'Iniciando Partida...' : 'Iniciar Partida'}
      </button>
    </div>
  );
}
