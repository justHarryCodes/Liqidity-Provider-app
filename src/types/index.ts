import type { Address } from 'viem';

export type { Address };

export type ChainId = 1 | 56 | 137 | 8453 | 42161 | 10 | 97;

export interface TokenInfo {
  address: Address;
  symbol: string;
  name: string;
  decimals: number;
  chainId: ChainId;
  logoURI?: string;
}

export interface NativeToken {
  symbol: string;
  name: string;
  decimals: 18;
  isNative: true;
}

export type FeeAmount = 100 | 500 | 3000 | 10000;

export const FEE_AMOUNTS: FeeAmount[] = [100, 500, 3000, 10000];

export const FEE_LABELS: Record<FeeAmount, string> = {
  100: '0.01%',
  500: '0.05%',
  3000: '0.30%',
  10000: '1.00%',
};

export const TICK_SPACINGS: Record<FeeAmount, number> = {
  100: 1,
  500: 10,
  3000: 60,
  10000: 200,
};

export interface PoolInfo {
  address: Address;
  token0: Address;
  token1: Address;
  fee: FeeAmount;
  sqrtPriceX96: bigint;
  tick: number;
  liquidity: bigint;
  tickSpacing: number;
  exists: boolean;
}

export interface PositionInfo {
  tokenId: bigint;
  nonce: bigint;
  operator: Address;
  token0: Address;
  token1: Address;
  fee: FeeAmount;
  tickLower: number;
  tickUpper: number;
  liquidity: bigint;
  feeGrowthInside0LastX128: bigint;
  feeGrowthInside1LastX128: bigint;
  tokensOwed0: bigint;
  tokensOwed1: bigint;
  protocol: 'uniswap' | 'pancakeswap';
}

export interface SwapQuote {
  amountOut: bigint;
  amountIn: bigint;
  priceImpact: number;
  sqrtPriceX96After: bigint;
  gasEstimate: bigint;
  route: SwapRoute;
}

export interface SwapRoute {
  tokenIn: TokenInfo;
  tokenOut: TokenInfo;
  fee: FeeAmount;
  poolAddress: Address;
}

export interface SwapParams {
  tokenIn: TokenInfo;
  tokenOut: TokenInfo;
  amountIn: bigint;
  amountOutMinimum: bigint;
  fee: FeeAmount;
  recipient: Address;
  deadline: bigint;
  sqrtPriceLimitX96?: bigint;
}

export interface MintPositionParams {
  token0: TokenInfo;
  token1: TokenInfo;
  fee: FeeAmount;
  tickLower: number;
  tickUpper: number;
  amount0Desired: bigint;
  amount1Desired: bigint;
  amount0Min: bigint;
  amount1Min: bigint;
  recipient: Address;
  deadline: bigint;
}

export interface IncreaseLiquidityParams {
  tokenId: bigint;
  amount0Desired: bigint;
  amount1Desired: bigint;
  amount0Min: bigint;
  amount1Min: bigint;
  deadline: bigint;
}

export interface DecreaseLiquidityParams {
  tokenId: bigint;
  liquidity: bigint;
  amount0Min: bigint;
  amount1Min: bigint;
  deadline: bigint;
}

export interface CollectFeesParams {
  tokenId: bigint;
  recipient: Address;
  amount0Max: bigint;
  amount1Max: bigint;
}

export type Protocol = 'uniswap' | 'pancakeswap';

export type TxStatus = 'idle' | 'pending' | 'success' | 'error';

export interface TransactionState {
  hash?: `0x${string}`;
  status: TxStatus;
  error?: string;
}

export interface BulkTransferRecipient {
  address: string;
  amount: string;
  tokenId?: string;
  isValid: boolean;
  error?: string;
}

export type TokenStandard = 'ERC20' | 'ERC721' | 'ERC1155';

export interface ParsedABI {
  functions: ABIFunction[];
  events: ABIEvent[];
  raw: object[];
}

export interface ABIFunction {
  name: string;
  inputs: ABIInput[];
  outputs: ABIOutput[];
  stateMutability: string;
  type: 'function';
}

export interface ABIEvent {
  name: string;
  inputs: ABIInput[];
  anonymous: boolean;
  type: 'event';
}

export interface ABIInput {
  name: string;
  type: string;
  components?: ABIInput[];
  indexed?: boolean;
}

export interface ABIOutput {
  name: string;
  type: string;
  components?: ABIOutput[];
}
