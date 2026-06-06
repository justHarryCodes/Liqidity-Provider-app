'use client';

import { useState } from 'react';
import { useAccount, useChainId, usePublicClient, useWalletClient } from 'wagmi';
import { AlertTriangle } from 'lucide-react';
import { TokenSelector } from '@/components/swap/TokenSelector';
import { TransactionModal } from '@/components/common/TransactionModal';
import { UniswapV3Adapter } from '@/lib/adapters/UniswapV3Adapter';
import { PancakeSwapV3Adapter } from '@/lib/adapters/PancakeSwapV3Adapter';
import { encodeSqrtRatioX96 } from '@/lib/utils';
import { FEE_AMOUNTS, FEE_LABELS } from '@/types';
import type { TokenInfo, FeeAmount, Protocol } from '@/types';

export function CreatePool() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  const [protocol, setProtocol] = useState<Protocol>('uniswap');
  const [tokenA, setTokenA] = useState<TokenInfo | undefined>();
  const [tokenB, setTokenB] = useState<TokenInfo | undefined>();
  const [fee, setFee] = useState<FeeAmount>(3000);
  const [initialPrice, setInitialPrice] = useState('');
  const [step, setStep] = useState<'create' | 'initialize'>('create');
  const [poolAddress, setPoolAddress] = useState<`0x${string}` | undefined>();
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
  const [txModal, setTxModal] = useState(false);
  const [txTitle, setTxTitle] = useState('');
  const [loading, setLoading] = useState(false);

  const getAdapter = () => {
    if (!publicClient || !walletClient) return null;
    return protocol === 'uniswap'
      ? new UniswapV3Adapter(chainId, publicClient as any, walletClient as any)
      : new PancakeSwapV3Adapter(chainId, publicClient as any, walletClient as any);
  };

  const handleCreate = async () => {
    if (!tokenA || !tokenB || !publicClient) return;
    const adapter = getAdapter();
    if (!adapter) return;
    setLoading(true);
    try {
      const sqrtPrice = encodeSqrtRatioX96(
        BigInt(Math.floor(parseFloat(initialPrice || '1') * 10 ** tokenB.decimals)),
        BigInt(10 ** tokenA.decimals)
      );
      const hash = await adapter.createPool(tokenA, tokenB, fee, sqrtPrice);
      setTxHash(hash); setTxTitle('Create Pool'); setTxModal(true);
      await publicClient.waitForTransactionReceipt({ hash });
      const poolInfo = await adapter.getPool(tokenA, tokenB, fee);
      if (poolInfo?.exists) setPoolAddress(poolInfo.address);
      setStep('initialize');
    } catch (err: any) { alert(err.message || 'Failed to create pool'); }
    finally { setLoading(false); }
  };

  const handleInitialize = async () => {
    if (!poolAddress || !tokenA || !tokenB) return;
    const adapter = getAdapter();
    if (!adapter) return;
    setLoading(true);
    try {
      const sqrtPrice = encodeSqrtRatioX96(
        BigInt(Math.floor(parseFloat(initialPrice || '1') * 10 ** tokenB.decimals)),
        BigInt(10 ** tokenA.decimals)
      );
      const hash = await adapter.initializePool(poolAddress, sqrtPrice);
      setTxHash(hash); setTxTitle('Initialize Pool'); setTxModal(true);
    } catch (err: any) { alert(err.message || 'Failed to initialize pool'); }
    finally { setLoading(false); }
  };

  const tabStyle = (active: boolean) => ({
    background: active ? 'rgba(37,99,235,0.08)' : '#F1F5F9',
    color:      active ? '#2563EB' : '#64748B',
    border:     `1px solid ${active ? 'rgba(37,99,235,0.25)' : '#E2E8F0'}`,
  });

  return (
    <div className="card space-y-4">
      <h3 className="font-semibold" style={{ color: '#0F172A' }}>Create New Pool</h3>

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
        <div className="flex-1 flex justify-center py-2.5 rounded-xl min-w-0" style={{ background: '#F1F5F9', border: '1px solid #E2E8F0' }}>
          <TokenSelector selected={tokenA} onSelect={setTokenA} exclude={tokenB} />
        </div>
        <span className="font-bold flex-shrink-0" style={{ color: '#94A3B8' }}>+</span>
        <div className="flex-1 flex justify-center py-2.5 rounded-xl min-w-0" style={{ background: '#F1F5F9', border: '1px solid #E2E8F0' }}>
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

      {/* Initial price */}
      <div>
        <label className="text-xs mb-2 block font-medium" style={{ color: '#64748B' }}>
          Initial Price ({tokenA?.symbol || 'Token A'} per {tokenB?.symbol || 'Token B'})
        </label>
        <input type="number" placeholder="e.g. 1800" value={initialPrice}
          onChange={(e) => setInitialPrice(e.target.value)}
          className="w-full px-4 py-3 rounded-xl text-sm outline-none"
          style={{ background: '#F1F5F9', border: '1px solid #E2E8F0', color: '#0F172A' }} />
      </div>

      {/* Warning */}
      <div className="rounded-xl p-3 text-xs flex gap-2"
        style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.28)' }}>
        <AlertTriangle size={14} style={{ color: '#F59E0B', flexShrink: 0, marginTop: 1 }} />
        <div>
          <p className="font-medium mb-0.5" style={{ color: '#92400E' }}>Pool Creation Warning</p>
          <p style={{ color: '#78350F' }}>
            Creates a new contract. Ensure the pair + fee tier do not already exist. You will need to initialize the pool after.
          </p>
        </div>
      </div>

      {!isConnected ? (
        <button disabled className="btn-primary w-full text-sm">Connect Wallet</button>
      ) : step === 'create' ? (
        <button onClick={handleCreate} disabled={!tokenA || !tokenB || !initialPrice || loading}
          className="btn-primary w-full text-sm">
          {loading ? 'Creating…' : 'Create Pool'}
        </button>
      ) : (
        <button onClick={handleInitialize} disabled={!poolAddress || loading}
          className="btn-primary w-full text-sm">
          {loading ? 'Initializing…' : 'Initialize Pool Price'}
        </button>
      )}

      <TransactionModal hash={txHash} isOpen={txModal} onClose={() => setTxModal(false)} title={txTitle} />
    </div>
  );
}
