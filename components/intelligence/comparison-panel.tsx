'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X, GitCompare, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';

interface ConnectedIntelligence {
  primary_alert: {
    id: string;
    type: string;
    severity: string;
    timestamp: string;
    product_id?: string;
  };
  connected_factors: Array<{
    id: string;
    type: string;
    alert_id: string;
    timestamp: string;
    severity: string;
    correlation_score?: number;
  }>;
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

interface ComparisonPanelProps {
  alert1: ConnectedIntelligence;
  alert2: ConnectedIntelligence;
  alert3?: ConnectedIntelligence;
  onClose: () => void;
}

/**
 * Side-by-side comparison panel for multiple alerts
 * Shows differences, similarities, and unique risk factors
 */
export function ComparisonPanel({ alert1, alert2, alert3, onClose }: ComparisonPanelProps) {
  const [selectedTab, setSelectedTab] = useState<'overview' | 'connections' | 'risks' | 'actions'>('overview');

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRiskColor = (risk: number) => {
    if (risk >= 80) return 'text-red-600 font-bold';
    if (risk >= 60) return 'text-orange-600 font-semibold';
    if (risk >= 40) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getTypeName = (type: string) => {
    return type.split('_').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  // Get unique connections for each alert
  const getUniqueConnections = (alert: ConnectedIntelligence) => {
    const allFactors = alert.connected_factors;
    return allFactors;
  };

  // Get shared risk factors
  const getSharedRiskFactors = () => {
    const factors1 = alert1.risk_assessment.risk_factors;
    const factors2 = alert2.risk_assessment.risk_factors;
    const factors3 = alert3?.risk_assessment.risk_factors || [];

    return factors1.filter(f =>
      factors2.includes(f) || (alert3 && factors3.includes(f))
    );
  };

  const alerts = [alert1, alert2, ...(alert3 ? [alert3] : [])];

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-7xl max-h-[90vh] overflow-hidden">
        <CardHeader className="border-b bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <GitCompare className="h-6 w-6 text-blue-600" />
              <CardTitle>Compare Alerts</CardTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {/* Tab Navigation */}
          <div className="border-b">
            <div className="flex px-6 pt-4">
              <button
                onClick={() => setSelectedTab('overview')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${selectedTab === 'overview'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
              >
                Overview
              </button>
              <button
                onClick={() => setSelectedTab('connections')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${selectedTab === 'connections'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
              >
                Connections
              </button>
              <button
                onClick={() => setSelectedTab('risks')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${selectedTab === 'risks'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
              >
                Risks
              </button>
              <button
                onClick={() => setSelectedTab('actions')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${selectedTab === 'actions'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
              >
                Actions
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[70vh]">
            {/* Overview Tab */}
            {selectedTab === 'overview' && (
              <div className="space-y-6">
                {/* Metrics Comparison */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {alerts.map((alert, idx) => (
                    <Card key={idx} className="border-2">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Alert {idx + 1}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Overall Risk</p>
                          <p className={`text-3xl font-bold ${getRiskColor(alert.risk_assessment.overall_risk)}`}>
                            {alert.risk_assessment.overall_risk}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Cascading Impact</p>
                          <p className="text-2xl font-bold">{alert.impact_cascade.cascading_impact}%</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Total Connections</p>
                          <p className="text-2xl font-bold">{alert.impact_cascade.total_factors}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Supply Chain Status</p>
                          <Badge className={alert.impact_cascade.affected_supply_chain
                            ? 'bg-red-100 text-red-800'
                            : 'bg-green-100 text-green-800'}>
                            {alert.impact_cascade.affected_supply_chain ? 'Affected' : 'Stable'}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Key Differences */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Key Differences</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                        <TrendingUp className="h-5 w-5 text-blue-600" />
                        <div>
                          <p className="font-semibold text-sm">Risk Variance</p>
                          <p className="text-xs text-gray-600">
                            Alert 1: {alert1.risk_assessment.overall_risk} |
                            Alert 2: {alert2.risk_assessment.overall_risk}
                            {alert3 && ` | Alert 3: ${alert3.risk_assessment.overall_risk}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 p-3 bg-orange-50 rounded-lg">
                        <AlertTriangle className="h-5 w-5 text-orange-600" />
                        <div>
                          <p className="font-semibold text-sm">Impact Difference</p>
                          <p className="text-xs text-gray-600">
                            Variance of {Math.abs(alert1.impact_cascade.cascading_impact - alert2.impact_cascade.cascading_impact)}%
                            between primary alerts
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Shared Risk Factors */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Shared Risk Factors</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {getSharedRiskFactors().length > 0 ? (
                      <div className="space-y-2">
                        {getSharedRiskFactors().map((factor, idx) => (
                          <div key={idx} className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg">
                            <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                            <span className="text-sm">{factor}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No shared risk factors found</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Connections Tab */}
            {selectedTab === 'connections' && (
              <div className="space-y-4">
                {alerts.map((alert, idx) => (
                  <Card key={idx}>
                    <CardHeader>
                      <CardTitle className="text-sm">
                        Alert {idx + 1} - {alert.connected_factors.length} Connections
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {alert.connected_factors.map((factor, factorIdx) => (
                          <div
                            key={factorIdx}
                            className="flex items-center justify-between p-2 border rounded-lg text-sm"
                          >
                            <div className="flex items-center gap-2">
                              <Badge className={getSeverityColor(factor.severity)}>
                                {factor.severity}
                              </Badge>
                              <span className="font-medium">{getTypeName(factor.type)}</span>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-gray-600">
                              {factor.correlation_score && (
                                <span>{(factor.correlation_score * 100).toFixed(0)}%</span>
                              )}
                              <span>{new Date(factor.timestamp).toLocaleDateString()}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Risks Tab */}
            {selectedTab === 'risks' && (
              <div className="space-y-4">
                {alerts.map((alert, idx) => (
                  <Card key={idx}>
                    <CardHeader>
                      <CardTitle className="text-sm">Alert {idx + 1} Risk Factors</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {alert.risk_assessment.risk_factors.map((factor, factorIdx) => (
                          <div
                            key={factorIdx}
                            className="flex items-start gap-2 p-3 bg-orange-50 rounded-lg"
                          >
                            <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium">{factor}</p>
                              <p className="text-xs text-gray-600">
                                Priority: {alert.risk_assessment.mitigation_priority}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Actions Tab */}
            {selectedTab === 'actions' && (
              <div className="space-y-4">
                {alerts.map((alert, idx) => (
                  <Card key={idx}>
                    <CardHeader>
                      <CardTitle className="text-sm">Alert {idx + 1} Recommendations</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {alert.recommended_actions.map((action, actionIdx) => (
                          <li key={actionIdx} className="flex items-start gap-2 p-2 border rounded-lg">
                            <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                            <span className="text-sm">{action}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

