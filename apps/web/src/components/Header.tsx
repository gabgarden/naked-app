'use client';

import { usePathname } from 'next/navigation';

import NakedLogo from './NakedLogo';

const pageTitles: Record<string, string> = {
  '/': 'Naked App',
  '/players': 'Players',
  '/players/new': 'New Player',
  '/rounds': 'Rounds',
  '/rounds/new': 'New Round',
  '/ranking': 'Ranking',
  // Legacy aliases
  '/jogadores': 'Players',
  '/jogadores/novo': 'New Player',
  '/peladas': 'Rounds',
  '/peladas/nova': 'New Round',
};

function getTitle(pathname: string): string {
  if (pageTitles[pathname]) return pageTitles[pathname];
  if (pathname.includes('/matches/') || pathname.includes('/partidas/')) return 'Match';
  if (pathname.match(/^\/rounds\/[^/]+$/) || pathname.match(/^\/peladas\/[^/]+$/)) return 'Round';
  if (pathname.match(/^\/players\/[^/]+$/) || pathname.match(/^\/jogadores\/[^/]+$/)) return 'Player';
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
        background: 'rgba(8, 10, 16, 0.85)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border-color)',
      }}
      className="sticky top-0 z-40"
    >
      <div className="relative max-w-2xl mx-auto h-full flex items-center px-4">
        <div className="flex items-center gap-3">
          <NakedLogo size={32} />
          <span
            className="text-xl font-bold tracking-wide uppercase"
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              color: 'var(--foreground)',
              letterSpacing: '0.04em',
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
