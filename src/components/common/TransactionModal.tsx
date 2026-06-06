'use client';

import { useWaitForTransactionReceipt, useChainId } from 'wagmi';
import { CheckCircle, XCircle, Loader } from 'lucide-react';
import { getExplorerUrl } from '@/lib/utils';
import type { ChainId } from '@/types';

interface Props {
  hash?: `0x${string}`;
  isOpen: boolean;
  onClose: () => void;
  title?: string;
}

export function TransactionModal({ hash, isOpen, onClose, title = 'Transaction' }: Props) {
  const chainId = useChainId();
  const { isLoading, isSuccess, isError } = useWaitForTransactionReceipt({ hash });

  if (!isOpen) return null;

  const status = isLoading ? 'pending' : isSuccess ? 'success' : isError ? 'error' : 'idle';

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="card w-full sm:max-w-sm animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center space-y-5">
          <div className="flex justify-center">
            {status === 'pending' && (
              <div className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(37,99,235,0.08)' }}>
                <Loader size={30} style={{ color: '#2563EB' }} className="animate-spin-slow" />
              </div>
            )}
            {status === 'success' && (
              <div className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(16,185,129,0.08)' }}>
                <CheckCircle size={34} style={{ color: '#10B981' }} strokeWidth={1.8} />
              </div>
            )}
            {status === 'error' && (
              <div className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(239,68,68,0.08)' }}>
                <XCircle size={34} style={{ color: '#EF4444' }} strokeWidth={1.8} />
              </div>
            )}
          </div>

          <div>
            <h3 className="font-semibold text-lg" style={{ color: '#0F172A' }}>{title}</h3>
            <p className="text-sm mt-1" style={{ color: '#64748B' }}>
              {status === 'pending' && 'Waiting for confirmation…'}
              {status === 'success' && 'Transaction confirmed!'}
              {status === 'error'   && 'Transaction failed.'}
            </p>
          </div>

          {hash && (
            <a href={getExplorerUrl(chainId as ChainId, 'tx', hash)}
              target="_blank" rel="noopener noreferrer"
              className="text-sm font-medium break-all" style={{ color: '#2563EB' }}>
              View on Explorer →
            </a>
          )}

          {(status === 'success' || status === 'error') && (
            <button onClick={onClose} className="btn-secondary w-full text-sm">Close</button>
          )}
        </div>
      </div>
    </div>
  );
}
