'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

interface SectorImpact {
  sector: string;
  affected_count: number;
  avg_duty_rate: number;
  total_value_at_risk: number;
}

interface Props {
  data: SectorImpact[];
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export function SectorImpactChart({ data }: Props) {
  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" />
          <YAxis dataKey="sector" type="category" width={80} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #ccc',
              borderRadius: '8px'
            }}
            formatter={(value: number) => value.toLocaleString()}
          />
          <Legend />
          <Bar dataKey="affected_count" fill="#3B82F6" name="Affected Gazettes">
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

