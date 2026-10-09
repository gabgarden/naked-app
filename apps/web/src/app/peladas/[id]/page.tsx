import { notFound } from 'next/navigation';
import { peladasService } from '../../../services/peladas.service';
import { PeladaDetailClient } from '../../../components/PeladaDetailClient';

export const revalidate = 0;

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PeladaDetailPage({ params }: PageProps) {
  const { id } = await params;

  let round;
  try {
    round = await peladasService.getById(id);
  } catch {
    notFound();
  }

  if (!round) {
    notFound();
  }

  return <PeladaDetailClient initialRound={round} />;
}
