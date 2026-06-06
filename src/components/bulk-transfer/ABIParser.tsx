'use client';

import { useState } from 'react';
import type { ParsedABI, ABIFunction, TokenStandard } from '@/types';

interface Props {
  onParsed: (abi: ParsedABI, standard: TokenStandard) => void;
}

const TRANSFER_FUNCTION_NAMES = ['transfer', 'transferFrom', 'safeTransferFrom', 'safeBatchTransferFrom'];

function detectStandard(functions: ABIFunction[]): TokenStandard {
  const names = new Set(functions.map((f) => f.name));
  if (names.has('safeBatchTransferFrom')) return 'ERC1155';
  if (names.has('safeTransferFrom') || names.has('tokenOfOwnerByIndex')) return 'ERC721';
  return 'ERC20';
}

export function ABIParser({ onParsed }: Props) {
  const [rawABI, setRawABI] = useState('');
  const [error, setError] = useState('');

  const handleParse = () => {
    setError('');
    try {
      const parsed = JSON.parse(rawABI);
      const items = Array.isArray(parsed) ? parsed : parsed.abi || [];

      const functions: ABIFunction[] = items
        .filter((item: any) => item.type === 'function')
        .map((item: any) => ({
          name: item.name,
          inputs: item.inputs || [],
          outputs: item.outputs || [],
          stateMutability: item.stateMutability || 'nonpayable',
          type: 'function' as const,
        }));

      const events = items
        .filter((item: any) => item.type === 'event')
        .map((item: any) => ({
          name: item.name,
          inputs: item.inputs || [],
          anonymous: item.anonymous || false,
          type: 'event' as const,
        }));

      const standard = detectStandard(functions);

      onParsed({ functions, events, raw: items }, standard);
    } catch {
      setError('Invalid ABI JSON. Please paste a valid contract ABI array.');
    }
  };

  const PRESET_ABIS = {
    ERC20: '[{"type":"function","name":"transfer","inputs":[{"name":"to","type":"address"},{"name":"amount","type":"uint256"}],"outputs":[{"name":"","type":"bool"}],"stateMutability":"nonpayable"},{"type":"function","name":"transferFrom","inputs":[{"name":"from","type":"address"},{"name":"to","type":"address"},{"name":"amount","type":"uint256"}],"outputs":[{"name":"","type":"bool"}],"stateMutability":"nonpayable"},{"type":"function","name":"approve","inputs":[{"name":"spender","type":"address"},{"name":"amount","type":"uint256"}],"outputs":[{"name":"","type":"bool"}],"stateMutability":"nonpayable"},{"type":"function","name":"balanceOf","inputs":[{"name":"account","type":"address"}],"outputs":[{"name":"","type":"uint256"}],"stateMutability":"view"},{"type":"function","name":"decimals","inputs":[],"outputs":[{"name":"","type":"uint8"}],"stateMutability":"view"},{"type":"function","name":"symbol","inputs":[],"outputs":[{"name":"","type":"string"}],"stateMutability":"view"}]',
    ERC721: '[{"type":"function","name":"safeTransferFrom","inputs":[{"name":"from","type":"address"},{"name":"to","type":"address"},{"name":"tokenId","type":"uint256"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"transferFrom","inputs":[{"name":"from","type":"address"},{"name":"to","type":"address"},{"name":"tokenId","type":"uint256"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"balanceOf","inputs":[{"name":"owner","type":"address"}],"outputs":[{"name":"balance","type":"uint256"}],"stateMutability":"view"},{"type":"function","name":"ownerOf","inputs":[{"name":"tokenId","type":"uint256"}],"outputs":[{"name":"owner","type":"address"}],"stateMutability":"view"},{"type":"function","name":"tokenOfOwnerByIndex","inputs":[{"name":"owner","type":"address"},{"name":"index","type":"uint256"}],"outputs":[{"name":"tokenId","type":"uint256"}],"stateMutability":"view"}]',
    ERC1155: '[{"type":"function","name":"safeBatchTransferFrom","inputs":[{"name":"from","type":"address"},{"name":"to","type":"address"},{"name":"ids","type":"uint256[]"},{"name":"amounts","type":"uint256[]"},{"name":"data","type":"bytes"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"safeTransferFrom","inputs":[{"name":"from","type":"address"},{"name":"to","type":"address"},{"name":"id","type":"uint256"},{"name":"amount","type":"uint256"},{"name":"data","type":"bytes"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"balanceOf","inputs":[{"name":"account","type":"address"},{"name":"id","type":"uint256"}],"outputs":[{"name":"","type":"uint256"}],"stateMutability":"view"}]',
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs mb-2 block font-medium" style={{ color: '#8A8B9B' }}>Contract ABI (JSON)</label>
        <textarea
          value={rawABI}
          onChange={(e) => setRawABI(e.target.value)}
          placeholder='Paste ABI JSON array here, e.g. [{"type":"function","name":"transfer",...}]'
          rows={6}
          className="w-full px-4 py-3 rounded-xl text-xs font-mono outline-none resize-none"
          style={{ background: '#22232E', border: '1px solid #2A2B35', color: 'white' }}
        />
      </div>

      {/* Preset loaders */}
      <div>
        <label className="text-xs mb-2 block" style={{ color: '#8A8B9B' }}>Quick Load Preset</label>
        <div className="flex gap-2">
          {(['ERC20', 'ERC721', 'ERC1155'] as const).map((std) => (
            <button
              key={std}
              onClick={() => setRawABI(PRESET_ABIS[std])}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{ background: '#22232E', color: '#8A8B9B', border: '1px solid #2A2B35' }}
            >
              {std}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-xs" style={{ color: '#FF4B4B' }}>{error}</p>}

      <button
        onClick={handleParse}
        disabled={!rawABI.trim()}
        className="btn-primary text-sm"
      >
        Parse ABI
      </button>
    </div>
  );
}
