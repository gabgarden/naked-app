import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { playersService } from '../../../../services/players.service';
import { PlayerForm } from '../../../../components/PlayerForm';

export const revalidate = 0;

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPlayerPage({ params }: PageProps) {
  const { id } = await params;

  let player;
  try {
    player = await playersService.getById(id);
  } catch {
    notFound();
  }

  if (!player) {
    notFound();
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <Link href={`/players/${player.id}`} className="flex items-center gap-2 text-sm" style={{ color: 'var(--muted)' }}>
        <ArrowLeft className="w-4 h-4" />
        Voltar para o Perfil
      </Link>

      <div>
        <h1
          className="text-2xl font-bold"
          style={{ fontFamily: "'Barlow Condensed', sans-serif", color: 'var(--foreground)' }}
        >
          Editar Jogador
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
          Altere os dados ou classificação técnica do jogador
        </p>
      </div>

      <PlayerForm player={player} />
    </div>
  );
}
