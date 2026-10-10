import { Trophy } from 'lucide-react';
import Link from 'next/link';
import { rankingService, RankingEntry } from '../../services/ranking.service';

export const revalidate = 0;

async function getRankingData(): Promise<RankingEntry[]> {
  try {
    return await rankingService.getGlobal();
  } catch {
    return [];
  }
}

export default async function RankingPage() {
  const ranking = await getRankingData();

  // Top 3 for podium
  const podium = ranking.slice(0, 3);
  const podiumVisual = podium.length >= 3 ? [podium[1], podium[0], podium[2]] : podium;

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-2xl font-bold"
            style={{ fontFamily: "'Barlow Condensed', sans-serif", color: 'var(--foreground)' }}
          >
            Global Ranking
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--muted)' }}>
            Cumulative stats across all rounds
          </p>
        </div>
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: 'rgba(249,115,22,0.15)', color: 'var(--accent)' }}
        >
          <Trophy className="w-5 h-5" />
        </div>
      </div>

      {ranking.length === 0 ? (
        <div className="card p-10 text-center flex flex-col items-center justify-center space-y-3">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
            style={{ background: 'var(--surface-hover)' }}
          >
            🏆
          </div>
          <h2 className="font-bold text-base" style={{ color: 'var(--foreground)' }}>
            No ranking data yet
          </h2>
          <p className="text-sm max-w-xs" style={{ color: 'var(--muted)' }}>
            Start and finish matches in your rounds to compute player rankings!
          </p>
          <Link href="/rounds" className="btn btn-primary mt-2">
            View Rounds
          </Link>
        </div>
      ) : (
        <>
          {/* Podium */}
          {podium.length >= 3 && (
            <div className="pt-6 pb-2 flex items-end justify-center gap-2 sm:gap-4">
              {podiumVisual.map((player, idx) => {
                const position = idx === 0 ? 2 : idx === 1 ? 1 : 3;
                const isFirst = position === 1;

                const heightCls = isFirst ? 'h-32' : position === 2 ? 'h-24' : 'h-20';
                const borderColor = isFirst
                  ? 'var(--accent)'
                  : position === 2
                  ? '#94a3b8'
                  : '#d97706';
                const medalBg = isFirst
                  ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                  : position === 2
                  ? 'linear-gradient(135deg, #cbd5e1, #94a3b8)'
                  : 'linear-gradient(135deg, #b45309, #78350f)';

                return (
                  <Link
                    key={player.player_id}
                    href={`/players/${player.player_id}`}
                    className="flex flex-col items-center w-1/3 max-w-[110px] group transition-transform hover:-translate-y-1"
                  >
                    {/* Medal / Position Badge */}
                    <div className="relative mb-2 flex flex-col items-center">
                      <div
                        className="px-3 py-1 rounded-lg flex items-center justify-center text-xs font-black shadow-md border"
                        style={{
                          borderColor: borderColor,
                          background: medalBg,
                          color: isFirst ? '#080A10' : '#fff',
                        }}
                      >
                        {position === 1 ? '🥇 1º' : position === 2 ? '🥈 2º' : '🥉 3º'}
                      </div>
                    </div>

                    {/* First Name & Points */}
                    <p
                      className="font-extrabold text-sm truncate w-full text-center mt-1"
                      style={{ color: 'var(--foreground)' }}
                    >
                      {player.nickname?.trim() || player.name.trim().split(/\s+/)[0]}
                    </p>
                    <p
                      className="text-xs font-black"
                      style={{ color: isFirst ? 'var(--accent)' : 'var(--muted)' }}
                    >
                      {player.points} pts
                    </p>

                    {/* Pedestal */}
                    <div
                      className={`w-full ${heightCls} rounded-t-xl mt-2 flex flex-col items-center justify-center border-t-2 transition-all`}
                      style={{
                        background: isFirst
                          ? 'linear-gradient(to top, rgba(204,255,0,0.2), rgba(204,255,0,0.04))'
                          : 'linear-gradient(to top, rgba(255,255,255,0.06), rgba(255,255,255,0.02))',
                        borderColor: borderColor,
                      }}
                    >
                      <span className="text-[10px] font-semibold" style={{ color: 'var(--muted)' }}>
                        ⚽ {player.total_goals}
                      </span>
                      <span className="text-[10px] font-semibold" style={{ color: 'var(--muted)' }}>
                        🎯 {player.total_assists}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Full Table */}
          <div className="card overflow-hidden">
            <div
              className="flex items-center justify-between px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider"
              style={{
                background: 'var(--surface-hover)',
                borderBottom: '1px solid var(--border-color)',
                color: 'var(--muted)',
              }}
            >
              <div className="flex items-center gap-3">
                <span className="w-6 text-center">#</span>
                <span>Player</span>
              </div>
              <div className="flex items-center gap-4 text-right">
                <span className="w-8">M</span>
                <span className="w-8">W</span>
                <span className="w-8">G</span>
                <span className="w-8">A</span>
                <span className="w-12 text-right">PTS</span>
              </div>
            </div>

            {ranking.map((player, idx) => {
              const rank = idx + 1;
              const isTop3 = rank <= 3;

              return (
                <Link
                  key={player.player_id}
                  href={`/players/${player.player_id}`}
                  className={`flex items-center justify-between px-4 py-3 transition-colors hover:bg-[var(--surface-hover)] ${
                    idx < ranking.length - 1 ? 'border-b border-[var(--border-color)]' : ''
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className="w-6 text-xs font-bold text-center flex-shrink-0"
                      style={{
                        color:
                          rank === 1
                            ? 'var(--accent)'
                            : rank === 2
                            ? '#94a3b8'
                            : rank === 3
                            ? '#d97706'
                            : 'var(--muted)',
                      }}
                    >
                      {rank}
                    </span>

                    <div className="min-w-0">
                      <p className="font-bold text-sm truncate" style={{ color: 'var(--foreground)' }}>
                        {player.nickname?.trim() || player.name.trim().split(/\s+/)[0]}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-semibold text-right flex-shrink-0">
                    <span className="w-8" style={{ color: 'var(--muted)' }}>
                      {player.total_games}
                    </span>
                    <span className="w-8" style={{ color: 'var(--success)' }}>
                      {player.total_wins}
                    </span>
                    <span className="w-8" style={{ color: 'var(--foreground)' }}>
                      {player.total_goals}
                    </span>
                    <span className="w-8" style={{ color: 'var(--foreground)' }}>
                      {player.total_assists}
                    </span>
                    <span
                      className="w-12 text-right font-black text-sm"
                      style={{ color: 'var(--accent)' }}
                    >
                      {player.points}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
