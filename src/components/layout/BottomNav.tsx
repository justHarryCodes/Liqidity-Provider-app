'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ArrowLeftRight, Layers, PieChart, Send } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/',              label: 'Home',      Icon: LayoutDashboard },
  { href: '/swap',          label: 'Swap',      Icon: ArrowLeftRight },
  { href: '/pool',          label: 'Pools',     Icon: Layers },
  { href: '/portfolio',     label: 'Portfolio', Icon: PieChart },
  { href: '/bulk-transfer', label: 'Airdrop',   Icon: Send },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-40 flex items-stretch"
      style={{
        background: '#FFFFFF',
        borderTop: '1px solid #E2E8F0',
        boxShadow: '0 -2px 12px rgba(15,23,42,0.06)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {NAV_ITEMS.map(({ href, label, Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className="relative flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 transition-colors"
            style={{ color: active ? '#2563EB' : '#94A3B8' }}
          >
            {/* Active top-line indicator */}
            {active && (
              <span
                className="absolute top-0 left-1/2 -translate-x-1/2 rounded-b-full"
                style={{ width: 28, height: 3, background: '#2563EB' }}
              />
            )}
            <Icon
              size={21}
              strokeWidth={active ? 2.2 : 1.7}
              style={{ color: active ? '#2563EB' : '#94A3B8' }}
            />
            <span
              className="text-[10px] font-medium leading-none"
              style={{ color: active ? '#2563EB' : '#94A3B8' }}
            >
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
