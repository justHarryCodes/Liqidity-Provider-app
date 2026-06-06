import { BulkTransferInterface } from '@/components/bulk-transfer/BulkTransferInterface';

export const dynamic = 'force-dynamic';

export default function BulkTransferPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Batch Airdrop</h1>
        <p className="text-sm mt-1" style={{ color: '#64748B' }}>
          Airdrop ERC20 tokens to multiple addresses in a single transaction via the batch airdrop contract.
        </p>
      </div>
      <BulkTransferInterface />
    </div>
  );
}
