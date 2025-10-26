'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Correlation {
  product_a: {
    id: string;
    hs_code: string;
    category: string;
  };
  product_b: {
    id: string;
    hs_code: string;
    category: string;
  };
  correlation_coefficient: number;
  correlation_type: 'positive' | 'negative' | 'neutral';
  strength: 'weak' | 'moderate' | 'strong';
  interpretation: string;
}

interface SectorCorrelation {
  sector: string;
  correlated_products: Array<{
    product_id: string;
    hs_code: string;
    correlation: number;
  }>;
  trend_direction: 'up' | 'down' | 'stable';
  significance: 'high' | 'medium' | 'low';
}

export default function CorrelationDashboard() {
  const [correlations, setCorrelations] = useState<Correlation[]>([]);
  const [sectors, setSectors] = useState<SectorCorrelation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'sectors'>('all');

  useEffect(() => {
    loadData();
  }, [activeTab]);

  async function loadData() {
    setLoading(true);
    try {
      if (activeTab === 'all') {
        const response = await fetch('/api/analytics/correlation?type=all');
        const data = await response.json();
        setCorrelations(data.correlations || []);
      } else {
        const response = await fetch('/api/analytics/correlation?type=sector');
        const data = await response.json();
        setSectors(data.sectors || []);
      }
    } catch (error) {
      console.error('Error loading correlation data:', error);
    } finally {
      setLoading(false);
    }
  }

  const getCorrelationColor = (coefficient: number) => {
    const absCoeff = Math.abs(coefficient);
    if (absCoeff > 0.7) return 'bg-red-500';
    if (absCoeff > 0.4) return 'bg-orange-500';
    if (absCoeff > 0.2) return 'bg-yellow-500';
    return 'bg-gray-300';
  };

  const getStrengthColor = (strength: string) => {
    switch (strength) {
      case 'strong':
        return 'bg-red-100 text-red-800';
      case 'moderate':
        return 'bg-orange-100 text-orange-800';
      case 'weak':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Cross-Sector Correlation Analysis</h1>
          <p className="text-gray-600 mt-2">
            Understand relationships across different sectors and products
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-2 border-b">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 font-medium ${activeTab === 'all'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
            }`}
        >
          All Correlations ({correlations.length})
        </button>
        <button
          onClick={() => setActiveTab('sectors')}
          className={`px-4 py-2 font-medium ${activeTab === 'sectors'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
            }`}
        >
          Sector Analysis ({sectors.length})
        </button>
      </div>

      {/* All Correlations View */}
      {activeTab === 'all' && (
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Product Correlations</h2>
              <Badge variant="outline">{correlations.length} correlations found</Badge>
            </div>

            {correlations.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                No correlations found. Try running analytics on your data.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Product A
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Product B
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Strength
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Coefficient
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Interpretation
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {correlations.map((corr, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium">
                            {corr.product_a.hs_code}
                          </div>
                          <div className="text-xs text-gray-500">{corr.product_a.category}</div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium">
                            {corr.product_b.hs_code}
                          </div>
                          <div className="text-xs text-gray-500">{corr.product_b.category}</div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <Badge className={getStrengthColor(corr.strength)}>{corr.strength}</Badge>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${getCorrelationColor(corr.correlation_coefficient)}`}
                                style={{ width: `${Math.abs(corr.correlation_coefficient) * 100}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium">
                              {corr.correlation_coefficient.toFixed(2)}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-sm text-gray-600">{corr.interpretation}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Sector Analysis View */}
      {activeTab === 'sectors' && (
        <div className="grid grid-cols-1 gap-6">
          {sectors.map((sector, idx) => (
            <Card key={idx} className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">{sector.sector}</h3>
                <div className="flex space-x-2">
                  <Badge className={getStrengthColor(sector.significance)}>
                    {sector.significance} significance
                  </Badge>
                  <Badge
                    className={
                      sector.trend_direction === 'up'
                        ? 'bg-green-100 text-green-800'
                        : sector.trend_direction === 'down'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                    }
                  >
                    {sector.trend_direction}
                  </Badge>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm text-gray-600">
                  {sector.correlated_products.length} correlated products
                </div>
                <div className="flex flex-wrap gap-2">
                  {sector.correlated_products.slice(0, 10).map((product, pIdx) => (
                    <Badge key={pIdx} variant="outline">
                      {product.hs_code} ({product.correlation.toFixed(2)})
                    </Badge>
                  ))}
                </div>
              </div>
            </Card>
          ))}

          {sectors.length === 0 && (
            <Card className="p-12">
              <div className="text-center text-gray-500">
                No sector correlations available. This requires historical shipment data.
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

