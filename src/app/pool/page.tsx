'use client';

import { useState } from 'react';
import { PoolDiscovery } from '@/components/pool/PoolDiscovery';
import { CreatePool } from '@/components/pool/CreatePool';
import { AddLiquidity } from '@/components/pool/AddLiquidity';
import type { PoolInfo, TokenInfo, Protocol } from '@/types';

type Tab = 'discover' | 'create';

interface SelectedPool {
  pool: PoolInfo;
  token0: TokenInfo;
  token1: TokenInfo;
  protocol: Protocol;
}

export default function PoolPage() {
  const [tab, setTab] = useState<Tab>('discover');
  const [selected, setSelected] = useState<SelectedPool | null>(null);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Liquidity Pools</h1>
        <p className="text-sm mt-1" style={{ color: '#64748B' }}>
          Discover pools, provide concentrated liquidity, and earn trading fees.
        </p>
      </div>

      <div className="flex gap-2">
        {([['discover', 'Discover Pool'], ['create', 'Create Pool']] as [Tab, string][]).map(([t, label]) => (
          <button
            key={t}
            onClick={() => { setTab(t); setSelected(null); }}
            className="px-5 py-2 rounded-xl text-sm font-medium transition-all"
            style={{
              background: tab === t ? 'rgba(37,99,235,0.08)' : '#FFFFFF',
              color:      tab === t ? '#2563EB' : '#64748B',
              border:     `1px solid ${tab === t ? 'rgba(37,99,235,0.25)' : '#E2E8F0'}`,
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          {tab === 'discover' ? (
            <PoolDiscovery
              onPoolSelected={(pool, t0, t1, proto) =>
                setSelected({ pool, token0: t0, token1: t1, protocol: proto })
              }
            />
          ) : (
            <CreatePool />
          )}
        </div>

        {selected && (
          <div>
            <AddLiquidity
              pool={selected.pool}
              token0={selected.token0}
              token1={selected.token1}
              protocol={selected.protocol}
            />
          </div>
        )}
      </div>
    </div>
  );
}
