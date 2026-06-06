'use client';

import { useState, useEffect } from 'react';
import { useChainId, usePublicClient, useWalletClient, useAccount } from 'wagmi';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { TransactionModal } from '@/components/common/TransactionModal';
import { RemoveLiquidity } from '@/components/pool/RemoveLiquidity';
import { IncreaseLiquidity } from '@/components/pool/IncreaseLiquidity';
import { UniswapV3Adapter } from '@/lib/adapters/UniswapV3Adapter';
import { PancakeSwapV3Adapter } from '@/lib/adapters/PancakeSwapV3Adapter';
import { shortenAddress, tickToPrice, formatAmount } from '@/lib/utils';
import { MAX_UINT128 } from '@/lib/constants/addresses';
import { FEE_LABELS } from '@/types';
import { erc20ABI } from '@/lib/abis';
import type { PositionInfo, FeeAmount } from '@/types';

interface Props {
  position: PositionInfo;
  onRefresh?: () => void;
}

export function PositionCard({ position, onRefresh }: Props) {
  const { address } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const [expanded, setExpanded] = useState(false);
  const [manageTab, setManageTab] = useState<'increase' | 'remove'>('remove');
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
  const [txModal, setTxModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [token0Decimals, setToken0Decimals] = useState(18);
  const [token1Decimals, setToken1Decimals] = useState(18);

  useEffect(() => {
    if (!publicClient) return;
    Promise.all([
      publicClient.readContract({ address: position.token0, abi: erc20ABI, functionName: 'decimals' }),
      publicClient.readContract({ address: position.token1, abi: erc20ABI, functionName: 'decimals' }),
    ]).then(([d0, d1]) => { setToken0Decimals(Number(d0)); setToken1Decimals(Number(d1)); }).catch(() => {});
  }, [position.token0, position.token1, publicClient]);

  const priceLower = tickToPrice(position.tickLower, token0Decimals, token1Decimals);
  const priceUpper = tickToPrice(position.tickUpper, token0Decimals, token1Decimals);
  const isInRange  = position.liquidity > 0n;
  const hasFees    = position.tokensOwed0 > 0n || position.tokensOwed1 > 0n;

  const handleCollect = async () => {
    if (!address || !publicClient || !walletClient) return;
    const adapter = position.protocol === 'uniswap'
      ? new UniswapV3Adapter(chainId, publicClient as any, walletClient as any)
      : new PancakeSwapV3Adapter(chainId, publicClient as any, walletClient as any);
    setLoading(true);
    try {
      const hash = await adapter.collectFees({
        tokenId: position.tokenId, recipient: address,
        amount0Max: MAX_UINT128, amount1Max: MAX_UINT128,
      });
      setTxHash(hash); setTxModal(true); onRefresh?.();
    } catch (err: any) { alert(err.message || 'Failed to collect fees'); }
    finally { setLoading(false); }
  };

  const tabStyle = (active: boolean) => ({
    background: active ? 'rgba(37,99,235,0.08)' : '#F1F5F9',
    color:      active ? '#2563EB' : '#64748B',
    border:     `1px solid ${active ? 'rgba(37,99,235,0.25)' : '#E2E8F0'}`,
  });

  return (
    <div className="card-sm space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <span className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ background: position.protocol === 'uniswap' ? '#FF007A' : '#1FC7D4' }} />
          <span className="font-semibold text-sm truncate" style={{ color: '#0F172A' }}>
            Position #{position.tokenId.toString()}
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0"
            style={{
              background: isInRange ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.08)',
              color:      isInRange ? '#10B981' : '#EF4444',
            }}>
            {isInRange ? '● In Range' : '○ Out of Range'}
          </span>
        </div>
        <button onClick={() => setExpanded(!expanded)}
          className="p-1 rounded-lg flex-shrink-0 transition-colors"
          style={{ background: '#F1F5F9' }}>
          {expanded
            ? <ChevronUp size={15} style={{ color: '#64748B' }} />
            : <ChevronDown size={15} style={{ color: '#64748B' }} />}
        </button>
      </div>

      {/* Summary — 3 cols, each truncates safely */}
      <div className="grid grid-cols-3 gap-2 text-xs">
        {[
          ['Protocol', position.protocol],
          ['Fee', FEE_LABELS[position.fee as FeeAmount] || `${position.fee / 10000}%`],
          ['Liquidity', position.liquidity.toString().slice(0, 8) + '…'],
        ].map(([label, value]) => (
          <div key={label} className="min-w-0">
            <div style={{ color: '#64748B' }}>{label}</div>
            <div className="font-semibold capitalize mt-0.5 truncate" style={{ color: '#0F172A' }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Token addresses */}
      <div className="text-xs space-y-1 min-w-0">
        <div className="flex justify-between gap-2">
          <span style={{ color: '#64748B' }}>Token 0</span>
          <span className="font-mono font-medium" style={{ color: '#0F172A' }}>{shortenAddress(position.token0)}</span>
        </div>
        <div className="flex justify-between gap-2">
          <span style={{ color: '#64748B' }}>Token 1</span>
          <span className="font-mono font-medium" style={{ color: '#0F172A' }}>{shortenAddress(position.token1)}</span>
        </div>
      </div>

      {/* Price range */}
      <div className="rounded-xl p-3 text-xs space-y-1.5" style={{ background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
        <p className="font-medium" style={{ color: '#64748B' }}>Price Range</p>
        <div className="flex justify-between gap-2">
          <span style={{ color: '#64748B' }}>Min</span>
          <span className="font-mono font-medium" style={{ color: '#0F172A' }}>{priceLower.toFixed(6)}</span>
        </div>
        <div className="flex justify-between gap-2">
          <span style={{ color: '#64748B' }}>Max</span>
          <span className="font-mono font-medium" style={{ color: '#0F172A' }}>{priceUpper.toFixed(6)}</span>
        </div>
      </div>

      {/* Uncollected fees */}
      {hasFees && (
        <div className="rounded-xl p-3 text-xs" style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)' }}>
          <p className="font-medium mb-2" style={{ color: '#10B981' }}>Uncollected Fees</p>
          <div className="space-y-1">
            <div className="flex justify-between gap-2" style={{ color: '#064E3B' }}>
              <span>Token 0</span><span>{formatAmount(position.tokensOwed0, token0Decimals, 6)}</span>
            </div>
            <div className="flex justify-between gap-2" style={{ color: '#064E3B' }}>
              <span>Token 1</span><span>{formatAmount(position.tokensOwed1, token1Decimals, 6)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Actions — flex row, each button is flex-1 so they share space evenly */}
      <div className="flex gap-2">
        {hasFees && (
          <button onClick={handleCollect} disabled={loading}
            className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all"
            style={{ background: 'rgba(16,185,129,0.1)', color: '#10B981', border: '1px solid rgba(16,185,129,0.25)' }}>
            {loading ? '…' : 'Collect Fees'}
          </button>
        )}
        <button onClick={() => setExpanded(!expanded)}
          className="flex-1 btn-secondary py-2 text-xs font-semibold">
          {expanded ? 'Hide' : 'Manage'}
        </button>
      </div>

      {/* Expanded manage panel */}
      {expanded && (
        <div className="space-y-3 pt-3" style={{ borderTop: '1px solid #E2E8F0' }}>
          <div className="flex gap-2">
            {(['remove', 'increase'] as const).map((t) => (
              <button key={t} onClick={() => setManageTab(t)}
                className="flex-1 py-1.5 rounded-lg text-xs font-medium capitalize transition-all"
                style={tabStyle(manageTab === t)}>
                {t === 'remove' ? 'Remove / Collect' : 'Add More'}
              </button>
            ))}
          </div>
          {manageTab === 'remove'
            ? <RemoveLiquidity position={position} onSuccess={onRefresh} />
            : <IncreaseLiquidity position={position} onSuccess={onRefresh} />
          }
        </div>
      )}

      <TransactionModal hash={txHash} isOpen={txModal} onClose={() => setTxModal(false)} title="Collect Fees" />
    </div>
  );
}
