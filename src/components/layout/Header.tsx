'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useChainId } from 'wagmi';
import { Globe, Zap } from 'lucide-react';
import { CHAIN_NAMES } from '@/lib/constants/addresses';
import type { ChainId } from '@/types';

export function Header() {
  const chainId = useChainId();
  const chainName = CHAIN_NAMES[chainId as ChainId] || 'Unknown';

  return (
    <header
      className="flex items-center justify-between px-4 md:px-6 py-3 flex-shrink-0"
      style={{ borderBottom: '1px solid #E2E8F0', background: '#FFFFFF' }}
    >
      {/* Logo — shown only on mobile (sidebar hidden on mobile) */}
      <div className="flex items-center gap-2 md:hidden">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #2563EB, #0EA5E9)' }}
        >
          <Zap size={14} color="white" strokeWidth={2.5} />
        </div>
        <span className="font-bold text-sm" style={{ color: '#0F172A' }}>LiquidityDEX</span>
      </div>

      {/* Chain badge — hidden on mobile, shown on desktop */}
      <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
        style={{ background: '#F1F5F9', color: '#64748B', border: '1px solid #E2E8F0' }}>
        <Globe size={12} strokeWidth={1.8} />
        {chainName}
      </div>

      <ConnectButton
        accountStatus="address"
        chainStatus="icon"
        showBalance={false}
      />
    </header>
  );
}
