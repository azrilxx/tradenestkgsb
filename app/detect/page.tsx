'use client';

import { useState } from 'react';

export default function DetectPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);

  const runDetection = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/detect', {
        method: 'POST',
      });

      const data = await response.json();
      setResult(data);

      // Also fetch updated statistics
      await fetchStats();
      await fetchAlerts();
    } catch (error) {
      console.error('Detection error:', error);
      setResult({ success: false, error: (error as Error).message });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/detect');
      const data = await response.json();
      setStats(data.data);
    } catch (error) {
      console.error('Stats error:', error);
    }
  };

  const fetchAlerts = async () => {
    try {
      const response = await fetch('/api/alerts?limit=20');
      const data = await response.json();
      setAlerts(data.data || []);
    } catch (error) {
      console.error('Alerts error:', error);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'price_spike':
        return '💰 Price Spike';
      case 'tariff_change':
        return '📊 Tariff Change';
      case 'freight_surge':
        return '🚢 Freight Surge';
      case 'fx_volatility':
        return '💱 FX Volatility';
      default:
        return type;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-xl p-8 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Anomaly Detection Engine
          </h1>
          <p className="text-gray-600 mb-6">
            Run detection algorithms to identify trade anomalies
          </p>

          <div className="flex gap-4">
            <button
              onClick={runDetection}
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition font-semibold"
            >
              {loading ? '🔍 Detecting...' : '🔍 Run Detection'}
            </button>

            <button
              onClick={fetchStats}
              disabled={loading}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition font-semibold"
            >
              📊 Refresh Stats
            </button>

            <button
              onClick={fetchAlerts}
              disabled={loading}
              className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 disabled:bg-gray-400 transition font-semibold"
            >
              🔔 Load Alerts
            </button>
          </div>
        </div>

        {/* Detection Result */}
        {result && (
          <div className="bg-white rounded-lg shadow-xl p-8 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Detection Results
            </h2>

            {result.success ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-green-600">
                  <span className="text-2xl">✅</span>
                  <span className="text-lg font-semibold">{result.message}</span>
                </div>

                <div className="grid grid-cols-4 gap-4 mt-6">
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div className="text-3xl font-bold text-blue-600">
                      {result.data.breakdown.price_spikes}
                    </div>
                    <div className="text-sm text-gray-600">Price Spikes</div>
                  </div>

                  <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                    <div className="text-3xl font-bold text-orange-600">
                      {result.data.breakdown.tariff_changes}
                    </div>
                    <div className="text-sm text-gray-600">Tariff Changes</div>
                  </div>

                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                    <div className="text-3xl font-bold text-purple-600">
                      {result.data.breakdown.freight_surges}
                    </div>
                    <div className="text-sm text-gray-600">Freight Surges</div>
                  </div>

                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <div className="text-3xl font-bold text-green-600">
                      {result.data.breakdown.fx_volatility}
                    </div>
                    <div className="text-sm text-gray-600">FX Volatility</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-red-600">
                <span className="text-2xl">❌</span>
                <span className="ml-2">Detection failed: {result.error}</span>
              </div>
            )}
          </div>
        )}

        {/* Statistics */}
        {stats && (
          <div className="bg-white rounded-lg shadow-xl p-8 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Alert Statistics
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                <div className="text-sm text-gray-600">Total Alerts</div>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{stats.new}</div>
                <div className="text-sm text-gray-600">New</div>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{stats.viewed}</div>
                <div className="text-sm text-gray-600">Viewed</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
                <div className="text-sm text-gray-600">Resolved</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">By Severity</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-red-600">● Critical</span>
                    <span className="font-semibold">{stats.bySeverity.critical}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-orange-600">● High</span>
                    <span className="font-semibold">{stats.bySeverity.high}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-yellow-600">● Medium</span>
                    <span className="font-semibold">{stats.bySeverity.medium}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-blue-600">● Low</span>
                    <span className="font-semibold">{stats.bySeverity.low}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-700 mb-2">By Type</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span>💰 Price Spikes</span>
                    <span className="font-semibold">{stats.byType.price_spike}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>📊 Tariff Changes</span>
                    <span className="font-semibold">{stats.byType.tariff_change}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>🚢 Freight Surges</span>
                    <span className="font-semibold">{stats.byType.freight_surge}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>💱 FX Volatility</span>
                    <span className="font-semibold">{stats.byType.fx_volatility}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recent Alerts */}
        {alerts.length > 0 && (
          <div className="bg-white rounded-lg shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Recent Alerts ({alerts.length})
            </h2>

            <div className="space-y-3">
              {alerts.map((alert: any) => {
                const anomaly = Array.isArray(alert.anomalies)
                  ? alert.anomalies[0]
                  : alert.anomalies;
                const product = anomaly?.products;

                return (
                  <div
                    key={alert.id}
                    className={`p-4 rounded-lg border-2 ${getSeverityColor(anomaly?.severity)}`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-lg">
                            {getTypeLabel(anomaly?.type)}
                          </span>
                          <span className="text-xs px-2 py-1 bg-white rounded-full border">
                            {anomaly?.severity?.toUpperCase()}
                          </span>
                          <span className="text-xs px-2 py-1 bg-white rounded-full border">
                            {alert.status}
                          </span>
                        </div>

                        {product && (
                          <div className="text-sm text-gray-600 mb-2">
                            <span className="font-mono">{product.hs_code}</span> - {product.description}
                          </div>
                        )}

                        <div className="text-xs text-gray-500">
                          Detected: {new Date(anomaly?.detected_at).toLocaleString()}
                        </div>

                        {anomaly?.details && (
                          <div className="mt-2 text-sm">
                            {anomaly.details.percentage_change && (
                              <span className="font-semibold">
                                Change: {anomaly.details.percentage_change.toFixed(2)}%
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Instructions */}
        {!result && !stats && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="font-semibold text-blue-900 mb-2">📝 How to Use</h3>
            <ol className="list-decimal list-inside text-blue-800 space-y-1">
              <li>Make sure you've seeded the database with mock data</li>
              <li>Click "Run Detection" to scan for anomalies</li>
              <li>View detection results and statistics</li>
              <li>Check recent alerts to see what was found</li>
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}