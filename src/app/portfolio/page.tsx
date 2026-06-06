import { PositionList } from '@/components/portfolio/PositionList';

export const dynamic = 'force-dynamic';

export default function PortfolioPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Portfolio</h1>
        <p className="text-sm mt-1" style={{ color: '#64748B' }}>
          All your Uniswap V3 and PancakeSwap V3 LP positions across the current network.
        </p>
      </div>
      <PositionList />
    </div>
  );
}
