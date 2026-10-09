'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { matchesService } from '../services/matches.service';
import { Swords, ArrowLeft, Play } from 'lucide-react';
import Link from 'next/link';

interface MatchCreatorProps {
  round: {
    id: string;
    date: string;
    teams: { id: string; name: string; color: string; players?: any[] }[];
    matches?: any[];
  };
}

export function MatchCreator({ round }: MatchCreatorProps) {
  const router = useRouter();
  const [teamAId, setTeamAId] = useState<string>('');
  const [teamBId, setTeamBId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const teams = round?.teams || [];

  async function handleStart() {
    if (!teamAId || !teamBId) {
      setError('Select both teams to start the match.');
      return;
    }
    if (teamAId === teamBId) {
      setError('Opponent teams must be different.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const order = (round?.matches?.length || 0) + 1;
      const res = await matchesService.create({
        roundId: round.id,
        teamAId,
        teamBId,
        matchOrder: order,
      });

      router.push(`/rounds/${round.id}/matches/${res.matchId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error creating match.');
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
            New Match
          </h1>
          <p className="text-xs" style={{ color: 'var(--muted)' }}>
            Select the two teams facing each other
          </p>
        </div>
      </div>

      <div className="card p-6 flex flex-col items-center gap-6">
        {error && (
          <div
            className="w-full p-3 rounded-lg text-xs font-semibold text-center"
            style={{
              background: 'rgba(239,68,68,0.12)',
              color: 'var(--danger)',
              border: '1px solid rgba(239,68,68,0.2)',
            }}
          >
            {error}
          </div>
        )}

        {/* Team A */}
        <div className="w-full space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider pl-1" style={{ color: 'var(--muted)' }}>
            Team 1
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
                  className={`p-3.5 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                    isSelected ? 'ring-2' : ''
                  }`}
                  style={{
                    background: isSelected ? 'rgba(249,115,22,0.12)' : 'var(--surface)',
                    borderColor: isSelected ? 'var(--accent)' : 'var(--border-color)',
                    opacity: isDisabled ? 0.35 : 1,
                    cursor: isDisabled ? 'not-allowed' : 'pointer',
                  }}
                >
                  <div
                    className="w-5 h-5 rounded-full shadow-sm"
                    style={{ backgroundColor: t.color || 'var(--accent)' }}
                  />
                  <span className="text-xs font-bold truncate w-full text-center" style={{ color: 'var(--foreground)' }}>
                    {t.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* VS badge */}
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center -my-2 shadow-lg"
          style={{ background: 'var(--surface-hover)', border: '2px solid var(--border-color)' }}
        >
          <Swords className="w-5 h-5" style={{ color: 'var(--accent)' }} />
        </div>

        {/* Team B */}
        <div className="w-full space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider pl-1" style={{ color: 'var(--muted)' }}>
            Team 2
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
                  className={`p-3.5 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                    isSelected ? 'ring-2' : ''
                  }`}
                  style={{
                    background: isSelected ? 'rgba(249,115,22,0.12)' : 'var(--surface)',
                    borderColor: isSelected ? 'var(--accent)' : 'var(--border-color)',
                    opacity: isDisabled ? 0.35 : 1,
                    cursor: isDisabled ? 'not-allowed' : 'pointer',
                  }}
                >
                  <div
                    className="w-5 h-5 rounded-full shadow-sm"
                    style={{ backgroundColor: t.color || 'var(--accent)' }}
                  />
                  <span className="text-xs font-bold truncate w-full text-center" style={{ color: 'var(--foreground)' }}>
                    {t.name}
                  </span>
                </button>
              );
            })}
          </div>
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
        {loading ? 'Starting...' : 'Start Match'}
      </button>
    </div>
  );
}

