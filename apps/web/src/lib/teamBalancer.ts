export interface PlayerWithStars {
  id: string;
  name: string;
  nickname?: string | null;
  stars?: number | null;
}

/**
 * Algoritmo de Sorteio e Balanceamento Inteligente para Peladas
 *
 * Garante simultaneamente:
 * 1. Igualdade estrita no número de jogadores por time (diferença máx de 1 jogador).
 * 2. Distribuição justa de Craques (3 estrelas) - diferença máx de 1 craque entre qualquer time.
 * 3. Distribuição justa de Básicos (1 estrela) - diferença máx de 1 básico entre qualquer time.
 * 4. Média de estrelas por jogador compensada e quase idêntica em todos os times.
 * 5. Variação aleatória a cada clique (reembaralha garantindo equilíbrio matemático).
 */
export function balanceTeams<T extends PlayerWithStars>(
  players: T[],
  numTeams: number,
): T[][] {
  if (numTeams <= 0) return [];
  if (players.length === 0) return Array.from({ length: numTeams }, () => []);

  const N = players.length;
  const K = numTeams;

  // 1. Determina a capacidade exata de cada time (ex: 19 jogadores em 3 times = [7, 6, 6])
  const baseSize = Math.floor(N / K);
  const remainder = N % K;

  // Sorteia quais times recebem o jogador excedente para não beneficiar sempre o mesmo time
  const sizeIndices = Array.from({ length: K }, (_, i) => i);
  for (let i = sizeIndices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [sizeIndices[i], sizeIndices[j]] = [sizeIndices[j], sizeIndices[i]];
  }

  const targetSizes = new Array(K).fill(baseSize);
  for (let i = 0; i < remainder; i++) {
    targetSizes[sizeIndices[i]] += 1;
  }

  const shuffle = <U>(arr: U[]): U[] => {
    const res = [...arr];
    for (let i = res.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [res[i], res[j]] = [res[j], res[i]];
    }
    return res;
  };

  // Separação por faixas técnicas
  const tier3 = shuffle(players.filter((p) => (p.stars ?? 2) === 3));
  const tier2 = shuffle(players.filter((p) => (p.stars ?? 2) === 2));
  const tier1 = shuffle(players.filter((p) => (p.stars ?? 2) === 1));

  const totalStars = players.reduce((acc, p) => acc + (p.stars ?? 2), 0);
  const targetAvgStarsPerPlayer = totalStars / N;

  // Função de pontuação de desbalanceamento (quanto menor, mais equilibrado)
  const scoreAssignment = (teams: T[][]): number => {
    let penalty = 0;

    // A) Penalidade gravíssima para tamanho incorreto
    for (let i = 0; i < K; i++) {
      const diff = Math.abs(teams[i].length - targetSizes[i]);
      if (diff > 0) penalty += diff * 100000;
    }

    // B) Dispersão de Craques (3 estrelas): diferença máxima permitida é 1
    const craquesCounts = teams.map((t) => t.filter((p) => (p.stars ?? 2) === 3).length);
    const craquesSpread = Math.max(...craquesCounts) - Math.min(...craquesCounts);
    if (craquesSpread > 1) {
      penalty += (craquesSpread - 1) * 25000;
    }

    // C) Dispersão de Básicos (1 estrela): diferença máxima permitida é 1
    const basicCounts = teams.map((t) => t.filter((p) => (p.stars ?? 2) === 1).length);
    const basicSpread = Math.max(...basicCounts) - Math.min(...basicCounts);
    if (basicSpread > 1) {
      penalty += (basicSpread - 1) * 20000;
    }

    // D) Média e total de estrelas esperadas para o tamanho do time
    for (let i = 0; i < K; i++) {
      if (teams[i].length > 0) {
        const teamSum = teams[i].reduce((acc, p) => acc + (p.stars ?? 2), 0);
        const teamAvg = teamSum / teams[i].length;
        penalty += Math.pow((teamAvg - targetAvgStarsPerPlayer) * 10, 2);

        const expectedTeamStars = targetSizes[i] * targetAvgStarsPerPlayer;
        penalty += Math.pow(teamSum - expectedTeamStars, 2) * 8;
      }
    }

    return penalty;
  };

  let bestTeams: T[][] = Array.from({ length: K }, () => []);
  let bestScore = Infinity;

  // Busca multi-start (60 iterações com otimização local)
  for (let attempt = 0; attempt < 60; attempt++) {
    const candidateTeams: T[][] = Array.from({ length: K }, () => []);

    // Ordem aleatória de preenchimento dos times
    const teamOrder = Array.from({ length: K }, (_, i) => i);
    for (let i = teamOrder.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [teamOrder[i], teamOrder[j]] = [teamOrder[j], teamOrder[i]];
    }

    // 1. Distribui os Craques (Tier 3) uniformemente
    const t3List = shuffle(tier3);
    for (let i = 0; i < t3List.length; i++) {
      const teamIdx = teamOrder[i % K];
      candidateTeams[teamIdx].push(t3List[i]);
    }

    // 2. Distribui os Básicos (Tier 1) de forma a compensar os times com mais craques/tamanho
    const t1List = shuffle(tier1);
    for (let i = 0; i < t1List.length; i++) {
      const eligibleTeams = candidateTeams
        .map((t, idx) => ({ t, idx }))
        .filter(({ t, idx }) => t.length < targetSizes[idx]);

      if (eligibleTeams.length > 0) {
        // Envia para o time elegível com maior soma de estrelas para puxar a média para o centro
        eligibleTeams.sort((a, b) => {
          const sumA = a.t.reduce((acc, p) => acc + (p.stars ?? 2), 0);
          const sumB = b.t.reduce((acc, p) => acc + (p.stars ?? 2), 0);
          return sumB - sumA;
        });
        eligibleTeams[0].t.push(t1List[i]);
      } else {
        candidateTeams[i % K].push(t1List[i]);
      }
    }

    // 3. Distribui os Médios (Tier 2) preenchendo os times com menor pontuação
    const t2List = shuffle(tier2);
    for (let i = 0; i < t2List.length; i++) {
      const eligibleTeams = candidateTeams
        .map((t, idx) => ({ t, idx }))
        .filter(({ t, idx }) => t.length < targetSizes[idx]);

      if (eligibleTeams.length > 0) {
        eligibleTeams.sort((a, b) => {
          const sumA = a.t.reduce((acc, p) => acc + (p.stars ?? 2), 0);
          const sumB = b.t.reduce((acc, p) => acc + (p.stars ?? 2), 0);
          return sumA - sumB;
        });
        eligibleTeams[0].t.push(t2List[i]);
      } else {
        candidateTeams[i % K].push(t2List[i]);
      }
    }

    // 4. Otimização por trocas locais (Hill Climbing)
    let currentScore = scoreAssignment(candidateTeams);

    for (let step = 0; step < 50; step++) {
      const tAIdx = Math.floor(Math.random() * K);
      const tBIdx = Math.floor(Math.random() * K);
      if (tAIdx === tBIdx) continue;

      const teamA = candidateTeams[tAIdx];
      const teamB = candidateTeams[tBIdx];
      if (teamA.length === 0 || teamB.length === 0) continue;

      const pAIdx = Math.floor(Math.random() * teamA.length);
      const pBIdx = Math.floor(Math.random() * teamB.length);

      const pA = teamA[pAIdx];
      const pB = teamB[pBIdx];

      // Testa a troca
      teamA[pAIdx] = pB;
      teamB[pBIdx] = pA;

      const newScore = scoreAssignment(candidateTeams);
      if (newScore < currentScore) {
        currentScore = newScore;
      } else {
        // Desfaz se não melhorou
        teamA[pAIdx] = pA;
        teamB[pBIdx] = pB;
      }
    }

    if (currentScore < bestScore) {
      bestScore = currentScore;
      bestTeams = candidateTeams.map((t) => [...t]);
    }
  }

  return bestTeams;
}
