'use client';

import { useState, useEffect } from 'react';
import { useAccount, useChainId, usePublicClient, useWalletClient } from 'wagmi';
import { TransactionModal } from '@/components/common/TransactionModal';
import { UniswapV3Adapter } from '@/lib/adapters/UniswapV3Adapter';
import { PancakeSwapV3Adapter } from '@/lib/adapters/PancakeSwapV3Adapter';
import { parseAmount, getDeadline, applySlippage } from '@/lib/utils';
import { erc20ABI } from '@/lib/abis';
import type { PositionInfo } from '@/types';

interface Props {
  position: PositionInfo;
  onSuccess?: () => void;
}

export function IncreaseLiquidity({ position, onSuccess }: Props) {
  const { address } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  const [amount0, setAmount0] = useState('');
  const [amount1, setAmount1] = useState('');
  const [slippage] = useState(0.5);
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

  const getAdapter = () => {
    if (!publicClient || !walletClient) return null;
    return position.protocol === 'uniswap'
      ? new UniswapV3Adapter(chainId, publicClient as any, walletClient as any)
      : new PancakeSwapV3Adapter(chainId, publicClient as any, walletClient as any);
  };

  const handleIncrease = async () => {
    if (!address || !amount0 || !amount1) return;
    const adapter = getAdapter(); if (!adapter) return;
    setLoading(true);
    try {
      const desired0 = parseAmount(amount0, token0Decimals);
      const desired1 = parseAmount(amount1, token1Decimals);
      const hash = await adapter.increaseLiquidity({
        tokenId: position.tokenId,
        amount0Desired: desired0, amount1Desired: desired1,
        amount0Min: applySlippage(desired0, slippage * 100, 'min'),
        amount1Min: applySlippage(desired1, slippage * 100, 'min'),
        deadline: getDeadline(20),
      });
      setTxHash(hash); setTxModal(true); setAmount0(''); setAmount1(''); onSuccess?.();
    } catch (err: any) { alert(err.message || 'Failed to increase liquidity'); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold" style={{ color: '#0F172A' }}>Increase Liquidity</h4>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs mb-1 block font-medium" style={{ color: '#64748B' }}>Token 0</label>
          <input type="number" value={amount0} onChange={(e) => setAmount0(e.target.value)} placeholder="0.0"
            className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
            style={{ background: '#F1F5F9', border: '1px solid #E2E8F0', color: '#0F172A' }} />
        </div>
        <div>
          <label className="text-xs mb-1 block font-medium" style={{ color: '#64748B' }}>Token 1</label>
          <input type="number" value={amount1} onChange={(e) => setAmount1(e.target.value)} placeholder="0.0"
            className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
            style={{ background: '#F1F5F9', border: '1px solid #E2E8F0', color: '#0F172A' }} />
        </div>
      </div>
      <button onClick={handleIncrease} disabled={!amount0 || !amount1 || loading}
        className="btn-primary w-full text-sm">
        {loading ? 'Adding…' : 'Increase Liquidity'}
      </button>
      <TransactionModal hash={txHash} isOpen={txModal} onClose={() => setTxModal(false)} title="Increase Liquidity" />
    </div>
  );
}
