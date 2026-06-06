import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#0D0E12',
          secondary: '#1A1B23',
          tertiary: '#22232E',
        },
        border: {
          DEFAULT: '#2A2B35',
          light: '#3A3B47',
        },
        accent: {
          purple: '#7B61FF',
          blue: '#00C2FF',
          green: '#00D395',
          red: '#FF4B4B',
          yellow: '#FFB800',
        },
        text: {
          primary: '#FFFFFF',
          secondary: '#8A8B9B',
          muted: '#5A5B6B',
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'gradient-purple': 'linear-gradient(135deg, #7B61FF, #00C2FF)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 3s linear infinite',
      },
    },
  },
  plugins: [],
};

export default config;
