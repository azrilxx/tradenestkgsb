import React from 'react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

interface MiniChartProps {
  data: Array<{ value: number; date: string }>;
  color?: string;
  height?: number;
}

export function MiniChart({ data, color = '#3B82F6', height = 40 }: MiniChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-10 text-gray-400 text-xs">
        No data
      </div>
    );
  }

  return (
    <div style={{ height }} className="relative">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 4, fill: color }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
