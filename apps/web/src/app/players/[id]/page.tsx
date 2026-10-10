import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ChevronRight, Calendar } from 'lucide-react';
import { playersService } from '../../../services/players.service';
import { getInitials, getDisplayName, calculateWinRate, formatDateShort } from '../../../lib/utils';

export const revalidate = 0;

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PlayerProfilePage({ params }: PageProps) {
  const { id } = await params;

  let playerProfile;
  try {
    playerProfile = await playersService.getById(id);
  } catch {
    notFound();
  }

  if (!playerProfile) {
    notFound();
  }

  const stats = playerProfile.stats || {
    total_games: 0,
    total_goals: 0,
    total_assists: 0,
    total_wins: 0,
    total_draws: 0,
    total_losses: 0,
  };

  const points = stats.total_wins * 3 + stats.total_draws;
  const winRate = calculateWinRate(stats.total_wins, stats.total_draws, stats.total_games);
  const history = playerProfile.history || [];

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <Link
          href="/players"
          className="inline-flex items-center gap-2 text-sm font-semibold transition-colors hover:text-[var(--foreground)]"
          style={{ color: 'var(--muted)' }}
        >
          <ArrowLeft className="w-4 h-4" />
          Players
        </Link>
      </div>

      {/* Hero Profile Card */}
      <div className="card p-6 flex flex-col items-center text-center relative overflow-hidden">
        <div
          className="absolute -top-12 -right-12 w-36 h-36 rounded-full blur-3xl opacity-20 pointer-events-none"
          style={{ background: 'var(--accent)' }}
        />

        {/* Avatar */}
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-black mb-4 shadow-xl"
          style={{
            background: 'linear-gradient(135deg, var(--accent-dark), var(--accent))',
            color: '#fff',
            boxShadow: '0 8px 24px rgba(249,115,22,0.25)',
          }}
        >
          {getInitials(playerProfile.name)}
        </div>

        <h1
          className="text-2xl font-bold"
          style={{ fontFamily: "'Barlow Condensed', sans-serif", color: 'var(--foreground)' }}
        >
          {getDisplayName(playerProfile.name, playerProfile.nickname)}
        </h1>

        <div className="flex items-center gap-2 mt-1">
          <span className="text-sm text-amber-400 font-bold">
            {'⭐'.repeat(playerProfile.stars ?? 2)}
          </span>
          <span className="text-xs text-muted">
            ({playerProfile.stars === 1 ? 'Nível 1 - Básico' : playerProfile.stars === 2 ? 'Nível 2 - Médio' : 'Nível 3 - Craque'})
          </span>
        </div>

        {playerProfile.nickname && (
          <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
            {playerProfile.name}
          </p>
        )}

        {/* Highlight points & winrate */}
        <div
          className="mt-6 py-3 px-6 rounded-2xl inline-flex items-center gap-6"
          style={{ background: 'var(--surface-hover)', border: '1px solid var(--border-color)' }}
        >
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
              Points
            </span>
            <span
              className="stat-number text-2xl font-black"
              style={{ color: 'var(--accent)' }}
            >
              {points}
            </span>
          </div>

          <div className="w-px h-8" style={{ background: 'var(--border-color)' }} />

          <div className="flex flex-col items-center">
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
              Win Rate
            </span>
            <span className="stat-number text-2xl font-black" style={{ color: 'var(--foreground)' }}>
              {winRate}%
            </span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <section className="space-y-3">
        <h2
          className="text-sm font-bold uppercase tracking-wider px-1"
          style={{ color: 'var(--muted)' }}
        >
          Overall Statistics
        </h2>

        <div className="grid grid-cols-2 gap-3">
          <div className="card p-4 flex flex-col justify-between">
            <span className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>
              Games
            </span>
            <p className="stat-number text-2xl mt-2" style={{ color: 'var(--foreground)' }}>
              {stats.total_games}
            </p>
          </div>

          <div className="card p-4 flex flex-col justify-between">
            <span className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>
              Wins
            </span>
            <p className="stat-number text-2xl mt-2" style={{ color: 'var(--success)' }}>
              {stats.total_wins}
            </p>
          </div>

          <div className="card p-4 flex flex-col justify-between">
            <span className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>
              Goals Scored
            </span>
            <p className="stat-number text-2xl mt-2" style={{ color: 'var(--accent)' }}>
              {stats.total_goals}
            </p>
          </div>

          <div className="card p-4 flex flex-col justify-between">
            <span className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>
              Assists
            </span>
            <p className="stat-number text-2xl mt-2" style={{ color: 'var(--foreground)' }}>
              {stats.total_assists}
            </p>
          </div>
        </div>

        {/* Detailed record bar */}
        <div className="card p-4 flex items-center justify-around text-center">
          <div>
            <p className="text-xs font-bold" style={{ color: 'var(--success)' }}>
              {stats.total_wins}W
            </p>
            <p className="text-[10px]" style={{ color: 'var(--muted)' }}>Wins</p>
          </div>
          <div className="w-px h-6" style={{ background: 'var(--border-color)' }} />
          <div>
            <p className="text-xs font-bold" style={{ color: 'var(--warning)' }}>
              {stats.total_draws}D
            </p>
            <p className="text-[10px]" style={{ color: 'var(--muted)' }}>Draws</p>
          </div>
          <div className="w-px h-6" style={{ background: 'var(--border-color)' }} />
          <div>
            <p className="text-xs font-bold" style={{ color: 'var(--danger)' }}>
              {stats.total_losses}L
            </p>
            <p className="text-[10px]" style={{ color: 'var(--muted)' }}>Losses</p>
          </div>
        </div>
      </section>

      {/* History */}
      <section className="space-y-3">
        <h2
          className="text-sm font-bold uppercase tracking-wider px-1"
          style={{ color: 'var(--muted)' }}
        >
          Round History
        </h2>

        {history.length === 0 ? (
          <div className="card p-6 text-center">
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              Has not participated in any finished round yet.
            </p>
          </div>
        ) : (
          <div className="card overflow-hidden">
            {history.map((h, idx) => (
              <Link
                key={h.id || idx}
                href={`/rounds/${h.round_id}`}
                className={`flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-[var(--surface-hover)] ${
                  idx < history.length - 1 ? 'border-b border-[var(--border-color)]' : ''
                }`}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-bold"
                  style={{ background: 'var(--surface-hover)', color: 'var(--accent)' }}
                >
                  <Calendar className="w-4 h-4" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold" style={{ color: 'var(--foreground)' }}>
                    {formatDateShort(h.round?.date)}
                  </p>
                  <div className="flex items-center gap-3 mt-0.5 text-xs">
                    <span style={{ color: 'var(--muted)' }}>⚽ {h.goals} goals</span>
                    <span style={{ color: 'var(--muted)' }}>🎯 {h.assists} assists</span>
                    <span
                      className="font-bold"
                      style={{
                        color:
                          h.wins > h.losses
                            ? 'var(--success)'
                            : h.wins === h.losses
                            ? 'var(--warning)'
                            : 'var(--danger)',
                      }}
                    >
                      {h.wins}W {h.draws}D {h.losses}L
                    </span>
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <span className="font-bold text-sm" style={{ color: 'var(--accent)' }}>
                    +{h.wins * 3 + h.draws} pts
                  </span>
                </div>

                <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--muted)' }} />
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
