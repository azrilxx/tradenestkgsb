'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface ConnectionFactor {
  id: string;
  type: string;
  alert_id: string;
  timestamp: string;
  severity: string;
  correlation_score?: number;
}

interface ConnectedIntelligence {
  primary_alert: {
    id: string;
    type: string;
    severity: string;
    timestamp: string;
    product_id?: string;
  };
  connected_factors: ConnectionFactor[];
  impact_cascade: {
    cascading_impact: number;
    total_factors: number;
    affected_supply_chain: boolean;
  };
  recommended_actions: string[];
  risk_assessment: {
    overall_risk: number;
    risk_factors: string[];
    mitigation_priority: string;
  };
}

export default function IntelligenceDashboard() {
  const [alertId, setAlertId] = useState('');
  const [intelligence, setIntelligence] = useState<ConnectedIntelligence | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recentAlerts, setRecentAlerts] = useState<any[]>([]);

  // Fetch recent alerts for selection
  useEffect(() => {
    async function fetchRecentAlerts() {
      try {
        const response = await fetch('/api/alerts');
        const data = await response.json();
        if (data.alerts) {
          setRecentAlerts(data.alerts.slice(0, 10));
        }
      } catch (err) {
        console.error('Error fetching alerts:', err);
      }
    }
    fetchRecentAlerts();
  }, []);

  async function analyzeIntelligence() {
    if (!alertId) {
      setError('Please select or enter an alert ID');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/analytics/connections/${alertId}?window=30`);
      if (!response.ok) {
        throw new Error('Failed to analyze intelligence');
      }

      const data = await response.json();
      setIntelligence(data);
    } catch (err) {
      setError('Failed to analyze interconnected intelligence. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRiskColor = (risk: number) => {
    if (risk >= 80) return 'text-red-600 font-bold';
    if (risk >= 60) return 'text-orange-600 font-semibold';
    if (risk >= 40) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getTypeName = (type: string) => {
    return type
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Interconnected Intelligence</h1>
          <p className="text-gray-600 mt-1">
            Analyze relationships between anomalies to understand cascading impacts
          </p>
        </div>
      </div>

      {/* Alert Selection Card */}
      <Card>
        <CardHeader>
          <CardTitle>Select Alert for Analysis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <select
              value={alertId}
              onChange={(e) => setAlertId(e.target.value)}
              className="flex-1 border rounded-lg px-4 py-2"
              disabled={loading}
            >
              <option value="">Select an alert...</option>
              {recentAlerts.map((alert) => (
                <option key={alert.id} value={alert.id}>
                  Alert #{alert.id.substring(0, 8)} -{' '}
                  {alert.anomalies?.[0]?.type || 'Unknown'} -{' '}
                  {alert.anomalies?.[0]?.severity || 'Unknown'}
                </option>
              ))}
            </select>
            <Button onClick={analyzeIntelligence} disabled={loading || !alertId}>
              {loading ? 'Analyzing...' : 'Analyze Intelligence'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          {error}
        </div>
      )}

      {intelligence && (
        <div className="space-y-6">
          {/* Primary Alert Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Primary Alert Analysis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Type</p>
                  <p className="font-semibold">{getTypeName(intelligence.primary_alert.type)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Severity</p>
                  <Badge className={getSeverityColor(intelligence.primary_alert.severity)}>
                    {intelligence.primary_alert.severity}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Impact Cascade Metrics */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Cascading Impact</CardTitle>
              </CardHeader>
              <CardContent>
                <p className={`text-4xl font-bold ${getRiskColor(intelligence.impact_cascade.cascading_impact)}`}>
                  {intelligence.impact_cascade.cascading_impact}%
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  Based on {intelligence.impact_cascade.total_factors} connected factors
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Total Connections</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold">{intelligence.impact_cascade.total_factors}</p>
                <p className="text-sm text-gray-600 mt-2">Interconnected anomalies detected</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Supply Chain Status</CardTitle>
              </CardHeader>
              <CardContent>
                <p className={`text-2xl font-bold ${intelligence.impact_cascade.affected_supply_chain ? 'text-red-600' : 'text-green-600'}`}>
                  {intelligence.impact_cascade.affected_supply_chain ? '⚠️ Affected' : '✓ Stable'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Risk Assessment */}
          <Card>
            <CardHeader>
              <CardTitle>Risk Assessment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Overall Risk Score</span>
                  <span className={`text-2xl font-bold ${getRiskColor(intelligence.risk_assessment.overall_risk)}`}>
                    {intelligence.risk_assessment.overall_risk}/100
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${intelligence.risk_assessment.overall_risk >= 80
                        ? 'bg-red-600'
                        : intelligence.risk_assessment.overall_risk >= 60
                          ? 'bg-orange-600'
                          : intelligence.risk_assessment.overall_risk >= 40
                            ? 'bg-yellow-600'
                            : 'bg-green-600'
                      }`}
                    style={{ width: `${intelligence.risk_assessment.overall_risk}%` }}
                  />
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-2">Risk Factors</p>
                <ul className="list-disc list-inside space-y-1">
                  {intelligence.risk_assessment.risk_factors.length > 0 ? (
                    intelligence.risk_assessment.risk_factors.map((factor, idx) => (
                      <li key={idx} className="text-sm">
                        {factor}
                      </li>
                    ))
                  ) : (
                    <li className="text-sm text-gray-400">No specific risk factors identified</li>
                  )}
                </ul>
              </div>

              <div className="pt-2 border-t">
                <p className="text-sm text-gray-600">Mitigation Priority</p>
                <Badge className={getSeverityColor(intelligence.risk_assessment.mitigation_priority)}>
                  {intelligence.risk_assessment.mitigation_priority.toUpperCase()}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Connected Factors */}
          {intelligence.connected_factors.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Connected Factors</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {intelligence.connected_factors.map((factor) => (
                    <div
                      key={factor.id}
                      className="border rounded-lg p-3 hover:bg-gray-50 transition"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Badge className={getSeverityColor(factor.severity)}>
                            {factor.severity}
                          </Badge>
                          <span className="font-medium">{getTypeName(factor.type)}</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          {factor.correlation_score && (
                            <span>Correlation: {(factor.correlation_score * 100).toFixed(0)}%</span>
                          )}
                          <span>{new Date(factor.timestamp).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recommended Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Recommended Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {intelligence.recommended_actions.map((action, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">✓</span>
                    <span className="text-sm">{action}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      )}

      {!intelligence && !loading && !error && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">
              Select an alert above to begin interconnected intelligence analysis
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
