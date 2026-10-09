import Link from 'next/link';
import { Calendar, Plus, ChevronRight, Flame, CheckCircle2 } from 'lucide-react';
import { roundsService, Round } from '../../services/rounds.service';
import { formatDateBR } from '../../lib/utils';

export const revalidate = 0;

async function getRounds(): Promise<Round[]> {
  try {
    return await roundsService.list();
  } catch {
    return [];
  }
}

export default async function RoundsPage() {
  const rounds = await getRounds();

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-2xl font-bold"
            style={{ fontFamily: "'Barlow Condensed', sans-serif", color: 'var(--foreground)' }}
          >
            Rounds
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--muted)' }}>
            {rounds.length} session{rounds.length !== 1 ? 's' : ''} recorded
          </p>
        </div>

        <Link href="/rounds/new" className="btn btn-primary">
          <Plus className="w-4 h-4" />
          New Round
        </Link>
      </div>

      {rounds.length === 0 ? (
        <div className="card p-10 flex flex-col items-center justify-center text-center space-y-4">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
            style={{ background: 'var(--surface-hover)' }}
          >
            ⚽
          </div>
          <div>
            <h2 className="font-bold text-base" style={{ color: 'var(--foreground)' }}>
              No rounds played yet
            </h2>
            <p className="text-sm mt-1 max-w-xs" style={{ color: 'var(--muted)' }}>
              Create your first round to form teams and track live matches!
            </p>
          </div>
          <Link href="/rounds/new" className="btn btn-primary">
            <Plus className="w-4 h-4" />
            Create First Round
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {rounds.map((round) => {
            const isActive = round.status === 'active';
            const isFinished = round.status === 'finished';

            return (
              <Link
                key={round.id}
                href={`/rounds/${round.id}`}
                className="card card-hover p-4.5 block transition-all relative overflow-hidden"
                style={{
                  borderColor: isActive ? 'var(--accent)' : 'var(--border-color)',
                }}
              >
                {isActive && (
                  <div
                    className="absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-15 pointer-events-none"
                    style={{ background: 'var(--accent)' }}
                  />
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{
                        background: isActive
                          ? 'rgba(249,115,22,0.15)'
                          : 'var(--surface-hover)',
                        color: isActive ? 'var(--accent)' : 'var(--muted)',
                      }}
                    >
                      {isActive ? (
                        <Flame className="w-5 h-5 animate-pulse" />
                      ) : isFinished ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      ) : (
                        <Calendar className="w-5 h-5" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-base truncate" style={{ color: 'var(--foreground)' }}>
                          {formatDateBR(round.date)}
                        </p>
                        <span
                          className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex-shrink-0"
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
                          {isActive ? 'Live' : isFinished ? 'Finished' : 'Draft'}
                        </span>
                      </div>

                      {round.notes && (
                        <p className="text-xs truncate mt-0.5" style={{ color: 'var(--muted)' }}>
                          {round.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  <ChevronRight className="w-5 h-5 flex-shrink-0 ml-2" style={{ color: 'var(--muted)' }} />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
