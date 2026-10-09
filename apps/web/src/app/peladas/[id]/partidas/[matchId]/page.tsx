import { notFound } from 'next/navigation';
import { matchesService } from '../../../../../services/matches.service';
import { MatchLiveBoard } from '../../../../../components/MatchLiveBoard';

export const revalidate = 0;

interface PageProps {
  params: Promise<{ id: string; matchId: string }>;
}

export default async function MatchLivePage({ params }: PageProps) {
  const { matchId } = await params;

  let match;
  try {
    match = await matchesService.getDetails(matchId);
  } catch {
    notFound();
  }

  if (!match) {
    notFound();
  }

  return <MatchLiveBoard initialMatch={match} matchDuration={10} />;
}
