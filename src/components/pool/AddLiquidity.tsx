'use client';

import { useState, useEffect } from 'react';
import { useAccount, useChainId, usePublicClient, useWalletClient } from 'wagmi';
import { TransactionModal } from '@/components/common/TransactionModal';
import { UniswapV3Adapter } from '@/lib/adapters/UniswapV3Adapter';
import { PancakeSwapV3Adapter } from '@/lib/adapters/PancakeSwapV3Adapter';
import { parseAmount, getDeadline, applySlippage, nearestUsableTickFromPrice, sqrtPriceX96ToPrice } from '@/lib/utils';
import type { TokenInfo, FeeAmount, PoolInfo, Protocol } from '@/types';
import { TICK_SPACINGS } from '@/types';

interface Props {
  pool: PoolInfo; token0: TokenInfo; token1: TokenInfo; protocol: Protocol;
}

export function AddLiquidity({ pool, token0, token1, protocol }: Props) {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  const [amount0, setAmount0] = useState('');
  const [amount1, setAmount1] = useState('');
  const [priceLower, setPriceLower] = useState('');
  const [priceUpper, setPriceUpper] = useState('');
  const [slippage, setSlippage] = useState(0.5);
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
  const [txModal, setTxModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const currentPrice = pool.exists && pool.sqrtPriceX96 > 0n
    ? sqrtPriceX96ToPrice(pool.sqrtPriceX96, token0.decimals, token1.decimals) : 1;

  useEffect(() => {
    if (!priceLower && !priceUpper && currentPrice > 0) {
      setPriceLower((currentPrice * 0.8).toFixed(6));
      setPriceUpper((currentPrice * 1.2).toFixed(6));
    }
  }, [currentPrice]); // eslint-disable-line react-hooks/exhaustive-deps

  const getTickRange = () => {
    const tickSpacing = pool.tickSpacing || TICK_SPACINGS[pool.fee as FeeAmount];
    const lower = nearestUsableTickFromPrice(parseFloat(priceLower) || currentPrice * 0.8, token0.decimals, token1.decimals, tickSpacing);
    const upper = nearestUsableTickFromPrice(parseFloat(priceUpper) || currentPrice * 1.2, token0.decimals, token1.decimals, tickSpacing);
    return { tickLower: Math.min(lower, upper), tickUpper: Math.max(lower, upper) };
  };

  const handleAdd = async () => {
    if (!address || !publicClient || !walletClient || !amount0 || !amount1) return;
    setLoading(true);
    try {
      const adapter = protocol === 'uniswap'
        ? new UniswapV3Adapter(chainId, publicClient as any, walletClient as any)
        : new PancakeSwapV3Adapter(chainId, publicClient as any, walletClient as any);
      const { tickLower, tickUpper } = getTickRange();
      const desired0 = parseAmount(amount0, token0.decimals);
      const desired1 = parseAmount(amount1, token1.decimals);
      const hash = await adapter.mintPosition({
        token0, token1, fee: pool.fee as FeeAmount, tickLower, tickUpper,
        amount0Desired: desired0, amount1Desired: desired1,
        amount0Min: applySlippage(desired0, slippage * 100, 'min'),
        amount1Min: applySlippage(desired1, slippage * 100, 'min'),
        recipient: address, deadline: getDeadline(20),
      });
      setTxHash(hash); setTxModal(true); setAmount0(''); setAmount1('');
    } catch (err: any) { alert(err.message || 'Failed to add liquidity'); }
    finally { setLoading(false); }
  };

  const tabStyle = (active: boolean) => ({
    background: active ? 'rgba(37,99,235,0.08)' : '#F1F5F9',
    color:      active ? '#2563EB' : '#64748B',
    border:     `1px solid ${active ? 'rgba(37,99,235,0.25)' : '#E2E8F0'}`,
  });

  return (
    <div className="card space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h3 className="font-semibold" style={{ color: '#0F172A' }}>Add Liquidity</h3>
        <span className="text-xs px-2 py-1 rounded-full font-medium flex-shrink-0"
          style={{ background: '#F1F5F9', color: '#64748B' }}>
          {token0.symbol}/{token1.symbol}
        </span>
      </div>

      {/* Current price */}
      <div className="rounded-xl p-3 text-xs" style={{ background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
        <span style={{ color: '#64748B' }}>Current Price: </span>
        <span className="font-semibold" style={{ color: '#0F172A' }}>
          {currentPrice.toFixed(6)} {token1.symbol} per {token0.symbol}
        </span>
      </div>

      {/* Price range */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs mb-1.5 block font-medium" style={{ color: '#64748B' }}>Min Price</label>
          <input type="number" value={priceLower} onChange={(e) => setPriceLower(e.target.value)} placeholder="0.0"
            className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
            style={{ background: '#F1F5F9', border: '1px solid #E2E8F0', color: '#0F172A' }} />
        </div>
        <div>
          <label className="text-xs mb-1.5 block font-medium" style={{ color: '#64748B' }}>Max Price</label>
          <input type="number" value={priceUpper} onChange={(e) => setPriceUpper(e.target.value)} placeholder="∞"
            className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
            style={{ background: '#F1F5F9', border: '1px solid #E2E8F0', color: '#0F172A' }} />
        </div>
      </div>

      {/* Token amounts */}
      <div className="space-y-3">
        <div className="token-input">
          <p className="text-xs font-medium mb-2" style={{ color: '#64748B' }}>{token0.symbol} Amount</p>
          <input type="number" value={amount0} onChange={(e) => setAmount0(e.target.value)}
            className="w-full bg-transparent text-xl font-semibold outline-none" placeholder="0.0"
            style={{ color: '#0F172A' }} />
        </div>
        <div className="token-input">
          <p className="text-xs font-medium mb-2" style={{ color: '#64748B' }}>{token1.symbol} Amount</p>
          <input type="number" value={amount1} onChange={(e) => setAmount1(e.target.value)}
            className="w-full bg-transparent text-xl font-semibold outline-none" placeholder="0.0"
            style={{ color: '#0F172A' }} />
        </div>
      </div>

      {/* Slippage */}
      <div>
        <label className="text-xs mb-2 block font-medium" style={{ color: '#64748B' }}>Slippage Tolerance</label>
        <div className="flex gap-2">
          {[0.1, 0.5, 1.0].map((s) => (
            <button key={s} onClick={() => setSlippage(s)}
              className="flex-1 py-2 rounded-xl text-xs font-medium transition-all"
              style={tabStyle(slippage === s)}>
              {s}%
            </button>
          ))}
        </div>
      </div>

      {!isConnected ? (
        <button disabled className="btn-primary w-full">Connect Wallet</button>
      ) : (
        <button onClick={handleAdd} disabled={!amount0 || !amount1 || loading} className="btn-primary w-full">
          {loading ? 'Adding Liquidity…' : 'Add Liquidity'}
        </button>
      )}

      <TransactionModal hash={txHash} isOpen={txModal} onClose={() => setTxModal(false)} title="Add Liquidity" />
    </div>
  );
}
