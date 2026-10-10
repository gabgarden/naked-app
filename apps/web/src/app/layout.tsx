import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import BottomNav from '../components/BottomNav';
import Header from '../components/Header';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'Naked App — Match & Player Tracker',
  description: 'Track matches, squads, goals, and player stats cleanly.',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'Naked App' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#CCFF00',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <div className="min-h-screen flex flex-col">
          <Header />
          <main className="flex-1 w-full max-w-2xl mx-auto px-4 pt-4">
            {children}
          </main>
          <BottomNav />
        </div>
      </body>
    </html>
  );
}
