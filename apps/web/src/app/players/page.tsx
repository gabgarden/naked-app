import { playersService } from '../../services/players.service';
import { PlayerListClient } from '../../components/PlayerListClient';

export const revalidate = 0;

async function getPlayers() {
  try {
    return await playersService.list();
  } catch {
    return [];
  }
}

export default async function PlayersPage() {
  const players = await getPlayers();

  return <PlayerListClient initialPlayers={players} />;
}
