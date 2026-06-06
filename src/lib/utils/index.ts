import type { Address } from 'viem';
import { isAddress } from 'viem';
import type { TokenInfo, FeeAmount } from '@/types';
import { CHAIN_EXPLORERS } from '@/lib/constants/addresses';
import type { ChainId } from '@/types';

export function formatAmount(amount: bigint, decimals: number, displayDecimals = 6): string {
  if (amount === 0n) return '0';
  const divisor = BigInt(10 ** decimals);
  const whole = amount / divisor;
  const remainder = amount % divisor;
  const remainderStr = remainder.toString().padStart(decimals, '0');
  const trimmed = remainderStr.slice(0, displayDecimals).replace(/0+$/, '');
  return trimmed ? `${whole}.${trimmed}` : whole.toString();
}

export function parseAmount(value: string, decimals: number): bigint {
  if (!value || value === '.') return 0n;
  const [whole, frac = ''] = value.split('.');
  const wholePart = BigInt(whole || '0') * BigInt(10 ** decimals);
  const fracPart = BigInt(frac.slice(0, decimals).padEnd(decimals, '0'));
  return wholePart + fracPart;
}

export function formatUSD(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatPercent(value: number, decimals = 2): string {
  return `${value.toFixed(decimals)}%`;
}

export function shortenAddress(address: string, chars = 4): string {
  if (!address) return '';
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

export function isValidAddress(address: string): address is Address {
  return isAddress(address);
}

export function sortTokens(tokenA: TokenInfo, tokenB: TokenInfo): [TokenInfo, TokenInfo] {
  return tokenA.address.toLowerCase() < tokenB.address.toLowerCase()
    ? [tokenA, tokenB]
    : [tokenB, tokenA];
}

export function getExplorerUrl(chainId: ChainId, type: 'tx' | 'address' | 'token', value: string): string {
  const base = CHAIN_EXPLORERS[chainId];
  switch (type) {
    case 'tx': return `${base}/tx/${value}`;
    case 'address': return `${base}/address/${value}`;
    case 'token': return `${base}/token/${value}`;
  }
}

export function getDeadline(minutesFromNow = 20): bigint {
  return BigInt(Math.floor(Date.now() / 1000) + minutesFromNow * 60);
}

export function calculatePriceImpact(
  amountIn: bigint,
  amountOut: bigint,
  spotPrice: number,
  tokenInDecimals: number,
  tokenOutDecimals: number
): number {
  const amountInFloat = Number(amountIn) / 10 ** tokenInDecimals;
  const amountOutFloat = Number(amountOut) / 10 ** tokenOutDecimals;
  const executionPrice = amountOutFloat / amountInFloat;
  return Math.abs((executionPrice - spotPrice) / spotPrice) * 100;
}

export function sqrtPriceX96ToPrice(
  sqrtPriceX96: bigint,
  token0Decimals: number,
  token1Decimals: number
): number {
  const Q96 = 2 ** 96;
  const sqrtPrice = Number(sqrtPriceX96) / Q96;
  const price = sqrtPrice ** 2;
  return price * 10 ** (token0Decimals - token1Decimals);
}

export function encodeSqrtRatioX96(amount1: bigint, amount0: bigint): bigint {
  const numerator = amount1 * (1n << 192n);
  const ratioX192 = numerator / amount0;
  return bigIntSqrt(ratioX192);
}

function bigIntSqrt(n: bigint): bigint {
  if (n < 0n) throw new Error('Square root of negative number');
  if (n === 0n) return 0n;
  let x = n;
  let y = (x + 1n) / 2n;
  while (y < x) {
    x = y;
    y = (x + n / x) / 2n;
  }
  return x;
}

export function tickToPrice(tick: number, token0Decimals: number, token1Decimals: number): number {
  const sqrtRatio = 1.0001 ** (tick / 2);
  const price = sqrtRatio ** 2;
  return price * 10 ** (token0Decimals - token1Decimals);
}

export function priceToTick(price: number, token0Decimals: number, token1Decimals: number): number {
  const adjustedPrice = price / 10 ** (token0Decimals - token1Decimals);
  return Math.floor(Math.log(adjustedPrice) / Math.log(1.0001));
}

export function nearestUsableTickFromPrice(
  price: number,
  token0Decimals: number,
  token1Decimals: number,
  tickSpacing: number
): number {
  const tick = priceToTick(price, token0Decimals, token1Decimals);
  return Math.round(tick / tickSpacing) * tickSpacing;
}

export function feeToPercent(fee: FeeAmount): string {
  return `${fee / 10000}%`;
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function formatTokenAmount(amount: bigint, decimals: number, symbol: string): string {
  return `${formatAmount(amount, decimals, 6)} ${symbol}`;
}

export function slippageToBps(slippage: number): bigint {
  return BigInt(Math.floor(slippage * 100));
}

export function applySlippage(amount: bigint, slippageBps: number, direction: 'min' | 'max'): bigint {
  const bps = BigInt(10000);
  const slipBps = BigInt(slippageBps);
  if (direction === 'min') {
    return (amount * (bps - slipBps)) / bps;
  }
  return (amount * (bps + slipBps)) / bps;
}
