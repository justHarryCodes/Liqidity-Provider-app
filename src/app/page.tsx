import Link from 'next/link';

export const dynamic = 'force-dynamic';
import { ArrowLeftRight, Layers, PieChart, Send, CheckCircle } from 'lucide-react';

const FEATURE_CARDS = [
  {
    href: '/swap',
    Icon: ArrowLeftRight,
    title: 'Swap Tokens',
    description: 'Swap any token pair across Uniswap V3 and PancakeSwap V3 with optimal routing.',
    accent: '#2563EB',
    accentBg: 'rgba(37,99,235,0.07)',
  },
  {
    href: '/pool',
    Icon: Layers,
    title: 'Manage Pools',
    description: 'Discover pools, provide concentrated liquidity, and earn trading fees on your positions.',
    accent: '#0EA5E9',
    accentBg: 'rgba(14,165,233,0.07)',
  },
  {
    href: '/portfolio',
    Icon: PieChart,
    title: 'Portfolio',
    description: 'View all your LP positions, track accrued fees, and manage liquidity with one click.',
    accent: '#10B981',
    accentBg: 'rgba(16,185,129,0.07)',
  },
  {
    href: '/bulk-transfer',
    Icon: Send,
    title: 'Batch Airdrop',
    description: 'Distribute ERC20 tokens to hundreds of addresses in a single gas-efficient transaction.',
    accent: '#F59E0B',
    accentBg: 'rgba(245,158,11,0.07)',
  },
];

const CHAIN_BADGES = ['Ethereum', 'BNB Chain', 'Polygon', 'Base', 'Arbitrum', 'Optimism'];

export default function HomePage() {
  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
      {/* Hero */}
      <div className="text-center py-8">
        <h1 className="text-4xl font-bold mb-3 tracking-tight">
          <span className="gradient-text">Multi-Chain DEX Interface</span>
        </h1>
        <p className="text-lg" style={{ color: '#64748B' }}>
          Uniswap V3 &amp; PancakeSwap V3 — concentrated liquidity, optimal swaps, batch airdrops.
        </p>
        <div className="flex flex-wrap justify-center gap-2 mt-5">
          {CHAIN_BADGES.map((chain) => (
            <span
              key={chain}
              className="px-3 py-1 rounded-full text-xs font-medium"
              style={{ background: '#F1F5F9', color: '#64748B', border: '1px solid #E2E8F0' }}
            >
              {chain}
            </span>
          ))}
        </div>
      </div>

      {/* Feature cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {FEATURE_CARDS.map(({ href, Icon, title, description, accent, accentBg }) => (
          <Link
            key={href}
            href={href}
            className="card group transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            <div className="flex items-start gap-4">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: accentBg }}
              >
                <Icon size={20} style={{ color: accent }} strokeWidth={1.9} />
              </div>
              <div>
                <h3 className="font-semibold text-base mb-1" style={{ color: '#0F172A' }}>{title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#64748B' }}>{description}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Protocol info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="card-sm">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#FF007A' }} />
            <span className="font-semibold text-sm">Uniswap V3</span>
          </div>
          <ul className="space-y-1.5 text-xs" style={{ color: '#64748B' }}>
            {[
              'Factory + SwapRouter + NonfungiblePositionManager',
              'QuoterV2 for exact price quotes',
              '0.01% / 0.05% / 0.30% / 1.00% fee tiers',
              'Ethereum, Polygon, Arbitrum, Optimism, Base, BSC',
            ].map((item) => (
              <li key={item} className="flex items-start gap-1.5">
                <CheckCircle size={12} style={{ color: '#10B981', marginTop: 1, flexShrink: 0 }} />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="card-sm">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#1FC7D4' }} />
            <span className="font-semibold text-sm">PancakeSwap V3</span>
          </div>
          <ul className="space-y-1.5 text-xs" style={{ color: '#64748B' }}>
            {[
              'Factory + SmartRouter + NonfungiblePositionManager',
              'QuoterV2 for exact price quotes',
              '0.01% / 0.05% / 0.25% / 1.00% fee tiers',
              'Ethereum, BNB Chain, Base, Arbitrum',
            ].map((item) => (
              <li key={item} className="flex items-start gap-1.5">
                <CheckCircle size={12} style={{ color: '#10B981', marginTop: 1, flexShrink: 0 }} />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
