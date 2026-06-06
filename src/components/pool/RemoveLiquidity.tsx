'use client';

import { useState, useEffect } from 'react';
import { useAccount, useChainId, usePublicClient, useWalletClient } from 'wagmi';
import { TransactionModal } from '@/components/common/TransactionModal';
import { UniswapV3Adapter } from '@/lib/adapters/UniswapV3Adapter';
import { PancakeSwapV3Adapter } from '@/lib/adapters/PancakeSwapV3Adapter';
import { getDeadline, formatAmount } from '@/lib/utils';
import { MAX_UINT128 } from '@/lib/constants/addresses';
import { erc20ABI } from '@/lib/abis';
import type { PositionInfo } from '@/types';

interface Props {
  position: PositionInfo;
  onSuccess?: () => void;
}

export function RemoveLiquidity({ position, onSuccess }: Props) {
  const { address } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  const [percent, setPercent] = useState(100);
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
  const [txModal, setTxModal] = useState(false);
  const [step, setStep] = useState<'decrease' | 'collect'>('decrease');
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

  const getAdapter = () => {
    if (!publicClient || !walletClient) return null;
    return position.protocol === 'uniswap'
      ? new UniswapV3Adapter(chainId, publicClient as any, walletClient as any)
      : new PancakeSwapV3Adapter(chainId, publicClient as any, walletClient as any);
  };

  const handleDecrease = async () => {
    if (!address) return;
    const adapter = getAdapter(); if (!adapter) return;
    setLoading(true);
    try {
      const hash = await adapter.decreaseLiquidity({
        tokenId: position.tokenId,
        liquidity: (position.liquidity * BigInt(percent)) / 100n,
        amount0Min: 0n, amount1Min: 0n, deadline: getDeadline(20),
      });
      setTxHash(hash); setTxModal(true); setStep('collect');
    } catch (err: any) { alert(err.message || 'Failed to remove liquidity'); }
    finally { setLoading(false); }
  };

  const handleCollect = async () => {
    if (!address) return;
    const adapter = getAdapter(); if (!adapter) return;
    setLoading(true);
    try {
      const hash = await adapter.collectFees({
        tokenId: position.tokenId, recipient: address,
        amount0Max: MAX_UINT128, amount1Max: MAX_UINT128,
      });
      setTxHash(hash); setTxModal(true); onSuccess?.();
    } catch (err: any) { alert(err.message || 'Failed to collect tokens'); }
    finally { setLoading(false); }
  };

  const pctStyle = (p: number) => ({
    background: percent === p ? 'rgba(37,99,235,0.08)' : '#F1F5F9',
    color:      percent === p ? '#2563EB' : '#64748B',
    border:     `1px solid ${percent === p ? 'rgba(37,99,235,0.25)' : '#E2E8F0'}`,
  });

  return (
    <div className="card space-y-4">
      <h3 className="font-semibold" style={{ color: '#0F172A' }}>Remove Liquidity</h3>
      <p className="text-xs -mt-2" style={{ color: '#64748B' }}>Position #{position.tokenId.toString()}</p>

      {/* Percent slider */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="text-xs font-medium" style={{ color: '#64748B' }}>Remove Amount</label>
          <span className="text-sm font-bold" style={{ color: '#2563EB' }}>{percent}%</span>
        </div>
        <input type="range" min={1} max={100} value={percent}
          onChange={(e) => setPercent(Number(e.target.value))}
          className="w-full accent-blue-600" />
        <div className="flex gap-2 mt-2">
          {[25, 50, 75, 100].map((p) => (
            <button key={p} onClick={() => setPercent(p)}
              className="flex-1 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={pctStyle(p)}>
              {p}%
            </button>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="rounded-xl p-3 text-xs space-y-2" style={{ background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
        <div className="flex justify-between">
          <span style={{ color: '#64748B' }}>Liquidity to remove</span>
          <span style={{ color: '#0F172A' }}>{((Number(position.liquidity) * percent) / 100).toFixed(0)}</span>
        </div>
        <div className="flex justify-between">
          <span style={{ color: '#64748B' }}>Fees owed (token0)</span>
          <span style={{ color: '#0F172A' }}>{formatAmount(position.tokensOwed0, token0Decimals, 6)}</span>
        </div>
        <div className="flex justify-between">
          <span style={{ color: '#64748B' }}>Fees owed (token1)</span>
          <span style={{ color: '#0F172A' }}>{formatAmount(position.tokensOwed1, token1Decimals, 6)}</span>
        </div>
      </div>

      {/* Actions — each button fills its grid cell */}
      <div className="grid grid-cols-2 gap-3">
        <button onClick={handleDecrease} disabled={loading || position.liquidity === 0n}
          className="btn-secondary w-full text-sm">
          {loading && step === 'decrease' ? 'Removing…' : `Remove ${percent}%`}
        </button>
        <button onClick={handleCollect} disabled={loading}
          className="btn-primary w-full text-sm">
          {loading && step === 'collect' ? 'Collecting…' : 'Collect Fees'}
        </button>
      </div>

      <TransactionModal hash={txHash} isOpen={txModal} onClose={() => setTxModal(false)} title="Remove Liquidity" />
    </div>
  );
}
