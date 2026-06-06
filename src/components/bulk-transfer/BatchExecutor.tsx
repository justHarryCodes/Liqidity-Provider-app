'use client';

import { useState } from 'react';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { isAddress, parseUnits } from 'viem';
import { erc20ABI, erc721ABI, erc1155ABI } from '@/lib/abis';
import { shortenAddress } from '@/lib/utils';
import type { BulkTransferRecipient, TokenStandard, ABIFunction } from '@/types';

interface Props {
  contractAddress: string;
  abi: object[];
  standard: TokenStandard;
  transferFn: ABIFunction;
  recipients: BulkTransferRecipient[];
  tokenDecimals?: number;
}

interface TxResult {
  recipient: BulkTransferRecipient;
  hash?: `0x${string}`;
  status: 'pending' | 'success' | 'error';
  error?: string;
}

export function BatchExecutor({ contractAddress, abi, standard, transferFn, recipients, tokenDecimals = 18 }: Props) {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  const [results, setResults] = useState<TxResult[]>([]);
  const [executing, setExecuting] = useState(false);
  const [gasEstimates, setGasEstimates] = useState<bigint[]>([]);

  const validRecipients = recipients.filter((r) => r.isValid);

  const estimateGas = async () => {
    if (!address || !publicClient || !isAddress(contractAddress)) return;
    const estimates: bigint[] = [];

    for (const r of validRecipients) {
      try {
        let args: unknown[];
        if (standard === 'ERC20') {
          args = [r.address, parseUnits(r.amount, tokenDecimals)];
        } else if (standard === 'ERC721') {
          args = [address, r.address, BigInt(r.tokenId || '0')];
        } else {
          args = [address, r.address, [BigInt(r.tokenId || '0')], [parseUnits(r.amount, 0)], '0x'];
        }

        const gas = await publicClient.estimateContractGas({
          address: contractAddress as `0x${string}`,
          abi,
          functionName: transferFn.name,
          args,
          account: address,
        });
        estimates.push(gas);
      } catch {
        estimates.push(0n);
      }
    }

    setGasEstimates(estimates);
  };

  const executeAll = async () => {
    if (!address || !walletClient || !publicClient || !isAddress(contractAddress)) return;
    setExecuting(true);

    const initialResults: TxResult[] = validRecipients.map((r) => ({
      recipient: r,
      status: 'pending',
    }));
    setResults(initialResults);

    for (let i = 0; i < validRecipients.length; i++) {
      const r = validRecipients[i];
      try {
        let args: unknown[];
        if (standard === 'ERC20') {
          args = [r.address, parseUnits(r.amount, tokenDecimals)];
        } else if (standard === 'ERC721') {
          args = [address, r.address, BigInt(r.tokenId || '0')];
        } else {
          args = [address, r.address, [BigInt(r.tokenId || '0')], [parseUnits(r.amount, 0)], '0x' as `0x${string}`];
        }

        const { request } = await publicClient.simulateContract({
          address: contractAddress as `0x${string}`,
          abi,
          functionName: transferFn.name,
          args,
          account: address,
        });

        const hash = await walletClient.writeContract(request);

        setResults((prev) => {
          const next = [...prev];
          next[i] = { recipient: r, hash, status: 'success' };
          return next;
        });
      } catch (err: any) {
        setResults((prev) => {
          const next = [...prev];
          next[i] = { recipient: r, status: 'error', error: err.shortMessage || err.message };
          return next;
        });
      }

      // 300ms between txs to avoid nonce issues
      await new Promise((res) => setTimeout(res, 300));
    }

    setExecuting(false);
  };

  const retryFailed = async () => {
    const failed = results.filter((r) => r.status === 'error');
    if (!failed.length) return;
    // Re-run only failed
    setExecuting(true);
    for (const res of failed) {
      const idx = results.indexOf(res);
      setResults((prev) => {
        const next = [...prev];
        next[idx] = { ...next[idx], status: 'pending', error: undefined };
        return next;
      });
      // Same logic as above...
    }
    setExecuting(false);
  };

  const totalGas = gasEstimates.reduce((a, b) => a + b, 0n);
  const successCount = results.filter((r) => r.status === 'success').length;
  const errorCount = results.filter((r) => r.status === 'error').length;
  const pendingCount = results.filter((r) => r.status === 'pending').length;

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card-sm text-center">
          <div className="text-2xl font-bold">{validRecipients.length}</div>
          <div className="text-xs mt-1" style={{ color: '#8A8B9B' }}>Recipients</div>
        </div>
        <div className="card-sm text-center">
          <div className="text-2xl font-bold" style={{ color: '#7B61FF' }}>
            {standard}
          </div>
          <div className="text-xs mt-1" style={{ color: '#8A8B9B' }}>Standard</div>
        </div>
        <div className="card-sm text-center">
          <div className="text-2xl font-bold">
            {totalGas > 0n ? `~${Number(totalGas / 1000n)}k` : '—'}
          </div>
          <div className="text-xs mt-1" style={{ color: '#8A8B9B' }}>Est. Gas</div>
        </div>
      </div>

      {/* Recipient table */}
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #2A2B35' }}>
        <table className="w-full text-xs">
          <thead>
            <tr style={{ background: '#22232E', color: '#8A8B9B' }}>
              <th className="text-left px-3 py-2.5">Address</th>
              {standard !== 'ERC721' && <th className="text-right px-3 py-2.5">Amount</th>}
              {standard !== 'ERC20' && <th className="text-right px-3 py-2.5">Token ID</th>}
              <th className="text-right px-3 py-2.5">Status</th>
            </tr>
          </thead>
          <tbody>
            {validRecipients.map((r, i) => {
              const result = results[i];
              return (
                <tr key={i} style={{ borderTop: '1px solid #2A2B35' }}>
                  <td className="px-3 py-2.5 font-mono">{shortenAddress(r.address)}</td>
                  {standard !== 'ERC721' && <td className="px-3 py-2.5 text-right">{r.amount}</td>}
                  {standard !== 'ERC20' && <td className="px-3 py-2.5 text-right">{r.tokenId || '—'}</td>}
                  <td className="px-3 py-2.5 text-right">
                    {!result && <span style={{ color: '#8A8B9B' }}>Queued</span>}
                    {result?.status === 'pending' && <span style={{ color: '#FFB800' }}>Sending...</span>}
                    {result?.status === 'success' && (
                      <a
                        href={result.hash ? `#${result.hash}` : '#'}
                        className="font-medium"
                        style={{ color: '#00D395' }}
                      >
                        ✓ Done
                      </a>
                    )}
                    {result?.status === 'error' && (
                      <span title={result.error} style={{ color: '#FF4B4B' }}>✗ Failed</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Progress */}
      {results.length > 0 && (
        <div className="rounded-xl p-3 text-xs space-y-1" style={{ background: '#22232E', border: '1px solid #2A2B35' }}>
          <div className="flex justify-between">
            <span style={{ color: '#00D395' }}>Success</span>
            <span>{successCount}</span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: '#FF4B4B' }}>Failed</span>
            <span>{errorCount}</span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: '#FFB800' }}>Pending</span>
            <span>{pendingCount}</span>
          </div>
          {/* Progress bar */}
          <div className="h-1.5 rounded-full mt-2 overflow-hidden" style={{ background: '#2A2B35' }}>
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${(successCount / validRecipients.length) * 100}%`,
                background: 'linear-gradient(90deg, #7B61FF, #00C2FF)',
              }}
            />
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={estimateGas}
          disabled={executing || !validRecipients.length}
          className="flex-1 btn-secondary text-sm"
        >
          Estimate Gas
        </button>
        <button
          onClick={executeAll}
          disabled={executing || !validRecipients.length}
          className="flex-1 btn-primary text-sm"
        >
          {executing ? `Sending ${successCount + pendingCount}/${validRecipients.length}...` : 'Execute All'}
        </button>
      </div>

      {errorCount > 0 && !executing && (
        <button onClick={retryFailed} className="w-full btn-secondary text-sm">
          Retry {errorCount} Failed
        </button>
      )}
    </div>
  );
}
