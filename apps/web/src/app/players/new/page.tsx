import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { PlayerForm } from '../../../components/PlayerForm';

export default function NewPlayerPage() {
  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Back */}
      <Link href="/players" className="flex items-center gap-2 text-sm" style={{ color: 'var(--muted)' }}>
        <ArrowLeft className="w-4 h-4" />
        Voltar para Jogadores
      </Link>

      <div>
        <h1
          className="text-2xl font-bold"
          style={{ fontFamily: "'Barlow Condensed', sans-serif", color: 'var(--foreground)' }}
        >
          Novo Jogador
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
          Cadastre um jogador com nível técnico (estrelas) para os sorteios e partidas
        </p>
      </div>

      <PlayerForm />
    </div>
  );
}
