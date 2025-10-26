'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ComparisonResult {
  user_price: number;
  market_avg: number;
  median_price: number;
  price_range: {
    min: number;
    max: number;
  };
  percentile_rank: number;
  deviation_percentage: number;
  is_outlier: boolean;
  recommendation: string;
  benchmark_context: {
    sample_size: number;
    price_volatility: number;
    top_exporters: Array<{
      country: string;
      volume: number;
      value: number;
      percentage: number;
    }>;
  };
}

interface PriceComparisonProps {
  hsCode: string;
  userPrice?: number;
  country?: string;
  dateRange?: {
    start: string;
    end: string;
  };
}

export default function PriceComparison({
  hsCode,
  userPrice,
  country,
  dateRange
}: PriceComparisonProps) {
  const [comparison, setComparison] = useState<ComparisonResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [inputPrice, setInputPrice] = useState(userPrice?.toString() || '');

  const comparePrice = async () => {
    if (!inputPrice || isNaN(Number(inputPrice))) {
      setError('Please enter a valid price');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/benchmark', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_price: Number(inputPrice),
          hs_code: hsCode,
          country,
          date_range: dateRange,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setComparison(data.data);
      } else {
        setError(data.error || 'Failed to compare price');
      }
    } catch (err) {
      setError('Failed to compare price');
      console.error('Error comparing price:', err);
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

  const getDeviationColor = (deviation: number) => {
    if (Math.abs(deviation) > 20) return 'text-red-600';
    if (Math.abs(deviation) > 10) return 'text-orange-600';
    return 'text-green-600';
  };

  const getDeviationBadgeVariant = (deviation: number) => {
    if (Math.abs(deviation) > 20) return 'destructive';
    if (Math.abs(deviation) > 10) return 'secondary';
    return 'default';
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Price Comparison</h3>
        <Badge variant="outline" className="text-blue-600">
          HS Code: {hsCode}
        </Badge>
      </div>

      {/* Price Input */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Your Price (MYR)
        </label>
        <div className="flex space-x-3">
          <input
            type="number"
            value={inputPrice}
            onChange={(e) => setInputPrice(e.target.value)}
            placeholder="Enter your price"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Button
            onClick={comparePrice}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {loading ? 'Comparing...' : 'Compare'}
          </Button>
        </div>
        {error && (
          <p className="mt-2 text-sm text-red-600">{error}</p>
        )}
      </div>

      {/* Comparison Results */}
      {comparison && (
        <div className="space-y-6">
          {/* Main Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Your Price</p>
              <p className="text-xl font-bold text-gray-900">
                {formatCurrency(comparison.user_price)}
              </p>
            </div>

            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600">Market Average</p>
              <p className="text-xl font-bold text-blue-900">
                {formatCurrency(comparison.market_avg)}
              </p>
            </div>

            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600">Deviation</p>
              <p className={`text-xl font-bold ${getDeviationColor(comparison.deviation_percentage)}`}>
                {comparison.deviation_percentage > 0 ? '+' : ''}{comparison.deviation_percentage.toFixed(1)}%
              </p>
            </div>
          </div>

          {/* Detailed Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h4 className="text-md font-semibold text-gray-900 mb-3">Price Analysis</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Percentile Rank</span>
                  <Badge variant="default">
                    {comparison.percentile_rank.toFixed(1)}th percentile
                  </Badge>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Market Position</span>
                  <Badge
                    variant={getDeviationBadgeVariant(comparison.deviation_percentage)}
                    className={comparison.is_outlier ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}
                  >
                    {comparison.is_outlier ? 'Outlier' : 'Normal Range'}
                  </Badge>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Price Range</span>
                  <span className="text-sm font-medium">
                    {formatCurrency(comparison.price_range.min)} - {formatCurrency(comparison.price_range.max)}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Median Price</span>
                  <span className="text-sm font-medium">
                    {formatCurrency(comparison.median_price)}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-md font-semibold text-gray-900 mb-3">Market Context</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Sample Size</span>
                  <span className="text-sm font-medium">
                    {comparison.benchmark_context.sample_size} transactions
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Price Volatility</span>
                  <Badge variant="high" className="text-orange-600">
                    {comparison.benchmark_context.price_volatility.toFixed(2)}%
                  </Badge>
                </div>

                <div>
                  <span className="text-sm text-gray-600">Top Exporters</span>
                  <div className="mt-1 space-y-1">
                    {comparison.benchmark_context.top_exporters.map((exporter, index) => (
                      <div key={exporter.country} className="flex justify-between text-xs">
                        <span>{exporter.country}</span>
                        <span>{exporter.percentage.toFixed(1)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recommendation */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="text-md font-semibold text-blue-900 mb-2">Recommendation</h4>
            <p className="text-sm text-blue-800">{comparison.recommendation}</p>
          </div>
        </div>
      )}

      {/* Help Text */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-900 mb-2">How to Use Price Comparison</h4>
        <ul className="text-xs text-gray-600 space-y-1">
          <li>• Enter your purchase price to compare against market benchmarks</li>
          <li>• Percentile rank shows where your price falls in the market distribution</li>
          <li>• Outliers are prices that deviate more than 20% from market average</li>
          <li>• Recommendations help you make informed pricing decisions</li>
        </ul>
      </div>
    </Card>
  );
}
