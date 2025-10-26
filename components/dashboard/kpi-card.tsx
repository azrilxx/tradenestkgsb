import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Bell, AlertTriangle, Star, CheckCircle, TrendingUp, TrendingDown } from 'lucide-react';
import { MiniChart } from './mini-chart';

interface KPICardProps {
  title: string;
  value: string | number;
  icon: 'bell' | 'alert' | 'star' | 'check';
  trend?: {
    value: number;
    isPositive: boolean;
  };
  subtitle?: string;
  color?: 'blue' | 'red' | 'green' | 'yellow' | 'purple';
  chartData?: Array<{ value: number; date: string }>;
}

export function KPICard({ title, value, icon, trend, subtitle, color = 'blue', chartData }: KPICardProps) {
  const iconMap = {
    bell: Bell,
    alert: AlertTriangle,
    star: Star,
    check: CheckCircle,
  };

  const IconComponent = iconMap[icon];

  const colorClasses = {
    blue: {
      bg: 'bg-blue-50',
      text: 'text-blue-600',
      border: 'border-blue-200',
      iconBg: 'bg-blue-100',
    },
    red: {
      bg: 'bg-red-50',
      text: 'text-red-600',
      border: 'border-red-200',
      iconBg: 'bg-red-100',
    },
    green: {
      bg: 'bg-green-50',
      text: 'text-green-600',
      border: 'border-green-200',
      iconBg: 'bg-green-100',
    },
    yellow: {
      bg: 'bg-yellow-50',
      text: 'text-yellow-600',
      border: 'border-yellow-200',
      iconBg: 'bg-yellow-100',
    },
    purple: {
      bg: 'bg-purple-50',
      text: 'text-purple-600',
      border: 'border-purple-200',
      iconBg: 'bg-purple-100',
    },
  };

  const colors = colorClasses[color];

  const getChartColor = () => {
    switch (color) {
      case 'red': return '#EF4444';
      case 'green': return '#10B981';
      case 'yellow': return '#EAB308';
      case 'purple': return '#8B5CF6';
      default: return '#3B82F6';
    }
  };

  return (
    <Card className="hover:shadow-lg transition-all duration-200 border-0 shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 mb-2">{title}</p>
            <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
            {subtitle && (
              <p className="text-xs text-gray-500 mb-2">{subtitle}</p>
            )}
            {trend && (
              <div className="flex items-center gap-1">
                {trend.isPositive ? (
                  <TrendingUp className="w-4 h-4 text-green-600" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-600" />
                )}
                <span className={`text-sm font-medium ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                  {Math.abs(trend.value)}%
                </span>
                <span className="text-xs text-gray-500">vs last period</span>
              </div>
            )}
          </div>
          <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${colors.iconBg} ${colors.text}`}>
            <IconComponent className="w-7 h-7" />
          </div>
        </div>

        {/* Mini Chart */}
        {chartData && chartData.length > 0 && (
          <div className="mt-4">
            <MiniChart data={chartData} color={getChartColor()} height={32} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}