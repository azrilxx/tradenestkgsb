'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

interface TimelineData {
  month: string;
  category_counts: {
    trade_remedy: number;
    tariff_change: number;
    anti_dumping: number;
    import_restriction: number;
  };
}

interface Props {
  data: TimelineData[];
}

export function TimelineChart({ data }: Props) {
  const formattedData = data.map(item => ({
    ...item,
    month_label: format(new Date(item.month), 'MMM yyyy'),
  }));

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={formattedData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month_label" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="category_counts.anti_dumping" stroke="#EF4444" strokeWidth={2} name="Anti-Dumping" />
          <Line type="monotone" dataKey="category_counts.trade_remedy" stroke="#3B82F6" strokeWidth={2} name="Trade Remedy" />
          <Line type="monotone" dataKey="category_counts.tariff_change" stroke="#10B981" strokeWidth={2} name="Tariff Changes" />
          <Line type="monotone" dataKey="category_counts.import_restriction" stroke="#F59E0B" strokeWidth={2} name="Import Restrictions" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

