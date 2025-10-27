'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Building2, Search, Globe, TrendingUp, Package, Filter } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

interface Company {
  id: string;
  name: string;
  country: string;
  type: string;
  sector: string;
  total_shipments: number;
  total_value: number;
}

export default function CompaniesPage() {
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedSector, setSelectedSector] = useState('all');

  useEffect(() => {
    async function fetchCompanies() {
      try {
        // First try to get companies directly from database
        const { data: dbCompanies, error } = await supabase
          .from('companies')
          .select('*')
          .order('name', { ascending: true });

        if (!error && dbCompanies && dbCompanies.length > 0) {
          // Get shipment stats for each company
          const companiesWithStats: Company[] = await Promise.all(
            dbCompanies.map(async (company) => {
              const { data: shipments } = await supabase
                .from('shipments')
                .select('total_value')
                .eq('company_id', company.id);

              const total_shipments = shipments?.length || 0;
              const total_value = shipments?.reduce((sum, s) => sum + (s.total_value || 0), 0) || 0;

              return {
                id: company.id,
                name: company.name,
                country: company.country,
                type: company.type,
                sector: company.sector,
                total_shipments,
                total_value,
              };
            })
          );

          setCompanies(companiesWithStats);
        } else {
          // Fallback: extract from shipments
          const response = await fetch('/api/trade/drilldown?limit=100');
          const result = await response.json();

          if (result.success && result.data?.shipments) {
            const companyMap = new Map<string, Company>();

            result.data.shipments.forEach((shipment: any) => {
              if (!companyMap.has(shipment.company_id)) {
                companyMap.set(shipment.company_id, {
                  id: shipment.company_id,
                  name: shipment.company_name,
                  country: shipment.company_country,
                  type: shipment.company_type,
                  sector: shipment.company_sector,
                  total_shipments: 0,
                  total_value: 0,
                });
              }

              const company = companyMap.get(shipment.company_id)!;
              company.total_shipments += 1;
              company.total_value += shipment.total_value || 0;
            });

            setCompanies(Array.from(companyMap.values()));
          }
        }
      } catch (err) {
        console.error('Error fetching companies:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchCompanies();
  }, []);

  const filteredCompanies = companies.filter(company => {
    const matchesSearch = !searchQuery ||
      company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      company.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
      company.sector.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = selectedType === 'all' || company.type === selectedType;
    const matchesSector = selectedSector === 'all' || company.sector === selectedSector;

    return matchesSearch && matchesType && matchesSector;
  });

  const uniqueSectors = Array.from(new Set(companies.map(c => c.sector))).sort();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'MYR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getTypeBadgeColor = (type: string) => {
    if (type === 'importer') return 'bg-blue-100 text-blue-800';
    if (type === 'exporter') return 'bg-green-100 text-green-800';
    return 'bg-purple-100 text-purple-800';
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-12 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Building2 className="h-8 w-8 text-blue-600" />
            Company Directory
          </h1>
          <p className="text-gray-600 mt-2">
            Explore companies and their trade activities
          </p>
        </div>
      </div>

      {/* Search & Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search companies by name, country, or sector..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Filters */}
            <div className="flex gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-600" />
                <label className="text-sm font-medium text-gray-700">Type:</label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="border rounded px-3 py-1.5 text-sm"
                >
                  <option value="all">All Types</option>
                  <option value="importer">Importer</option>
                  <option value="exporter">Exporter</option>
                  <option value="both">Both</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Sector:</label>
                <select
                  value={selectedSector}
                  onChange={(e) => setSelectedSector(e.target.value)}
                  className="border rounded px-3 py-1.5 text-sm min-w-[200px]"
                >
                  <option value="all">All Sectors</option>
                  {uniqueSectors.map(sector => (
                    <option key={sector} value={sector}>{sector}</option>
                  ))}
                </select>
              </div>

              {(selectedType !== 'all' || selectedSector !== 'all') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedType('all');
                    setSelectedSector('all');
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-gray-600">Total Companies</div>
            <div className="text-3xl font-bold mt-2">{companies.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-gray-600">Total Shipments</div>
            <div className="text-3xl font-bold mt-2">
              {companies.reduce((sum, c) => sum + c.total_shipments, 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-gray-600">Total Trade Value</div>
            <div className="text-3xl font-bold mt-2">
              {formatCurrency(companies.reduce((sum, c) => sum + c.total_value, 0))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Companies Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">
            Companies ({filteredCompanies.length})
          </h2>
        </div>

        {filteredCompanies.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-500">No companies found matching your search.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCompanies.map((company) => (
              <Card
                key={company.id}
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push(`/companies/${company.id}`)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-bold line-clamp-2 mb-2">
                        {company.name}
                      </CardTitle>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                        <Globe className="h-4 w-4" />
                        {company.country}
                      </div>
                      <Badge className={getTypeBadgeColor(company.type)}>
                        {company.type}
                      </Badge>
                      <div className="mt-2">
                        <Badge variant="outline">{company.sector}</Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div>
                      <div className="text-xs text-gray-500">Shipments</div>
                      <div className="text-lg font-semibold flex items-center gap-1">
                        <Package className="h-4 w-4" />
                        {company.total_shipments.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Trade Value</div>
                      <div className="text-lg font-semibold flex items-center gap-1">
                        <TrendingUp className="h-4 w-4" />
                        {formatCurrency(company.total_value)}
                      </div>
                    </div>
                  </div>
                  <Button
                    className="w-full mt-4"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/companies/${company.id}`);
                    }}
                  >
                    View Profile
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

