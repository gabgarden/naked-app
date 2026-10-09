import { notFound } from 'next/navigation';
import { roundsService } from '../../../services/rounds.service';
import { RoundDetailClient } from '../../../components/RoundDetailClient';

export const revalidate = 0;

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function RoundDetailPage({ params }: PageProps) {
  const { id } = await params;

  let round;
  try {
    round = await roundsService.getById(id);
  } catch {
    notFound();
  }

  if (!round) {
    notFound();
  }

  return <RoundDetailClient initialRound={round} />;
}
