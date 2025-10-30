'use client';

import { useState, useEffect } from 'react';

export default function SetupPage() {
  const [status, setStatus] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [healthData, setHealthData] = useState<any>(null);

  const runSeed = async () => {
    setLoading(true);
    setStatus('Seeding database...');
    setResult(null);

    try {
      const response = await fetch('/api/seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'seed' }),
      });

      const data = await response.json();
      setResult(data);

      if (data.success) {
        setStatus('✅ Database seeded successfully!');
      } else {
        setStatus('❌ Seeding failed');
      }
    } catch (error) {
      setStatus('❌ Error: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const clearDatabase = async () => {
    if (!confirm('Are you sure you want to clear all data?')) return;

    setLoading(true);
    setStatus('Clearing database...');
    setResult(null);

    try {
      const response = await fetch('/api/seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear' }),
      });

      const data = await response.json();
      setStatus('✅ Database cleared');
    } catch (error) {
      setStatus('❌ Error: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    setLoading(true);
    setStatus('Refreshing real data...');

    try {
      const response = await fetch('/api/data/ingest', {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        setStatus('✅ Data refreshed successfully!');
        setResult(data.status);
        // Reload health data
        loadHealthData();
      } else {
        setStatus('❌ Data refresh failed');
      }
    } catch (error) {
      setStatus('❌ Error: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const loadHealthData = async () => {
    try {
      const response = await fetch('/api/data/health');
      const data = await response.json();
      if (data.success) {
        setHealthData(data.health);
      }
    } catch (error) {
      console.error('Failed to load health data:', error);
    }
  };

  // Load health data on mount
  useEffect(() => {
    loadHealthData();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Trade Nest Setup
          </h1>
          <p className="text-gray-600 mb-8">
            Database initialization and seeding tools
          </p>

          <div className="space-y-6">
            {/* Step 1 */}
            <div className="border-l-4 border-blue-500 pl-4">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Step 1: Run Database Migration
              </h2>
              <p className="text-gray-600 mb-4">
                Go to your Supabase dashboard SQL Editor and run the migration file:
              </p>
              <code className="block bg-gray-100 p-4 rounded text-sm mb-4">
                supabase/migrations/001_initial_schema.sql
              </code>
              <a
                href="https://fckszlhkvdnrvgsjymgs.supabase.co"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition"
              >
                Open Supabase Dashboard
              </a>
            </div>

            {/* Step 2 */}
            <div className="border-l-4 border-green-500 pl-4">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Step 2: Seed Mock Data
              </h2>
              <p className="text-gray-600 mb-4">
                Populate the database with 6 months of historical data and demo anomalies.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={runSeed}
                  disabled={loading}
                  className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
                >
                  {loading ? 'Processing...' : 'Seed Database'}
                </button>
                <button
                  onClick={clearDatabase}
                  disabled={loading}
                  className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
                >
                  Clear Database
                </button>
              </div>
            </div>

            {/* Status */}
            {status && (
              <div className="border-l-4 border-yellow-500 pl-4">
                <h3 className="font-semibold text-gray-900 mb-2">Status</h3>
                <p className="text-gray-700">{status}</p>
              </div>
            )}

            {/* Results */}
            {result && result.success && result.stats && (
              <div className="border-l-4 border-purple-500 pl-4">
                <h3 className="font-semibold text-gray-900 mb-2">
                  Seeding Summary
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded">
                    <div className="text-2xl font-bold text-blue-600">
                      {result.stats.products}
                    </div>
                    <div className="text-sm text-gray-600">Products</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded">
                    <div className="text-2xl font-bold text-blue-600">
                      {result.stats.prices.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">Price Records</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded">
                    <div className="text-2xl font-bold text-blue-600">
                      {result.stats.tariffs}
                    </div>
                    <div className="text-sm text-gray-600">Tariff Records</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded">
                    <div className="text-2xl font-bold text-blue-600">
                      {result.stats.fxRates.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">FX Rates</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded">
                    <div className="text-2xl font-bold text-blue-600">
                      {result.stats.freight.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">Freight Indexes</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded">
                    <div className="text-2xl font-bold text-red-600">
                      {result.stats.anomalies}
                    </div>
                    <div className="text-sm text-gray-600">Anomalies Detected</div>
                  </div>
                </div>
              </div>
            )}

            {/* Data Refresh */}
            <div className="border-l-4 border-purple-500 pl-4">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Step 3: Refresh Real Data
              </h2>
              <p className="text-gray-600 mb-4">
                Update data from real sources (BNM FX rates, MATRADE statistics).
              </p>
              <button
                onClick={refreshData}
                disabled={loading}
                className="bg-purple-600 text-white px-6 py-2 rounded hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
              >
                {loading ? 'Refreshing...' : 'Refresh Real Data'}
              </button>

              {/* Health Status */}
              {healthData && (
                <div className="mt-4 grid grid-cols-2 gap-4">
                  {Object.entries(healthData.sources || {}).map(([key, source]: [string, any]) => (
                    <div key={key} className="bg-gray-50 p-4 rounded">
                      <div className="text-sm font-semibold text-gray-700 mb-2">{source.name}</div>
                      <div className="text-xs text-gray-600">Records: {source.recordCount.toLocaleString()}</div>
                      <div className="text-xs text-gray-600">
                        Status: <span className={source.status === 'healthy' ? 'text-green-600' : 'text-yellow-600'}>
                          {source.status}
                        </span>
                      </div>
                      {source.lastUpdated && (
                        <div className="text-xs text-gray-500 mt-1">
                          Last: {new Date(source.lastUpdated).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Next Steps */}
            <div className="border-l-4 border-indigo-500 pl-4">
              <h3 className="font-semibold text-gray-900 mb-2">
                Next Steps
              </h3>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                <li>Build the dashboard UI (Phase 3)</li>
                <li>Implement anomaly detection logic (Phase 2)</li>
                <li>Create alert management interface</li>
                <li>Add PDF evidence generation</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}