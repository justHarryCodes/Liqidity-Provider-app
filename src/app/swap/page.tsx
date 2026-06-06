import { SwapInterface } from '@/components/swap/SwapInterface';

export const dynamic = 'force-dynamic';

export default function SwapPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Swap Tokens</h1>
        <p className="text-sm mt-1" style={{ color: '#64748B' }}>
          Trade any token pair with exact quotes and slippage protection.
        </p>
      </div>
      <SwapInterface />
    </div>
  );
}
