'use client';

import { useEffect, useState } from 'react';
import { KPICard } from '@/components/dashboard/kpi-card';
import { AlertsTable } from '@/components/dashboard/alerts-table';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

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
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Monitor trade anomalies and alerts</p>
        </div>
        <Button onClick={fetchDashboardData}>
          🔄 Refresh
        </Button>
      </div>

      {/* KPI Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KPICard
            title="Total Alerts"
            value={stats.total}
            icon="🔔"
            color="blue"
            subtitle="All time"
          />
          <KPICard
            title="Critical Alerts"
            value={stats.bySeverity?.critical || 0}
            icon="🚨"
            color="red"
            subtitle="Requires immediate action"
          />
          <KPICard
            title="New Alerts"
            value={stats.new}
            icon="⭐"
            color="yellow"
            subtitle="Unviewed"
          />
          <KPICard
            title="Resolved"
            value={stats.resolved}
            icon="✅"
            color="green"
            subtitle="Completed"
          />
        </div>
      )}

      {/* Alert Breakdown */}
      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* By Severity */}
          <Card>
            <CardHeader>
              <CardTitle>Alerts by Severity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                  <span className="font-medium text-red-900">Critical</span>
                  <span className="text-2xl font-bold text-red-600">{stats.bySeverity?.critical || 0}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                  <span className="font-medium text-orange-900">High</span>
                  <span className="text-2xl font-bold text-orange-600">{stats.bySeverity?.high || 0}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                  <span className="font-medium text-yellow-900">Medium</span>
                  <span className="text-2xl font-bold text-yellow-600">{stats.bySeverity?.medium || 0}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                  <span className="font-medium text-blue-900">Low</span>
                  <span className="text-2xl font-bold text-blue-600">{stats.bySeverity?.low || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* By Type */}
          <Card>
            <CardHeader>
              <CardTitle>Alerts by Type</CardTitle>
            </CardHeader>
            <CardContent>
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

      {/* Recent Alerts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Alerts</CardTitle>
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
              <div className="text-4xl mb-4">📭</div>
              <p>No alerts found</p>
              <p className="text-sm mt-2">Run detection to generate alerts</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}