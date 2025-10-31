'use client';

import { useEffect, useState } from 'react';
import { KPICard } from '@/components/dashboard/kpi-card';
import { AlertsTable } from '@/components/dashboard/alerts-table';
import { SeverityChart } from '@/components/dashboard/severity-chart';
import { TrendChart } from '@/components/dashboard/trend-chart';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch statistics
      const statsRes = await fetch('/api/detect');
      const statsData = await statsRes.json();
      setStats(statsData.data);

      // Fetch recent alerts
      const alertsRes = await fetch('/api/alerts?limit=10');
      const alertsData = await alertsRes.json();
      setAlerts(alertsData.data || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (alertId: string, status: string) => {
    try {
      await fetch('/api/alerts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertId, status }),
      });
      // Refresh data
      fetchDashboardData();
    } catch (error) {
      console.error('Error updating alert:', error);
    }
  };

  const handleViewDetails = (alert: any) => {
    const details = alert.anomalies.details;
    const message = `Alert Details:\n\nType: ${alert.anomalies.type}\nSeverity: ${alert.anomalies.severity}\n\nDetails:\n${JSON.stringify(details, null, 2)}`;
    window.alert(message);
  };

  const handleDownloadPDF = async (alert: any) => {
    try {
      // Fetch evidence data
      const response = await fetch(`/api/evidence/${alert.id}`);
      const data = await response.json();
      if (data.success) {
        // Dynamically import the PDF generator
        const { generateAndDownloadEvidence } = await import('@/lib/pdf/evidence-generator');
        generateAndDownloadEvidence(data.data, `evidence-${alert.id}.pdf`);
      } else {
        window.alert('Failed to generate PDF evidence');
      }
    } catch (error) {
      console.error('Error downloading PDF:', error);
      window.alert('Error downloading PDF');
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Skeleton */}
        <div className="flex justify-between items-center">
          <div>
            <div className="h-8 bg-gray-200 rounded w-48 mb-2 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-64 animate-pulse"></div>
          </div>
          <div className="h-10 bg-gray-200 rounded w-24 animate-pulse"></div>
        </div>
        {/* KPI Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-24"></div>
                </div>
                <div className="w-14 h-14 bg-gray-200 rounded-xl"></div>
              </div>
            </div>
          ))}
        </div>
        {/* Charts Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
            <div className="h-48 bg-gray-200 rounded"></div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
        {/* Table Skeleton */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Dashboard Overview</h1>
          <p className="text-gray-500 text-sm mt-1.5">Monitor trade anomalies and alerts in real-time</p>
        </div>
        <div className="flex items-center gap-3">
          <select className="px-4 py-2 text-sm font-medium border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm hover:shadow-md transition-shadow">
            <option>Last 7 days</option>
            <option>Last 30 days</option>
            <option>Last 90 days</option>
          </select>
          <Button onClick={fetchDashboardData} className="flex items-center gap-2 hover:shadow-md transition-shadow">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>
      </div>
      {/* KPI Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <KPICard
            title="Total Alerts"
            value={stats.total}
            icon="bell"
            color="blue"
            subtitle="All time"
            chartData={[
              { value: 12, date: '2024-01-20' },
              { value: 8, date: '2024-01-21' },
              { value: 15, date: '2024-01-22' },
              { value: 6, date: '2024-01-23' },
              { value: 18, date: '2024-01-24' },
              { value: 10, date: '2024-01-25' },
              { value: 14, date: '2024-01-26' },
            ]}
          />
          <KPICard
            title="Critical Alerts"
            value={stats.bySeverity?.critical || 0}
            icon="alert"
            color="red"
            subtitle="Requires immediate action"
            chartData={[
              { value: 2, date: '2024-01-20' },
              { value: 1, date: '2024-01-21' },
              { value: 3, date: '2024-01-22' },
              { value: 0, date: '2024-01-23' },
              { value: 4, date: '2024-01-24' },
              { value: 2, date: '2024-01-25' },
              { value: 3, date: '2024-01-26' },
            ]}
          />
          <KPICard
            title="New Alerts"
            value={stats.new}
            icon="star"
            color="yellow"
            subtitle="Unviewed"
            chartData={[
              { value: 5, date: '2024-01-20' },
              { value: 3, date: '2024-01-21' },
              { value: 7, date: '2024-01-22' },
              { value: 2, date: '2024-01-23' },
              { value: 8, date: '2024-01-24' },
              { value: 4, date: '2024-01-25' },
              { value: 6, date: '2024-01-26' },
            ]}
          />
          <KPICard
            title="Resolved"
            value={stats.resolved}
            icon="check"
            color="green"
            subtitle="Completed"
            chartData={[
              { value: 7, date: '2024-01-20' },
              { value: 5, date: '2024-01-21' },
              { value: 8, date: '2024-01-22' },
              { value: 4, date: '2024-01-23' },
              { value: 10, date: '2024-01-24' },
              { value: 6, date: '2024-01-25' },
              { value: 8, date: '2024-01-26' },
            ]}
          />
        </div>
      )}
      {/* Alert Breakdown */}
      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* By Severity */}
          <Card>
            <CardHeader className="border-b-4 border-blue-500 bg-blue-50">
              <div className="flex items-center justify-between">
                <CardTitle>Alerts by Severity</CardTitle>
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  {stats.total} Total
                </span>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <SeverityChart
                data={[
                  { severity: 'Critical', count: stats.bySeverity?.critical || 0, color: '#EF4444' },
                  { severity: 'High', count: stats.bySeverity?.high || 0, color: '#F97316' },
                  { severity: 'Medium', count: stats.bySeverity?.medium || 0, color: '#EAB308' },
                  { severity: 'Low', count: stats.bySeverity?.low || 0, color: '#3B82F6' },
                ]}
              />
            </CardContent>
          </Card>
          {/* By Type */}
          <Card>
            <CardHeader className="border-b-4 border-purple-500 bg-purple-50">
              <CardTitle>Alerts by Type</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium">💰 Price Spikes</span>
                  <span className="text-2xl font-bold text-gray-900">{stats.byType?.price_spike || 0}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium">📊 Tariff Changes</span>
                  <span className="text-2xl font-bold text-gray-900">{stats.byType?.tariff_change || 0}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium">🚢 Freight Surges</span>
                  <span className="text-2xl font-bold text-gray-900">{stats.byType?.freight_surge || 0}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium">💱 FX Volatility</span>
                  <span className="text-2xl font-bold text-gray-900">{stats.byType?.fx_volatility || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      {/* Alert Trends */}
      {stats && (
        <Card>
          <CardHeader className="border-b-4 border-indigo-500 bg-indigo-50">
            <CardTitle>Alert Trends (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <TrendChart
              data={[
                { date: '2024-01-20', alerts: 12, critical: 2, high: 3, medium: 4, low: 3 },
                { date: '2024-01-21', alerts: 8, critical: 1, high: 2, medium: 3, low: 2 },
                { date: '2024-01-22', alerts: 15, critical: 3, high: 4, medium: 5, low: 3 },
                { date: '2024-01-23', alerts: 6, critical: 0, high: 1, medium: 2, low: 3 },
                { date: '2024-01-24', alerts: 18, critical: 4, high: 5, medium: 6, low: 3 },
                { date: '2024-01-25', alerts: 10, critical: 2, high: 2, medium: 4, low: 2 },
                { date: '2024-01-26', alerts: 14, critical: 3, high: 3, medium: 5, low: 3 },
              ]}
            />
          </CardContent>
        </Card>
      )}
      {/* Recent Alerts Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Alerts</CardTitle>
            <a href="/dashboard/alerts" className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors">
              View All →
            </a>
          </div>
        </CardHeader>
        <CardContent>
          {alerts.length > 0 ? (
            <AlertsTable
              alerts={alerts}
              onStatusChange={handleStatusChange}
              onViewDetails={handleViewDetails}
              onDownloadPDF={handleDownloadPDF}
            />
          ) : (
            <div className="text-center py-12 text-gray-500">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <RefreshCw className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-lg font-medium mb-2">No alerts found</p>
              <p className="text-sm">Run detection to generate alerts</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}