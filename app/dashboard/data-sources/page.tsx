'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertCircle, CheckCircle, Info } from 'lucide-react';

interface DataSourceHealth {
  name: string;
  source: string;
  status: 'healthy' | 'degraded' | 'failed' | 'unknown';
  recordCount: number;
  lastUpdated: string | null;
  isStale: boolean;
  refreshFrequency: string;
}

interface HealthData {
  timestamp: string;
  overallStatus: 'healthy' | 'degraded' | 'failed';
  sources: {
    fx_rates: DataSourceHealth;
    trade_statistics: DataSourceHealth;
  };
}

export default function DataSourcesPage() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchHealth();
  }, []);

  const fetchHealth = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/data/health');
      const data = await response.json();
      if (data.success) {
        setHealth(data.health);
      }
    } catch (error) {
      console.error('Error fetching data health:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshData = async () => {
    setRefreshing(true);
    try {
      const response = await fetch('/api/data/ingest', { method: 'POST' });
      const data = await response.json();

      if (data.success) {
        // Refresh health after ingestion
        await fetchHealth();
        alert(`Data refreshed successfully! ${data.status.successful} sources updated.`);
      } else {
        alert('Failed to refresh data');
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
      alert('Error refreshing data');
    } finally {
      setRefreshing(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'degraded':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Info className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      healthy: 'bg-green-100 text-green-800',
      degraded: 'bg-yellow-100 text-yellow-800',
      failed: 'bg-red-100 text-red-800',
      unknown: 'bg-gray-100 text-gray-800',
    };

    return (
      <Badge className={variants[status] || variants.unknown}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-gray-600">Loading data sources...</p>
        </div>
      </div>
    );
  }

  if (!health) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No data available</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Data Sources</h1>
          <p className="text-gray-600 mt-1">Monitor and manage data integrations</p>
        </div>
        <Button
          onClick={handleRefreshData}
          disabled={refreshing}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh Data'}
        </Button>
      </div>

      {/* Overall Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Overall System Status</CardTitle>
            {getStatusBadge(health.overallStatus)}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            {getStatusIcon(health.overallStatus)}
            <div>
              <p className="font-medium text-gray-900">Data Sources Health</p>
              <p className="text-sm text-gray-600">
                Last checked: {new Date(health.timestamp).toLocaleString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* BNM Exchange Rates */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{health.sources.fx_rates.name}</CardTitle>
            {getStatusBadge(health.sources.fx_rates.status)}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              {getStatusIcon(health.sources.fx_rates.status)}
              <div className="flex-1">
                <p className="font-medium text-gray-900">Source: Bank Negara Malaysia</p>
                <p className="text-sm text-gray-600">Official Malaysian Central Bank API</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <p className="text-sm text-gray-600">Record Count</p>
                <p className="text-2xl font-bold">{health.sources.fx_rates.recordCount.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Last Updated</p>
                <p className="text-lg font-semibold">
                  {health.sources.fx_rates.lastUpdated
                    ? new Date(health.sources.fx_rates.lastUpdated).toLocaleDateString()
                    : 'Never'}
                </p>
              </div>
            </div>
            <div className="pt-2 border-t">
              <p className="text-sm text-gray-600">
                <strong>Refresh Frequency:</strong> {health.sources.fx_rates.refreshFrequency}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* MATRADE Trade Statistics */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{health.sources.trade_statistics.name}</CardTitle>
            {getStatusBadge(health.sources.trade_statistics.status)}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              {getStatusIcon(health.sources.trade_statistics.status)}
              <div className="flex-1">
                <p className="font-medium text-gray-900">Source: MATRADE Open Data</p>
                <p className="text-sm text-gray-600">Malaysia External Trade Development Corporation</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <p className="text-sm text-gray-600">Record Count</p>
                <p className="text-2xl font-bold">{health.sources.trade_statistics.recordCount.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Last Updated</p>
                <p className="text-lg font-semibold">
                  {health.sources.trade_statistics.lastUpdated || 'Never'}
                </p>
              </div>
            </div>
            <div className="pt-2 border-t">
              <p className="text-sm text-gray-600">
                <strong>Refresh Frequency:</strong> {health.sources.trade_statistics.refreshFrequency}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Attribution Notice */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">Data Attribution</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-blue-800">
            All data displayed in TradeNest is properly attributed to its source. Government data sources
            (BNM, MATRADE) are clearly labeled throughout the platform to ensure transparency and data credibility.
            Mock data is used for demonstration purposes and is clearly marked.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

