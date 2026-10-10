export const PELADA_MATCH_DURATION_MINUTES = 7;
export const PELADA_GOAL_LIMIT = 2;

export interface PeladaTeam {
  id: string;
  name: string;
  color: string;
  players?: { id: string; name: string; nickname?: string | null; stars?: number }[];
}

export interface PeladaMatch {
  id: string;
  round_id?: string;
  team_a_id: string;
  team_b_id: string;
  score_a: number;
  score_b: number;
  status: string; // 'pending' | 'in_progress' | 'finished'
  match_order: number;
  goalkeeper_a_id?: string | null;
  goalkeeper_b_id?: string | null;
}

// Algoritmo de Rodízio Justo de Goleiros
export function getNextGoalkeeper(
  team?: PeladaTeam,
  matches: PeladaMatch[] = [],
): { id: string; count: number } {
  if (!team || !team.players || team.players.length === 0) {
    return { id: '', count: 0 };
  }

  const players = team.players;
  if (players.length === 1) {
    return { id: players[0].id, count: 0 };
  }

  const gkCounts: Record<string, number> = {};
  for (const p of players) {
    gkCounts[p.id] = 0;
  }

  for (const m of matches) {
    if (m.team_a_id === team.id && m.goalkeeper_a_id) {
      if (gkCounts[m.goalkeeper_a_id] !== undefined) {
        gkCounts[m.goalkeeper_a_id] += 1;
      }
    }
    if (m.team_b_id === team.id && m.goalkeeper_b_id) {
      if (gkCounts[m.goalkeeper_b_id] !== undefined) {
        gkCounts[m.goalkeeper_b_id] += 1;
      }
    }
  }

  const minCount = Math.min(...players.map((p) => gkCounts[p.id] || 0));
  const candidate = players.find((p) => (gkCounts[p.id] || 0) === minCount);

  return {
    id: candidate ? candidate.id : players[0].id,
    count: candidate ? gkCounts[candidate.id] || 0 : 0,
  };
}

export interface PeladaState {
  currentMatch: PeladaMatch | null;
  lastFinishedMatch: PeladaMatch | null;
  teamStaying: PeladaTeam | null;
  teamLeaving: PeladaTeam | null;
  teamEntering: PeladaTeam | null;
  cercaQueue: PeladaTeam[];
  reason: string;
  isFirstMatch: boolean;
  nextMatchOrder: number;
  suggestedGkAId: string;
  suggestedGkBId: string;
}

/**
 * Determina o estado da pelada "Rei da Mesa" (Quem ganha fica / Empate desafiante da cerca fica)
 */
