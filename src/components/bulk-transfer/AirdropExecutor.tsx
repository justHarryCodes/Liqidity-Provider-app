'use client';

import { useState } from 'react';
import { useAccount, usePublicClient, useWalletClient, useChainId } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { CheckCircle, Loader } from 'lucide-react';
import { erc20ABI, batchAirdropABI } from '@/lib/abis';
import { getExplorerUrl } from '@/lib/utils';
import type { BulkTransferRecipient, ChainId, TxStatus } from '@/types';
import type { AirdropMode } from './BulkTransferInterface';

interface Props {
  tokenAddress: string;
  airdropContract: string;
  mode: AirdropMode;
  recipients: BulkTransferRecipient[];
  equalAmount: string;
  tokenDecimals: number;
  tokenSymbol: string;
  totalAmount: bigint;
}

export function AirdropExecutor({ tokenAddress, airdropContract, mode, recipients, equalAmount, tokenDecimals, tokenSymbol, totalAmount }: Props) {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const chainId = useChainId();

  const [approveStatus, setApproveStatus] = useState<TxStatus>('idle');
  const [approveHash,   setApproveHash]   = useState<`0x${string}` | null>(null);
  const [sendStatus,    setSendStatus]    = useState<TxStatus>('idle');
  const [sendHash,      setSendHash]      = useState<`0x${string}` | null>(null);
  const [error, setError] = useState('');

  const approve = async () => {
    if (!address || !walletClient || !publicClient) return;
    setError(''); setApproveStatus('pending');
    try {
      const { request } = await publicClient.simulateContract({
        address: tokenAddress as `0x${string}`, abi: erc20ABI, functionName: 'approve',
        args: [airdropContract as `0x${string}`, totalAmount], account: address,
      });
      const hash = await walletClient.writeContract(request);
      setApproveHash(hash);
      await publicClient.waitForTransactionReceipt({ hash });
      setApproveStatus('success');
    } catch (err: any) { setApproveStatus('error'); setError(err.shortMessage || err.message); }
  };

  const send = async () => {
    if (!address || !walletClient || !publicClient) return;
    setError(''); setSendStatus('pending');
    try {
      const addrs = recipients.map((r) => r.address as `0x${string}`);
      let request: any; // wagmi simulateContract overloads don't narrow correctly across ABI union
      if (mode === 'equal') {
        ({ request } = await publicClient.simulateContract({
          address: airdropContract as `0x${string}`, abi: batchAirdropABI,
          functionName: 'sendEqualAmounts',
          args: [tokenAddress as `0x${string}`, addrs, parseUnits(equalAmount, tokenDecimals)],
          account: address,
        }));
      } else {
        ({ request } = await publicClient.simulateContract({
          address: airdropContract as `0x${string}`, abi: batchAirdropABI,
          functionName: 'sendCustomAmounts',
          args: [tokenAddress as `0x${string}`, addrs, recipients.map((r) => parseUnits(r.amount || '0', tokenDecimals))],
          account: address,
        }));
      }
      const hash = await walletClient.writeContract(request);
      setSendHash(hash);
      await publicClient.waitForTransactionReceipt({ hash });
      setSendStatus('success');
    } catch (err: any) { setSendStatus('error'); setError(err.shortMessage || err.message); }
  };

  const txUrl = (hash: string) => { try { return getExplorerUrl(chainId as ChainId, 'tx', hash); } catch { return '#'; } };

  const StatusBadge = ({ status }: { status: TxStatus }) => {
    if (status === 'idle')    return <span className="text-xs" style={{ color: '#94A3B8' }}>Waiting</span>;
    if (status === 'pending') return <span className="flex items-center gap-1 text-xs" style={{ color: '#2563EB' }}><Loader size={11} className="animate-spin-slow" />Pending…</span>;
    if (status === 'success') return <span className="flex items-center gap-1 text-xs" style={{ color: '#10B981' }}><CheckCircle size={11} />Done</span>;
    return <span className="text-xs" style={{ color: '#EF4444' }}>Failed</span>;
  };

  const stepCard = (num: number, title: string, desc: string, status: TxStatus, hash: `0x${string}` | null) => (
    <div className="rounded-xl p-3 space-y-2"
      style={{
        background: '#F8FAFC',
        border: `1px solid ${status === 'success' ? 'rgba(16,185,129,0.3)' : status === 'error' ? 'rgba(239,68,68,0.25)' : '#E2E8F0'}`,
      }}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold" style={{ color: '#0F172A' }}>Step {num}: {title}</p>
          <p className="text-xs mt-0.5" style={{ color: '#64748B' }}>{desc}</p>
        </div>
        <div className="flex-shrink-0"><StatusBadge status={status} /></div>
      </div>
      {hash && (
        <a href={txUrl(hash)} target="_blank" rel="noopener noreferrer"
          className="text-xs font-mono block truncate" style={{ color: '#2563EB' }}>
          {hash.slice(0, 20)}…{hash.slice(-6)}
        </a>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      {stepCard(1, 'Approve Token',   `Allow contract to spend ${formatUnits(totalAmount, tokenDecimals)} ${tokenSymbol}`, approveStatus, approveHash)}
      {stepCard(2, 'Execute Airdrop', `Send to ${recipients.length} recipients in one transaction`,                         sendStatus,    sendHash)}

      {error && (
        <div className="rounded-xl p-3 text-xs break-words"
          style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.22)', color: '#EF4444' }}>
          {error}
        </div>
      )}

      {/* Buttons: side-by-side, each fills half; stacks not needed since both are always present */}
      <div className="flex gap-3">
        <button onClick={approve}
          disabled={approveStatus === 'pending' || approveStatus === 'success' || sendStatus === 'success'}
          className="btn-secondary flex-1 text-sm">
          {approveStatus === 'pending' ? 'Approving…' : approveStatus === 'success' ? '✓ Approved' : 'Approve Token'}
        </button>
        <button onClick={send}
          disabled={approveStatus !== 'success' || sendStatus === 'pending' || sendStatus === 'success'}
          className="btn-primary flex-1 text-sm">
          {sendStatus === 'pending' ? 'Sending…' : sendStatus === 'success' ? '✓ Complete!' : 'Execute Airdrop'}
        </button>
      </div>

      {sendStatus === 'success' && (
        <div className="rounded-xl p-3 text-center text-sm font-medium"
          style={{ background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.25)', color: '#10B981' }}>
          Airdrop complete — {recipients.length} recipients · {formatUnits(totalAmount, tokenDecimals)} {tokenSymbol} total
        </div>
      )}
    </div>
  );
}
