import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface KPICardProps {
  title: string;
  value: string | number;
  icon: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  subtitle?: string;
  color?: 'blue' | 'red' | 'green' | 'yellow' | 'purple';
}

export function KPICard({ title, value, icon, trend, subtitle, color = 'blue' }: KPICardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    red: 'bg-red-50 text-red-600 border-red-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
            {subtitle && (
              <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
            )}
            {trend && (
              <div className="flex items-center gap-1 mt-2">
                <span className={trend.isPositive ? 'text-green-600' : 'text-red-600'}>
                  {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
                </span>
                <span className="text-xs text-gray-500">vs last period</span>
              </div>
            )}
          </div>
          <div className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl ${colorClasses[color]}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}