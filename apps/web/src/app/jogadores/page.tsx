import Link from 'next/link';
import { UserPlus } from 'lucide-react';
import { playersService } from '../../services/players.service';

async function getPlayers() {
  try {
    return await playersService.list();
  } catch {
    return [];
  }
}

export default async function JogadoresPage() {
  const players = await getPlayers();

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-2xl font-bold"
            style={{ fontFamily: "'Barlow Condensed', sans-serif", color: 'var(--foreground)' }}
          >
            Jogadores
          </h1>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            {players.length} cadastrado{players.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link href="/jogadores/novo" id="btn-novo-jogador" className="btn btn-primary">
          <UserPlus className="w-4 h-4" />
          Novo
        </Link>
      </div>

      {players.length === 0 && (
        <div className="card p-10 flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl" style={{ background: 'var(--surface-hover)' }}>
            👤
          </div>
          <div>
            <p className="font-bold text-base" style={{ color: 'var(--foreground)' }}>Nenhum jogador ainda</p>
            <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
              Cadastre os jogadores da sua pelada para começar
            </p>
          </div>
          <Link href="/jogadores/novo" className="btn btn-primary">
            <UserPlus className="w-4 h-4" />
            Cadastrar primeiro jogador
          </Link>
        </div>
      )}

      {players.length > 0 && (
        <div className="card overflow-hidden">
          {players.map((player, i) => (
            <Link
              key={player.id}
              href={`/jogadores/${player.id}`}
              className={`flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-[var(--surface-hover)] animate-fade-in stagger-${Math.min(i + 1, 6)} ${i < players.length - 1 ? 'border-b border-[var(--border-color)]' : ''}`}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, var(--accent-dark), var(--accent))', color: '#fff' }}
              >
                {(player.nickname || player.name).slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate" style={{ color: 'var(--foreground)' }}>{player.name}</p>
                {player.nickname && (
                  <p className="text-xs truncate" style={{ color: 'var(--muted)' }}>{player.nickname}</p>
                )}
              </div>
              <svg className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--border-color)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
