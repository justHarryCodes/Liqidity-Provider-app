import type { Address } from 'viem';
import type { ChainId } from '@/types';

export const ZERO_ADDRESS: Address = '0x0000000000000000000000000000000000000000';

interface ChainAddresses {
  factory: Address;
  swapRouter: Address;
  nonfungiblePositionManager: Address;
  quoterV2: Address;
  multicall2: Address;
  weth: Address;
}
export const UNISWAP_V3_ADDRESSES: Partial<Record<ChainId, ChainAddresses>> = {
  // Ethereum Mainnet
  1: {
    factory: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
    swapRouter: '0xE592427A0AEce92De3Edee1F18E0157C05861564',
    nonfungiblePositionManager: '0xC36442b4a4522E871399CD717aBDD847Ab11FE88',
    quoterV2: '0x61fFE014bA17989E391c6c17C06EA59B65eA2d34',
    multicall2: '0x5BA1e12693Dc8F9c48aAD8770482f4739bEeD696',
    weth: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
  },
  // BNB Smart Chain
  56: {
    factory: '0xdB1d10011AD0Ff90774D0C6Bb92e5C5c8b4461F7',
    swapRouter: '0xB971eF87ede563556b2ed4b1c0b0019111Dd85d2',
    nonfungiblePositionManager: '0x7b8A338563aA277F58f6ADc1535665AE0D4D1d87',
    quoterV2: '0x3D3a21ADA959c2D64c5945ea450C87AB5AE4F53a',
    multicall2: '0xac1cE734566f390A94b00eb9cAFFeD1cBb1A1E6c',
    weth: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c', // WBNB
  },
  // Polygon
  137: {
    factory: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
    swapRouter: '0xE592427A0AEce92De3Edee1F18E0157C05861564',
    nonfungiblePositionManager: '0xC36442b4a4522E871399CD717aBDD847Ab11FE88',
    quoterV2: '0x61fFE014bA17989E391c6c17C06EA59B65eA2d34',
    multicall2: '0x275617327c958bD06b5D6b871E7f491D76113dd8',
    weth: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270', // WMATIC
  },
  // Base
  8453: {
    factory: '0x33128a8fC17869897dcE68Ed026d694621f6FDfD',
    swapRouter: '0x2626664c2603336E57B271c5C0b26F421741e481',
    nonfungiblePositionManager: '0x03a520b32C04Bf3bEEac7E5Ff5725EBA0c54b0c8',
    quoterV2: '0x3d4e44Eb1374240CE5F1B284a88c7cB1ECa2f68d',
    multicall2: '0xca11bde05977b3631167028862be2a173976ca11',
    weth: '0x4200000000000000000000000000000000000006',
  },
  // Arbitrum One
  42161: {
    factory: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
    swapRouter: '0xE592427A0AEce92De3Edee1F18E0157C05861564',
    nonfungiblePositionManager: '0xC36442b4a4522E871399CD717aBDD847Ab11FE88',
    quoterV2: '0x61fFE014bA17989E391c6c17C06EA59B65eA2d34',
    multicall2: '0x5BA1e12693Dc8F9c48aAD8770482f4739bEeD696',
    weth: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
  },
  // Optimism
  10: {
    factory: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
    swapRouter: '0xE592427A0AEce92De3Edee1F18E0157C05861564',
    nonfungiblePositionManager: '0xC36442b4a4522E871399CD717aBDD847Ab11FE88',
    quoterV2: '0x61fFE014bA17989E391c6c17C06EA59B65eA2d34',
    multicall2: '0x5BA1e12693Dc8F9c48aAD8770482f4739bEeD696',
    weth: '0x4200000000000000000000000000000000000006',
  },
};

interface PancakeChainAddresses {
  factory: Address;
  smartRouter: Address;
  nonfungiblePositionManager: Address;
  quoterV2: Address;
  multicall: Address;
  weth: Address;
}

