import React from 'react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts';

interface TrendChartProps {
  data: Array<{
    date: string;
    alerts: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
  }>;
}

export function TrendChart({ data }: TrendChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        No trend data available
      </div>
    );
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: '#6B7280' }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: '#6B7280' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            }}
          />
          <Line
            type="monotone"
            dataKey="critical"
            stroke="#EF4444"
            strokeWidth={2}
            dot={false}
            name="Critical"
          />
          <Line
            type="monotone"
            dataKey="high"
            stroke="#F97316"
            strokeWidth={2}
            dot={false}
            name="High"
          />
          <Line
            type="monotone"
            dataKey="medium"
            stroke="#EAB308"
            strokeWidth={2}
            dot={false}
            name="Medium"
          />
          <Line
            type="monotone"
            dataKey="low"
            stroke="#3B82F6"
            strokeWidth={2}
            dot={false}
            name="Low"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
