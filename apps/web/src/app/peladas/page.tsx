import Link from 'next/link';
import { Calendar, Plus, ChevronRight, Flame, Clock, CheckCircle2 } from 'lucide-react';
import { peladasService, Round } from '../../services/peladas.service';
import { formatDateBR } from '../../lib/utils';

export const revalidate = 0;

async function getPeladas(): Promise<Round[]> {
  try {
    return await peladasService.list();
  } catch {
    return [];
  }
}

export default async function PeladasPage() {
  const peladas = await getPeladas();

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-2xl font-bold"
            style={{ fontFamily: "'Barlow Condensed', sans-serif", color: 'var(--foreground)' }}
          >
            Peladas
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--muted)' }}>
            {peladas.length} sessão{peladas.length !== 1 ? 'ões' : ''} registrada{peladas.length !== 1 ? 's' : ''}
          </p>
        </div>

        <Link href="/peladas/nova" className="btn btn-primary">
          <Plus className="w-4 h-4" />
          Nova Pelada
        </Link>
      </div>

      {peladas.length === 0 ? (
        <div className="card p-10 flex flex-col items-center justify-center text-center space-y-4">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
            style={{ background: 'var(--surface-hover)' }}
          >
            ⚽
          </div>
          <div>
            <h2 className="font-bold text-base" style={{ color: 'var(--foreground)' }}>
              Nenhuma pelada realizada ainda
            </h2>
            <p className="text-sm mt-1 max-w-xs" style={{ color: 'var(--muted)' }}>
              Crie a primeira pelada para montar os times e registrar os jogos!
            </p>
          </div>
          <Link href="/peladas/nova" className="btn btn-primary">
            <Plus className="w-4 h-4" />
            Criar Primeira Pelada
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {peladas.map((pelada) => {
            const isActive = pelada.status === 'active';
            const isFinished = pelada.status === 'finished';

            return (
              <Link
                key={pelada.id}
                href={`/peladas/${pelada.id}`}
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
                          {formatDateBR(pelada.date)}
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
                          {isActive ? 'Ao Vivo' : isFinished ? 'Finalizada' : 'Rascunho'}
                        </span>
                      </div>

                      {pelada.notes && (
                        <p className="text-xs truncate mt-0.5" style={{ color: 'var(--muted)' }}>
                          {pelada.notes}
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
