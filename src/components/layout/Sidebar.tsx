'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ArrowLeftRight,
  Layers,
  PieChart,
  Send,
  Zap,
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/',              label: 'Dashboard',    Icon: LayoutDashboard },
  { href: '/swap',          label: 'Swap',         Icon: ArrowLeftRight },
  { href: '/pool',          label: 'Pools',        Icon: Layers },
  { href: '/portfolio',     label: 'Portfolio',    Icon: PieChart },
  { href: '/bulk-transfer', label: 'Airdrop',      Icon: Send },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="hidden md:flex w-60 flex-shrink-0 flex-col h-full"
      style={{
        background: '#FFFFFF',
        borderRight: '1px solid #E2E8F0',
      }}
    >
      {/* Logo */}
      <div className="px-5 py-5 flex items-center gap-2.5 border-b" style={{ borderColor: '#E2E8F0' }}>
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #2563EB, #0EA5E9)' }}
        >
          <Zap size={16} color="white" strokeWidth={2.5} />
        </div>
        <span className="font-bold text-base tracking-tight" style={{ color: '#0F172A' }}>
          LiquidityDEX
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV_ITEMS.map(({ href, label, Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
              style={{
                background: active ? 'rgba(37,99,235,0.08)' : 'transparent',
                color:      active ? '#2563EB' : '#64748B',
                borderLeft: active ? '3px solid #2563EB' : '3px solid transparent',
              }}
            >
              <Icon size={17} strokeWidth={active ? 2.2 : 1.8} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Protocol badges */}
      <div className="px-4 pb-5 pt-2 border-t space-y-2" style={{ borderColor: '#E2E8F0' }}>
        <p className="text-xs font-semibold px-1 mb-2" style={{ color: '#94A3B8', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Protocols</p>
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium" style={{ background: '#FFF0F6', color: '#BE185D' }}>
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: '#FF007A' }} />
          Uniswap V3
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium" style={{ background: '#F0FDFA', color: '#0D9488' }}>
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: '#1FC7D4' }} />
          PancakeSwap V3
        </div>
      </div>
    </aside>
  );
}
