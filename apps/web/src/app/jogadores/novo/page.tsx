'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserPlus, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { playersService } from '../../../services/players.service';

export default function NovoJogadorPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError('O nome é obrigatório.'); return; }

    setLoading(true);
    setError('');
    try {
      await playersService.create({ name: name.trim(), nickname: nickname.trim() || undefined });
      router.push('/jogadores');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao cadastrar jogador.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Back */}
      <Link href="/jogadores" className="flex items-center gap-2 text-sm" style={{ color: 'var(--muted)' }}>
        <ArrowLeft className="w-4 h-4" />
        Voltar
      </Link>

      <div>
        <h1
          className="text-2xl font-bold"
          style={{ fontFamily: "'Barlow Condensed', sans-serif", color: 'var(--foreground)' }}
        >
          Novo Jogador
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
          Cadastre um jogador para usar nas peladas
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="card p-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold" style={{ color: 'var(--foreground-muted)' }}>
              Nome *
            </label>
            <input
              id="input-name"
              className="input"
              placeholder="Nome completo"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold" style={{ color: 'var(--foreground-muted)' }}>
              Apelido <span style={{ color: 'var(--muted)' }}>(opcional)</span>
            </label>
            <input
              id="input-nickname"
              className="input"
              placeholder="Como é chamado nas peladas"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
            />
          </div>

          {error && (
            <div
              className="px-4 py-3 rounded-lg text-sm font-medium"
              style={{ background: 'rgba(239,68,68,0.12)', color: 'var(--danger)', border: '1px solid rgba(239,68,68,0.2)' }}
            >
              {error}
            </div>
          )}
        </div>

        <button
          id="btn-salvar-jogador"
          type="submit"
          disabled={loading}
          className="btn btn-primary btn-lg w-full"
          style={{ opacity: loading ? 0.7 : 1 }}
        >
          <UserPlus className="w-5 h-5" />
          {loading ? 'Salvando...' : 'Cadastrar Jogador'}
        </button>
      </form>
    </div>
  );
}
