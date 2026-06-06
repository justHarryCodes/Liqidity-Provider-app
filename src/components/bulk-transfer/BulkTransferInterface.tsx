'use client';

import { useState, useEffect } from 'react';
import { isAddress, parseUnits, formatUnits } from 'viem';
import { ChevronRight } from 'lucide-react';
import { CSVUpload } from './CSVUpload';
import { AirdropExecutor } from './AirdropExecutor';
import { usePublicClient, useChainId } from 'wagmi';
import { erc20ABI } from '@/lib/abis';
import { BATCH_AIRDROP_ADDRESSES, CHAIN_NAMES } from '@/lib/constants/addresses';
import type { BulkTransferRecipient } from '@/types';

type Step = 'token' | 'recipients' | 'execute';
export type AirdropMode = 'equal' | 'custom';

const STEPS: { key: Step; label: string }[] = [
  { key: 'token',      label: 'Token'      },
  { key: 'recipients', label: 'Recipients' },
  { key: 'execute',    label: 'Execute'    },
];

export function BulkTransferInterface() {
  const publicClient = usePublicClient();
  const chainId = useChainId();

  const [step, setStep] = useState<Step>('token');
  const [tokenAddress, setTokenAddress] = useState('');
  const [airdropContract, setAirdropContract] = useState('');
  const [tokenSymbol, setTokenSymbol] = useState('');
  const [tokenDecimals, setTokenDecimals] = useState(18);
  const [loadingMeta, setLoadingMeta] = useState(false);
  const [mode, setMode] = useState<AirdropMode>('equal');
  const [equalAmount, setEqualAmount] = useState('');
  const [recipients, setRecipients] = useState<BulkTransferRecipient[]>([]);
  const [manualInput, setManualInput] = useState('');

  useEffect(() => {
    setAirdropContract(BATCH_AIRDROP_ADDRESSES[chainId] ?? '');
  }, [chainId]);

  const knownChains: Record<number, string> = { 56: 'BSC', 1: 'Ethereum' };
  const chainLabel = knownChains[chainId] ?? CHAIN_NAMES[chainId as keyof typeof CHAIN_NAMES] ?? `Chain ${chainId}`;
  const isKnownChain = !!BATCH_AIRDROP_ADDRESSES[chainId];

  const loadTokenMeta = async () => {
    if (!isAddress(tokenAddress) || !publicClient) return;
    setLoadingMeta(true);
    try {
      const [decimals, symbol] = await Promise.all([
        publicClient.readContract({ address: tokenAddress as `0x${string}`, abi: erc20ABI, functionName: 'decimals' }),
        publicClient.readContract({ address: tokenAddress as `0x${string}`, abi: erc20ABI, functionName: 'symbol' }),
      ]);
      setTokenDecimals(Number(decimals)); setTokenSymbol(symbol as string);
    } catch { setTokenSymbol(''); }
    setLoadingMeta(false);
  };

  const parseManualInput = () => {
    setRecipients(manualInput.split('\n').map((l) => l.trim()).filter(Boolean).map((line) => {
      const parts = line.split(/[,\t\s]+/);
      const addr = parts[0] || '';
      const amount = mode === 'equal' ? equalAmount : (parts[1] || '');
      const valid = isAddress(addr);
      return { address: addr, amount, isValid: valid, error: valid ? undefined : 'Invalid address' };
    }));
  };

  const validRecipients = recipients.filter((r) => r.isValid);
  const totalAmount = (() => {
    if (!validRecipients.length) return 0n;
    try {
      if (mode === 'equal' && equalAmount) return parseUnits(equalAmount, tokenDecimals) * BigInt(validRecipients.length);
      if (mode === 'custom') return validRecipients.reduce((s, r) => { try { return s + parseUnits(r.amount || '0', tokenDecimals); } catch { return s; } }, 0n);
    } catch {}
    return 0n;
  })();

  const canProceedToRecipients = isAddress(tokenAddress) && isAddress(airdropContract) && !!tokenSymbol;
  const canProceedToExecute    = validRecipients.length > 0 && (mode === 'custom' || !!equalAmount);

  const tabStyle = (active: boolean) => ({
    background: active ? 'rgba(37,99,235,0.08)' : '#F1F5F9',
    color:      active ? '#2563EB' : '#64748B',
    border:     `1px solid ${active ? 'rgba(37,99,235,0.25)' : '#E2E8F0'}`,
  });

  const currentStepIndex = STEPS.findIndex((s) => s.key === step);

  return (
    <div className="space-y-6">

      {/* ── Step indicator — scrollable row on tiny screens ── */}
      <div className="flex items-center gap-1 overflow-x-auto pb-0.5" style={{ scrollbarWidth: 'none' }}>
        {STEPS.map(({ key, label }, i) => {
          const isDone   = i < currentStepIndex;
          const isActive = i === currentStepIndex;
          return (
            <div key={key} className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={() => setStep(key)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap"
                style={{
                  background: isActive ? 'rgba(37,99,235,0.08)' : isDone ? '#F1F5F9' : '#FFFFFF',
                  color:      isActive ? '#2563EB' : isDone ? '#64748B' : '#94A3B8',
                  border:     `1px solid ${isActive ? 'rgba(37,99,235,0.25)' : '#E2E8F0'}`,
                }}
              >
                <span
                  className="w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0"
                  style={{
                    background: isActive ? '#2563EB' : isDone ? '#10B981' : '#E2E8F0',
                    color: isActive || isDone ? 'white' : '#94A3B8',
                  }}
                >
                  {isDone ? '✓' : i + 1}
                </span>
                {label}
              </button>
              {i < STEPS.length - 1 && (
                <ChevronRight size={14} className="flex-shrink-0" style={{ color: '#CBD5E1' }} />
              )}
            </div>
          );
        })}
      </div>

      {/* ── Step 1: Token ── */}
      {step === 'token' && (
        <div className="card space-y-5">
          <h3 className="font-semibold" style={{ color: '#0F172A' }}>Token Setup</h3>

          <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs"
            style={{ background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
            <span style={{ color: '#64748B' }}>Chain:</span>
            <span className="font-semibold" style={{ color: isKnownChain ? '#10B981' : '#F59E0B' }}>{chainLabel}</span>
            {!isKnownChain && <span className="ml-1" style={{ color: '#EF4444' }}>— enter contract manually</span>}
          </div>

          <div>
            <label className="text-xs mb-2 block font-medium" style={{ color: '#64748B' }}>Token Address (ERC20)</label>
            {/* flex row: input grows, button stays compact */}
            <div className="flex gap-2 min-w-0">
              <input type="text" value={tokenAddress}
                onChange={(e) => { setTokenAddress(e.target.value); setTokenSymbol(''); }}
                placeholder="0x… token to airdrop"
                className="flex-1 min-w-0 px-3 py-2.5 rounded-xl text-sm font-mono outline-none"
                style={{ background: '#F1F5F9', border: '1px solid #E2E8F0', color: '#0F172A' }} />
              {/* inline button — no w-full, naturally sized */}
              <button onClick={loadTokenMeta} disabled={!isAddress(tokenAddress) || loadingMeta}
                className="flex-shrink-0 px-4 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-40"
                style={{ background: '#F1F5F9', border: '1px solid #E2E8F0', color: '#0F172A', cursor: 'pointer' }}>
                {loadingMeta ? '…' : 'Load'}
              </button>
            </div>
            {tokenSymbol && (
              <p className="text-xs mt-1.5 font-medium" style={{ color: '#10B981' }}>
                ✓ {tokenSymbol} · {tokenDecimals} decimals
              </p>
            )}
          </div>

          <div>
            <label className="text-xs mb-2 block font-medium" style={{ color: '#64748B' }}>
              Airdrop Contract
              <span className="ml-2 font-normal" style={{ color: isKnownChain ? '#2563EB' : '#F59E0B' }}>
                {isKnownChain ? `Auto-filled for ${chainLabel}` : 'Not configured — paste deployed address'}
              </span>
            </label>
            <input type="text" value={airdropContract} onChange={(e) => setAirdropContract(e.target.value)}
              placeholder="0x…"
              className="w-full px-3 py-2.5 rounded-xl text-sm font-mono outline-none"
              style={{
                background: '#F1F5F9',
                border: `1px solid ${isAddress(airdropContract) ? 'rgba(16,185,129,0.4)' : '#E2E8F0'}`,
                color: '#0F172A',
              }} />
            {isAddress(airdropContract) && (
              <p className="text-xs mt-1.5 font-medium" style={{ color: '#10B981' }}>✓ Valid address</p>
            )}
          </div>

          <button onClick={() => setStep('recipients')} disabled={!canProceedToRecipients}
            className="btn-primary w-full text-sm">
            Next: Add Recipients →
          </button>
        </div>
      )}

      {/* ── Step 2: Recipients ── */}
      {step === 'recipients' && (
        <div className="card space-y-5">
          <h3 className="font-semibold" style={{ color: '#0F172A' }}>Recipients</h3>

          <div>
            <label className="text-xs mb-2 block font-medium" style={{ color: '#64748B' }}>Distribution Mode</label>
            <div className="flex gap-2">
              {(['equal', 'custom'] as AirdropMode[]).map((m) => (
                <button key={m} onClick={() => setMode(m)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all"
                  style={tabStyle(mode === m)}>
                  {m === 'equal' ? 'Equal Amounts' : 'Custom Amounts'}
                </button>
              ))}
            </div>
          </div>

          {mode === 'equal' && (
            <div>
              <label className="text-xs mb-2 block font-medium" style={{ color: '#64748B' }}>
                Amount per recipient ({tokenSymbol})
              </label>
              <input type="text" value={equalAmount} onChange={(e) => setEqualAmount(e.target.value)}
                placeholder="e.g. 100"
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: '#F1F5F9', border: '1px solid #E2E8F0', color: '#0F172A' }} />
            </div>
          )}

          <CSVUpload standard="ERC20" onLoaded={setRecipients} />

          <div className="relative flex items-center gap-3">
            <div className="flex-1 h-px" style={{ background: '#E2E8F0' }} />
            <span className="text-xs font-medium flex-shrink-0" style={{ color: '#94A3B8' }}>OR enter manually</span>
            <div className="flex-1 h-px" style={{ background: '#E2E8F0' }} />
          </div>

          <textarea value={manualInput} onChange={(e) => setManualInput(e.target.value)}
            placeholder={mode === 'equal'
              ? '0xAddress1\n0xAddress2\n0xAddress3'
              : '0xAddress1, 100\n0xAddress2, 50'}
            rows={4}
            className="w-full px-3 py-2.5 rounded-xl text-sm font-mono outline-none resize-none"
            style={{ background: '#F1F5F9', border: '1px solid #E2E8F0', color: '#0F172A' }} />

          {manualInput && (
            <button onClick={parseManualInput} className="btn-secondary w-full text-sm">
              Parse Input
            </button>
          )}

          {recipients.length > 0 && (
            <div className="rounded-xl p-3 text-xs" style={{ background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
              <div className="flex justify-between mb-2">
                <span className="font-semibold" style={{ color: '#0F172A' }}>{recipients.length} recipients</span>
                <span style={{ color: '#EF4444' }}>{recipients.filter((r) => !r.isValid).length} invalid</span>
              </div>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {recipients.map((r, i) => (
                  <div key={i} className="flex justify-between gap-2 min-w-0"
                    style={{ color: r.isValid ? '#64748B' : '#EF4444' }}>
                    <span className="font-mono truncate">{r.address.slice(0, 12)}…</span>
                    <span className="flex-shrink-0">{r.error || `${mode === 'equal' ? equalAmount : r.amount} ${tokenSymbol}`}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button onClick={() => setStep('execute')} disabled={!canProceedToExecute}
            className="btn-primary w-full text-sm">
            Next: Preview &amp; Execute →
          </button>
        </div>
      )}

      {/* ── Step 3: Execute ── */}
      {step === 'execute' && (
        <div className="card space-y-5">
          <h3 className="font-semibold" style={{ color: '#0F172A' }}>Preview &amp; Execute</h3>

          <div className="rounded-xl p-4 text-xs space-y-2.5" style={{ background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
            {[
              ['Token',      `${tokenAddress.slice(0, 10)}… (${tokenSymbol})`],
              ['Mode',       mode === 'equal' ? `Equal — ${equalAmount} ${tokenSymbol} each` : 'Custom amounts'],
              ['Recipients', String(validRecipients.length)],
              ['Total',      `${formatUnits(totalAmount, tokenDecimals)} ${tokenSymbol}`],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between gap-2 min-w-0">
                <span className="flex-shrink-0" style={{ color: '#64748B' }}>{label}</span>
                <span className="font-semibold truncate text-right"
                  style={{ color: label === 'Total' ? '#2563EB' : '#0F172A' }}>
                  {value}
                </span>
              </div>
            ))}
          </div>

          <AirdropExecutor
            tokenAddress={tokenAddress}
            airdropContract={airdropContract}
            mode={mode}
            recipients={validRecipients}
            equalAmount={equalAmount}
            tokenDecimals={tokenDecimals}
            tokenSymbol={tokenSymbol}
            totalAmount={totalAmount}
          />
        </div>
      )}
    </div>
  );
}
