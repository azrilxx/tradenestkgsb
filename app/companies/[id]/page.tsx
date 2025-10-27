'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import {
  Building2, MapPin, TrendingUp, Package, Truck, Globe,
  Calendar, ArrowRight, Download, Share2, PlusCircle
} from 'lucide-react';

interface CompanyProfile {
  id: string;
  name: string;
  country: string;
  type: string;
  sector: string;
  stats: {
    total_shipments: number;
    total_value: number;
    unique_products: number;
    unique_routes: number;
    first_shipment_date: string | null;
    last_shipment_date: string | null;
  };
  top_products: Array<{
    hs_code: string;
    description: string;
    shipments: number;
    total_value: number;
    percentage: number;
  }>;
  top_suppliers: Array<{
    company_id: string;
    company_name: string;
    country: string;
    shipments: number;
    total_value: number;
    percentage: number;
  }>;
  top_customers: Array<{
    company_id: string;
    company_name: string;
    country: string;
    shipments: number;
    total_value: number;
    percentage: number;
  }>;
  top_carriers: Array<{
    vessel_name: string;
    shipments: number;
    total_weight: number;
    percentage: number;
  }>;
  shipping_activity: Array<{
    month: string;
    shipments: number;
    total_value: number;
    avg_price: number;
  }>;
  activity_feed: Array<{
    date: string;
    type: string;
    description: string;
  }>;
  country_distribution: Array<{
    country: string;
    shipments: number;
    total_value: number;
    percentage: number;
  }>;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function CompanyProfilePage() {
  const params = useParams();
  const companyId = params.id as string;
  const router = useRouter();
  
  const [company, setCompany] = useState<CompanyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCompanyProfile() {
      try {
        const response = await fetch(`/api/companies/${companyId}`);
        const result = await response.json();

        if (!response.ok) {
          setError(result.error || 'Failed to load company profile');
          return;
        }

        setCompany(result.data);
      } catch (err) {
        setError('Failed to load company profile');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    if (companyId) {
      fetchCompanyProfile();
    }
  }, [companyId]);

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-12 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error || 'Company not found'}</p>
        </div>
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'RM',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatMonth = (monthString: string) => {
    return monthString.substring(5, 7) + '/' + monthString.substring(2, 4);
  };

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6 ml-0 md:ml-64">
      {/* Header Section */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-4 mb-2">
            <Building2 className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold">{company.name}</h1>
              <div className="flex items-center gap-2 mt-1 text-gray-600">
                <MapPin className="h-4 w-4" />
                <span>{company.country}</span>
                <Badge variant="outline" className="ml-2">
                  Awareness
                </Badge>
              </div>
            </div>
          </div>
          <p className="text-gray-600 mt-2">
            {company.type.charAt(0).toUpperCase() + company.type.slice(1)} | {company.sector}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
          <Button variant="outline" size="sm">
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-gray-600">Total Shipments</div>
            <div className="text-3xl font-bold mt-2">
              {company.stats.total_shipments.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-gray-600">Total Value</div>
            <div className="text-3xl font-bold mt-2">
              {formatCurrency(company.stats.total_value)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-gray-600">Products</div>
            <div className="text-3xl font-bold mt-2">
              {company.stats.unique_products}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-gray-600">Routes</div>
            <div className="text-3xl font-bold mt-2">
              {company.stats.unique_routes}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-gray-600">First Shipment</div>
            <div className="text-lg font-semibold mt-2">
              {formatDate(company.stats.first_shipment_date)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Activity Feed */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Company Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {company.activity_feed.length > 0 ? (
                  company.activity_feed.map((activity, idx) => (
                    <div key={idx} className="border-l-2 border-blue-500 pl-3 pb-3">
                      <div className="text-xs text-gray-500 mb-1">
                        {formatDate(activity.date)}
                      </div>
                      <div className="text-sm">{activity.description}</div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No recent activity</p>
                )}
              </div>
              <div className="mt-4 pt-4 border-t">
                <Button variant="ghost" size="sm" className="w-full">
                  <PlusCircle className="h-4 w-4 mr-2" />
                  See all activities
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Middle Column - Charts */}
        <div className="lg:col-span-1 space-y-6">
          {/* Shipping Activity Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Shipping Activity Over Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={company.shipping_activity}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tickFormatter={formatMonth} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="shipments"
                    stroke="#0088FE"
                    strokeWidth={2}
                    name="Shipments"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Top Products */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Top Products
              </CardTitle>
            </CardHeader>
            <CardContent>
              {company.top_products.length > 0 ? (
                <div className="space-y-3">
                  {company.top_products.map((product, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{product.hs_code}</span>
                        <span className="text-sm text-gray-600">
                          {product.shipments.toLocaleString()} shipments
                        </span>
                      </div>
                      <div className="text-xs text-gray-600 line-clamp-1">
                        {product.description}
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${product.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No product data available</p>
              )}
              <Button variant="ghost" size="sm" className="w-full mt-4">
                See all products
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Trading Partners & Carriers */}
        <div className="lg:col-span-1 space-y-6">
          {/* Top Suppliers */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Top Suppliers
              </CardTitle>
            </CardHeader>
            <CardContent>
              {company.top_suppliers.length > 0 ? (
                <div className="space-y-3">
                  {company.top_suppliers.map((supplier, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{supplier.company_name}</span>
                        <span className="text-xs text-gray-600">{supplier.shipments}</span>
                      </div>
                      <div className="text-xs text-gray-600">{supplier.country}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No supplier data available</p>
              )}
              <Button variant="ghost" size="sm" className="w-full mt-4">
                See all suppliers
              </Button>
            </CardContent>
          </Card>

          {/* Top Customers */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Top Customers
              </CardTitle>
            </CardHeader>
            <CardContent>
              {company.top_customers.length > 0 ? (
                <div className="space-y-3">
                  {company.top_customers.map((customer, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{customer.company_name}</span>
                        <span className="text-xs text-gray-600">{customer.shipments}</span>
                      </div>
                      <div className="text-xs text-gray-600">{customer.country}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No customer data available</p>
              )}
              <Button variant="ghost" size="sm" className="w-full mt-4">
                See all customers
              </Button>
            </CardContent>
          </Card>

          {/* Top Carriers */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Top Carriers
              </CardTitle>
            </CardHeader>
            <CardContent>
              {company.top_carriers.length > 0 ? (
                <div className="space-y-3">
                  {company.top_carriers.map((carrier, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{carrier.vessel_name}</span>
                        <span className="text-xs text-gray-600">{carrier.shipments}</span>
                      </div>
                      <div className="text-xs text-gray-600">
                        {(carrier.total_weight / 1000).toFixed(1)} tons
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full"
                          style={{ width: `${carrier.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No carrier data available</p>
              )}
              <Button variant="ghost" size="sm" className="w-full mt-4">
                See all carriers
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Country Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Country Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={company.country_distribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ country, percentage }) => `${country}: ${percentage.toFixed(1)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="shipments"
                  >
                    {company.country_distribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3">
              {company.country_distribution.map((country, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                    ></div>
                    <span className="text-sm font-medium">{country.country}</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {country.shipments} shipments ({country.percentage.toFixed(1)}%)
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

