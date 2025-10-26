'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Sparkles,
  Bell,
  Package,
  TrendingUp,
  BarChart3,
  Search,
  FileText,
  Scale,
  Settings,
  Zap,
  ChevronRight,
  User,
  Power,
  LogOut,
  Users2,
  FileCheck
} from 'lucide-react';
import { getCurrentUser, signOut } from '@/lib/supabase/auth-helpers';

const navigation = [
  {
    group: 'Core',
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, shortcut: 'D' },
      { name: 'AI Assistant', href: '/ai-assistant', icon: Sparkles, shortcut: 'A', badge: 'AI' },
    ]
  },
  {
    group: 'Intelligence',
    items: [
      { name: 'Alerts', href: '/dashboard/alerts', icon: Bell, shortcut: 'L', badge: '12', badgeColor: 'red' },
      { name: 'Analytics', href: '/dashboard/analytics', icon: TrendingUp, shortcut: 'N' },
      { name: 'Interconnected', href: '/dashboard/intelligence', icon: Search, shortcut: 'I', badge: 'NEW' },
      { name: 'Trade Intelligence', href: '/dashboard/trade-intelligence', icon: Search, shortcut: 'T' },
      { name: 'Scenarios', href: '/dashboard/scenarios', icon: TrendingUp, shortcut: 'S' },
      { name: 'Correlation', href: '/dashboard/correlation', icon: BarChart3, shortcut: 'R', badge: 'NEW' },
    ]
  },
  {
    group: 'Data',
    items: [
      { name: 'Products', href: '/dashboard/products', icon: Package, shortcut: 'P' },
      { name: 'Benchmarks', href: '/dashboard/benchmarks', icon: BarChart3, shortcut: 'B' },
      { name: 'Gazette Tracker', href: '/dashboard/gazette-tracker', icon: FileText, shortcut: 'G' },
    ]
  },
  {
    group: 'Tools',
    items: [
      { name: 'Trade Remedy', href: '/dashboard/trade-remedy', icon: Scale, shortcut: 'R' },
      { name: 'Reports', href: '/dashboard/reports', icon: FileText, shortcut: 'E' },
      { name: 'Rules', href: '/dashboard/rules', icon: Settings, shortcut: 'U' },
      { name: 'Detection', href: '/detect', icon: Zap, shortcut: 'E' },
      { name: 'Associations', href: '/associations', icon: Users2, shortcut: 'F' },
      { name: 'FMM Dashboard', href: '/associations/fmm', icon: Users2, shortcut: 'M' },
      { name: 'Customs Checker', href: '/dashboard/customs-checker', icon: FileCheck, shortcut: 'C', badge: 'NEW' },
    ]
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>('Analyst');
  const [userName, setUserName] = useState<string>('User');

  useEffect(() => {
    // Fetch user info
    const loadUser = async () => {
      const user = await getCurrentUser();
      if (user) {
        setUserEmail(user.email || 'analyst@tradenest.io');
        setUserName(user.full_name || 'Analyst');
      }
    };
    loadUser();
  }, []);

  const handleLogout = async () => {
    await signOut();
    router.push('/login');
  };

  const toggleGroup = (groupName: string) => {
    const newCollapsed = new Set(collapsedGroups);
    if (newCollapsed.has(groupName)) {
      newCollapsed.delete(groupName);
    } else {
      newCollapsed.add(groupName);
    }
    setCollapsedGroups(newCollapsed);
  };

  const filteredNavigation = searchQuery
    ? navigation.map(group => ({
      ...group,
      items: group.items.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    })).filter(group => group.items.length > 0)
    : navigation;

  return (
    <div className="w-72 bg-[#0F1419] h-screen fixed left-0 top-0 border-r border-gray-800/50 flex flex-col overflow-hidden">
      {/* Enhanced Header */}
      <div className="px-5 py-6 border-b border-gray-800/50">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
            <span className="text-white font-bold text-lg">TN</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Trade Nest</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] text-emerald-400 font-medium uppercase tracking-wider">
                Premium
              </span>
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
            </div>
          </div>
        </div>
        <p className="text-xs text-gray-400 ml-13 -mt-3">Anomaly Detection Platform</p>
      </div>

      {/* Search Bar */}
      <div className="px-4 py-3 border-b border-gray-800/50">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search navigation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-3 py-2 bg-gray-900/50 border border-gray-800 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Enhanced Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
        {filteredNavigation.map((group) => (
          <div key={group.group} className="mb-6">
            <button
              onClick={() => toggleGroup(group.group)}
              className="flex items-center justify-between w-full px-2 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-400 transition-colors group"
            >
              <span>{group.group}</span>
              <ChevronRight
                className={`w-3.5 h-3.5 text-gray-600 transition-transform ${collapsedGroups.has(group.group) ? '' : 'rotate-90'
                  }`}
              />
            </button>

            {!collapsedGroups.has(group.group) && (
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
                  const isHovered = hoveredItem === item.name;

                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onMouseEnter={() => setHoveredItem(item.name)}
                      onMouseLeave={() => setHoveredItem(null)}
                      className="group relative flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200"
                      style={{
                        backgroundColor: isActive ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                      }}
                    >
                      {/* Left Border Accent for Active State */}
                      <div
                        className={`absolute left-0 top-0 bottom-0 w-1 rounded-r ${isActive ? 'bg-gradient-to-b from-blue-500 to-cyan-500' : 'bg-transparent'
                          }`}
                      />

                      {/* Icon */}
                      <Icon
                        className={`w-5 h-5 transition-colors ${isActive ? 'text-blue-400' : 'text-gray-500 group-hover:text-gray-300'
                          }`}
                      />

                      {/* Label */}
                      <span
                        className={`font-medium text-sm transition-colors flex-1 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'
                          }`}
                      >
                        {item.name}
                      </span>

                      {/* Badge */}
                      {item.badge && (
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${item.badgeColor === 'red'
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : item.badge === 'AI'
                            ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 border border-purple-500/30'
                            : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          }`}>
                          {item.badge}
                        </span>
                      )}

                      {/* Keyboard Shortcut Tooltip */}
                      {isHovered && (
                        <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 border border-gray-700 rounded text-xs text-gray-300 whitespace-nowrap z-50">
                          <span className="font-mono bg-gray-800 px-1.5 py-0.5 rounded">Ctrl + {item.shortcut}</span>
                        </div>
                      )}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* Enhanced Footer with User Info */}
      <div className="border-t border-gray-800/50 bg-gray-900/30 flex-shrink-0">
        {/* Quick Stats */}
        <div className="px-4 py-3 border-b border-gray-800/50">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">System Status</span>
            <div className="flex items-center gap-1.5">
              <Power className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-400 font-medium">Active</span>
            </div>
          </div>
        </div>

        {/* User Profile */}
        <div className="px-4 py-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center border-2 border-gray-700">
              <User className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{userName}</p>
              <p className="text-xs text-gray-400 truncate">{userEmail}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}