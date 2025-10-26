'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface TypeChartProps {
  data: {
    price_spike: number;
    tariff_change: number;
    freight_surge: number;
    fx_volatility: number;
  };
}

export function TypeChart({ data }: TypeChartProps) {
  const chartData = [
    { name: 'Price Spikes', value: data.price_spike, fill: '#3B82F6' },
    { name: 'Tariff Changes', value: data.tariff_change, fill: '#8B5CF6' },
    { name: 'Freight Surges', value: data.freight_surge, fill: '#10B981' },
    { name: 'FX Volatility', value: data.fx_volatility, fill: '#F59E0B' },
  ];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="value" fill="#3B82F6" />
      </BarChart>
    </ResponsiveContainer>
  );
}