import Link from 'next/link';
import { Calendar, Trophy, ChevronRight, Flame, Users } from 'lucide-react';
import { rankingService } from '../services/ranking.service';
import { peladasService } from '../services/peladas.service';

async function getDashboardData() {
  try {
    const [ranking, peladas] = await Promise.all([
      rankingService.getGlobal().catch(() => []),
      peladasService.list().catch(() => []),
    ]);
    const lastPelada = peladas.find((r) => r.status === 'finished') || peladas[0] || null;
    const activePelada = peladas.find((r) => r.status === 'active') || null;
    return { ranking: ranking.slice(0, 5), lastPelada, activePelada };
  } catch {
    return { ranking: [], lastPelada: null, activePelada: null };
  }
}

function RankBadge({ rank }: { rank: number }) {
  const cls =
    rank === 1 ? 'rank-1' : rank === 2 ? 'rank-2' : rank === 3 ? 'rank-3' : 'rank-other';
  return (
    <span className={`rank-badge ${cls}`}>{rank}</span>
  );
}

export default async function HomePage() {
  const { ranking, lastPelada, activePelada } = await getDashboardData();
  const topScorer = ranking[0] ?? null;
  const topAssister = [...ranking].sort((a, b) => b.total_assists - a.total_assists)[0] ?? null;
  const topWinner = [...ranking].sort((a, b) => b.total_wins - a.total_wins)[0] ?? null;

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Active pelada banner */}
      {activePelada && (
        <Link href={`/peladas/${activePelada.id}`} className="block">
          <div
            className="card card-hover p-5 relative overflow-hidden animate-pulse-glow"
            style={{ borderColor: 'var(--accent)' }}
          >
            <div
              className="absolute inset-0 opacity-5"
              style={{ background: 'var(--bg-accent-gradient)' }}
            />
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(249,115,22,0.15)' }}
                >
                  <Flame className="w-5 h-5" style={{ color: 'var(--accent)' }} />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--accent)' }}>
                    🔴 Ao vivo
                  </p>
                  <p className="font-bold" style={{ color: 'var(--foreground)' }}>
                    Pelada {new Date(activePelada.date).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5" style={{ color: 'var(--muted)' }} />
            </div>
          </div>
        </Link>
      )}

      {/* Highlights */}
      {ranking.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Flame className="w-4 h-4" style={{ color: 'var(--accent)' }} />
            <h2
              className="text-xs font-bold uppercase tracking-widest"
              style={{ color: 'var(--muted-light)' }}
            >
              Destaques
            </h2>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { emoji: '⚽', label: 'Artilheiro', player: topScorer?.nickname || topScorer?.name, value: topScorer?.total_goals ?? 0, unit: 'gols' },
              { emoji: '🎯', label: 'Assistências', player: topAssister?.nickname || topAssister?.name, value: topAssister?.total_assists ?? 0, unit: 'assist' },
              { emoji: '🏆', label: 'Vitórias', player: topWinner?.nickname || topWinner?.name, value: topWinner?.total_wins ?? 0, unit: 'vitórias' },
            ].map(({ emoji, label, player, value, unit }, i) => (
              <div
                key={label}
                className={`card p-4 animate-fade-in-up stagger-${i + 1}`}
              >
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="text-base">{emoji}</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
                    {label}
                  </span>
                </div>
                <p className="text-sm font-bold truncate" style={{ color: 'var(--foreground)' }}>
                  {player ?? '—'}
                </p>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="stat-number text-2xl gradient-text">{value}</span>
                  <span className="text-[10px]" style={{ color: 'var(--muted)' }}>{unit}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Ranking preview */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--muted-light)' }}>
            🏅 Ranking
          </h2>
          <Link
            href="/ranking"
            className="text-xs font-semibold transition-colors"
            style={{ color: 'var(--accent)' }}
          >
            Ver tudo →
          </Link>
        </div>

        {ranking.length === 0 ? (
          <div className="card p-8 flex flex-col items-center gap-3 text-center">
            <Trophy className="w-10 h-10" style={{ color: 'var(--muted)' }} />
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              Nenhum jogador ainda.<br />Cadastre jogadores e inicie uma pelada!
            </p>
            <Link href="/jogadores" className="btn btn-primary btn-sm mt-1">
              Cadastrar jogadores
            </Link>
          </div>
        ) : (
          <div className="card overflow-hidden">
            {ranking.map((entry, i) => (
              <Link
                key={entry.player_id}
                href={`/jogadores/${entry.player_id}`}
                className={`flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-[var(--surface-hover)] animate-fade-in stagger-${i + 1} ${i < ranking.length - 1 ? 'border-b border-[var(--border-color)]' : ''}`}
              >
                <RankBadge rank={i + 1} />
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{ background: 'var(--surface-hover)', color: 'var(--muted-light)' }}
                >
                  {(entry.nickname || entry.name).slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: 'var(--foreground)' }}>
                    {entry.nickname || entry.name}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px]" style={{ color: 'var(--muted)' }}>⚽ {entry.total_goals}</span>
                    <span className="text-[10px]" style={{ color: 'var(--muted)' }}>🎯 {entry.total_assists}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="stat-number text-xl gradient-text">{entry.points}</p>
                  <p className="text-[10px] font-medium" style={{ color: 'var(--muted)' }}>pts</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Quick actions */}
      <section className="grid grid-cols-2 gap-3 animate-fade-in-up stagger-4">
        <Link href="/peladas/nova" className="block">
          <div className="card card-hover p-4 flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(249,115,22,0.12)' }}
            >
              <Calendar className="w-5 h-5" style={{ color: 'var(--accent)' }} />
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: 'var(--foreground)' }}>Nova Pelada</p>
              <p className="text-xs" style={{ color: 'var(--muted)' }}>Criar sessão</p>
            </div>
          </div>
        </Link>
        <Link href="/jogadores" className="block">
          <div className="card card-hover p-4 flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(59,130,246,0.12)' }}
            >
              <Users className="w-5 h-5" style={{ color: 'var(--secondary)' }} />
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: 'var(--foreground)' }}>Jogadores</p>
              <p className="text-xs" style={{ color: 'var(--muted)' }}>Gerenciar</p>
            </div>
          </div>
        </Link>
      </section>
    </div>
  );
}
