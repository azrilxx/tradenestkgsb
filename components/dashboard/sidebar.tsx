'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: '📊' },
  { name: 'AI Assistant', href: '/ai-assistant', icon: '✨' },
  { name: 'Alerts', href: '/dashboard/alerts', icon: '🔔' },
  { name: 'Products', href: '/dashboard/products', icon: '📦' },
  { name: 'Analytics', href: '/dashboard/analytics', icon: '📈' },
  { name: 'Benchmarks', href: '/dashboard/benchmarks', icon: '📊' },
  { name: 'Trade Intelligence', href: '/dashboard/trade-intelligence', icon: '🔍' },
  { name: 'Rules', href: '/dashboard/rules', icon: '🔧' },
  { name: 'Detection', href: '/detect', icon: '⚡' },
  { name: 'Settings', href: '/dashboard/settings', icon: '⚙️' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 bg-gray-900 min-h-screen fixed left-0 top-0">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-gray-800">
        <h1 className="text-2xl font-bold text-white">Trade Nest</h1>
        <p className="text-xs text-gray-400 mt-1">Anomaly Detection</p>
      </div>

      {/* Navigation */}
      <nav className="mt-6 px-3">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-colors ${isActive
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-gray-800">
        <div className="text-xs text-gray-500">
          <p>Phase 2 Complete</p>
          <p className="mt-1">Detection Engine Active</p>
        </div>
      </div>
    </div>
  );
}