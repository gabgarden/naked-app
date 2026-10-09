import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { playersService, Player } from '../../../services/players.service';
import { RoundCreator } from '../../../components/RoundCreator';

export const revalidate = 0;

async function getPlayers(): Promise<Player[]> {
  try {
    return await playersService.list();
  } catch {
    return [];
  }
}

export default async function NovaPeladaPage() {
  const players = await getPlayers();

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Link
          href="/peladas"
          className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors"
          style={{ background: 'var(--surface-hover)', color: 'var(--muted)' }}
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1
            className="text-2xl font-bold"
            style={{ fontFamily: "'Barlow Condensed', sans-serif", color: 'var(--foreground)' }}
          >
            Nova Pelada
          </h1>
          <p className="text-xs" style={{ color: 'var(--muted)' }}>
            Configure a data, selecione os atletas e divida os times
          </p>
        </div>
      </div>

      <RoundCreator initialPlayers={players} />
    </div>
  );
}
