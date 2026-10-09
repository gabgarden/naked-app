'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { playersService, Player } from '../services/players.service';
import { UserCheck, Trash2 } from 'lucide-react';

export function PlayerForm({ player }: { player?: Player }) {
  const router = useRouter();
  const isEditing = !!player;

  const [name, setName] = useState(player?.name || '');
  const [nickname, setNickname] = useState(player?.nickname || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError('O nome é obrigatório.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (isEditing) {
        await playersService.update(player.id, {
          name: name.trim(),
          nickname: nickname.trim() || null,
        });
      } else {
        await playersService.create({
          name: name.trim(),
          nickname: nickname.trim() || undefined,
        });
      }

      router.push('/jogadores');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocorreu um erro ao salvar o jogador.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!player) return;
    if (!confirm(`Tem certeza que deseja excluir ${player.name}? Os registros históricos também serão removidos.`)) {
      return;
    }

    setLoading(true);
    try {
      await playersService.delete(player.id);
      router.push('/jogadores');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao deletar jogador.');
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="card p-5 space-y-4">
        {error && (
          <div
            className="px-4 py-3 rounded-lg text-sm font-medium"
            style={{
              background: 'rgba(239,68,68,0.12)',
              color: 'var(--danger)',
              border: '1px solid rgba(239,68,68,0.2)',
            }}
          >
            {error}
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-sm font-semibold" style={{ color: 'var(--foreground-muted)' }}>
            Nome Completo *
          </label>
          <input
            id="player-name"
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Neymar Júnior"
            required
            autoFocus
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-semibold" style={{ color: 'var(--foreground-muted)' }}>
            Apelido <span style={{ color: 'var(--muted)' }}>(opcional)</span>
          </label>
          <input
            id="player-nickname"
            className="input"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="Ex: Ney"
          />
        </div>
      </div>

      <div className="space-y-2.5">
        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary btn-lg w-full"
          style={{ opacity: loading ? 0.7 : 1 }}
        >
          <UserCheck className="w-5 h-5" />
          {loading ? 'Salvando...' : isEditing ? 'Salvar Alterações' : 'Cadastrar Jogador'}
        </button>

        {isEditing && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={loading}
            className="btn btn-secondary w-full"
            style={{ color: 'var(--danger)', borderColor: 'rgba(239,68,68,0.25)' }}
          >
            <Trash2 className="w-4 h-4" />
            Excluir Jogador
          </button>
        )}
      </div>
    </form>
  );
}
