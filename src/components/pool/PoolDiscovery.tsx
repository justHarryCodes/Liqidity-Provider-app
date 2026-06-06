'use client';

import { useState, useCallback } from 'react';
import { useChainId, usePublicClient } from 'wagmi';
import { TokenSelector } from '@/components/swap/TokenSelector';
import { UniswapV3Adapter } from '@/lib/adapters/UniswapV3Adapter';
import { PancakeSwapV3Adapter } from '@/lib/adapters/PancakeSwapV3Adapter';
import { sqrtPriceX96ToPrice, shortenAddress } from '@/lib/utils';
import type { TokenInfo, FeeAmount, PoolInfo, Protocol } from '@/types';
import { FEE_LABELS, FEE_AMOUNTS } from '@/types';

interface Props {
  onPoolSelected?: (pool: PoolInfo, token0: TokenInfo, token1: TokenInfo, protocol: Protocol) => void;
}

export function PoolDiscovery({ onPoolSelected }: Props) {
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const [protocol, setProtocol] = useState<Protocol>('uniswap');
  const [tokenA, setTokenA] = useState<TokenInfo | undefined>();
  const [tokenB, setTokenB] = useState<TokenInfo | undefined>();
  const [fee, setFee] = useState<FeeAmount>(3000);
  const [pool, setPool] = useState<PoolInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDiscover = useCallback(async () => {
    if (!tokenA || !tokenB || !publicClient) return;
    setLoading(true); setError(''); setPool(null);
    try {
      const adapter = protocol === 'uniswap'
        ? new UniswapV3Adapter(chainId, publicClient as any)
        : new PancakeSwapV3Adapter(chainId, publicClient as any);
      setPool(await adapter.getPool(tokenA, tokenB, fee));
    } catch (err: any) { setError(err.message || 'Failed to query pool'); }
    finally { setLoading(false); }
  }, [tokenA, tokenB, fee, protocol, chainId, publicClient]);

  const price = pool?.exists && pool.sqrtPriceX96 > 0n
    ? sqrtPriceX96ToPrice(pool.sqrtPriceX96, tokenA?.decimals ?? 18, tokenB?.decimals ?? 18) : null;

  const tabStyle = (active: boolean) => ({
    background: active ? 'rgba(37,99,235,0.08)' : '#F1F5F9',
    color:      active ? '#2563EB' : '#64748B',
    border:     `1px solid ${active ? 'rgba(37,99,235,0.25)' : '#E2E8F0'}`,
  });

  return (
    <div className="card space-y-4">
      <h3 className="font-semibold" style={{ color: '#0F172A' }}>Discover Pool</h3>

      {/* Protocol */}
      <div className="flex gap-2">
        {(['uniswap', 'pancakeswap'] as Protocol[]).map((p) => (
          <button key={p} onClick={() => setProtocol(p)}
            className="flex-1 py-2 rounded-xl text-xs font-medium capitalize transition-all"
            style={tabStyle(protocol === p)}>
            {p === 'uniswap' ? 'Uniswap V3' : 'PancakeSwap V3'}
          </button>
        ))}
      </div>

      {/* Token pair */}
      <div className="flex items-center gap-2">
        <div className="flex-1 flex items-center justify-center px-3 py-2.5 rounded-xl min-w-0" style={{ background: '#F1F5F9', border: '1px solid #E2E8F0' }}>
          <TokenSelector selected={tokenA} onSelect={setTokenA} exclude={tokenB} />
        </div>
        <span className="font-bold flex-shrink-0" style={{ color: '#94A3B8' }}>+</span>
        <div className="flex-1 flex items-center justify-center px-3 py-2.5 rounded-xl min-w-0" style={{ background: '#F1F5F9', border: '1px solid #E2E8F0' }}>
          <TokenSelector selected={tokenB} onSelect={setTokenB} exclude={tokenA} />
        </div>
      </div>

      {/* Fee tier — 2 cols on mobile, 4 on sm+ */}
      <div>
        <label className="text-xs mb-2 block font-medium" style={{ color: '#64748B' }}>Fee Tier</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {FEE_AMOUNTS.map((f) => (
            <button key={f} onClick={() => setFee(f)}
              className="py-2 rounded-xl text-xs font-medium transition-all"
              style={tabStyle(fee === f)}>
              {FEE_LABELS[f]}
            </button>
          ))}
        </div>
      </div>

      <button onClick={handleDiscover} disabled={!tokenA || !tokenB || loading}
        className="btn-primary w-full text-sm">
        {loading ? 'Searching…' : 'Find Pool'}
      </button>

      {error && <p className="text-xs" style={{ color: '#EF4444' }}>{error}</p>}

      {pool !== null && (
        <div className="rounded-xl p-4 space-y-3"
          style={{ background: '#F8FAFC', border: `1px solid ${pool.exists ? '#E2E8F0' : 'rgba(239,68,68,0.25)'}` }}>
          {!pool.exists ? (
            <div className="text-center py-2">
              <p className="font-medium" style={{ color: '#F59E0B' }}>Pool Does Not Exist</p>
              <p className="text-xs mt-1" style={{ color: '#64748B' }}>
                Create a new pool for {tokenA?.symbol}/{tokenB?.symbol} at {FEE_LABELS[fee]}
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="font-semibold text-sm" style={{ color: '#0F172A' }}>
                  {tokenA?.symbol}/{tokenB?.symbol} {FEE_LABELS[fee]}
                </span>
                <span className="text-xs px-2 py-1 rounded-full font-medium flex-shrink-0"
                  style={{ background: 'rgba(16,185,129,0.1)', color: '#10B981' }}>
                  Active
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span style={{ color: '#64748B' }}>Pool Address</span>
                  <p className="font-mono mt-0.5 font-medium truncate" style={{ color: '#0F172A' }}>{shortenAddress(pool.address)}</p>
                </div>
                <div>
                  <span style={{ color: '#64748B' }}>Current Price</span>
                  <p className="mt-0.5 font-medium" style={{ color: '#0F172A' }}>
                    {price !== null ? price.toFixed(6) : '—'} {tokenB?.symbol}/{tokenA?.symbol}
                  </p>
                </div>
                <div>
                  <span style={{ color: '#64748B' }}>Liquidity</span>
                  <p className="mt-0.5 font-medium font-mono truncate" style={{ color: '#0F172A' }}>{pool.liquidity.toString()}</p>
                </div>
                <div>
                  <span style={{ color: '#64748B' }}>Tick</span>
                  <p className="mt-0.5 font-medium" style={{ color: '#0F172A' }}>{pool.tick}</p>
                </div>
              </div>
              {onPoolSelected && tokenA && tokenB && (
                <button onClick={() => onPoolSelected(pool, tokenA, tokenB, protocol)}
                  className="btn-primary w-full text-sm mt-1">
                  Add Liquidity →
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
