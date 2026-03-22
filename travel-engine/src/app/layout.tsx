import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Travel Plans — Expert Destination Guides',
  description:
    'Curated travel plans with day-by-day itineraries, kid-friendly ratings, and local tips. Buy once, download instantly.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-lg">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
            <a href="/" className="text-lg font-bold text-brand-800">
              TravelPlans
            </a>
            <nav className="flex items-center gap-6 text-sm font-medium text-gray-600">
              <a href="/#destinations" className="hover:text-brand-700">
                Destinations
              </a>
            </nav>
          </div>
        </header>
        <main className="min-h-screen">{children}</main>
        <footer className="border-t border-gray-200 bg-gray-50 py-10 text-center text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} TravelPlans. All rights reserved.</p>
        </footer>
      </body>
    </html>
  );
}
