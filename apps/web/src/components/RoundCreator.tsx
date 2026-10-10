'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { roundsService } from '../services/rounds.service';
import { playersService, Player } from '../services/players.service';
import { getInitials } from '../lib/utils';
import {
  Users,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Plus,
  X,
  Sparkles,
  Shuffle,
  RotateCcw,
  ArrowRightLeft,
  GripVertical,
  HelpCircle,
} from 'lucide-react';
import { StarRating } from './StarRating';
import { balanceTeams } from '../lib/teamBalancer';

const DEFAULT_TEAMS = [
  { id: 'team1', name: 'Time Roxo', color: '#8b5cf6', players: [] as Player[] },
  { id: 'team2', name: 'Time Preto', color: '#1e293b', players: [] as Player[] },
  { id: 'team3', name: 'Time Branco', color: '#f8fafc', players: [] as Player[] },
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
  const [quickStars, setQuickStars] = useState<number>(2);
  const [quickLoading, setQuickLoading] = useState(false);

  // Step 3: Teams
  const [teams, setTeams] = useState(DEFAULT_TEAMS);
  const [draggedPlayerId, setDraggedPlayerId] = useState<string | null>(null);
  const [dragOverTeamId, setDragOverTeamId] = useState<string | null>(null);
  const [showRulesModal, setShowRulesModal] = useState(false);

  // Quick transfer modal (tap-to-move for touch convenience)
  const [transferPlayer, setTransferPlayer] = useState<Player | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  const selectedPlayers = allPlayers.filter((p) => selectedPlayerIds.has(p.id));
  const unassignedPlayers = selectedPlayers.filter(
    (p) => !teams.some((t) => t.players.some((tp) => tp.id === p.id)),
  );

  function showToast(msg: string) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  }

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
        stars: quickStars,
      });
      setAllPlayers((prev) => [created, ...prev]);
      setSelectedPlayerIds((prev) => new Set(prev).add(created.id));
      setQuickName('');
      setQuickNickname('');
      setQuickStars(2);
      setShowQuickAdd(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error adding player.');
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
    const colors = ['#8b5cf6', '#6366f1', '#ec4899', '#3b82f6', '#f59e0b'];
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

  function clearAllTeams() {
    setTeams((prev) => prev.map((t) => ({ ...t, players: [] })));
    showToast('Times limpos! Todos os jogadores voltaram para o banco.');
  }

  // Sorteio Equilibrado por Estrelas e Elenco
  function handleBalancedDraw() {
    if (selectedPlayers.length === 0 || teams.length === 0) return;
    const balancedSquads = balanceTeams(selectedPlayers, teams.length);
    setTeams((prev) =>
      prev.map((t, idx) => ({
        ...t,
        players: balancedSquads[idx] || [],
      })),
    );
    showToast('⚡ Times sorteados com equilíbrio máximo de estrelas e elenco!');
  }

  // Sorteio Aleatório Equilibrado (reembaralha mantendo equilíbrio matemático)
  function handleRandomDraw() {
    if (selectedPlayers.length === 0 || teams.length === 0) return;
    const balancedSquads = balanceTeams(selectedPlayers, teams.length);
    setTeams((prev) =>
      prev.map((t, idx) => ({
        ...t,
        players: balancedSquads[idx] || [],
      })),
    );
    showToast('🎲 Sorteio reembaralhado com equilíbrio garantido!');
  }

  // Drag and drop handlers (HTML5 + mouse/touch support)
  function handleDragStart(playerId: string) {
    setDraggedPlayerId(playerId);
  }

  function handleDragOver(e: React.DragEvent, teamId: string | 'unassigned') {
    e.preventDefault();
    setDragOverTeamId(teamId);
  }

  function handleDrop(e: React.DragEvent, targetTeamId: string | 'unassigned') {
    e.preventDefault();
    setDragOverTeamId(null);
    const playerId = draggedPlayerId;
    if (!playerId) return;

    const player = allPlayers.find((p) => p.id === playerId);
    if (!player) return;

    if (targetTeamId === 'unassigned') {
      removeFromTeam(player);
    } else {
      assignToTeam(player, targetTeamId);
    }
    setDraggedPlayerId(null);
  }

  // Touch Drag-and-Drop Implementation
  const touchPlayerRef = useRef<Player | null>(null);
  const touchGhostRef = useRef<HTMLDivElement | null>(null);

  function handleTouchStart(e: React.TouchEvent, player: Player) {
    touchPlayerRef.current = player;
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (!touchPlayerRef.current) return;
    const touch = e.touches[0];
    if (!touch) return;

    if (!touchGhostRef.current) {
      const ghost = document.createElement('div');
      ghost.id = 'touch-drag-ghost';
      ghost.style.position = 'fixed';
      ghost.style.zIndex = '9999';
      ghost.style.pointerEvents = 'none';
      ghost.style.padding = '6px 12px';
      ghost.style.borderRadius = '8px';
      ghost.style.background = 'rgba(103, 61, 230, 0.95)';
      ghost.style.color = '#ffffff';
      ghost.style.fontWeight = 'bold';
      ghost.style.fontSize = '12px';
      ghost.style.boxShadow = '0 8px 24px rgba(0,0,0,0.5)';
      ghost.innerText = `${touchPlayerRef.current.nickname || touchPlayerRef.current.name} (★${touchPlayerRef.current.stars ?? 2})`;
      document.body.appendChild(ghost);
      touchGhostRef.current = ghost;
    }

    if (touchGhostRef.current) {
      touchGhostRef.current.style.left = `${touch.clientX - 40}px`;
      touchGhostRef.current.style.top = `${touch.clientY - 25}px`;
    }

    // Detect target element
    const el = document.elementFromPoint(touch.clientX, touch.clientY);
    const teamZone = el?.closest('[data-drop-zone]');
    if (teamZone) {
      const zoneId = teamZone.getAttribute('data-drop-zone');
      setDragOverTeamId(zoneId);
    } else {
      setDragOverTeamId(null);
    }
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchGhostRef.current) {
      document.body.removeChild(touchGhostRef.current);
      touchGhostRef.current = null;
    }

    const player = touchPlayerRef.current;
    touchPlayerRef.current = null;

    if (!player) return;

    const touch = e.changedTouches[0];
    if (!touch) return;

    const el = document.elementFromPoint(touch.clientX, touch.clientY);
    const teamZone = el?.closest('[data-drop-zone]');

    if (teamZone) {
      const targetTeamId = teamZone.getAttribute('data-drop-zone');
      if (targetTeamId === 'unassigned') {
        removeFromTeam(player);
      } else if (targetTeamId) {
        assignToTeam(player, targetTeamId);
      }
    }
    setDragOverTeamId(null);
  }

  async function handleSave() {
    if (unassignedPlayers.length > 0) {
      if (
        !confirm(
          `Ainda restam ${unassignedPlayers.length} jogador(es) sem time. Deseja iniciar a rodada mesmo assim?`,
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

      const res = await roundsService.create({
        date,
        notes: notes.trim() || undefined,
        teams: teamsPayload,
      });

      router.push(`/rounds/${res.roundId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar rodada.');
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Toast Alert */}
      {toastMessage && (
        <div
          className="p-3 rounded-xl text-xs font-bold text-center fixed top-16 left-4 right-4 max-w-md mx-auto z-50 shadow-2xl animate-fade-in border flex items-center justify-center gap-2"
          style={{
            background: 'rgba(8, 10, 16, 0.95)',
            borderColor: 'var(--accent)',
            color: 'var(--accent-light)',
            boxShadow: '0 0 20px rgba(103, 61, 230, 0.35)',
          }}
        >
          <Sparkles className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Step Indicators */}
      <div className="flex items-center justify-between px-2">
        <div
          className={`flex flex-col items-center gap-1 ${step >= 1 ? 'text-[var(--accent)]' : 'text-[var(--muted)]'}`}
        >
          <div
            className="w-8 h-8 rounded-full border-2 border-current flex items-center justify-center text-xs font-bold"
            style={{ background: step === 1 ? 'rgba(103,61,230,0.2)' : 'transparent' }}
          >
            1
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider">Data</span>
        </div>

        <div className="flex-1 h-0.5 mx-2 bg-[var(--border-color)]" />

        <div
          className={`flex flex-col items-center gap-1 ${step >= 2 ? 'text-[var(--accent)]' : 'text-[var(--muted)]'}`}
        >
          <div
            className="w-8 h-8 rounded-full border-2 border-current flex items-center justify-center text-xs font-bold"
            style={{ background: step === 2 ? 'rgba(103,61,230,0.2)' : 'transparent' }}
          >
            2
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider">Jogadores</span>
        </div>

        <div className="flex-1 h-0.5 mx-2 bg-[var(--border-color)]" />

        <div
          className={`flex flex-col items-center gap-1 ${step >= 3 ? 'text-[var(--accent)]' : 'text-[var(--muted)]'}`}
        >
          <div
            className="w-8 h-8 rounded-full border-2 border-current flex items-center justify-center text-xs font-bold"
            style={{ background: step === 3 ? 'rgba(103,61,230,0.2)' : 'transparent' }}
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
            background: 'rgba(244,63,94,0.12)',
            color: 'var(--danger)',
            border: '1px solid rgba(244,63,94,0.2)',
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

          <div className="space-y-1.5 w-full min-w-0 max-w-full">
            <label className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
              Data da Partida
            </label>
            <div className="w-full max-w-full overflow-hidden">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="input w-full max-w-full"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
              Observações <span style={{ color: 'var(--muted)' }}>(opcional)</span>
            </label>
            <input
              type="text"
              placeholder="Ex: Quadra 2, grama sintética"
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
            Avançar: Selecionar Jogadores <ChevronRight className="w-4 h-4" />
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
                Selecione os presentes e cadastre novos se necessário
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
                Selecionar Todos
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
                  Cadastro Rápido de Jogador
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

              {/* Star selector */}
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-muted uppercase">Nível Técnico:</span>
                <div className="grid grid-cols-3 gap-1.5">
                  {[1, 2, 3].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setQuickStars(s)}
                      className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                        quickStars === s ? 'ring-1' : ''
                      }`}
                      style={{
                        background: quickStars === s ? 'rgba(103,61,230,0.2)' : 'var(--surface)',
                        borderColor: quickStars === s ? 'var(--accent)' : 'var(--border-color)',
                        color: quickStars === s ? '#fff' : 'var(--muted)',
                      }}
                    >
                      <StarRating stars={s} size={13} />
                      <span className="text-[10px]">({s === 1 ? 'Básico' : s === 2 ? 'Médio' : 'Craque'})</span>
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={quickLoading || !quickName.trim()}
                className="btn btn-primary w-full text-xs py-2"
              >
                {quickLoading ? 'Salvando...' : 'Adicionar e Selecionar'}
              </button>
            </form>
          )}

          {/* Players list */}
          <div className="card overflow-hidden max-h-[52vh] overflow-y-auto">
            {allPlayers.length === 0 ? (
              <div className="p-8 text-center text-sm" style={{ color: 'var(--muted)' }}>
                Nenhum jogador cadastrado. Use o botão acima para adicionar!
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
                      background: isSelected ? 'rgba(103,61,230,0.1)' : 'transparent',
                    }}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all flex-shrink-0"
                        style={{
                          background: isSelected
                            ? 'linear-gradient(135deg, var(--accent-dark), var(--accent))'
                            : 'var(--surface-hover)',
                          color: isSelected ? '#080A10' : 'var(--muted)',
                        }}
                      >
                        {getInitials(player.name)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p
                            className="text-xs font-bold truncate"
                            style={{ color: isSelected ? 'var(--accent)' : 'var(--foreground)' }}
                          >
                            {player.name}
                          </p>
                          <StarRating stars={player.stars ?? 2} size={11} />
                        </div>
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
          {/* Header & Quick Draw Bar */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div>
                <h2
                  className="text-base font-bold"
                  style={{ fontFamily: "'Barlow Condensed', sans-serif", color: 'var(--foreground)' }}
                >
                  Divisão de Times
                </h2>
                <p className="text-[11px] text-muted">
                  Segure e arraste até o time, ou toque para transferir rapidamente
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowRulesModal(true)}
                  className="px-2.5 py-1 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  style={{
                    background: 'rgba(103, 61, 230, 0.1)',
                    borderColor: 'rgba(103, 61, 230, 0.3)',
                    color: 'var(--accent-light)',
                  }}
                  title="Ver regras da rodada"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Regras</span>
                </button>

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
            </div>

            {/* Smart Draw Actions */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={handleBalancedDraw}
                className="py-2.5 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer text-white border overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, #673DE6 0%, #8B5CF6 100%)',
                  borderColor: 'rgba(139, 92, 246, 0.4)',
                  boxShadow: '0 4px 14px rgba(103, 61, 230, 0.3)',
                }}
                title="Distribui os jogadores dividindo craques e mantendo médias iguais"
              >
                <Sparkles className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">Equilibrar</span>
              </button>

              <button
                type="button"
                onClick={handleRandomDraw}
                className="py-2.5 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer border bg-[var(--surface-2)] border-[var(--border-color)] text-white hover:border-[var(--accent)] overflow-hidden"
                title="Gera uma nova combinação aleatória sempre equilibrada"
              >
                <Shuffle className="w-3.5 h-3.5 flex-shrink-0 text-purple-400" />
                <span className="truncate">Reembaralhar</span>
              </button>

              <button
                type="button"
                onClick={clearAllTeams}
                className="py-2.5 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer border bg-[var(--surface-2)] border-[var(--border-color)] text-muted-light hover:text-rose-400 hover:border-rose-500/30 overflow-hidden"
                title="Limpar todos os times"
              >
                <RotateCcw className="w-3.5 h-3.5 flex-shrink-0 text-muted" />
                <span className="truncate">Limpar</span>
              </button>
            </div>

            {/* Modal de Regras da Pelada */}
            {showRulesModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
                <div
                  className="card w-full max-w-md max-h-[85vh] overflow-y-auto border-2 border-[var(--accent)] shadow-2xl p-5 space-y-4 animate-scale-in"
                  style={{
                    background: 'linear-gradient(135deg, rgba(15, 18, 28, 0.98), rgba(22, 17, 38, 0.98))',
                    boxShadow: '0 0 35px rgba(103, 61, 230, 0.4)',
                  }}
                >
                  <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center"
                        style={{ background: 'rgba(103, 61, 230, 0.25)', color: 'var(--accent)' }}
                      >
                        <HelpCircle className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-black text-base text-white">Regras da Pelada</h3>
                        <p className="text-[11px] text-muted">Formato Rei da Mesa</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowRulesModal(false)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 text-muted hover:text-white"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    <div className="p-3 rounded-xl border bg-[var(--surface-2)] border-[var(--border-color)]">
                      <span className="font-bold text-white block mb-0.5">Duração das Partidas</span>
                      <p className="text-muted text-[11px]">
                        <strong>7 minutos corridos</strong> ou <strong>2 gols</strong>. O que ocorrer primeiro encerra imediatamente o jogo.
                      </p>
                    </div>

                    <div className="p-3 rounded-xl border bg-[var(--surface-2)] border-[var(--border-color)]">
                      <span className="font-bold text-white block mb-0.5">Sorteio da 1ª Partida</span>
                      <p className="text-muted text-[11px]">
                        Dois times são sorteados para abrir o jogo. O 3º time (e demais) aguardam de cerca.
                      </p>
                    </div>

                    <div className="p-3 rounded-xl border bg-[var(--surface-2)] border-[var(--border-color)]">
                      <span className="font-bold text-white block mb-0.5">Quem Ganha Fica</span>
                      <p className="text-muted text-[11px]">
                        O vencedor permanece em campo. Em caso de empate, <strong>o time que entrou por último da cerca fica</strong>.
                      </p>
                    </div>

                    <div className="p-3 rounded-xl border bg-[var(--surface-2)] border-[var(--border-color)]">
                      <span className="font-bold text-white block mb-0.5">Rodízio Justo de Goleiros</span>
                      <p className="text-muted text-[11px]">
                        O sistema escala os goleiros de forma rotativa para que todos joguem ao menos uma vez no gol.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowRulesModal(false)}
                    className="btn btn-primary w-full py-2.5 text-xs font-bold"
                  >
                    Entendido
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Unassigned pool / Drop Zone */}
          <div
            data-drop-zone="unassigned"
            onDragOver={(e) => handleDragOver(e, 'unassigned')}
            onDrop={(e) => handleDrop(e, 'unassigned')}
            className={`card p-3 space-y-2 transition-all ${
              dragOverTeamId === 'unassigned' ? 'ring-2 ring-[var(--accent)] border-[var(--accent)]' : ''
            }`}
            style={{
              borderColor: unassignedPlayers.length > 0 ? 'rgba(139,92,246,0.3)' : 'var(--border-color)',
              background: dragOverTeamId === 'unassigned' ? 'rgba(103,61,230,0.15)' : 'rgba(103,61,230,0.03)',
            }}
          >
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--warning)' }}>
                Aguardando Time ({unassignedPlayers.length})
              </span>
              <span className="text-[10px] text-muted">
                Toque no jogador para escolher time
              </span>
            </div>

            <div className="flex flex-wrap gap-2 min-h-[3rem] items-center">
              {unassignedPlayers.map((p) => (
                <div
                  key={p.id}
                  draggable
                  onDragStart={() => handleDragStart(p.id)}
                  onTouchStart={(e) => handleTouchStart(e, p)}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  onClick={() => setTransferPlayer(p)}
                  className="px-3 py-2 rounded-xl text-xs font-bold cursor-grab active:cursor-grabbing transition-all flex items-center gap-2 select-none shadow-md hover:scale-105 active:scale-95"
                  style={{
                    background: 'var(--surface-hover)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--foreground)',
                  }}
                >
                  <GripVertical className="w-3 h-3 text-muted opacity-50" />
                  <span>{p.nickname || p.name}</span>
                  <StarRating stars={p.stars ?? 2} size={11} />
                </div>
              ))}

              {unassignedPlayers.length === 0 && (
                <span className="text-xs italic py-1 text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Todos os jogadores alocados nos times!
                </span>
              )}
            </div>
          </div>

          {/* Teams cards & Drop Zones */}
          <div className="space-y-3">
            {teams.map((team) => {
              const totalStars = team.players.reduce((sum, p) => sum + (p.stars ?? 2), 0);
              const craquesCount = team.players.filter((p) => (p.stars ?? 2) === 3).length;
              const isOver = dragOverTeamId === team.id;

              return (
                <div
                  key={team.id}
                  data-drop-zone={team.id}
                  onDragOver={(e) => handleDragOver(e, team.id)}
                  onDrop={(e) => handleDrop(e, team.id)}
                  className={`card overflow-hidden transition-all ${
                    isOver ? 'ring-2 ring-[var(--accent)] border-[var(--accent)] shadow-xl' : ''
                  }`}
                  style={{
                    background: isOver ? 'rgba(103,61,230,0.1)' : 'var(--surface)',
                  }}
                >
                  <div
                    className="px-4 py-2.5 flex items-center justify-between"
                    style={{ background: 'var(--surface-hover)', borderBottom: '1px solid var(--border-color)' }}
                  >
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      <span
                        className="w-3.5 h-3.5 rounded-full shadow-sm flex-shrink-0"
                        style={{ backgroundColor: team.color }}
                      />
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
                        className="bg-transparent text-sm font-bold focus:outline-none max-w-[140px]"
                        style={{ color: 'var(--foreground)' }}
                      />
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {/* Stats badge: Player count, Star sum and Craques count */}
                      <span
                        className="text-[11px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1.5"
                        style={{ background: 'var(--surface)', color: 'var(--foreground)' }}
                      >
                        <span>{team.players.length} jogs</span>
                        <span className="text-purple-300 font-extrabold flex items-center gap-1">
                          • {totalStars} <StarRating stars={1} max={1} size={11} />
                        </span>
                        {craquesCount > 0 && (
                          <span className="text-[10px] text-muted font-medium">
                            ({craquesCount} craque{craquesCount > 1 ? 's' : ''})
                          </span>
                        )}
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

                  {/* Team roster zone */}
                  <div className="p-3 min-h-[4rem] flex flex-wrap gap-2 items-center">
                    {team.players.map((p) => (
                      <div
                        key={p.id}
                        draggable
                        onDragStart={() => handleDragStart(p.id)}
                        onTouchStart={(e) => handleTouchStart(e, p)}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                        onClick={() => setTransferPlayer(p)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-grab active:cursor-grabbing transition-all select-none shadow-sm hover:scale-105 active:scale-95"
                        style={{
                          background: 'var(--surface-2)',
                          border: '1px solid var(--border-color)',
                          color: 'var(--foreground)',
                        }}
                      >
                        <GripVertical className="w-3 h-3 text-muted opacity-40" />
                        <span>{p.nickname || p.name}</span>
                        <StarRating stars={p.stars ?? 2} size={11} />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFromTeam(p);
                          }}
                          className="ml-1 text-[10px] text-muted hover:text-rose-400"
                        >
                          ✕
                        </button>
                      </div>
                    ))}

                    {team.players.length === 0 && (
                      <div className="w-full text-center py-2 text-xs italic text-muted">
                        Arraste ou toque em um jogador para colocar neste time
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Transfer Modal / Sheet */}
          {transferPlayer && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
              <div className="card w-full max-w-sm p-5 space-y-4 animate-scale-in border-2 border-[var(--accent)] shadow-2xl">
                <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: 'var(--border-color)' }}>
                  <div>
                    <span className="text-[11px] font-bold uppercase text-muted">Mover Jogador</span>
                    <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                      <span>{transferPlayer.nickname || transferPlayer.name}</span>
                      <StarRating stars={transferPlayer.stars ?? 2} size={12} />
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setTransferPlayer(null)}
                    className="p-1 rounded-lg text-muted hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-bold text-muted uppercase">Escolha o destino:</span>
                  {teams.map((t) => {
                    const isInTeam = t.players.some((p) => p.id === transferPlayer.id);
                    const totalStars = t.players.reduce((sum, p) => sum + (p.stars ?? 2), 0);
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          assignToTeam(transferPlayer, t.id);
                          setTransferPlayer(null);
                        }}
                        className={`w-full p-3 rounded-xl border flex items-center justify-between text-left transition-all ${
                          isInTeam ? 'ring-2 ring-[var(--accent)]' : 'hover:scale-[1.02]'
                        }`}
                        style={{
                          background: isInTeam ? 'rgba(103,61,230,0.18)' : 'var(--surface-2)',
                          borderColor: isInTeam ? 'var(--accent)' : 'var(--border-color)',
                        }}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="w-3.5 h-3.5 rounded-full flex-shrink-0" style={{ backgroundColor: t.color }} />
                          <span className="font-bold text-sm text-white">{t.name}</span>
                        </div>
                        <span className="text-xs text-muted font-bold flex items-center gap-1">
                          {t.players.length} jogs • {totalStars} <StarRating stars={1} max={1} size={11} />
                        </span>
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    onClick={() => {
                      removeFromTeam(transferPlayer);
                      setTransferPlayer(null);
                    }}
                    className="w-full p-2.5 rounded-xl border text-center text-xs font-bold text-purple-300 border-purple-500/30 hover:bg-purple-500/10 transition-colors"
                  >
                    Mover para Banco / Sem Time
                  </button>
                </div>
              </div>
            </div>
          )}

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
              {loading ? 'Criando Rodada...' : 'Iniciar Rodada'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
