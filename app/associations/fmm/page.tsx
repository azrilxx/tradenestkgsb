'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { TrendingUp, TrendingDown, Bell, AlertCircle, Users, Package } from 'lucide-react';

interface SectorStats {
  total_companies: number;
  total_shipments: number;
  total_value: number;
  critical_alerts: number;
  new_alerts: number;
}

const sectors = [
  {
    id: 'steel',
    name: 'Steel & Metals',
    companies: 12,
    color: 'bg-gray-600',
    description: 'Primary demo sector - flat-rolled steel, iron/steel bars',
    hs_codes: ['7208', '7214'],
  },
  {
    id: 'electronics',
    name: 'Electronics & Electrical',
    companies: 15,
    color: 'bg-blue-600',
    description: 'High-value sector - integrated circuits, computers, telecom',
    hs_codes: ['8542', '8471', '8517'],
  },
  {
    id: 'chemicals',
    name: 'Chemicals & Petrochemicals',
    companies: 12,
    color: 'bg-purple-600',
    description: 'Complex pricing - hydrocarbons, polymers, petroleum oils',
    hs_codes: ['2902', '3901', '2710'],
  },
  {
    id: 'food',
    name: 'Food & Beverage',
    companies: 10,
    color: 'bg-green-600',
    description: 'Agricultural imports - wheat, soybean oil, cane sugar',
    hs_codes: ['1001', '1507', '1701'],
  },
  {
    id: 'textiles',
    name: 'Textiles & Apparel',
    companies: 6,
    color: 'bg-pink-600',
    description: 'Labor-intensive - cotton yarn, suits, t-shirts',
    hs_codes: ['5205', '6204', '6109'],
  },
  {
    id: 'automotive',
    name: 'Automotive & Parts',
    companies: 5,
    color: 'bg-red-600',
    description: 'Supply chain complexity - vehicle parts, motor cars, tires',
    hs_codes: ['8708', '8703', '4011'],
  },
];

export default function FMMDashboardPage() {
  const [selectedSector, setSelectedSector] = useState(sectors[0]);
  const [stats, setStats] = useState<SectorStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data loading
    setTimeout(() => {
      setStats({
        total_companies: selectedSector.companies,
        total_shipments: Math.floor(Math.random() * 200) + 100,
        total_value: Math.floor(Math.random() * 50000000) + 20000000,
        critical_alerts: Math.floor(Math.random() * 5),
        new_alerts: Math.floor(Math.random() * 15),
      });
      setLoading(false);
    }, 500);
  }, [selectedSector]);

  return (
    <div className="container mx-auto p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
            FMM
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              FMM Sector Dashboard
            </h1>
            <p className="text-gray-600">
              Federation of Malaysian Manufacturers - Sector Intelligence
            </p>
          </div>
        </div>
      </div>

      {/* Sector Selector */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex gap-2 flex-wrap">
          {sectors.map((sector) => (
            <button
              key={sector.id}
              onClick={() => setSelectedSector(sector)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${selectedSector.id === sector.id
                  ? `${sector.color} text-white`
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              {sector.name}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading sector data...</div>
      ) : stats && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center gap-3 mb-2">
                <Users className="w-5 h-5 text-blue-600" />
                <p className="text-sm text-gray-600">Companies</p>
              </div>
              <p className="text-3xl font-bold text-gray-900">{stats.total_companies}</p>
              <p className="text-xs text-gray-500 mt-1">{selectedSector.name}</p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center gap-3 mb-2">
                <Package className="w-5 h-5 text-green-600" />
                <p className="text-sm text-gray-600">Shipments</p>
              </div>
              <p className="text-3xl font-bold text-gray-900">{stats.total_shipments}</p>
              <p className="text-xs text-gray-500 mt-1">Total tracked</p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="w-5 h-5 text-purple-600" />
                <p className="text-sm text-gray-600">Total Value</p>
              </div>
              <p className="text-3xl font-bold text-gray-900">
                RM {(stats.total_value / 1000000).toFixed(1)}M
              </p>
              <p className="text-xs text-gray-500 mt-1">Sector volume</p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center gap-3 mb-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <p className="text-sm text-gray-600">Critical</p>
              </div>
              <p className="text-3xl font-bold text-red-600">{stats.critical_alerts}</p>
              <p className="text-xs text-gray-500 mt-1">
                {stats.new_alerts} new alerts
              </p>
            </div>
          </div>

          {/* Sector Info */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {selectedSector.name} Overview
            </h3>
            <p className="text-gray-700 mb-4">{selectedSector.description}</p>
            <div className="flex flex-wrap gap-2">
              {selectedSector.hs_codes.map((code) => (
                <Link
                  key={code}
                  href={`/dashboard/benchmarks?hs_code=${code}`}
                  className="bg-blue-100 text-blue-700 text-sm px-3 py-1 rounded-lg hover:bg-blue-200 transition-colors"
                >
                  HS: {code}
                </Link>
              ))}
            </div>
          </div>

          {/* Sector Alerts */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Recent Sector Alerts
              </h3>
              <Link
                href="/dashboard/alerts"
                className="text-blue-600 hover:text-blue-700 text-sm"
              >
                View All
              </Link>
            </div>
            <div className="text-center py-8 text-gray-500">
              No recent alerts for {selectedSector.name} sector
            </div>
          </div>
        </>
      )}
    </div>
  );
}

