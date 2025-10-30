'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Calendar, RefreshCw } from 'lucide-react';
import { useState, useEffect } from 'react';

interface FXRate {
  currency_pair: string;
  rate: number;
  date: string;
}

interface BNMDataSourceProps {
  showHeader?: boolean;
}

export function BNMDataSource({ showHeader = true }: BNMDataSourceProps) {
  const [rates, setRates] = useState<FXRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  useEffect(() => {
    fetchRates();
  }, []);

  const fetchRates = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/data-sources/bnm?action=fetch');
      const data = await response.json();

      if (data.success) {
        setRates(data.data || []);
        setLastUpdated(data.timestamp || '');
      }
    } catch (error) {
      console.error('Failed to fetch BNM rates:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshRates = async () => {
    try {
      setRefreshing(true);
      const response = await fetch('/api/data-sources/bnm', { method: 'POST' });
      const data = await response.json();

      if (data.success) {
        await fetchRates();
      }
    } catch (error) {
      console.error('Failed to refresh rates:', error);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <Card className="p-6">
      {showHeader && (
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">🇲🇾</span>
              <h3 className="text-lg font-semibold text-gray-900">
                Bank Negara Malaysia Exchange Rates
              </h3>
            </div>
            <p className="text-sm text-gray-600">
              Real-time official currency exchange rates
            </p>
          </div>
          <Button
            onClick={refreshRates}
            variant="outline"
            size="sm"
            disabled={refreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      )}

      {/* Data Source Attribution */}
      <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <div className="text-xs text-blue-800">
          <strong>Data Source:</strong> Bank Negara Malaysia (BNM) Open API
          <br />
          {lastUpdated && (
            <span className="flex items-center gap-1 mt-1">
              <Calendar className="w-3 h-3" />
              Last updated: {new Date(lastUpdated).toLocaleString('en-MY')}
            </span>
          )}
        </div>
      </div>

      {/* Exchange Rates Display */}
      {loading ? (
        <div className="text-center py-8 text-gray-500">
          Loading exchange rates...
        </div>
      ) : rates.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No exchange rate data available. Click "Refresh" to fetch latest rates.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {rates.map((rate) => {
            const change = Math.random() * 2 - 1; // Placeholder for change calculation
            const isPositive = change >= 0;

            return (
              <div
                key={rate.currency_pair}
                className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium text-gray-700">
                    {rate.currency_pair}
                  </div>
                  {isPositive ? (
                    <TrendingUp className="w-4 h-4 text-green-600" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-600" />
                  )}
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {rate.rate.toFixed(4)}
                </div>
                <div className="text-xs text-gray-500">
                  Last updated: {new Date(rate.date).toLocaleDateString('en-MY')}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

