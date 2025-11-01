import React from 'react';
import { DollarSign, BarChart3, Ship, TrendingUp, Activity } from 'lucide-react';

interface TypeChartProps {
  data: Array<{
    type: string;
    count: number;
    icon?: string;
  }>;
  onClickType?: (type: string) => void;
}

const typeIcons = {
  price_spike: DollarSign,
  tariff_change: BarChart3,
  freight_surge: Ship,
  fx_volatility: TrendingUp,
};

const typeLabels = {
  price_spike: 'Price Spike',
  tariff_change: 'Tariff Change',
  freight_surge: 'Freight Surge',
  fx_volatility: 'FX Volatility',
};

export function TypeChartV2({ data, onClickType }: TypeChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400">
        <div className="text-center">
          <Activity className="w-12 h-12 mx-auto mb-2 text-gray-300" />
          <p className="text-sm">No type data available</p>
        </div>
      </div>
    );
  }

  const maxCount = Math.max(...data.map(d => d.count));
  const totalCount = data.reduce((sum, d) => sum + d.count, 0);

  // Sort by count descending
  const sortedData = [...data].sort((a, b) => b.count - a.count);

  return (
    <div className="space-y-4">
      {sortedData.map((item, index) => {
        const IconComponent = typeIcons[item.type as keyof typeof typeIcons] || Activity;
        const label = typeLabels[item.type as keyof typeof typeLabels] || item.type;
        const percentage = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
        const percentageOfTotal = totalCount > 0 ? ((item.count / totalCount) * 100).toFixed(1) : 0;

        // Color based on type
        const getColor = () => {
          switch (item.type) {
            case 'price_spike':
              return { bg: 'bg-red-500', bgLight: 'bg-red-50', text: 'text-red-700' };
            case 'tariff_change':
              return { bg: 'bg-blue-500', bgLight: 'bg-blue-50', text: 'text-blue-700' };
            case 'freight_surge':
              return { bg: 'bg-purple-500', bgLight: 'bg-purple-50', text: 'text-purple-700' };
            case 'fx_volatility':
              return { bg: 'bg-orange-500', bgLight: 'bg-orange-50', text: 'text-orange-700' };
            default:
              return { bg: 'bg-gray-500', bgLight: 'bg-gray-50', text: 'text-gray-700' };
          }
        };

        const color = getColor();

        return (
          <div
            key={index}
            onClick={() => onClickType?.(item.type)}
            className={`group relative ${
              onClickType ? 'cursor-pointer hover:bg-gray-50 rounded-lg p-2 -m-2 transition-colors' : ''
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                {/* Icon */}
                <div className={`w-10 h-10 rounded-lg ${color.bgLight} flex items-center justify-center`}>
                  <IconComponent className={`w-5 h-5 ${color.text}`} />
                </div>
                {/* Label */}
                <span className="text-sm font-semibold text-gray-900">
                  {label}
                </span>
              </div>
              <div className="text-right">
                <span className="text-lg font-bold text-gray-900">{item.count}</span>
                <span className="text-xs text-gray-500 ml-1">
                  ({percentageOfTotal}%)
                </span>
              </div>
            </div>

            {/* Progress bar with icon color */}
            <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500 relative overflow-hidden"
                style={{
                  width: `${percentage}%`,
                  background: `linear-gradient(90deg, ${color.bg}, ${color.bg}dd)`,
                }}
              >
                {/* Shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
              </div>
            </div>

            {/* Tooltip on hover */}
            {onClickType && (
              <div className="absolute left-0 top-full mt-2 hidden group-hover:block bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-xl z-50 whitespace-nowrap">
                <div className="flex items-center gap-2">
                  <IconComponent className="w-4 h-4" />
                  <span>Click to filter by {label.toLowerCase()} alerts</span>
                </div>
                <div className="absolute -top-1 left-4 w-2 h-2 bg-gray-900 transform rotate-45" />
              </div>
            )}
          </div>
        );
      })}

      {/* Total summary at bottom */}
      <div className="pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 font-medium">Total Alert Types</span>
          <span className="text-xl font-bold text-gray-900">{totalCount}</span>
        </div>
      </div>
    </div>
  );
}

