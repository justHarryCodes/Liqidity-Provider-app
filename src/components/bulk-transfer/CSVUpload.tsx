'use client';

import { useCallback } from 'react';
import Papa from 'papaparse';
import { isAddress } from 'viem';
import { FileText, Upload } from 'lucide-react';
import type { BulkTransferRecipient, TokenStandard } from '@/types';

interface Props {
  standard: TokenStandard;
  onLoaded: (recipients: BulkTransferRecipient[]) => void;
}

function validateRow(row: Record<string, string>, standard: TokenStandard): BulkTransferRecipient {
  const address = (row['address'] || row['to'] || row['recipient'] || '').trim();
  const amount  = (row['amount']  || row['value'] || '').trim();
  const tokenId = (row['tokenId'] || row['token_id'] || row['id'] || '').trim();
  if (!isAddress(address)) return { address, amount, tokenId, isValid: false, error: 'Invalid address' };
  if (standard === 'ERC20'   && (!amount  || isNaN(parseFloat(amount))  || parseFloat(amount)  <= 0)) return { address, amount, tokenId, isValid: false, error: 'Invalid amount' };
  if (standard === 'ERC721'  && !tokenId) return { address, amount, tokenId, isValid: false, error: 'Missing tokenId' };
  if (standard === 'ERC1155' && (!tokenId || !amount)) return { address, amount, tokenId, isValid: false, error: 'Missing tokenId or amount' };
  return { address, amount, tokenId, isValid: true };
}

export function CSVUpload({ standard, onLoaded }: Props) {
  const handleFile = useCallback((file: File) => {
    Papa.parse(file, {
      header: true, skipEmptyLines: true,
      complete: (result) => {
        onLoaded((result.data as Record<string, string>[]).map((row) => validateRow(row, standard)));
      },
    });
  }, [standard, onLoaded]);

  const handleDrop  = useCallback((e: React.DragEvent) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }, [handleFile]);
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (f) handleFile(f); };

  const CSV_EXAMPLE: Record<TokenStandard, string> = {
    ERC20:   'address,amount\n0x1234…,100\n0x5678…,50',
    ERC721:  'address,tokenId\n0x1234…,1\n0x5678…,2',
    ERC1155: 'address,tokenId,amount\n0x1234…,1,10\n0x5678…,2,5',
  };

  return (
    <div className="space-y-3">
      <div className="rounded-xl p-3 text-xs" style={{ background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
        <div className="flex items-center gap-1.5 mb-1.5">
          <FileText size={12} style={{ color: '#64748B' }} />
          <span className="font-medium" style={{ color: '#64748B' }}>Expected CSV format ({standard})</span>
        </div>
        <pre className="font-mono text-xs" style={{ color: '#2563EB' }}>{CSV_EXAMPLE[standard]}</pre>
      </div>

      <label onDrop={handleDrop} onDragOver={(e) => e.preventDefault()}
        className="flex flex-col items-center justify-center gap-2 p-6 rounded-xl cursor-pointer transition-all"
        style={{ border: '2px dashed #CBD5E1', background: '#F8FAFC' }}
        onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#2563EB')}
        onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#CBD5E1')}>
        <Upload size={22} style={{ color: '#64748B' }} />
        <span className="text-sm font-medium" style={{ color: '#0F172A' }}>Drop CSV or click to browse</span>
        <span className="text-xs" style={{ color: '#94A3B8' }}>Supports: CSV with headers</span>
        <input type="file" accept=".csv" onChange={handleChange} className="hidden" />
      </label>

      <p className="text-center text-xs" style={{ color: '#94A3B8' }}>Or paste addresses manually below</p>
    </div>
  );
}
