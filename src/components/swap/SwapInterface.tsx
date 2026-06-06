'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAccount, useChainId, usePublicClient, useWalletClient } from 'wagmi';
import { ArrowUpDown } from 'lucide-react';
import { TokenSelector } from './TokenSelector';
import { TransactionModal } from '@/components/common/TransactionModal';
import { UniswapV3Adapter } from '@/lib/adapters/UniswapV3Adapter';
import { PancakeSwapV3Adapter } from '@/lib/adapters/PancakeSwapV3Adapter';
import { formatAmount, parseAmount, getDeadline, applySlippage } from '@/lib/utils';
import type { TokenInfo, FeeAmount, SwapQuote, Protocol } from '@/types';
import { FEE_LABELS, FEE_AMOUNTS } from '@/types';

export function SwapInterface() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  const [protocol, setProtocol] = useState<Protocol>('uniswap');
  const [tokenIn, setTokenIn] = useState<TokenInfo | undefined>();
  const [tokenOut, setTokenOut] = useState<TokenInfo | undefined>();
  const [amountIn, setAmountIn] = useState('');
  const [fee, setFee] = useState<FeeAmount>(3000);
  const [slippage, setSlippage] = useState(0.5);
  const [quote, setQuote] = useState<SwapQuote | null>(null);
  const [quoting, setQuoting] = useState(false);
  const [quoteError, setQuoteError] = useState('');
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
  const [txModal, setTxModal] = useState(false);
  const [swapping, setSwapping] = useState(false);

  const getAdapter = useCallback(() => {
    if (!publicClient) return null;
    return protocol === 'uniswap'
      ? new UniswapV3Adapter(chainId, publicClient as any, walletClient as any)
      : new PancakeSwapV3Adapter(chainId, publicClient as any, walletClient as any);
  }, [chainId, publicClient, walletClient, protocol]);

  useEffect(() => {
    if (!tokenIn || !tokenOut || !amountIn || parseFloat(amountIn) === 0) {
      setQuote(null); setQuoteError(''); return;
    }
    const adapter = getAdapter();
    if (!adapter) return;
    const timer = setTimeout(async () => {
      setQuoting(true); setQuoteError('');
      try {
        const q = await adapter.quoteExactInput(tokenIn, tokenOut, parseAmount(amountIn, tokenIn.decimals), fee);
        setQuote(q);
      } catch (err: any) {
        setQuoteError(err.message || 'Failed to get quote. Pool may not exist.');
        setQuote(null);
      } finally { setQuoting(false); }
    }, 600);
    return () => clearTimeout(timer);
  }, [tokenIn, tokenOut, amountIn, fee, getAdapter]);

  const handleSwap = async () => {
    if (!address || !tokenIn || !tokenOut || !quote || !walletClient) return;
    const adapter = getAdapter();
    if (!adapter) return;
    setSwapping(true);
    try {
      const hash = await adapter.swap({
        tokenIn, tokenOut,
        amountIn: parseAmount(amountIn, tokenIn.decimals),
        amountOutMinimum: applySlippage(quote.amountOut, slippage * 100, 'min'),
        fee, recipient: address, deadline: getDeadline(20),
      });
      setTxHash(hash); setTxModal(true); setAmountIn(''); setQuote(null);
    } catch (err: any) { alert(err.message || 'Transaction failed'); }
    finally { setSwapping(false); }
  };

  const flipTokens = () => {
    const t = tokenIn; setTokenIn(tokenOut); setTokenOut(t); setAmountIn(''); setQuote(null);
  };
  const formattedOut = quote ? formatAmount(quote.amountOut, tokenOut?.decimals ?? 18, 6) : '';

  const tabStyle = (active: boolean) => ({
    background: active ? 'rgba(37,99,235,0.08)' : '#F1F5F9',
    color:      active ? '#2563EB' : '#64748B',
    border:     `1px solid ${active ? 'rgba(37,99,235,0.25)' : '#E2E8F0'}`,
  });

  return (
    <div className="card space-y-4">
      {/* Protocol selector */}
      <div className="flex gap-2">
        {(['uniswap', 'pancakeswap'] as Protocol[]).map((p) => (
          <button key={p} onClick={() => setProtocol(p)}
            className="flex-1 py-2 rounded-xl text-sm font-medium transition-all capitalize"
            style={tabStyle(protocol === p)}>
            {p === 'uniswap' ? 'Uniswap V3' : 'PancakeSwap V3'}
          </button>
        ))}
      </div>

      {/* Token In */}
      <div className="token-input">
        <p className="text-xs font-medium mb-2" style={{ color: '#64748B' }}>You Pay</p>
        <div className="flex items-center gap-2 min-w-0">
          <input
            type="number" placeholder="0.0" value={amountIn}
            onChange={(e) => setAmountIn(e.target.value)}
            className="flex-1 bg-transparent text-2xl font-semibold outline-none min-w-0 w-0"
            style={{ color: '#0F172A' }}
          />
          <TokenSelector selected={tokenIn} onSelect={setTokenIn} exclude={tokenOut} />
        </div>
      </div>

      {/* Flip */}
      <div className="flex justify-center -my-1">
        <button onClick={flipTokens}
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-110"
          style={{ background: '#F1F5F9', border: '1px solid #E2E8F0' }}>
          <ArrowUpDown size={16} style={{ color: '#64748B' }} />
        </button>
      </div>

      {/* Token Out */}
      <div className="token-input">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-medium" style={{ color: '#64748B' }}>You Receive</p>
          {quoting && <span className="text-xs font-medium" style={{ color: '#2563EB' }}>Fetching quote…</span>}
        </div>
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex-1 text-2xl font-semibold truncate" style={{ color: formattedOut ? '#0F172A' : '#CBD5E1' }}>
            {formattedOut || '0.0'}
          </div>
          <TokenSelector selected={tokenOut} onSelect={setTokenOut} exclude={tokenIn} />
        </div>
      </div>

      {/* Fee + Slippage */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs mb-1.5 block font-medium" style={{ color: '#64748B' }}>Fee Tier</label>
          <select value={fee} onChange={(e) => setFee(Number(e.target.value) as FeeAmount)}
            className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
            style={{ background: '#F1F5F9', border: '1px solid #E2E8F0', color: '#0F172A' }}>
            {FEE_AMOUNTS.map((f) => <option key={f} value={f}>{FEE_LABELS[f]}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs mb-1.5 block font-medium" style={{ color: '#64748B' }}>Slippage</label>
          <div className="flex gap-1.5">
            {[0.1, 0.5, 1.0].map((s) => (
              <button key={s} onClick={() => setSlippage(s)}
                className="flex-1 py-2.5 rounded-xl text-xs font-medium transition-all"
                style={tabStyle(slippage === s)}>
                {s}%
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Quote details */}
      {quote && tokenIn && tokenOut && (
        <div className="rounded-xl p-3 space-y-2 text-xs" style={{ background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
          <div className="flex justify-between">
            <span style={{ color: '#64748B' }}>Price Impact</span>
            <span style={{ color: quote.priceImpact > 5 ? '#EF4444' : quote.priceImpact > 1 ? '#F59E0B' : '#10B981' }}>
              {quote.priceImpact.toFixed(2)}%
            </span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: '#64748B' }}>Min Received</span>
            <span style={{ color: '#0F172A' }}>
              {formatAmount(applySlippage(quote.amountOut, slippage * 100, 'min'), tokenOut.decimals, 6)} {tokenOut.symbol}
            </span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: '#64748B' }}>Est. Gas</span>
            <span style={{ color: '#0F172A' }}>{Number(quote.gasEstimate).toLocaleString()} units</span>
          </div>
        </div>
      )}

      {quoteError && (
        <p className="text-xs text-center py-2 px-3 rounded-xl" style={{ color: '#EF4444', background: 'rgba(239,68,68,0.07)' }}>
          {quoteError}
        </p>
      )}

      {/* Swap button — w-full makes it fill the card */}
      {!isConnected ? (
        <button disabled className="btn-primary w-full opacity-40">Connect Wallet to Swap</button>
      ) : !tokenIn || !tokenOut ? (
        <button disabled className="btn-primary w-full">Select Tokens</button>
      ) : !amountIn || parseFloat(amountIn) === 0 ? (
        <button disabled className="btn-primary w-full">Enter Amount</button>
      ) : !quote && !quoting ? (
        <button disabled className="btn-primary w-full">No Route Found</button>
      ) : (
        <button onClick={handleSwap} disabled={swapping || quoting || !quote} className="btn-primary w-full">
          {swapping ? 'Swapping…' : quoting ? 'Fetching Quote…' : 'Swap'}
        </button>
      )}

      <TransactionModal hash={txHash} isOpen={txModal} onClose={() => setTxModal(false)} title="Swap" />
    </div>
  );
}
