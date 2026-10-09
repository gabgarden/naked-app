'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { peladasService } from '../services/peladas.service';
import { playersService, Player } from '../services/players.service';
import { getInitials } from '../lib/utils';
import { Users, Calendar, CheckCircle2, ChevronRight, Plus, X } from 'lucide-react';

const DEFAULT_TEAMS = [
  { id: 'team1', name: 'Laranja', color: '#f97316', players: [] as Player[] },
  { id: 'team2', name: 'Preto', color: '#27272a', players: [] as Player[] },
  { id: 'team3', name: 'Branco', color: '#e4e4e7', players: [] as Player[] },
];

export function RoundCreator({ initialPlayers }: { initialPlayers: Player[] }) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  // Players pool
  const [allPlayers, setAllPlayers] = useState<Player[]>(initialPlayers);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<Set<string>>(new Set());

  // Quick add player modal
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickName, setQuickName] = useState('');
  const [quickNickname, setQuickNickname] = useState('');
  const [quickLoading, setQuickLoading] = useState(false);

  // Step 3: Teams
  const [teams, setTeams] = useState(DEFAULT_TEAMS);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const selectedPlayers = allPlayers.filter((p) => selectedPlayerIds.has(p.id));
  const unassignedPlayers = selectedPlayers.filter(
    (p) => !teams.some((t) => t.players.some((tp) => tp.id === p.id)),
  );

  function togglePlayerSelection(id: string) {
    const next = new Set(selectedPlayerIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedPlayerIds(next);
  }

  function selectAll() {
    setSelectedPlayerIds(new Set(allPlayers.map((p) => p.id)));
  }

  function deselectAll() {
    setSelectedPlayerIds(new Set());
  }

  async function handleQuickAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!quickName.trim()) return;
    setQuickLoading(true);
    try {
      const created = await playersService.create({
        name: quickName.trim(),
        nickname: quickNickname.trim() || undefined,
      });
      setAllPlayers((prev) => [created, ...prev]);
      setSelectedPlayerIds((prev) => new Set(prev).add(created.id));
      setQuickName('');
      setQuickNickname('');
      setShowQuickAdd(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao adicionar jogador.');
    } finally {
      setQuickLoading(false);
    }
  }

  function assignToTeam(player: Player, teamId: string) {
    setTeams((prev) =>
      prev.map((t) => {
        const filtered = t.players.filter((p) => p.id !== player.id);
        if (t.id === teamId) {
          return { ...t, players: [...filtered, player] };
        }
        return { ...t, players: filtered };
      }),
    );
  }

  function removeFromTeam(player: Player) {
    setTeams((prev) =>
      prev.map((t) => ({
        ...t,
        players: t.players.filter((p) => p.id !== player.id),
      })),
    );
  }

  function addTeam() {
    const colors = ['#3b82f6', '#10b981', '#a855f7', '#ec4899', '#eab308'];
    const newIdx = teams.length + 1;
    setTeams((prev) => [
      ...prev,
      {
        id: `team_${Date.now()}`,
        name: `Time ${newIdx}`,
        color: colors[(newIdx - 1) % colors.length],
        players: [],
      },
    ]);
  }

  function removeTeam(teamId: string) {
    if (teams.length <= 2) {
      alert('A pelada precisa ter pelo menos 2 times.');
      return;
    }
    setTeams((prev) => prev.filter((t) => t.id !== teamId));
  }

  async function handleSave() {
    if (unassignedPlayers.length > 0) {
      if (
        !confirm(
          `Ainda há ${unassignedPlayers.length} jogador(es) selecionado(s) sem time. Deseja criar a pelada mesmo assim?`,
        )
      ) {
        return;
      }
    }

    setLoading(true);
    setError('');

    try {
      const teamsPayload = teams.map((t) => ({
        name: t.name,
        color: t.color,
        playerIds: t.players.map((p) => p.id),
      }));

      const res = await peladasService.create({
        date,
        notes: notes.trim() || undefined,
        teams: teamsPayload,
      });

      router.push(`/peladas/${res.roundId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar pelada.');
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Step Indicators */}
      <div className="flex items-center justify-between px-2">
        <div className={`flex flex-col items-center gap-1 ${step >= 1 ? 'text-[var(--accent)]' : 'text-[var(--muted)]'}`}>
          <div
            className="w-8 h-8 rounded-full border-2 border-current flex items-center justify-center text-xs font-bold"
            style={{ background: step === 1 ? 'rgba(249,115,22,0.15)' : 'transparent' }}
          >
            1
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider">Data</span>
        </div>

        <div className={`flex-1 h-0.5 mx-2 ${step >= 2 ? 'bg-[var(--accent)]' : 'bg-[var(--border-color)]'}`} />

        <div className={`flex flex-col items-center gap-1 ${step >= 2 ? 'text-[var(--accent)]' : 'text-[var(--muted)]'}`}>
          <div
            className="w-8 h-8 rounded-full border-2 border-current flex items-center justify-center text-xs font-bold"
            style={{ background: step === 2 ? 'rgba(249,115,22,0.15)' : 'transparent' }}
          >
            2
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider">Jogadores</span>
        </div>

        <div className={`flex-1 h-0.5 mx-2 ${step >= 3 ? 'bg-[var(--accent)]' : 'bg-[var(--border-color)]'}`} />

        <div className={`flex flex-col items-center gap-1 ${step >= 3 ? 'text-[var(--accent)]' : 'text-[var(--muted)]'}`}>
          <div
            className="w-8 h-8 rounded-full border-2 border-current flex items-center justify-center text-xs font-bold"
            style={{ background: step === 3 ? 'rgba(249,115,22,0.15)' : 'transparent' }}
          >
            3
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider">Times</span>
        </div>
      </div>

      {error && (
        <div
          className="p-3.5 rounded-xl text-xs font-semibold text-center"
          style={{
            background: 'rgba(239,68,68,0.12)',
            color: 'var(--danger)',
            border: '1px solid rgba(239,68,68,0.2)',
          }}
        >
          {error}
        </div>
      )}

      {/* STEP 1: Date & notes */}
      {step === 1 && (
        <div className="card p-5 space-y-4 animate-fade-in">
          <h2
            className="text-base font-bold flex items-center gap-2"
            style={{ fontFamily: "'Barlow Condensed', sans-serif", color: 'var(--foreground)' }}
          >
            <Calendar className="w-5 h-5" style={{ color: 'var(--accent)' }} />
            Informações da Pelada
          </h2>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
              Data da Partida
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="input"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
              Observações <span style={{ color: 'var(--muted)' }}>(opcional)</span>
            </label>
            <input
              type="text"
              placeholder="Ex: Campo Society 3, quadra externa"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="input"
            />
          </div>

          <button
            type="button"
            onClick={() => setStep(2)}
            className="btn btn-primary btn-lg w-full mt-2"
          >
            Próximo: Escolher Jogadores <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* STEP 2: Player selection */}
      {step === 2 && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h2
                className="text-base font-bold flex items-center gap-2"
                style={{ fontFamily: "'Barlow Condensed', sans-serif", color: 'var(--foreground)' }}
              >
                <Users className="w-5 h-5" style={{ color: 'var(--accent)' }} />
                Quem vai jogar hoje?
              </h2>
              <p className="text-xs" style={{ color: 'var(--muted)' }}>
                Selecione os presentes ou adicione novos jogadores
              </p>
            </div>
            <span
              className="text-xs font-bold px-2.5 py-1 rounded-full"
              style={{ background: 'var(--surface-hover)', color: 'var(--accent)' }}
            >
              {selectedPlayerIds.size} presentes
            </span>
          </div>

          {/* Quick actions & quick add */}
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setShowQuickAdd(true)}
              className="btn btn-secondary text-xs py-2 px-3"
              style={{ color: 'var(--accent)', borderColor: 'var(--accent)' }}
            >
              <Plus className="w-3.5 h-3.5" />
              Novo Jogador
            </button>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={selectAll}
                className="text-xs font-semibold px-2 py-1 transition-colors hover:text-[var(--accent)]"
                style={{ color: 'var(--muted)' }}
              >
                Marcar Todos
              </button>
              <span style={{ color: 'var(--border-color)' }}>|</span>
              <button
                type="button"
                onClick={deselectAll}
                className="text-xs font-semibold px-2 py-1 transition-colors hover:text-[var(--danger)]"
                style={{ color: 'var(--muted)' }}
              >
                Limpar
              </button>
            </div>
          </div>

          {/* Quick add modal/inline card */}
          {showQuickAdd && (
            <form onSubmit={handleQuickAdd} className="card p-4 space-y-3 border-2 border-[var(--accent)] animate-fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--accent)' }}>
                  Cadastrar Jogador Rápido
                </span>
                <button
                  type="button"
                  onClick={() => setShowQuickAdd(false)}
                  className="text-xs p-1"
                  style={{ color: 'var(--muted)' }}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Nome *"
                  value={quickName}
                  onChange={(e) => setQuickName(e.target.value)}
                  className="input text-xs"
                  required
                  autoFocus
                />
                <input
                  type="text"
                  placeholder="Apelido (opcional)"
                  value={quickNickname}
                  onChange={(e) => setQuickNickname(e.target.value)}
                  className="input text-xs"
                />
              </div>

              <button
                type="submit"
                disabled={quickLoading || !quickName.trim()}
                className="btn btn-primary w-full text-xs py-2"
              >
                {quickLoading ? 'Cadastrando...' : 'Adicionar e Selecionar'}
              </button>
            </form>
          )}

          {/* Players list */}
          <div className="card overflow-hidden max-h-[52vh] overflow-y-auto">
            {allPlayers.length === 0 ? (
              <div className="p-8 text-center text-sm" style={{ color: 'var(--muted)' }}>
                Nenhum jogador cadastrado ainda. Use o botão acima para adicionar!
              </div>
            ) : (
              allPlayers.map((player, idx) => {
                const isSelected = selectedPlayerIds.has(player.id);
                return (
                  <div
                    key={player.id}
                    onClick={() => togglePlayerSelection(player.id)}
                    className={`flex items-center justify-between p-3.5 cursor-pointer transition-colors ${
                      idx < allPlayers.length - 1 ? 'border-b border-[var(--border-color)]' : ''
                    }`}
                    style={{
                      background: isSelected ? 'rgba(249,115,22,0.08)' : 'transparent',
                    }}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all flex-shrink-0"
                        style={{
                          background: isSelected
                            ? 'linear-gradient(135deg, var(--accent-dark), var(--accent))'
                            : 'var(--surface-hover)',
                          color: isSelected ? '#fff' : 'var(--muted)',
                        }}
                      >
                        {getInitials(player.name)}
                      </div>
                      <div className="min-w-0">
                        <p
                          className="text-xs font-bold truncate"
                          style={{ color: isSelected ? 'var(--accent)' : 'var(--foreground)' }}
                        >
                          {player.name}
                        </p>
                        {player.nickname && (
                          <p className="text-[11px] truncate" style={{ color: 'var(--muted)' }}>
                            {player.nickname}
                          </p>
                        )}
                      </div>
                    </div>

                    {isSelected ? (
                      <CheckCircle2 className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--accent)' }} />
                    ) : (
                      <div
                        className="w-5 h-5 rounded-full border-2 flex-shrink-0"
                        style={{ borderColor: 'var(--border-color)' }}
                      />
                    )}
                  </div>
                );
              })
            )}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="btn btn-secondary flex-1"
            >
              Voltar
            </button>
            <button
              type="button"
              onClick={() => setStep(3)}
              disabled={selectedPlayerIds.size === 0}
              className="btn btn-primary flex-[2]"
              style={{ opacity: selectedPlayerIds.size === 0 ? 0.5 : 1 }}
            >
              Montar Times ({selectedPlayerIds.size}) <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Teams division */}
      {step === 3 && (
        <div className="space-y-5 animate-fade-in">
          <div className="flex items-center justify-between">
            <h2
              className="text-base font-bold"
              style={{ fontFamily: "'Barlow Condensed', sans-serif", color: 'var(--foreground)' }}
            >
              Divisão dos Times
            </h2>
            <button
              type="button"
              onClick={addTeam}
              className="text-xs font-bold flex items-center gap-1 transition-colors hover:text-[var(--accent)]"
              style={{ color: 'var(--accent)' }}
            >
              <Plus className="w-4 h-4" />
              Adicionar Time
            </button>
          </div>

          {/* Unassigned pool */}
          {unassignedPlayers.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--warning)' }}>
                  Aguardando Time ({unassignedPlayers.length})
                </span>
                <span className="text-[11px]" style={{ color: 'var(--muted)' }}>
                  Clique para alocar
                </span>
              </div>

              <div
                className="card p-3 flex flex-wrap gap-2 min-h-[4rem]"
                style={{ borderColor: 'var(--warning)', background: 'rgba(234,179,8,0.04)' }}
              >
                {unassignedPlayers.map((p) => (
                  <div key={p.id} className="relative group">
                    <div
                      className="px-2.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors flex items-center gap-1.5 shadow-sm"
                      style={{ background: 'var(--surface-hover)', border: '1px solid var(--border-color)', color: 'var(--foreground)' }}
                    >
                      <span>{p.nickname || p.name}</span>
                    </div>

                    {/* Quick allocate dropdown on hover */}
                    <div
                      className="absolute top-full left-0 mt-1 hidden group-hover:flex flex-col w-32 rounded-xl shadow-2xl overflow-hidden z-20"
                      style={{ background: 'var(--surface)', border: '1px solid var(--border-color)' }}
                    >
                      <span className="text-[9px] uppercase tracking-wider font-bold p-1.5 bg-[var(--surface-hover)]" style={{ color: 'var(--muted)' }}>
                        Enviar para:
                      </span>
                      {teams.map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => assignToTeam(p, t.id)}
                          className="px-2.5 py-2 text-left text-xs font-bold flex items-center gap-2 hover:bg-[var(--surface-hover)] transition-colors border-b border-[var(--border-color)] last:border-0"
                          style={{ color: 'var(--foreground)' }}
                        >
                          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: t.color }} />
                          <span className="truncate">{t.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Teams cards */}
          <div className="space-y-3">
            {teams.map((team) => (
              <div key={team.id} className="card overflow-hidden">
                <div
                  className="px-4 py-2.5 flex items-center justify-between"
                  style={{ background: 'var(--surface-hover)', borderBottom: '1px solid var(--border-color)' }}
                >
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <span className="w-3.5 h-3.5 rounded-full shadow-sm flex-shrink-0" style={{ backgroundColor: team.color }} />
                    <input
                      type="text"
                      value={team.name}
                      onChange={(e) =>
                        setTeams(
                          teams.map((t) =>
                            t.id === team.id ? { ...t, name: e.target.value } : t,
                          ),
                        )
                      }
                      className="bg-transparent text-sm font-bold focus:outline-none max-w-[120px]"
                      style={{ color: 'var(--foreground)' }}
                    />
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-md" style={{ background: 'var(--surface)', color: 'var(--muted)' }}>
                      {team.players.length} atletas
                    </span>
                    {teams.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeTeam(team.id)}
                        className="text-[11px] font-bold px-1.5 py-0.5 transition-colors hover:text-[var(--danger)]"
                        style={{ color: 'var(--muted)' }}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                <div className="p-3 min-h-[3.5rem] flex flex-wrap gap-2">
                  {team.players.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => removeFromTeam(p)}
                      title="Clique para remover do time"
                      className="px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors group"
                      style={{ background: 'var(--surface)', border: '1px solid var(--border-color)', color: 'var(--foreground)' }}
                    >
                      <span>{p.nickname || p.name}</span>
                      <span className="text-[10px] opacity-40 group-hover:opacity-100 group-hover:text-[var(--danger)]">
                        ✕
                      </span>
                    </div>
                  ))}

                  {team.players.length === 0 && (
                    <span className="text-xs italic py-1" style={{ color: 'var(--muted)' }}>
                      Nenhum atleta alocado neste time ainda.
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="btn btn-secondary flex-1"
            >
              Voltar
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={loading}
              className="btn btn-primary flex-[2]"
              style={{ opacity: loading ? 0.7 : 1 }}
            >
              {loading ? 'Criando Pelada...' : 'Iniciar Pelada'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
