'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAccount, useChainId, usePublicClient } from 'wagmi';
import { RefreshCw } from 'lucide-react';
import { PositionCard } from './PositionCard';
import { UniswapV3Adapter } from '@/lib/adapters/UniswapV3Adapter';
import { PancakeSwapV3Adapter } from '@/lib/adapters/PancakeSwapV3Adapter';
import type { PositionInfo } from '@/types';

export function PositionList() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const [positions, setPositions] = useState<PositionInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'uniswap' | 'pancakeswap'>('all');

  const fetchPositions = useCallback(async () => {
    if (!address || !publicClient) return;
    setLoading(true);
    try {
      const [uni, cake] = await Promise.allSettled([
        new UniswapV3Adapter(chainId, publicClient as any).getPositions(address),
        new PancakeSwapV3Adapter(chainId, publicClient as any).getPositions(address),
      ]);
      setPositions([
        ...(uni.status  === 'fulfilled' ? uni.value  : []),
        ...(cake.status === 'fulfilled' ? cake.value : []),
      ]);
    } finally { setLoading(false); }
  }, [address, chainId, publicClient]);

  useEffect(() => { fetchPositions(); }, [fetchPositions]);

  const filtered = filter === 'all' ? positions : positions.filter((p) => p.protocol === filter);

  const tabStyle = (active: boolean) => ({
    background: active ? 'rgba(37,99,235,0.08)' : '#FFFFFF',
    color:      active ? '#2563EB' : '#64748B',
    border:     `1px solid ${active ? 'rgba(37,99,235,0.25)' : '#E2E8F0'}`,
  });

  if (!isConnected) {
    return (
      <div className="card text-center py-14">
        <p className="text-lg font-semibold mb-2" style={{ color: '#0F172A' }}>Connect Your Wallet</p>
        <p className="text-sm" style={{ color: '#64748B' }}>Connect your wallet to view your LP positions.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter bar — wraps on mobile */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex gap-2 flex-wrap">
          {([['all', 'All'], ['uniswap', 'Uniswap V3'], ['pancakeswap', 'PancakeSwap V3']] as const).map(([f, label]) => (
            <button key={f} onClick={() => setFilter(f)}
              className="px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap"
              style={tabStyle(filter === f)}>
              {label}
            </button>
          ))}
        </div>
        <button onClick={fetchPositions} disabled={loading}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl transition-all flex-shrink-0"
          style={{ background: '#FFFFFF', color: '#64748B', border: '1px solid #E2E8F0' }}>
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          {loading ? 'Loading…' : 'Refresh'}
        </button>
      </div>

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card-sm">
              <div className="loading-skeleton h-4 w-3/4 mb-3" />
              <div className="loading-skeleton h-3 w-1/2 mb-2" />
              <div className="loading-skeleton h-3 w-2/3" />
            </div>
          ))}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="card text-center py-14">
          <p className="font-semibold mb-2" style={{ color: '#0F172A' }}>No Positions Found</p>
          <p className="text-sm" style={{ color: '#64748B' }}>
            You have no liquidity positions on this chain.{' '}
            <a href="/pool" className="font-medium underline" style={{ color: '#2563EB' }}>Add liquidity →</a>
          </p>
        </div>
      )}

      {!loading && filtered.map((position) => (
        <PositionCard
          key={`${position.protocol}-${position.tokenId}`}
          position={position}
          onRefresh={fetchPositions}
        />
      ))}
    </div>
  );
}
