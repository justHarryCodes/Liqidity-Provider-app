'use client';

import { useState, useMemo } from 'react';
import { useChainId } from 'wagmi';
import { isAddress } from 'viem';
import { ChevronDown, X, Search, PlusCircle } from 'lucide-react';
import { COMMON_TOKENS } from '@/lib/constants/tokens';
import type { TokenInfo, ChainId } from '@/types';

interface Props {
  selected?: TokenInfo;
  onSelect: (token: TokenInfo) => void;
  exclude?: TokenInfo;
}

export function TokenSelector({ selected, onSelect, exclude }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const chainId = useChainId() as ChainId;

  const tokens = useMemo(() => {
    const list = COMMON_TOKENS[chainId] || [];
    const filtered = list.filter((t) => t.address !== exclude?.address);
    if (!search) return filtered;
    const q = search.toLowerCase();
    return filtered.filter(
      (t) =>
        t.symbol.toLowerCase().includes(q) ||
        t.name.toLowerCase().includes(q) ||
        t.address.toLowerCase().includes(q)
    );
  }, [chainId, exclude, search]);

  const close = () => { setOpen(false); setSearch(''); };

  const handleCustomToken = () => {
    if (isAddress(search)) {
      onSelect({ address: search as `0x${string}`, symbol: search.slice(0, 8), name: 'Custom Token', decimals: 18, chainId });
      close();
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl font-semibold text-sm transition-all flex-shrink-0"
        style={{
          background: selected ? '#F1F5F9' : 'linear-gradient(135deg, #2563EB, #0EA5E9)',
          color:      selected ? '#0F172A' : 'white',
          border:     selected ? '1px solid #E2E8F0' : 'none',
          whiteSpace: 'nowrap',
        }}
      >
        {selected ? (
          <>
            <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #2563EB, #0EA5E9)' }}>
              {selected.symbol[0]}
            </span>
            {selected.symbol}
            <ChevronDown size={14} strokeWidth={2} style={{ color: '#64748B' }} />
          </>
        ) : (
          <>Select token <ChevronDown size={14} strokeWidth={2} /></>
        )}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(4px)' }}
          onClick={close}
        >
          <div className="card w-full max-w-sm animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold" style={{ color: '#0F172A' }}>Select Token</h3>
              <button onClick={close} className="p-1 rounded-lg hover:bg-gray-100 transition-colors">
                <X size={16} style={{ color: '#64748B' }} />
              </button>
            </div>

            <div className="relative mb-4">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#94A3B8' }} />
              <input
                autoFocus
                type="text"
                placeholder="Search by name, symbol or address…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: '#F1F5F9', border: '1px solid #E2E8F0', color: '#0F172A' }}
              />
            </div>

            <div className="space-y-0.5 max-h-72 overflow-y-auto">
              {tokens.map((token) => (
                <button
                  key={token.address}
                  onClick={() => { onSelect(token); close(); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left"
                  style={{ background: selected?.address === token.address ? 'rgba(37,99,235,0.07)' : 'transparent' }}
                  onMouseEnter={(e) => { if (selected?.address !== token.address) (e.currentTarget as HTMLElement).style.background = '#F8FAFC'; }}
                  onMouseLeave={(e) => { if (selected?.address !== token.address) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                >
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, #2563EB, #0EA5E9)' }}>
                    {token.symbol[0]}
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-sm" style={{ color: '#0F172A' }}>{token.symbol}</div>
                    <div className="text-xs truncate" style={{ color: '#64748B' }}>{token.name}</div>
                  </div>
                  {selected?.address === token.address && (
                    <span className="ml-auto text-xs font-medium" style={{ color: '#2563EB' }}>Selected</span>
                  )}
                </button>
              ))}

              {tokens.length === 0 && isAddress(search) && (
                <button
                  onClick={handleCustomToken}
                  className="w-full flex items-center gap-2 px-3 py-3 rounded-xl text-sm font-medium"
                  style={{ background: 'rgba(37,99,235,0.07)', border: '1px solid rgba(37,99,235,0.2)', color: '#2563EB' }}
                >
                  <PlusCircle size={16} />
                  Import: {search.slice(0, 10)}…
                </button>
              )}

              {tokens.length === 0 && !isAddress(search) && search && (
                <p className="text-center py-6 text-sm" style={{ color: '#94A3B8' }}>
                  No tokens found. Try pasting a contract address.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
