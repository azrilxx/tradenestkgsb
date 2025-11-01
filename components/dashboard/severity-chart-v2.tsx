import React from 'react';
import { BarChart3, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface SeverityChartProps {
  data: Array<{
    severity: string;
    count: number;
    color: string;
    trend?: number; // Percentage change
  }>;
  onClickSeverity?: (severity: string) => void;
}

export function SeverityChartV2({ data, onClickSeverity }: SeverityChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400">
        <div className="text-center">
          <BarChart3 className="w-12 h-12 mx-auto mb-2 text-gray-300" />
          <p className="text-sm">No severity data available</p>
        </div>
      </div>
    );
  }

  const maxCount = Math.max(...data.map(d => d.count));
  const totalCount = data.reduce((sum, d) => sum + d.count, 0);

  const getTrendIcon = (trend?: number) => {
    if (!trend) return <Minus className="w-3 h-3" />;
    if (trend > 0) return <TrendingUp className="w-3 h-3" />;
    return <TrendingDown className="w-3 h-3" />;
  };

  const getTrendColor = (trend?: number) => {
    if (!trend) return 'text-gray-500';
    if (trend > 0) return 'text-red-500';
    return 'text-green-500';
  };

  return (
    <div className="space-y-4">
      {data.map((item, index) => {
        const percentage = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
        const percentageOfTotal = totalCount > 0 ? ((item.count / totalCount) * 100).toFixed(1) : 0;

        return (
          <div
            key={index}
            onClick={() => onClickSeverity?.(item.severity)}
            className={`group relative ${
              onClickSeverity ? 'cursor-pointer hover:bg-gray-50 rounded-lg p-2 -m-2 transition-colors' : ''
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className={`text-sm font-semibold w-20`} style={{ color: item.color }}>
                  {item.severity}
                </span>
                {/* Trend indicator */}
                {item.trend !== undefined && (
                  <div className={`flex items-center gap-0.5 ${getTrendColor(item.trend)}`}>
                    {getTrendIcon(item.trend)}
                    <span className="text-xs font-medium">{Math.abs(item.trend)}%</span>
                  </div>
                )}
              </div>
              <div className="text-right">
                <span className="text-lg font-bold text-gray-900">{item.count}</span>
                <span className="text-xs text-gray-500 ml-1">
                  ({percentageOfTotal}%)
                </span>
              </div>
            </div>

            {/* Progress bar with gradient */}
            <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500 relative overflow-hidden"
                style={{
                  width: `${percentage}%`,
                  background: `linear-gradient(90deg, ${item.color}, ${item.color}dd)`,
                }}
              >
                {/* Shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
              </div>
            </div>

            {/* Tooltip on hover */}
            {onClickSeverity && (
              <div className="absolute left-0 top-full mt-2 hidden group-hover:block bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-xl z-50 whitespace-nowrap">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  <span>Click to filter by {item.severity.toLowerCase()} alerts</span>
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
          <span className="text-gray-600 font-medium">Total Alerts</span>
          <span className="text-xl font-bold text-gray-900">{totalCount}</span>
        </div>
      </div>
    </div>
  );
}

// Add shimmer animation to global CSS
const shimmerStyle = `
@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
.animate-shimmer {
  animation: shimmer 3s infinite;
}
`;

// Inject style if not already added (for client-side)
if (typeof document !== 'undefined') {
  const styleId = 'severity-chart-shimmer-style';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = shimmerStyle;
    document.head.appendChild(style);
  }
}

