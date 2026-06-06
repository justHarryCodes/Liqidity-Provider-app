'use client';

import {
  RainbowKitProvider,
  lightTheme,
  getDefaultConfig,
} from '@rainbow-me/rainbowkit';

import { WagmiProvider } from 'wagmi';
import {
  mainnet,
  bsc,
  bscTestnet,
  polygon,
  base,
  arbitrum,
  optimism,
} from 'wagmi/chains';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http } from 'wagmi';
import '@rainbow-me/rainbowkit/styles.css';

const projectId =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ||
  '8437015803358329e372053af3344273';

const config = getDefaultConfig({
  appName: 'LiquidityDEX',
  projectId,

  chains: [
    mainnet,
    bsc,
    bscTestnet,
    polygon,
    base,
    arbitrum,
    optimism,
  ],

  transports: {
    [mainnet.id]: http(
      process.env.NEXT_PUBLIC_ALCHEMY_ETHEREUM_KEY
        ? `https://eth-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_ETHEREUM_KEY}`
        : undefined
    ),

    [bsc.id]: http('https://bsc-dataseed1.binance.org'),

    [bscTestnet.id]: http(
      process.env.NEXT_PUBLIC_BSC_TESTNET_RPC ||
        'https://bsc-testnet.publicnode.com'
    ),

    [polygon.id]: http(
      process.env.NEXT_PUBLIC_ALCHEMY_POLYGON_KEY
        ? `https://polygon-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_POLYGON_KEY}`
        : 'https://polygon-rpc.com'
    ),

    [base.id]: http(
      process.env.NEXT_PUBLIC_ALCHEMY_BASE_KEY
        ? `https://base-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_BASE_KEY}`
        : undefined
    ),

    [arbitrum.id]: http(
      process.env.NEXT_PUBLIC_ALCHEMY_ARBITRUM_KEY
        ? `https://arb-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_ARBITRUM_KEY}`
        : undefined
    ),

    [optimism.id]: http(
      process.env.NEXT_PUBLIC_ALCHEMY_OPTIMISM_KEY
        ? `https://opt-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_OPTIMISM_KEY}`
        : undefined
    ),
  },

  ssr: true,
});

const queryClient = new QueryClient();

export function WalletProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={lightTheme({
            accentColor: '#2563EB',
            accentColorForeground: 'white',
            borderRadius: 'medium',
          })}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}