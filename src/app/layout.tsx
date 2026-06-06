import type { Metadata } from 'next';
import './globals.css';
import { WalletProvider } from '@/providers/WalletProvider';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';

export const metadata: Metadata = {
  title: 'LiquidityDEX — Uniswap V3 & PancakeSwap V3',
  description: 'Multi-chain DEX interface for Uniswap V3 and PancakeSwap V3',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <WalletProvider>
          <div className="flex h-screen overflow-hidden" style={{ background: '#F0F4F8' }}>
            <Sidebar />
            <div className="flex flex-col flex-1 overflow-hidden min-w-0">
              <Header />
              {/* pb-20 on mobile reserves space above the bottom nav */}
              <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-24 md:pb-6">
                {children}
              </main>
            </div>
          </div>
          <BottomNav />
        </WalletProvider>
      </body>
    </html>
  );
}
