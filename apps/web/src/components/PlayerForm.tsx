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
  const [stars, setStars] = useState<number>(player?.stars ?? 2);
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
          stars,
        });
      } else {
        await playersService.create({
          name: name.trim(),
          nickname: nickname.trim() || undefined,
          stars,
        });
      }

      router.push('/players');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocorreu um erro ao salvar o jogador.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!player) return;
    if (!confirm(`Tem certeza que deseja excluir ${player.name}? Todo o histórico será removido.`)) {
      return;
    }

    setLoading(true);
    try {
      await playersService.delete(player.id);
      router.push('/players');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir jogador.');
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
            placeholder="ex: Gabriel Santos"
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
            placeholder="ex: Biel"
          />
        </div>

        {/* Nível / Estrelas (1 a 3) */}
        <div className="space-y-2 pt-1">
          <label className="text-sm font-semibold flex items-center justify-between" style={{ color: 'var(--foreground-muted)' }}>
            <span>Classificação (Nível Técnico)</span>
            <span className="text-xs font-bold" style={{ color: 'var(--accent)' }}>
              {stars === 1 ? '⭐ Nível 1 (Iniciante)' : stars === 2 ? '⭐⭐ Nível 2 (Médio)' : '⭐⭐⭐ Nível 3 (Craque)'}
            </span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { val: 1, label: '1 Estrela', desc: 'Iniciante' },
              { val: 2, label: '2 Estrelas', desc: 'Equilibrado' },
              { val: 3, label: '3 Estrelas', desc: 'Craque' },
            ].map((opt) => {
              const isSelected = stars === opt.val;
              return (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => setStars(opt.val)}
                  className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                    isSelected ? 'ring-2' : ''
                  }`}
                  style={{
                    background: isSelected ? 'rgba(103, 61, 230, 0.18)' : 'var(--surface-2)',
                    borderColor: isSelected ? 'var(--accent)' : 'var(--border-color)',
                  }}
                >
                  <div className="text-base">
                    {'⭐'.repeat(opt.val)}
                  </div>
                  <span className="text-xs font-bold text-white leading-tight">
                    {opt.label}
                  </span>
                  <span className="text-[10px] text-muted leading-none">
                    {opt.desc}
                  </span>
                </button>
              );
            })}
          </div>
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
