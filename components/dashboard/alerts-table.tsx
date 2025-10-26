'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AnomalySeverity, AlertStatus, AnomalyType } from '@/types/database';
import { DollarSign, BarChart3, Ship, TrendingUp, Lightbulb } from 'lucide-react';
import { SmartInsights } from './smart-insights';

interface Alert {
  id: string;
  status: AlertStatus;
  created_at: string;
  risk_score?: number;
  risk_level?: 'low' | 'medium' | 'high' | 'critical';
  anomalies: {
    id: string;
    type: AnomalyType;
    severity: AnomalySeverity;
    detected_at: string;
    details: any;
    products?: {
      hs_code: string;
      description: string;
    };
  };
}

interface AlertsTableProps {
  alerts: Alert[];
  onStatusChange?: (alertId: string, status: AlertStatus) => void;
  onViewDetails?: (alert: Alert) => void;
  onDownloadPDF?: (alert: Alert) => void;
}

export function AlertsTable({ alerts, onStatusChange, onViewDetails, onDownloadPDF }: AlertsTableProps) {
  const [sortBy, setSortBy] = useState<'date' | 'severity'>('date');
  const [filterSeverity, setFilterSeverity] = useState<AnomalySeverity | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<AlertStatus | 'all'>('all');
  const [showInsightsForId, setShowInsightsForId] = useState<string | null>(null);

  const getTypeLabel = (type: AnomalyType) => {
    const labels = {
      price_spike: { icon: DollarSign, text: 'Price Spike' },
      tariff_change: { icon: BarChart3, text: 'Tariff Change' },
      freight_surge: { icon: Ship, text: 'Freight Surge' },
      fx_volatility: { icon: TrendingUp, text: 'FX Volatility' },
    };
    return labels[type];
  };

  const getSeverityBadgeVariant = (severity: AnomalySeverity) => {
    const variants: Record<AnomalySeverity, 'critical' | 'high' | 'medium' | 'low'> = {
      critical: 'critical',
      high: 'high',
      medium: 'medium',
      low: 'low',
    };
    return variants[severity];
  };

  const getStatusBadgeVariant = (status: AlertStatus) => {
    const variants: Record<AlertStatus, 'new' | 'viewed' | 'resolved'> = {
      new: 'new',
      viewed: 'viewed',
      resolved: 'resolved',
    };
    return variants[status];
  };

  const getRiskColor = (riskScore?: number) => {
    if (!riskScore) return 'bg-gray-100';
    if (riskScore >= 70) return 'bg-red-500';
    if (riskScore >= 50) return 'bg-orange-500';
    if (riskScore >= 30) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  // Filter and sort alerts
  let filteredAlerts = alerts.filter((alert) => {
    const anomaly = alert.anomalies;
    const severityMatch = filterSeverity === 'all' || anomaly.severity === filterSeverity;
    const statusMatch = filterStatus === 'all' || alert.status === filterStatus;
    return severityMatch && statusMatch;
  });

  if (sortBy === 'date') {
    filteredAlerts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  } else {
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    filteredAlerts.sort((a, b) => severityOrder[a.anomalies.severity] - severityOrder[b.anomalies.severity]);
  }

  return (
    <div>
      {/* Filters */}
      <div className="mb-4 flex gap-4 items-center flex-wrap">
        <div>
          <label className="text-sm font-medium text-gray-700 mr-2">Sort by:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'date' | 'severity')}
            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="date">Date</option>
            <option value="severity">Severity</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 mr-2">Severity:</label>
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value as AnomalySeverity | 'all')}
            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 mr-2">Status:</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as AlertStatus | 'all')}
            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All</option>
            <option value="new">New</option>
            <option value="viewed">Viewed</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>

        <div className="ml-auto text-sm text-gray-600">
          Showing {filteredAlerts.length} of {alerts.length} alerts
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Product
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Severity
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Risk Score
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Detected
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Insights
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredAlerts.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                  No alerts found matching your filters
                </td>
              </tr>
            ) : (
              filteredAlerts.map((alert) => {
                const anomaly = alert.anomalies;
                return (
                  <tr key={alert.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {(() => {
                          const typeInfo = getTypeLabel(anomaly.type);
                          const IconComponent = typeInfo.icon;
                          return (
                            <>
                              <IconComponent className="w-4 h-4 text-gray-500" />
                              <span className="text-sm font-medium text-gray-900">
                                {typeInfo.text}
                              </span>
                            </>
                          );
                        })()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {anomaly.products ? (
                        <div className="text-sm">
                          <div className="font-mono text-gray-900">{anomaly.products.hs_code}</div>
                          <div className="text-gray-500 truncate max-w-xs">
                            {anomaly.products.description}
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={getSeverityBadgeVariant(anomaly.severity)}>
                        {anomaly.severity.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {alert.risk_score !== undefined ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${getRiskColor(alert.risk_score)}`}
                              style={{ width: `${alert.risk_score}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium">{alert.risk_score}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={getStatusBadgeVariant(alert.status)}>
                        {alert.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(anomaly.detected_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setShowInsightsForId(showInsightsForId === alert.id ? null : alert.id)}
                      >
                        {showInsightsForId === alert.id ? 'Hide' : 'Show'} Insights
                      </Button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onViewDetails?.(alert)}
                        >
                          View
                        </Button>
                        {onDownloadPDF && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onDownloadPDF(alert)}
                            title="Download PDF Evidence"
                          >
                            📄 PDF
                          </Button>
                        )}
                        {alert.status !== 'resolved' && onStatusChange && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onStatusChange(alert.id, 'resolved')}
                          >
                            Resolve
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Insights Panels */}
      {showInsightsForId && (
        <div className="mt-4">
          <SmartInsights alertId={showInsightsForId} />
        </div>
      )}
    </div>
  );
}