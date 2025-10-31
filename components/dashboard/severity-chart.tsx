import React from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from 'recharts';

interface SeverityChartProps {
  data: Array<{
    severity: string;
    count: number;
    color: string;
  }>;
}

export function SeverityChart({ data }: SeverityChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400">
        No severity data available
      </div>
    );
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="horizontal"
          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
        >
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="severity"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 14, fill: '#6B7280', fontWeight: 500 }}
            width={80}
          />
          <Bar dataKey="count" radius={[0, 8, 8, 0]} barSize={40}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}