export function determinePeladaState(
  teams: PeladaTeam[],
  matches: PeladaMatch[],
): PeladaState {
  const teamsMap = new Map<string, PeladaTeam>(teams.map((t) => [t.id, t]));
  const sortedMatches = [...matches].sort((a, b) => a.match_order - b.match_order);

  const finishedMatches = sortedMatches.filter((m) => m.status === 'finished');
  const activeOrPendingMatches = sortedMatches.filter((m) => m.status !== 'finished');
  const currentMatch = activeOrPendingMatches[0] || null;
  const lastFinishedMatch = finishedMatches[finishedMatches.length - 1] || null;

  // Se não temos nenhuma partida finalizada ainda
  if (finishedMatches.length === 0) {
    // Se já existe uma 1ª partida criada (pendente ou em andamento)
    if (currentMatch) {
      const playingIds = new Set([currentMatch.team_a_id, currentMatch.team_b_id]);
      const cercaQueue = teams.filter((t) => !playingIds.has(t.id));
      const teamA = teamsMap.get(currentMatch.team_a_id) || null;
      const teamB = teamsMap.get(currentMatch.team_b_id) || null;

      return {
        currentMatch,
        lastFinishedMatch: null,
        teamStaying: teamA,
        teamLeaving: null,
        teamEntering: cercaQueue[0] || null,
        cercaQueue,
        reason: 'Primeira partida da rodada (Sorteada)',
        isFirstMatch: true,
        nextMatchOrder: 2,
        suggestedGkAId: '',
        suggestedGkBId: '',
      };
    }

    // Nenhuma partida criada ainda: Sorteia 2 times para abrir a rodada
    const shuffled = [...teams].sort(() => Math.random() - 0.5);
    const teamA = shuffled[0] || null;
    const teamB = shuffled[1] || null;
    const cercaQueue = shuffled.slice(2);

    const gkA = teamA ? getNextGoalkeeper(teamA, []) : { id: '' };
    const gkB = teamB ? getNextGoalkeeper(teamB, []) : { id: '' };

    return {
      currentMatch: null,
      lastFinishedMatch: null,
      teamStaying: teamA,
      teamLeaving: null,
      teamEntering: teamB,
      cercaQueue,
      reason: 'Sorteio da 1ª partida',
      isFirstMatch: true,
      nextMatchOrder: 1,
      suggestedGkAId: gkA.id,
      suggestedGkBId: gkB.id,
    };
  }

  // Simular a fila da cerca e os vencedores jogo a jogo para determinar com 100% de precisão:
  // 1. Quem entrou da cerca por último no jogo mais recente
  // 2. Fila atual da cerca
  let cercaQueue: string[] = [];

  // Na partida 1:
  const firstMatch = finishedMatches[0];
  const firstPlayingIds = new Set([firstMatch.team_a_id, firstMatch.team_b_id]);
  cercaQueue = teams.filter((t) => !firstPlayingIds.has(t.id)).map((t) => t.id);

  let lastStayingTeamId = '';
  let lastLeavingTeamId = '';
  let lastReason = '';

  for (let i = 0; i < finishedMatches.length; i++) {
    const m = finishedMatches[i];
    const prevMatch = i > 0 ? finishedMatches[i - 1] : null;

    let stayingId = '';
    let leavingId = '';
    let matchReason = '';

    if (m.score_a > m.score_b) {
      stayingId = m.team_a_id;
      leavingId = m.team_b_id;
      const winnerName = teamsMap.get(stayingId)?.name || 'Vencedor';
      matchReason = `Vitória de ${winnerName} (${m.score_a} × ${m.score_b}) — Quem ganha fica!`;
    } else if (m.score_b > m.score_a) {
      stayingId = m.team_b_id;
      leavingId = m.team_a_id;
      const winnerName = teamsMap.get(stayingId)?.name || 'Vencedor';
      matchReason = `Vitória de ${winnerName} (${m.score_b} × ${m.score_a}) — Quem ganha fica!`;
    } else {
      // Empate!
      // Regra: o time que entrou da cerca por último fica.
      if (prevMatch) {
        const prevTeams = new Set([prevMatch.team_a_id, prevMatch.team_b_id]);
        if (!prevTeams.has(m.team_a_id)) {
          // Time A veio da cerca
          stayingId = m.team_a_id;
          leavingId = m.team_b_id;
        } else if (!prevTeams.has(m.team_b_id)) {
          // Time B veio da cerca
          stayingId = m.team_b_id;
          leavingId = m.team_a_id;
        } else {
          // Caso ambos estivessem no jogo anterior (improvável), time B fica
          stayingId = m.team_b_id;
          leavingId = m.team_a_id;
        }
      } else {
        // Empate no jogo 1: Time B (desafiante) fica
        stayingId = m.team_b_id;
        leavingId = m.team_a_id;
      }

      const stayingName = teamsMap.get(stayingId)?.name || 'Desafiante';
      matchReason = `Empate (${m.score_a} × ${m.score_b}) — ${stayingName} entrou da cerca por último e fica!`;
    }

    lastStayingTeamId = stayingId;
    lastLeavingTeamId = leavingId;
    lastReason = matchReason;

    // O perdedor vai para o final da fila da cerca
    if (leavingId && !cercaQueue.includes(leavingId)) {
      cercaQueue.push(leavingId);
    }

    // Se houver próximo jogo já jogado, removemos quem entrou da cerca
    if (i < finishedMatches.length - 1) {
      const nextM = finishedMatches[i + 1];
      const nextPlayingIds = new Set([nextM.team_a_id, nextM.team_b_id]);
      // Remove da fila da cerca quem entrou em campo
      cercaQueue = cercaQueue.filter((id) => !nextPlayingIds.has(id));
    }
  }

  // Agora temos a fila final da cerca após a última partida finalizada
  // O próximo time a entrar é o primeiro da fila
  const nextEnteringId = cercaQueue.length > 0 ? cercaQueue[0] : '';
  const remainingCercaQueue = cercaQueue.slice(1).map((id) => teamsMap.get(id)!).filter(Boolean);

  const teamStaying = teamsMap.get(lastStayingTeamId) || null;
  const teamLeaving = teamsMap.get(lastLeavingTeamId) || null;
  const teamEntering = teamsMap.get(nextEnteringId) || (teams.find((t) => t.id !== lastStayingTeamId) || null);

  const gkA = teamStaying ? getNextGoalkeeper(teamStaying, sortedMatches) : { id: '' };
  const gkB = teamEntering ? getNextGoalkeeper(teamEntering, sortedMatches) : { id: '' };

  return {
    currentMatch,
    lastFinishedMatch,
    teamStaying,
    teamLeaving,
    teamEntering,
    cercaQueue: teamEntering ? [teamEntering, ...remainingCercaQueue] : remainingCercaQueue,
    reason: lastReason,
    isFirstMatch: false,
    nextMatchOrder: sortedMatches.length + 1,
    suggestedGkAId: gkA.id,
    suggestedGkBId: gkB.id,
  };
}
