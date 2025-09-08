'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React from 'react';

interface NavItem {
  href: string;
  label: string;
  emoji: string;
}

export default function BottomNav(): JSX.Element {
  const pathname = usePathname();

  const navItems: NavItem[] = [
    { href: '/dashboard', label: 'Dashboard', emoji: '🏠' },
    { href: '/browse', label: 'Browse', emoji: '🗂️' },
    { href: '/loose-ends', label: 'Loose Ends', emoji: '🧵' }, // Updated here
  ];

  return (
    <nav className="bottom-nav-fixed flex justify-around items-center py-3">
      {navItems.map((item) => {
        const isActive = pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center text-xs ${
              isActive ? 'text-blue-600 font-semibold' : 'text-gray-500'
            }`}
          >
            <span className="text-xl">{item.emoji}</span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}