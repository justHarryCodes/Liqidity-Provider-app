# LiquidityDEX

A multichain DEX interface for **Uniswap V3** and **PancakeSwap V3**. Swap tokens, create pools, manage concentrated-liquidity positions and send tokens in bulk, all from one app.

## Features

- **Swap:** token swaps through the V3 routers, with a token selector
- **Pools:** discover existing pools, create new ones, and add, increase or remove concentrated liquidity
- **Portfolio:** view every open liquidity position and its details
- **Bulk transfer and airdrops:** upload a CSV of recipients, or load any contract ABI, then run transfers in batches with progress tracking
- **Multichain:** Ethereum, Arbitrum, Base, Optimism, Polygon and BNB Chain (plus BSC testnet)
- A mobile-friendly layout with a bottom navigation bar

## Tech stack

- Next.js (App Router), React and TypeScript
- wagmi, viem and RainbowKit for wallets and contract calls
- A protocol adapter layer (`UniswapV3Adapter`, `PancakeSwapV3Adapter`) behind a shared interface
- Tailwind CSS and Papa Parse (CSV)

## Getting started

```bash
git clone https://github.com/justHarryCodes/Liqidity-Provider-app.git
cd Liqidity-Provider-app
npm install
# create .env.local (see below)
npm run dev          # http://localhost:3000
```

## Environment variables

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | WalletConnect for RainbowKit |
| `NEXT_PUBLIC_ALCHEMY_ETHEREUM_KEY`, `…_ARBITRUM_KEY`, `…_BASE_KEY`, `…_OPTIMISM_KEY`, `…_POLYGON_KEY` | RPC access for each chain |
| `NEXT_PUBLIC_BSC_TESTNET_RPC` | BSC testnet RPC |

## Project structure

```
src/
├── app/                 # /, /swap, /pool, /portfolio, /bulk-transfer
├── components/          # swap, pool, portfolio, bulk-transfer, layout, common
├── lib/
│   ├── adapters/        # Uniswap V3 and PancakeSwap V3 adapters
│   ├── constants/       # Contract addresses and token lists for each chain
│   └── abis/
├── providers/           # wagmi / RainbowKit provider
└── types/
```

## Adding a protocol

Implement the interface in `src/lib/adapters/types.ts`, then add the protocol's contract addresses to `src/lib/constants/addresses.ts`.
