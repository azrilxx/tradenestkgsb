'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SeverityChart } from '@/components/dashboard/severity-chart';
import { TypeChart } from '@/components/dashboard/type-chart';
import { RefreshCw, AlertCircle, Info } from 'lucide-react';

export default function AnalyticsPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dataHealth, setDataHealth] = useState<any>(null);
  const [fetchingHealth, setFetchingHealth] = useState(true);

  useEffect(() => {
    fetchAnalytics();
    fetchHealth();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/detect');
      const data = await response.json();
      setStats(data.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };
  const fetchHealth = async () => {
    setFetchingHealth(true);
    try {
      const res = await fetch('/api/data/health');
      const data = await res.json();
      if (data.success) setDataHealth(data.health);
    } catch (err) {
      setDataHealth(null);
    } finally {
      setFetchingHealth(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No analytics data available</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Data Status Industry Banner */}
      <div className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded flex items-center gap-4 text-sm">
        {fetchingHealth ? (
          <span className="text-gray-500">Checking data sources ...</span>
        ) : dataHealth ? (
          <>
            <div>
              <strong>Last Updated:</strong>{' '}
              {dataHealth.timestamp ? new Date(dataHealth.timestamp).toLocaleString() : 'Unknown'}
            </div>
            <div className="hidden md:inline">
              <strong>Sources:</strong>
              <span className="mx-1">BNM FX</span>
              <Info className="inline w-3 h-3 text-blue-400 align-text-top" title="Bank Negara Malaysia FX rates" />
              ({dataHealth.sources?.fx_rates?.status}) |
              <span className="mx-1">MATRADE</span>
              <Info className="inline w-3 h-3 text-blue-400 align-text-top" title="MATRADE trade statistics" />
              ({dataHealth.sources?.trade_statistics?.status})
            </div>
            <div className="inline-block">
              {Object.values(dataHealth.sources || {}).some((s:any)=>s.isStale) ? (
                <span className="inline-flex items-center px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">
                  <AlertCircle className="w-4 h-4 mr-1" /> Data may be delayed
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                  <Info className="w-4 h-4 mr-1" /> Data healthy
                </span>
              )}
            </div>
          </>
        ) : (
          <span className="text-red-600">Unable to retrieve data source status</span>
        )}
        <Button size="sm" className="ml-auto" onClick={fetchHealth} variant="secondary">
          <RefreshCw className="w-4 h-4" /> Check Again
        </Button>
      </div>

      {/* Summary Cards, pass health info as a mini-caption */}
      {stats && dataHealth && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="text-sm text-gray-600">Total Alerts</div>
              <div className="text-xs text-gray-500 mb-1">
                Updated: {dataHealth.sources?.trade_statistics?.lastUpdated ? new Date(dataHealth.sources.trade_statistics.lastUpdated).toLocaleDateString() : 'Unknown'} | Source: MATRADE
                {dataHealth.sources?.trade_statistics?.isStale ? <span className="ml-1 text-yellow-700">(Delayed)</span> : null}
              </div>
              <div className="text-4xl font-bold text-gray-900 mt-2">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-sm text-gray-600">Active Alerts</div>
              <div className="text-xs text-gray-500 mb-1">
                Updated: {dataHealth.sources?.trade_statistics?.lastUpdated ? new Date(dataHealth.sources.trade_statistics.lastUpdated).toLocaleDateString() : 'Unknown'} | Source: MATRADE
                {dataHealth.sources?.trade_statistics?.isStale ? <span className="ml-1 text-yellow-700">(Delayed)</span> : null}
              </div>
              <div className="text-4xl font-bold text-blue-600 mt-2">{stats.new + stats.viewed}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-sm text-gray-600">Resolution Rate</div>
              <div className="text-xs text-gray-500 mb-1">
                Updated: {dataHealth.sources?.trade_statistics?.lastUpdated ? new Date(dataHealth.sources.trade_statistics.lastUpdated).toLocaleDateString() : 'Unknown'} | Source: MATRADE
                {dataHealth.sources?.trade_statistics?.isStale ? <span className="ml-1 text-yellow-700">(Delayed)</span> : null}
              </div>
              <div className="text-4xl font-bold text-green-600 mt-2">
                {stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0}%
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Severity Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Alerts by Severity</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.bySeverity && (
              <SeverityChart data={stats.bySeverity} />
            )}
          </CardContent>
        </Card>

        {/* Type Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Alerts by Type</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.byType && (
              <TypeChart data={stats.byType} />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Status Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-blue-50 rounded-lg">
              <div className="text-5xl font-bold text-blue-600">{stats.new}</div>
              <div className="text-sm text-blue-900 mt-2 font-medium">New Alerts</div>
              <div className="text-xs text-blue-700 mt-1">Requires attention</div>
            </div>
            <div className="text-center p-6 bg-yellow-50 rounded-lg">
              <div className="text-5xl font-bold text-yellow-600">{stats.viewed}</div>
              <div className="text-sm text-yellow-900 mt-2 font-medium">Viewed</div>
              <div className="text-xs text-yellow-700 mt-1">Under review</div>
            </div>
            <div className="text-center p-6 bg-green-50 rounded-lg">
              <div className="text-5xl font-bold text-green-600">{stats.resolved}</div>
              <div className="text-sm text-green-900 mt-2 font-medium">Resolved</div>
              <div className="text-xs text-green-700 mt-1">Completed</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Key Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.bySeverity?.critical > 0 && (
              <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded">
                <div className="font-semibold text-red-900">
                  🚨 {stats.bySeverity.critical} Critical Alert{stats.bySeverity.critical > 1 ? 's' : ''}
                </div>
                <div className="text-sm text-red-700 mt-1">
                  Requires immediate action
                </div>
              </div>
            )}

            {stats.byType && (
              <div className="p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
                <div className="font-semibold text-blue-900">
                  📊 Most Common: {Object.entries(stats.byType).sort((a: any, b: any) => b[1] - a[1])[0][0].replace('_', ' ').toUpperCase()}
                </div>
                <div className="text-sm text-blue-700 mt-1">
                  Primary anomaly type detected
                </div>
              </div>
            )}

            {stats.resolved > 0 && (
              <div className="p-4 bg-green-50 border-l-4 border-green-500 rounded">
                <div className="font-semibold text-green-900">
                  ✅ {stats.resolved} Alert{stats.resolved > 1 ? 's' : ''} Resolved
                </div>
                <div className="text-sm text-green-700 mt-1">
                  Great progress on anomaly management
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}