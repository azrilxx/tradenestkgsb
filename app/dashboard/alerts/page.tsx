'use client';

import { useEffect, useState } from 'react';
import { AlertsTable } from '@/components/dashboard/alerts-table';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/alerts?limit=100');
      const data = await response.json();
      setAlerts(data.data || []);
    } catch (error) {
      console.error('Error fetching alerts:', error);
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
      fetchAlerts();
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
      const response = await fetch(`/api/evidence/${alert.id}`);
      const data = await response.json();

      if (data.success) {
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
          <p className="text-gray-600">Loading alerts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Alerts</h1>
          <p className="text-gray-600 mt-1">Manage and review all alerts</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={fetchAlerts}>
            🔄 Refresh
          </Button>
          <Button onClick={() => window.location.href = '/detect'}>
            🔍 Run Detection
          </Button>
        </div>
      </div>

      {/* Alerts Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Alerts ({alerts.length})</CardTitle>
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
              <p className="text-lg font-medium">No alerts yet</p>
              <p className="text-sm mt-2">Click "Run Detection" to scan for anomalies</p>
              <Button className="mt-4" onClick={() => window.location.href = '/detect'}>
                🔍 Run Detection
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}