'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface BenchmarkData {
  avg_price: number;
  median_price: number;
  price_range: {
    min: number;
    max: number;
  };
  price_percentiles: Array<{
    percentile: number;
    value: number;
  }>;
  top_exporters: Array<{
    country: string;
    volume: number;
    value: number;
    percentage: number;
  }>;
  market_distribution: Array<{
    country: string;
    volume: number;
    value: number;
    percentage: number;
  }>;
  price_volatility: number;
  total_volume: number;
  total_value: number;
  sample_size: number;
}

interface PriceTrendData {
  date: string;
  avg_price: number;
  volume: number;
}

interface TopProduct {
  hs_code: string;
  description: string;
  category: string;
  total_volume: number;
  avg_price: number;
}

interface BenchmarkResponse {
  success: boolean;
  data: {
    benchmark: BenchmarkData;
    price_trend: PriceTrendData[];
    top_products: TopProduct[];
    filters_applied: any;
    generated_at: string;
  };
}

export default function MarketBenchmarksPage() {
  const [hsCode, setHsCode] = useState('');
  const [country, setCountry] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [benchmarkData, setBenchmarkData] = useState<BenchmarkData | null>(null);
  const [priceTrendData, setPriceTrendData] = useState<PriceTrendData[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [error, setError] = useState('');

  // Set default date range (last 6 months)
  useEffect(() => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(endDate.getMonth() - 6);

    setEndDate(endDate.toISOString().split('T')[0]);
    setStartDate(startDate.toISOString().split('T')[0]);
  }, []);

  const fetchBenchmarkData = async () => {
    if (!hsCode.trim()) {
      setError('Please enter an HS code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams();
      params.append('hs_code', hsCode);
      if (country) params.append('country', country);
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      params.append('trend_months', '6');
      params.append('top_products_limit', '10');

      const response = await fetch(`/api/benchmark?${params}`);
      const data: BenchmarkResponse = await response.json();

      if (data.success) {
        setBenchmarkData(data.data.benchmark);
        setPriceTrendData(data.data.price_trend);
        setTopProducts(data.data.top_products);
      } else {
        setError('No benchmark data found for the specified criteria');
      }
    } catch (err) {
      setError('Failed to fetch benchmark data');
      console.error('Error fetching benchmark data:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-MY').format(num);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Market Benchmarks</h1>
          <p className="text-gray-600 mt-2">
            Compare your prices against market intelligence and peer data
          </p>
        </div>
      </div>

      {/* Search Interface */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              HS Code *
            </label>
            <input
              type="text"
              value={hsCode}
              onChange={(e) => setHsCode(e.target.value)}
              placeholder="e.g., 8517.12"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Country
            </label>
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Countries</option>
              <option value="China">China</option>
              <option value="Singapore">Singapore</option>
              <option value="Japan">Japan</option>
              <option value="South Korea">South Korea</option>
              <option value="Germany">Germany</option>
              <option value="United States">United States</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="mt-4">
          <Button
            onClick={fetchBenchmarkData}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {loading ? 'Loading...' : 'Get Benchmark Data'}
          </Button>
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600">{error}</p>
          </div>
        )}
      </Card>

      {/* Benchmark Results */}
      {benchmarkData && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Average Price</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(benchmarkData.avg_price)}
                  </p>
                </div>
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 text-sm">💰</span>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Median Price</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(benchmarkData.median_price)}
                  </p>
                </div>
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 text-sm">📊</span>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Volume</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatNumber(benchmarkData.total_volume)}
                  </p>
                  <p className="text-xs text-gray-500">containers</p>
                </div>
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-purple-600 text-sm">📦</span>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Sample Size</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatNumber(benchmarkData.sample_size)}
                  </p>
                  <p className="text-xs text-gray-500">transactions</p>
                </div>
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                  <span className="text-orange-600 text-sm">📈</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Price Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Price Distribution</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Price Range</span>
                  <span className="font-medium">
                    {formatCurrency(benchmarkData.price_range.min)} - {formatCurrency(benchmarkData.price_range.max)}
                  </span>
                </div>
                {benchmarkData.price_percentiles.map((percentile) => (
                  <div key={percentile.percentile} className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">{percentile.percentile}th Percentile</span>
                    <span className="font-medium">{formatCurrency(percentile.value)}</span>
                  </div>
                ))}
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Volatility</span>
                  <Badge variant="high" className="text-orange-600">
                    {benchmarkData.price_volatility.toFixed(2)}%
                  </Badge>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Top 5 Exporters</h3>
              <div className="space-y-3">
                {benchmarkData.top_exporters.map((exporter, index) => (
                  <div key={exporter.country} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                      <span className="text-sm font-medium text-gray-900">{exporter.country}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">
                        {exporter.percentage.toFixed(1)}%
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatNumber(exporter.volume)} containers
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Price Trend Chart */}
          {priceTrendData.length > 0 && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Price Trend (Last 6 Months)</h3>
              <div className="h-64 flex items-end space-x-2">
                {priceTrendData.map((data, index) => {
                  const maxPrice = Math.max(...priceTrendData.map(d => d.avg_price));
                  const height = (data.avg_price / maxPrice) * 100;

                  return (
                    <div key={data.date} className="flex flex-col items-center flex-1">
                      <div
                        className="bg-blue-500 rounded-t w-full min-h-[20px] transition-all duration-300 hover:bg-blue-600"
                        style={{ height: `${height}%` }}
                        title={`${data.date}: ${formatCurrency(data.avg_price)}`}
                      />
                      <div className="text-xs text-gray-500 mt-2 transform -rotate-45 origin-left">
                        {data.date.split('-')[1]}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 text-center text-sm text-gray-600">
                Average price trend over time
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Top Products Table */}
      {topProducts.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Products by Volume</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    HS Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Volume
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Avg Price
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {topProducts.map((product) => (
                  <tr key={product.hs_code} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {product.hs_code}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {product.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <Badge variant="default">{product.category}</Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatNumber(product.total_volume)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(product.avg_price)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
