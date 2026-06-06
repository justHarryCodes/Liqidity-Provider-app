import type { PublicClient, WalletClient, Address } from 'viem';
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
import type { DEXAdapter } from './types';
import {
  uniswapV3FactoryABI,
  uniswapV3PoolABI,
  nonfungiblePositionManagerABI,
  swapRouterABI,
  quoterV2ABI,
  erc20ABI,
} from '@/lib/abis';
import { PANCAKESWAP_V3_ADDRESSES, ZERO_ADDRESS } from '@/lib/constants/addresses';
import { sqrtPriceX96ToPrice } from '@/lib/utils';

// PancakeSwap V3 is a fork of Uniswap V3 with compatible interfaces.
// The primary SmartRouter ABI is compatible with the standard SwapRouter interface.
export class PancakeSwapV3Adapter implements DEXAdapter {
  readonly protocol = 'pancakeswap' as const;
  readonly chainId: number;

  private publicClient: PublicClient;
  private walletClient?: WalletClient;

  constructor(chainId: number, publicClient: PublicClient, walletClient?: WalletClient) {
    this.chainId = chainId;
    this.publicClient = publicClient;
    this.walletClient = walletClient;
  }

  private get addresses() {
    const addrs = PANCAKESWAP_V3_ADDRESSES[this.chainId];
    if (!addrs) throw new Error(`PancakeSwap V3 not supported on chain ${this.chainId}`);
    return addrs;
  }

  private async ensureApproval(
    token: TokenInfo,
    spender: Address,
    amount: bigint,
    owner: Address
  ): Promise<void> {
    const allowance = await this.publicClient.readContract({
      address: token.address,
      abi: erc20ABI,
      functionName: 'allowance',
      args: [owner, spender],
    });
    if (allowance >= amount) return;
    if (!this.walletClient) throw new Error('Wallet client required for approval');
    const { request } = await this.publicClient.simulateContract({
      address: token.address,
      abi: erc20ABI,
      functionName: 'approve',
      args: [spender, amount],
      account: owner,
    });
    await this.walletClient.writeContract(request);
  }

  async getPool(tokenA: TokenInfo, tokenB: TokenInfo, fee: FeeAmount): Promise<PoolInfo | null> {
    const poolAddress = await this.publicClient.readContract({
      address: this.addresses.factory,
      abi: uniswapV3FactoryABI,
      functionName: 'getPool',
      args: [tokenA.address, tokenB.address, fee],
    });

    if (!poolAddress || poolAddress === ZERO_ADDRESS) {
      return {
        address: ZERO_ADDRESS,
        token0: tokenA.address,
        token1: tokenB.address,
        fee,
        sqrtPriceX96: 0n,
        tick: 0,
        liquidity: 0n,
        tickSpacing: fee === 100 ? 1 : fee === 500 ? 10 : fee === 3000 ? 60 : 200,
        exists: false,
      };
    }

    const [slot0, liquidity, token0, token1, tickSpacing] = await Promise.all([
      this.publicClient.readContract({ address: poolAddress, abi: uniswapV3PoolABI, functionName: 'slot0' }),
      this.publicClient.readContract({ address: poolAddress, abi: uniswapV3PoolABI, functionName: 'liquidity' }),
      this.publicClient.readContract({ address: poolAddress, abi: uniswapV3PoolABI, functionName: 'token0' }),
      this.publicClient.readContract({ address: poolAddress, abi: uniswapV3PoolABI, functionName: 'token1' }),
      this.publicClient.readContract({ address: poolAddress, abi: uniswapV3PoolABI, functionName: 'tickSpacing' }),
    ]);

    return {
      address: poolAddress,
      token0,
      token1,
      fee,
      sqrtPriceX96: slot0[0],
      tick: slot0[1],
      liquidity,
      tickSpacing,
      exists: true,
    };
  }

  async createPool(
    tokenA: TokenInfo,
    tokenB: TokenInfo,
    fee: FeeAmount,
    sqrtPriceX96: bigint
  ): Promise<`0x${string}`> {
    if (!this.walletClient) throw new Error('Wallet client required');
    const [account] = await this.walletClient.getAddresses();

    const { request } = await this.publicClient.simulateContract({
      address: this.addresses.factory,
      abi: uniswapV3FactoryABI,
      functionName: 'createPool',
      args: [tokenA.address, tokenB.address, fee],
      account,
    });
    return this.walletClient.writeContract(request);
  }

