'use client';

import { usePathname } from 'next/navigation';

const pageTitles: Record<string, string> = {
  '/': 'Naked App',
  '/jogadores': 'Jogadores',
  '/jogadores/novo': 'Novo Jogador',
  '/peladas': 'Peladas',
  '/peladas/nova': 'Nova Pelada',
  '/ranking': 'Ranking',
};

function getTitle(pathname: string): string {
  if (pageTitles[pathname]) return pageTitles[pathname];
  if (pathname.includes('/partidas/')) return 'Partida';
  if (pathname.match(/^\/peladas\/[^/]+$/)) return 'Pelada';
  if (pathname.match(/^\/jogadores\/[^/]+$/)) return 'Jogador';
  return 'Naked App';
}

export default function Header() {
  const pathname = usePathname();
  const title = getTitle(pathname);

  return (
    <header
      id="app-header"
      style={{
        height: 'var(--header-height)',
        background: 'rgba(13, 15, 20, 0.95)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border-color)',
      }}
      className="sticky top-0 z-40"
    >
      <div className="relative max-w-2xl mx-auto h-full flex items-center px-4">
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-sm"
            style={{
              background: 'linear-gradient(135deg, var(--accent-dark), var(--accent))',
              color: '#fff',
            }}
          >
            ⚽
          </div>
          <span
            className="text-xl font-bold tracking-wide"
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              color: 'var(--foreground)',
            }}
          >
            {title}
          </span>
        </div>
        <div className="header-accent-bar" />
      </div>
    </header>
  );
}
