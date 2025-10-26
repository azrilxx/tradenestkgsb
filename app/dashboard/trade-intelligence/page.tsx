'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ShipmentData {
  id: string;
  shipment_date: string;
  arrival_date: string;
  vessel_name: string;
  container_count: number;
  weight_kg: number;
  volume_m3: number;
  unit_price: number;
  total_value: number;
  currency: string;
  freight_cost: number;
  invoice_number: string;
  bl_number: string;
  hs_code: string;
  company_id: string;
  company_name: string;
  company_country: string;
  company_type: string;
  company_sector: string;
  product_id: string;
  product_description: string;
  product_category: string;
  origin_port_id: string;
  origin_port_name: string;
  origin_port_code: string;
  origin_country: string;
  destination_port_id: string;
  destination_port_name: string;
  destination_port_code: string;
  destination_country: string;
}

interface DrillDownStats {
  totalShipments: number;
  totalValue: number;
  averagePrice: number;
  topCompanies: Array<{
    name: string;
    totalValue: number;
    shipments: number;
  }>;
  topCountries: Array<{
    country: string;
    shipments: number;
  }>;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export default function TradeIntelligencePage() {
  const [shipments, setShipments] = useState<ShipmentData[]>([]);
  const [stats, setStats] = useState<DrillDownStats | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [filters, setFilters] = useState({
    hs_code: '',
    company: '',
    country: '',
    port: '',
    start_date: '',
    end_date: '',
  });

  const [currentPage, setCurrentPage] = useState(1);

  // Fetch data
  const fetchData = async (page: number = 1) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value !== '')
        ),
      });

      const response = await fetch(`/api/trade/drilldown?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch data');
      }

      setShipments(data.data.shipments);
      setStats(data.data.stats);
      setPagination(data.data.pagination);
      setCurrentPage(page);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchData();
  }, []);

  // Handle filter changes
  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchData(1);
  };

  const handleClearFilters = () => {
    setFilters({
      hs_code: '',
      company: '',
      country: '',
      port: '',
      start_date: '',
      end_date: '',
    });
    setCurrentPage(1);
    fetchData(1);
  };

  const handlePageChange = (page: number) => {
    fetchData(page);
  };

  const formatCurrency = (amount: number, currency: string = 'MYR') => {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatWeight = (kg: number) => {
    if (kg >= 1000) {
      return `${(kg / 1000).toFixed(1)} tons`;
    }
    return `${kg.toLocaleString()} kg`;
  };

  return (
    <div className="p-6 ml-64">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Trade Intelligence</h1>
          <p className="text-gray-600">
            Drill down into shipment data and analyze trade patterns across Malaysian companies
          </p>
        </div>

        {/* Filters */}
        <Card className="p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Search & Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                HS Code
              </label>
              <input
                type="text"
                value={filters.hs_code}
                onChange={(e) => handleFilterChange('hs_code', e.target.value)}
                placeholder="e.g., 7208"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company
              </label>
              <input
                type="text"
                value={filters.company}
                onChange={(e) => handleFilterChange('company', e.target.value)}
                placeholder="e.g., MegaSteel"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Country
              </label>
              <input
                type="text"
                value={filters.country}
                onChange={(e) => handleFilterChange('country', e.target.value)}
                placeholder="e.g., China"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Port
              </label>
              <input
                type="text"
                value={filters.port}
                onChange={(e) => handleFilterChange('port', e.target.value)}
                placeholder="e.g., Port Klang"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={filters.start_date}
                onChange={(e) => handleFilterChange('start_date', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={filters.end_date}
                onChange={(e) => handleFilterChange('end_date', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSearch} className="bg-blue-600 hover:bg-blue-700">
              Search
            </Button>
            <Button onClick={handleClearFilters} variant="outline">
              Clear Filters
            </Button>
          </div>
        </Card>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <Card className="p-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.totalShipments}</div>
                <div className="text-sm text-gray-600">Total Shipments</div>
              </div>
            </Card>
            <Card className="p-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(stats.totalValue)}
                </div>
                <div className="text-sm text-gray-600">Total Value</div>
              </div>
            </Card>
            <Card className="p-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {formatCurrency(stats.averagePrice)}
                </div>
                <div className="text-sm text-gray-600">Avg Price/kg</div>
              </div>
            </Card>
            <Card className="p-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {stats.topCompanies.length}
                </div>
                <div className="text-sm text-gray-600">Active Companies</div>
              </div>
            </Card>
          </div>
        )}

        {/* Top Companies & Countries */}
        {stats && (stats.topCompanies.length > 0 || stats.topCountries.length > 0) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Top Companies by Value</h3>
              <div className="space-y-2">
                {stats.topCompanies.slice(0, 5).map((company, index) => (
                  <div key={company.name} className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                      <span className="text-sm">{company.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold">{formatCurrency(company.totalValue)}</div>
                      <div className="text-xs text-gray-500">{company.shipments} shipments</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Top Countries by Volume</h3>
              <div className="space-y-2">
                {stats.topCountries.slice(0, 5).map((country, index) => (
                  <div key={country.country} className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                      <span className="text-sm">{country.country}</span>
                    </div>
                    <div className="text-sm font-semibold">{country.shipments} shipments</div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* Shipments Table */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Shipment Details</h2>
            {pagination && (
              <div className="text-sm text-gray-600">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                {pagination.total} results
              </div>
            )}
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="text-gray-500">Loading shipment data...</div>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <div className="text-red-500">Error: {error}</div>
              <Button onClick={() => fetchData(currentPage)} className="mt-2">
                Retry
              </Button>
            </div>
          ) : shipments.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-500">No shipments found matching your criteria</div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full table-auto">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Date</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Company</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Route</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Vessel</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Weight</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Value</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">HS Code</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Sector</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shipments.map((shipment) => (
                      <tr key={shipment.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="text-sm">
                            <div className="font-medium">{shipment.shipment_date}</div>
                            <div className="text-gray-500 text-xs">Arr: {shipment.arrival_date}</div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-sm">
                            <div className="font-medium">{shipment.company_name}</div>
                            <div className="text-gray-500 text-xs">{shipment.company_country}</div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-sm">
                            <div className="font-medium">
                              {shipment.origin_port_name} → {shipment.destination_port_name}
                            </div>
                            <div className="text-gray-500 text-xs">
                              {shipment.origin_country} → {shipment.destination_country}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-sm">
                            <div className="font-medium">{shipment.vessel_name}</div>
                            <div className="text-gray-500 text-xs">{shipment.container_count} containers</div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-sm">
                            <div className="font-medium">{formatWeight(shipment.weight_kg)}</div>
                            <div className="text-gray-500 text-xs">{shipment.volume_m3.toFixed(1)} m³</div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-sm">
                            <div className="font-medium">{formatCurrency(shipment.total_value)}</div>
                            <div className="text-gray-500 text-xs">
                              {formatCurrency(shipment.unit_price)}/kg
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="default">{shipment.hs_code}</Badge>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="default">{shipment.company_sector}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-6">
                  <Button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={!pagination.hasPrev}
                    variant="outline"
                  >
                    Previous
                  </Button>

                  <div className="flex gap-1">
                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                      const page = i + 1;
                      return (
                        <Button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          variant={page === currentPage ? 'primary' : 'outline'}
                          className="w-10"
                        >
                          {page}
                        </Button>
                      );
                    })}
                  </div>

                  <Button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={!pagination.hasNext}
                    variant="outline"
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