  async initializePool(poolAddress: `0x${string}`, sqrtPriceX96: bigint): Promise<`0x${string}`> {
    if (!this.walletClient) throw new Error('Wallet client required');
    const [account] = await this.walletClient.getAddresses();
    const { request } = await this.publicClient.simulateContract({
      address: poolAddress,
      abi: uniswapV3PoolABI,
      functionName: 'initialize',
      args: [sqrtPriceX96],
      account,
    });
    return this.walletClient.writeContract(request);
  }

  async quoteExactInput(
    tokenIn: TokenInfo,
    tokenOut: TokenInfo,
    amountIn: bigint,
    fee: FeeAmount
  ): Promise<SwapQuote> {
    const pool = await this.getPool(tokenIn, tokenOut, fee);
    if (!pool?.exists) throw new Error('Pool does not exist');

    const result = await this.publicClient.simulateContract({
      address: this.addresses.quoterV2,
      abi: quoterV2ABI,
      functionName: 'quoteExactInputSingle',
      args: [{ tokenIn: tokenIn.address, tokenOut: tokenOut.address, amountIn, fee, sqrtPriceLimitX96: 0n }],
    });

    const [amountOut, sqrtPriceX96After, , gasEstimate] = result.result;
    const spotPrice = sqrtPriceX96ToPrice(pool.sqrtPriceX96, tokenIn.decimals, tokenOut.decimals);
    const executionPrice =
      (Number(amountOut) / 10 ** tokenOut.decimals) / (Number(amountIn) / 10 ** tokenIn.decimals);
    const priceImpact = Math.abs((executionPrice - spotPrice) / spotPrice) * 100;

    return {
      amountOut,
      amountIn,
      priceImpact,
      sqrtPriceX96After,
      gasEstimate,
      route: { tokenIn, tokenOut, fee, poolAddress: pool.address },
    };
  }

  async quoteExactOutput(
    tokenIn: TokenInfo,
    tokenOut: TokenInfo,
    amountOut: bigint,
    fee: FeeAmount
  ): Promise<SwapQuote> {
    const pool = await this.getPool(tokenIn, tokenOut, fee);
    if (!pool?.exists) throw new Error('Pool does not exist');

    const result = await this.publicClient.simulateContract({
      address: this.addresses.quoterV2,
      abi: quoterV2ABI,
      functionName: 'quoteExactOutputSingle',
      args: [{ tokenIn: tokenIn.address, tokenOut: tokenOut.address, amount: amountOut, fee, sqrtPriceLimitX96: 0n }],
    });

    const [amountIn, sqrtPriceX96After, , gasEstimate] = result.result;
    const spotPrice = sqrtPriceX96ToPrice(pool.sqrtPriceX96, tokenIn.decimals, tokenOut.decimals);
    const executionPrice =
      (Number(amountOut) / 10 ** tokenOut.decimals) / (Number(amountIn) / 10 ** tokenIn.decimals);
    const priceImpact = Math.abs((executionPrice - spotPrice) / spotPrice) * 100;

    return {
      amountOut,
      amountIn,
      priceImpact,
      sqrtPriceX96After,
      gasEstimate,
      route: { tokenIn, tokenOut, fee, poolAddress: pool.address },
    };
  }

  async swap(params: SwapParams): Promise<`0x${string}`> {
    if (!this.walletClient) throw new Error('Wallet client required');
    const [account] = await this.walletClient.getAddresses();
    const router = this.addresses.smartRouter;

    await this.ensureApproval(params.tokenIn, router, params.amountIn, account);

    const { request } = await this.publicClient.simulateContract({
      address: router,
      abi: swapRouterABI,
      functionName: 'exactInputSingle',
      args: [{
        tokenIn: params.tokenIn.address,
        tokenOut: params.tokenOut.address,
        fee: params.fee,
        recipient: params.recipient,
        deadline: params.deadline,
        amountIn: params.amountIn,
        amountOutMinimum: params.amountOutMinimum,
        sqrtPriceLimitX96: params.sqrtPriceLimitX96 ?? 0n,
      }],
      account,
    });

    return this.walletClient.writeContract(request);
  }

  async mintPosition(params: MintPositionParams): Promise<`0x${string}`> {
    if (!this.walletClient) throw new Error('Wallet client required');
    const [account] = await this.walletClient.getAddresses();
    const npm = this.addresses.nonfungiblePositionManager;

    await Promise.all([
      this.ensureApproval(params.token0, npm, params.amount0Desired, account),
      this.ensureApproval(params.token1, npm, params.amount1Desired, account),
    ]);

    const { request } = await this.publicClient.simulateContract({
      address: npm,
      abi: nonfungiblePositionManagerABI,
      functionName: 'mint',
      args: [{
        token0: params.token0.address,
        token1: params.token1.address,
        fee: params.fee,
        tickLower: params.tickLower,
        tickUpper: params.tickUpper,
        amount0Desired: params.amount0Desired,
        amount1Desired: params.amount1Desired,
        amount0Min: params.amount0Min,
        amount1Min: params.amount1Min,
        recipient: params.recipient,
        deadline: params.deadline,
      }],
      account,
    });

    return this.walletClient.writeContract(request);
  }

