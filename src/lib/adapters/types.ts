import type {
  TokenInfo,
  PoolInfo,
  PositionInfo,
  SwapQuote,
  SwapParams,
  MintPositionParams,
  IncreaseLiquidityParams,
  DecreaseLiquidityParams,
  CollectFeesParams,
  FeeAmount,
} from '@/types';

export interface DEXAdapter {
  readonly protocol: 'uniswap' | 'pancakeswap';
  readonly chainId: number;

  getPool(tokenA: TokenInfo, tokenB: TokenInfo, fee: FeeAmount): Promise<PoolInfo | null>;
  createPool(tokenA: TokenInfo, tokenB: TokenInfo, fee: FeeAmount, sqrtPriceX96: bigint): Promise<`0x${string}`>;
  initializePool(poolAddress: `0x${string}`, sqrtPriceX96: bigint): Promise<`0x${string}`>;

  quoteExactInput(
    tokenIn: TokenInfo,
    tokenOut: TokenInfo,
    amountIn: bigint,
    fee: FeeAmount
  ): Promise<SwapQuote>;

  quoteExactOutput(
    tokenIn: TokenInfo,
    tokenOut: TokenInfo,
    amountOut: bigint,
    fee: FeeAmount
  ): Promise<SwapQuote>;

  swap(params: SwapParams): Promise<`0x${string}`>;

  mintPosition(params: MintPositionParams): Promise<`0x${string}`>;
  increaseLiquidity(params: IncreaseLiquidityParams): Promise<`0x${string}`>;
  decreaseLiquidity(params: DecreaseLiquidityParams): Promise<`0x${string}`>;
  collectFees(params: CollectFeesParams): Promise<`0x${string}`>;

  getPositions(owner: `0x${string}`): Promise<PositionInfo[]>;
  getPosition(tokenId: bigint): Promise<PositionInfo | null>;
}

export interface AdapterContext {
  publicClient: import('viem').PublicClient;
  walletClient?: import('viem').WalletClient;
}
