'use client';

import { Badge } from '@/components/ui/badge';

interface DataSourceBadgeProps {
  source: string;
  size?: 'sm' | 'md' | 'lg';
}

const sourceColors: Record<string, { bg: string; text: string }> = {
  BNM: { bg: 'bg-blue-100', text: 'text-blue-800' },
  MATRADE: { bg: 'bg-green-100', text: 'text-green-800' },
  MOCK: { bg: 'bg-gray-100', text: 'text-gray-800' },
  PANJIVA: { bg: 'bg-purple-100', text: 'text-purple-800' },
  UNKNOWN: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
};

export function DataSourceBadge({ source, size = 'sm' }: DataSourceBadgeProps) {
  const colorClass = sourceColors[source] || sourceColors.UNKNOWN;
  const sizeDuration = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  const sizeClass = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  return (
    <Badge className={`${colorClass.bg} ${colorClass.text} ${sizeClass[size]} font-medium`}>
      {source}
    </Badge>
  );
}