export const PANCAKESWAP_V3_ADDRESSES: Record<number, PancakeChainAddresses> = {
  // Ethereum Mainnet
  1: {
    factory: '0x0BFbCF9fa4f9C56B0F40a671Ad40E0805A091865',
    smartRouter: '0x13f4EA83D0bd40E75C8222255bc855a974568Dd4',
    nonfungiblePositionManager: '0x46A15B0b27311cedF172AB29E4f4766fbE7F4364',
    quoterV2: '0xB048Bbc1Ee6b733FFfCFb9e9CeF7375518e25997',
    multicall: '0xac1cE734566f390A94b00eb9cAFFeD1cBb1A1E6c',
    weth: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
  },
  // BNB Smart Chain
  56: {
    factory: '0x0BFbCF9fa4f9C56B0F40a671Ad40E0805A091865',
    smartRouter: '0x13f4EA83D0bd40E75C8222255bc855a974568Dd4',
    nonfungiblePositionManager: '0x46A15B0b27311cedF172AB29E4f4766fbE7F4364',
    quoterV2: '0xB048Bbc1Ee6b733FFfCFb9e9CeF7375518e25997',
    multicall: '0x49B5a44eF521C61717f7b43cF5B7f30Cb1Bed01E',
    weth: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
  },
  // Base
  8453: {
    factory: '0x0BFbCF9fa4f9C56B0F40a671Ad40E0805A091865',
    smartRouter: '0x678Aa4bF4E210cf2166753e054d5b7c31cc7fa86',
    nonfungiblePositionManager: '0x46A15B0b27311cedF172AB29E4f4766fbE7F4364',
    quoterV2: '0xB048Bbc1Ee6b733FFfCFb9e9CeF7375518e25997',
    multicall: '0xca11bde05977b3631167028862be2a173976ca11',
    weth: '0x4200000000000000000000000000000000000006',
  },
  // Arbitrum One
  42161: {
    factory: '0x0BFbCF9fa4f9C56B0F40a671Ad40E0805A091865',
    smartRouter: '0x32226588378236Fd0c7c4053999F88aC0e5cAc77',
    nonfungiblePositionManager: '0x46A15B0b27311cedF172AB29E4f4766fbE7F4364',
    quoterV2: '0xB048Bbc1Ee6b733FFfCFb9e9CeF7375518e25997',
    multicall: '0xcA11bde05977b3631167028862bE2a173976CA11',
    weth: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
  },
};

export const CHAIN_NAMES: Record<ChainId, string> = {
  1: 'Ethereum',
  56: 'BNB Chain',
  137: 'Polygon',
  8453: 'Base',
  42161: 'Arbitrum One',
  10: 'Optimism',
  97:'BNB Testnet'
};

export const CHAIN_NATIVE_SYMBOL: Record<ChainId, string> = {
  1: 'ETH',
  56: 'BNB',
  137: 'MATIC',
  8453: 'ETH',
  42161: 'ETH',
  10: 'ETH',
  97: 'tBNB'
};

export const SUPPORTED_CHAIN_IDS: ChainId[] = [1, 56, 137, 8453, 42161, 10, 97];

export const CHAIN_EXPLORERS: Record<ChainId, string> = {
  1: 'https://etherscan.io',
  56: 'https://bscscan.com',
  137: 'https://polygonscan.com',
  8453: 'https://basescan.org',
  42161: 'https://arbiscan.io',
  10: 'https://optimistic.etherscan.io',
  97:'https://testnet.bscscan.com'
};

export const MAX_UINT128 = BigInt('0xffffffffffffffffffffffffffffffff');
export const MAX_UINT256 = BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff');

// Batch airdrop contract addresses per chain
export const BATCH_AIRDROP_ADDRESSES: Partial<Record<number, Address>> = {
  56: '0xfc13372d4747Bbf846a8ADd351aF32E0Be956836', // BSC Mainnet
  97: '0x8ae14423f4878D3f0E5066BD99e0bE7FAF1cd356'
  // 1: '0x...', // Ethereum Mainnet — add address when deployed
};
