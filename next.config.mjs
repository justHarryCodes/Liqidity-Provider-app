/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { webpack, isServer }) => {
    if (!isServer) {
      // Polyfill Node.js built-ins referenced by wagmi / viem on the client
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs:      false,
        net:     false,
        tls:     false,
        crypto:  false,
        stream:  false,
        http:    false,
        https:   false,
        zlib:    false,
        os:      false,
        path:    false,
        process: false,
      };
    }

    // IgnorePlugin fires at the module-factory level, before alias resolution,
    // so it correctly suppresses warnings that resolve.alias cannot reach inside
    // pre-compiled barrel-optimised vendor bundles.
    //
    // Both modules are optional deps wrapped in try/catch in their callers:
    //   pino-pretty      → pino/lib/tools.js       (WalletConnect logger)
    //   async-storage    → @metamask/sdk            (React Native only)
    // Neither is executed in a browser context, so ignoring them is safe.
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /^pino-pretty$/,
        contextRegExp:  /node_modules/,
      }),
      new webpack.IgnorePlugin({
        resourceRegExp: /^@react-native-async-storage\/async-storage$/,
        contextRegExp:  /node_modules/,
      })
    );

    return config;
  },

  experimental: {
    // Tree-shake large packages — critical for lucide-react (1 000+ icons).
    optimizePackageImports: [
      'lucide-react',
      '@rainbow-me/rainbowkit',
      'wagmi',
      'viem',
      '@tanstack/react-query',
    ],
  },
};

export default nextConfig;
