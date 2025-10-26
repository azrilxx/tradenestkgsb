'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface SeverityChartProps {
  data: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}

export function SeverityChart({ data }: SeverityChartProps) {
  const chartData = [
    { name: 'Critical', value: data.critical, color: '#DC2626' },
    { name: 'High', value: data.high, color: '#EA580C' },
    { name: 'Medium', value: data.medium, color: '#CA8A04' },
    { name: 'Low', value: data.low, color: '#2563EB' },
  ].filter(item => item.value > 0);

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        No data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}