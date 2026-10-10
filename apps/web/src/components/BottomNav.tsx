'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, Calendar, Trophy } from 'lucide-react';

const navItems = [
  { href: '/', label: 'Home', Icon: Home },
  { href: '/players', label: 'Players', Icon: Users },
  { href: '/rounds', label: 'Rounds', Icon: Calendar },
  { href: '/ranking', label: 'Ranking', Icon: Trophy },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      id="bottom-nav"
      style={{
        height: 'var(--bottom-nav-height)',
        background: 'linear-gradient(180deg, rgba(8,10,16,0.3) 0%, rgba(8,10,16,0.95) 30%)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
      }}
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--border-color)]"
    >
      <div className="max-w-2xl mx-auto h-full flex items-center justify-around px-2">
        {navItems.map(({ href, label, Icon }) => {
          const isActive =
            href === '/' ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              id={`nav-${label.toLowerCase()}`}
              className="flex flex-col items-center justify-center gap-1 flex-1 h-full transition-all duration-200 group"
            >
              <div
                className="relative flex items-center justify-center w-10 h-8 rounded-xl transition-all duration-200"
                style={{
                  background: isActive ? 'rgba(204, 255, 0, 0.15)' : 'transparent',
                }}
              >
                <Icon
                  className="w-5 h-5 transition-all duration-200"
                  style={{
                    color: isActive ? 'var(--accent)' : 'var(--muted)',
                    strokeWidth: isActive ? 2.5 : 2,
                  }}
                />
                {isActive && (
                  <span
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                    style={{ background: 'var(--accent)' }}
                  />
                )}
              </div>
              <span
                className="text-[10px] font-semibold tracking-wide transition-colors duration-200"
                style={{
                  color: isActive ? 'var(--accent)' : 'var(--muted)',
                }}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