  async increaseLiquidity(params: IncreaseLiquidityParams): Promise<`0x${string}`> {
    if (!this.walletClient) throw new Error('Wallet client required');
    const [account] = await this.walletClient.getAddresses();
    const npm = this.addresses.nonfungiblePositionManager;

    const position = await this.getPosition(params.tokenId);
    if (!position) throw new Error('Position not found');

    const t0: TokenInfo = { address: position.token0, decimals: 18, symbol: '', name: '', chainId: this.chainId as import('@/types').ChainId };
    const t1: TokenInfo = { address: position.token1, decimals: 18, symbol: '', name: '', chainId: this.chainId as import('@/types').ChainId };
    await Promise.all([
      this.ensureApproval(t0, npm, params.amount0Desired, account),
      this.ensureApproval(t1, npm, params.amount1Desired, account),
    ]);

    const { request } = await this.publicClient.simulateContract({
      address: npm,
      abi: nonfungiblePositionManagerABI,
      functionName: 'increaseLiquidity',
      args: [{
        tokenId: params.tokenId,
        amount0Desired: params.amount0Desired,
        amount1Desired: params.amount1Desired,
        amount0Min: params.amount0Min,
        amount1Min: params.amount1Min,
        deadline: params.deadline,
      }],
      account,
    });

    return this.walletClient.writeContract(request);
  }

  async decreaseLiquidity(params: DecreaseLiquidityParams): Promise<`0x${string}`> {
    if (!this.walletClient) throw new Error('Wallet client required');
    const [account] = await this.walletClient.getAddresses();

    const { request } = await this.publicClient.simulateContract({
      address: this.addresses.nonfungiblePositionManager,
      abi: nonfungiblePositionManagerABI,
      functionName: 'decreaseLiquidity',
      args: [{
        tokenId: params.tokenId,
        liquidity: params.liquidity,
        amount0Min: params.amount0Min,
        amount1Min: params.amount1Min,
        deadline: params.deadline,
      }],
      account,
    });

    return this.walletClient.writeContract(request);
  }

  async collectFees(params: CollectFeesParams): Promise<`0x${string}`> {
    if (!this.walletClient) throw new Error('Wallet client required');
    const [account] = await this.walletClient.getAddresses();

    const { request } = await this.publicClient.simulateContract({
      address: this.addresses.nonfungiblePositionManager,
      abi: nonfungiblePositionManagerABI,
      functionName: 'collect',
      args: [{
        tokenId: params.tokenId,
        recipient: params.recipient,
        amount0Max: params.amount0Max,
        amount1Max: params.amount1Max,
      }],
      account,
    });

    return this.walletClient.writeContract(request);
  }

  async getPositions(owner: Address): Promise<PositionInfo[]> {
    const balance = await this.publicClient.readContract({
      address: this.addresses.nonfungiblePositionManager,
      abi: nonfungiblePositionManagerABI,
      functionName: 'balanceOf',
      args: [owner],
    });
    if (balance === 0n) return [];

    const tokenIds = await Promise.all(
      Array.from({ length: Number(balance) }, (_, i) =>
        this.publicClient.readContract({
          address: this.addresses.nonfungiblePositionManager,
          abi: nonfungiblePositionManagerABI,
          functionName: 'tokenOfOwnerByIndex',
          args: [owner, BigInt(i)],
        })
      )
    );

    const positions = await Promise.all(tokenIds.map((id) => this.getPosition(id)));
    return positions.filter((p): p is PositionInfo => p !== null);
  }

  async getPosition(tokenId: bigint): Promise<PositionInfo | null> {
    try {
      const pos = await this.publicClient.readContract({
        address: this.addresses.nonfungiblePositionManager,
        abi: nonfungiblePositionManagerABI,
        functionName: 'positions',
        args: [tokenId],
      });
      return {
        tokenId,
        nonce: pos[0],
        operator: pos[1],
        token0: pos[2],
        token1: pos[3],
        fee: pos[4] as FeeAmount,
        tickLower: pos[5],
        tickUpper: pos[6],
        liquidity: pos[7],
        feeGrowthInside0LastX128: pos[8],
        feeGrowthInside1LastX128: pos[9],
        tokensOwed0: pos[10],
        tokensOwed1: pos[11],
        protocol: 'pancakeswap',
      };
    } catch {
      return null;
    }
  }
}
