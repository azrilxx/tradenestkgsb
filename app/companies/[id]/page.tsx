'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, Area, AreaChart
} from 'recharts';
import {
  Building2, MapPin, TrendingUp, Package, Truck, Globe,
  Calendar, ArrowRight, Download, Share2, PlusCircle, Zap, Star, Route,
  TrendingDown, Users, Activity, AlertCircle, CheckCircle
} from 'lucide-react';
import { motion } from 'framer-motion';

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

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
const PREMIUM_COLORS = ['#6366F1', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981'];

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
      currency: 'MYR',
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

  // Calculate trend for stats (mock data for demo)
  const getTrend = (value: number) => {
    return { value: Math.floor(Math.random() * 30) - 10, isUp: Math.random() > 0.5 };
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="w-full bg-gradient-to-br from-gray-50 to-blue-50/30 min-h-screen p-6">
      {/* Premium Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative mb-8"
      >
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-[2px]">
          <div className="relative bg-white rounded-2xl p-8">
            <div className="flex items-start justify-between flex-wrap gap-6">
              <div className="flex items-start gap-6">
                {/* Large Company Icon with Gradient */}
                <div className="relative">
                  <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-xl flex items-center justify-center">
                    <Building2 className="h-12 w-12 text-white" />
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-4 border-white flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 text-white" />
                  </div>
                </div>

                <div className="flex-1">
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-3">
                    {company.name}
                  </h1>

                  <div className="flex items-center flex-wrap gap-3 mb-4">
                    <Badge className="bg-blue-100 text-blue-700 border-blue-300">
                      <MapPin className="h-3 w-3 mr-1.5" />
                      {company.country}
                    </Badge>

                    <Badge className="bg-purple-100 text-purple-700 border-purple-300">
                      <Zap className="h-3 w-3 mr-1.5" />
                      {company.sector}
                    </Badge>

                    <Badge className="bg-green-100 text-green-700 border-green-300">
                      <Activity className="h-3 w-3 mr-1.5" />
                      Active
                    </Badge>
                  </div>

                  <div className="flex items-center gap-6 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      <span className="font-medium">{company.type.charAt(0).toUpperCase() + company.type.slice(1)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Route className="h-4 w-4" />
                      <span>Est. {company.stats.first_shipment_date ? new Date(company.stats.first_shipment_date).getFullYear() : 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300">
                  <Download className="h-4 w-4 mr-2" />
                  Export Report
                </Button>
                <Button variant="outline" className="border-2 hover:bg-gray-50">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
                <Button variant="ghost" className="hover:bg-gray-100">
                  <Star className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Premium Stats Cards */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8"
      >
        {[
          { label: 'Total Shipments', value: company.stats.total_shipments, icon: Package, color: 'from-blue-500 to-blue-600', trend: getTrend(company.stats.total_shipments) },
          { label: 'Total Value', value: formatCurrency(company.stats.total_value), icon: TrendingUp, color: 'from-green-500 to-emerald-600', trend: getTrend(company.stats.total_value) },
          { label: 'Products', value: company.stats.unique_products, icon: Package, color: 'from-purple-500 to-purple-600', trend: getTrend(company.stats.unique_products) },
          { label: 'Routes', value: company.stats.unique_routes, icon: Route, color: 'from-orange-500 to-orange-600', trend: getTrend(company.stats.unique_routes) },
          { label: 'Since', value: formatDate(company.stats.first_shipment_date), icon: Calendar, color: 'from-pink-500 to-pink-600', trend: null },
        ].map((stat, idx) => (
          <motion.div key={idx} variants={itemVariants} whileHover={{ scale: 1.02 }} className="group">
            <div className="relative h-full p-6 bg-white rounded-xl border border-gray-200 hover:border-blue-200 hover:shadow-lg transition-all duration-300 overflow-hidden">
              {/* Gradient top accent */}
              <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${stat.color}`} />

              {/* Trend Indicator */}
              {stat.trend && (
                <div className={`absolute top-4 right-4 flex items-center gap-1 ${stat.trend.isUp ? 'text-green-600' : 'text-red-600'}`}>
                  {stat.trend.isUp ? <TrendingUp className="h-4 w-4 animate-pulse" /> : <TrendingDown className="h-4 w-4" />}
                  <span className={`text-xs font-bold ${stat.trend.isUp ? 'text-green-600' : 'text-red-600'}`}>
                    {stat.trend.isUp ? '+' : ''}{stat.trend.value}%
                  </span>
                </div>
              )}

              {/* Icon with gradient background */}
              <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-md`}>
                <stat.icon className="h-7 w-7 text-white" />
              </div>

              {/* Label */}
              <div className="text-gray-600 text-sm mb-2">{stat.label}</div>

              {/* Value */}
              <div className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-3">
                {stat.value}
              </div>

              {/* Progress bar */}
              <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full bg-gradient-to-r ${stat.color} rounded-full`}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((idx + 1) * 20, 100)}%` }}
                  transition={{ duration: 1, delay: idx * 0.1 }}
                />
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Main Content Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 xl:grid-cols-3 gap-6"
      >
        {/* Left Column - Activity Feed */}
        <motion.div variants={itemVariants} className="lg:col-span-1">
          <div className="relative bg-white/80 backdrop-blur-lg rounded-xl border border-gray-200/50 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] hover:shadow-[0_12px_48px_0_rgba(31,38,135,0.12)] transition-all duration-300 overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Company Activity</h2>
              </div>

              <div className="space-y-4 max-h-96 overflow-y-auto">
                {company.activity_feed.length > 0 ? (
                  company.activity_feed.map((activity, idx) => (
                    <div key={idx} className="relative border-l-2 border-blue-500 pl-4 pb-4">
                      <div className="absolute -left-2 top-0 w-4 h-4 bg-blue-500 rounded-full border-2 border-white" />
                      <div className="text-xs text-gray-500 mb-2 font-medium">
                        {formatDate(activity.date)}
                      </div>
                      <div className="text-sm text-gray-800">{activity.description}</div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 text-center py-8">No recent activity</p>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-gray-200">
                <Button variant="ghost" size="sm" className="w-full">
                  <PlusCircle className="h-4 w-4 mr-2" />
                  See all activities
                </Button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Middle Column - Charts */}
        <motion.div variants={itemVariants} className="lg:col-span-1 space-y-6">
          {/* Shipping Activity Chart */}
          <div className="relative bg-white/80 backdrop-blur-lg rounded-xl border border-gray-200/50 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] hover:shadow-[0_12px_48px_0千万(31,38,135,0.12)] transition-all duration-300 overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500" />
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-gradient-to增进 from-green-500 to-emerald-600 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Shipping Activity</h2>
              </div>

              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={company.shipping_activity}>
                  <defs>
                    <linearGradient id="colorShipments" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis dataKey="month" tickFormatter={formatMonth} tick={{ fill: '#6B7280', fontSize: 12 }} axisLine={{ stroke: '#E5E7EB' }} tickLine={false} />
                  <YAxis tick={{ fill: '#6B7280', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #E5E7EB',
                      borderRadius: '12px',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="shipments"
                    stroke="none"
                    fillOpacity={1}
                    fill="url(#colorShipments)"
                  />
                  <Line
                    type="monotone"
                    dataKey="shipments"
                    stroke="#10B981"
                    strokeWidth={3}
                    dot={{ fill: '#10B981', r: 4, strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 6 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Products with Premium Styling */}
          <div className="relative bg-white/80 backdrop-blur-lg rounded-xl border border-gray-200/50 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] hover:shadow-[0_12px_48px_0_rgba(31,38,135,0.12)] transition-all duration-300 overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-red-500" />
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                  <Package className="h-5 w-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Top Products</h2>
              </div>

              {company.top_products.length > 0 ? (
                <div className="space-y-4">
                  {company.top_products.map((product, idx) => (
                    <div key={idx} className="group relative p-4 rounded-lg border border-gray-100 hover:border-purple-200 hover:shadow-md transition-all duration-300 bg-gradient-to-r from-white to-purple-50/50">
                      {/* Rank badge */}
                      <div className="absolute top-3 right-3 w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white text-xs font-bold group-hover:scale-110 transition-transform shadow-md">
                        {idx + 1}
                      </div>

                      <div className="flex items-center gap-3 mb-3">
                        <div className="px-3 py-1 rounded-md bg-gradient-to-r from-purple-100 to-pink-100 border border-purple-200">
                          <span className="text-sm font-bold text-purple-700">{product.hs_code}</span>
                        </div>
                        <span className="text-xs text-gray-600">{product.shipments.toLocaleString()} shipments</span>
                      </div>

                      <div className="text-sm text-gray-800 mb-3 line-clamp-1">{product.description}</div>

                      <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
                        <motion.div
                          className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${product.percentage}%` }}
                          transition={{ duration: 1, delay: idx * 0.1 }}
                        />
                        <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
                          {product.percentage.toFixed(1)}%
                        </span>
                      </div>

                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-xs text-gray-500">Total Value</span>
                        <span className="text-sm font-bold text-gray-900">{formatCurrency(product.total_value)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-8">No product data available</p>
              )}

              <Button variant="ghost" size="sm" className="w-full mt-4">
                See all products
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Right Column - Trading Partners */}
        <motion.div variants={itemVariants} className="lg:col-span-1 space-y-6">
          {/* Top Carriers */}
          <div className="relative bg-white/80 backdrop-blur-lg rounded-xl border border-gray-200/50 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] hover:shadow-[0_12px_48px_0_rgba(31,38,135,0.12)] transition-all duration-300 overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 via-red-500 to-pink-500" />
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
                  <Truck className="h-5 w-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Top Carriers</h2>
              </div>

              {company.top_carriers.length > 0 ? (
                <div className="space-y-4">
                  {company.top_carriers.map((carrier, idx) => (
                    <div key={idx} className="group relative p-4 rounded-lg border border-gray-100 hover:border-orange-200 hover:shadow-md transition-all duration-300">
                      <div className="absolute top-3 right-3 w-7 h-7 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white text-xs font-bold group-hover:scale-110 transition-transform">
                        {idx + 1}
                      </div>

                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-gray-900">{carrier.vessel_name}</span>
                        <span className="text-xs text-gray-600">{carrier.shipments} shipments</span>
                      </div>

                      <div className="text-xs text-gray-600 mb-3">{(carrier.total_weight / 1000).toFixed(1)} tons</div>

                      <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${carrier.percentage}%` }}
                          transition={{ duration: 1, delay: idx * 0.1 }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-8">No carrier data available</p>
              )}

              <Button variant="ghost" size="sm" className="w-full mt-4">
                See all carriers
              </Button>
            </div>
          </div>

          {/* Top Customers */}
          <div className="relative bg-white/80 backdrop-blur-lg rounded-xl border border-gray-200/50 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] hover:shadow-[0_12px_48px_0_rgba(31,38,135,0.12)] transition-all duration-300 overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Top Customers</h2>
              </div>

              {company.top_customers.length > 0 ? (
                <div className="space-y-3 mb-6">
                  {company.top_customers.map((customer, idx) => (
                    <div key={idx} className="group flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-all duration-300">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                          <Building2 className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-gray-900 truncate">{customer.company_name}</div>
                          <div className="text-xs text-gray-600">{customer.country}</div>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-sm font-bold text-gray-900">{customer.shipments}</div>
                        <div className="text-xs text-gray-500">shipments</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-8">No customer data available</p>
              )}

              <Button variant="ghost" size="sm" className="w-full mt-4">
                See all customers
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Country Distribution */}
      <motion.div
        variants={itemVariants}
        className="mt-6 relative bg-white/80 backdrop-blur-lg rounded-xl border border-gray-200/50 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] hover:shadow-[0_12px_48px_0_rgba(31,38,135,0.12)] transition-all duration-300 overflow-hidden"
      >
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500" />
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
              <Globe className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Country Distribution</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={company.country_distribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ country, percentage }) => `${country}: ${percentage.toFixed(1)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="shipments"
                  >
                    {company.country_distribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PREMIUM_COLORS[index % PREMIUM_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #E5E7EB',
                      borderRadius: '12px',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-4">
              {company.country_distribution.map((country, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded shadow-sm" style={{ backgroundColor: PREMIUM_COLORS[idx % PREMIUM_COLORS.length] }} />
                    <span className="text-sm font-semibold text-gray-900">{country.country}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-gray-900">{country.shipments} shipments</div>
                    <div className="text-xs text-gray-600">{country.percentage.toFixed(1)}%</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
