'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserPlus, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { playersService } from '../../../services/players.service';

export default function NewPlayerPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError('Name is required.'); return; }

    setLoading(true);
    setError('');
    try {
      await playersService.create({ name: name.trim(), nickname: nickname.trim() || undefined });
      router.push('/players');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error registering player.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Back */}
      <Link href="/players" className="flex items-center gap-2 text-sm" style={{ color: 'var(--muted)' }}>
        <ArrowLeft className="w-4 h-4" />
        Back
      </Link>

      <div>
        <h1
          className="text-2xl font-bold"
          style={{ fontFamily: "'Barlow Condensed', sans-serif", color: 'var(--foreground)' }}
        >
          New Player
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
          Register a player to participate in rounds
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="card p-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold" style={{ color: 'var(--foreground-muted)' }}>
              Full Name *
            </label>
            <input
              id="input-name"
              className="input"
              placeholder="e.g. John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold" style={{ color: 'var(--foreground-muted)' }}>
              Nickname <span style={{ color: 'var(--muted)' }}>(optional)</span>
            </label>
            <input
              id="input-nickname"
              className="input"
              placeholder="e.g. Johnny"
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
          id="btn-save-player"
          type="submit"
          disabled={loading}
          className="btn btn-primary btn-lg w-full"
          style={{ opacity: loading ? 0.7 : 1 }}
        >
          <UserPlus className="w-5 h-5" />
          {loading ? 'Saving...' : 'Register Player'}
        </button>
      </form>
    </div>
  );
}
