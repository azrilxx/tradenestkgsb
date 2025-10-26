'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { NetworkGraph } from '@/components/intelligence/network-graph';
import { CascadeFlow } from '@/components/intelligence/cascade-flow';
import { SubscriptionBanner } from '@/components/subscription/subscription-banner';
import { LoadingSkeleton } from '@/components/intelligence/loading-skeleton';
import { AdvancedFilters } from '@/components/intelligence/advanced-filters';
import { ComparisonPanel } from '@/components/intelligence/comparison-panel';
import { supabase } from '@/lib/supabase/client';
import { getUserSubscription, checkUsageLimit } from '@/lib/subscription/tier-checker';
import { generateAndDownloadIntelligenceReport } from '@/lib/pdf/evidence-generator';
import { Download, FileText, Database, Zap, Brain, GitCompare, Layers } from 'lucide-react';

type ViewMode = 'list' | 'graph' | 'timeline' | 'matrix';

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
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [subscription, setSubscription] = useState<any>(null);
  const [usageData, setUsageData] = useState<any>(null);
  const [timeWindow, setTimeWindow] = useState(30);
  const [limitReached, setLimitReached] = useState(false);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [mlPredictions, setMlPredictions] = useState<any>(null);
  const [loadingPredictions, setLoadingPredictions] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [severityFilter, setSeverityFilter] = useState<string[]>([]);
  const [correlationThreshold, setCorrelationThreshold] = useState(0.3);
  const [compareAlerts, setCompareAlerts] = useState<ConnectedIntelligence[]>([]);
  const [showComparison, setShowComparison] = useState(false);

  // Fetch subscription data on mount
  useEffect(() => {
    async function loadSubscription() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const sub = await getUserSubscription(user.id);
          const usage = await checkUsageLimit(user.id);
          setSubscription(sub);
          setUsageData(usage);

          // Set max time window based on tier
          if (sub?.usage_limits?.max_time_window_days) {
            setTimeWindow(Math.min(timeWindow, sub.usage_limits.max_time_window_days));
          }
        }
      } catch (err) {
        console.error('Error loading subscription:', err);
      }
    }
    loadSubscription();
  }, []);

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
    setLimitReached(false);
    setShowUpgradePrompt(false);

    try {
      // Get authentication token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('Authentication required. Please log in.');
        setLoading(false);
        return;
      }

      // Check usage limit before making request
      if (usageData && !usageData.can_use) {
        setLimitReached(true);
        setShowUpgradePrompt(true);
        setError('Monthly limit reached. Upgrade to continue using Interconnected Intelligence.');
        setLoading(false);
        return;
      }

      const response = await fetch(`/api/analytics/connections/${alertId}?window=${timeWindow}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      // Handle different response statuses
      if (response.status === 401) {
        setError('Authentication expired. Please log in again.');
      } else if (response.status === 403) {
        const data = await response.json();
        setLimitReached(true);
        setShowUpgradePrompt(true);
        setError(data.message || 'Monthly limit reached.');
      } else if (!response.ok) {
        setError('Failed to analyze interconnected intelligence.');
      } else {
        const data = await response.json();
        setIntelligence(data);

        // Show tier limit message if applicable
        if (data.tier_limit) {
          setShowUpgradePrompt(true);
        }

        // Refresh usage data after successful analysis
        if (session) {
          const usage = await checkUsageLimit(session.user.id);
          setUsageData(usage);
        }
      }
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

  // Export functions
  async function exportPDF() {
    if (!intelligence || !alertId) return;

    setExporting(true);
    try {
      generateAndDownloadIntelligenceReport({
        alertId,
        intelligence,
        tierLimit: intelligence.tier_limit || false,
      });
    } catch (err) {
      console.error('Error exporting PDF:', err);
      setError('Failed to export PDF');
    } finally {
      setExporting(false);
    }
  }

  async function exportData(format: 'csv' | 'json') {
    if (!alertId) return;

    setExporting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('Authentication required');
        return;
      }

      const response = await fetch(
        `/api/analytics/connections/export?alertId=${alertId}&format=${format}&window=${timeWindow}`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `intelligence-export-${alertId}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting data:', err);
      setError(`Failed to export ${format.toUpperCase()}`);
    } finally {
      setExporting(false);
    }
  }

  async function getMLPredictions() {
    if (!alertId || subscription?.tier !== 'enterprise') return;

    setLoadingPredictions(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('Authentication required');
        return;
      }

      const response = await fetch(
        `/api/analytics/predictions/${alertId}?window=${timeWindow}`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        }
      );

      if (!response.ok) {
        if (response.status === 403) {
          setError('ML predictions require Enterprise tier');
        } else {
          throw new Error('Failed to get predictions');
        }
        return;
      }

      const data = await response.json();
      setMlPredictions(data);
    } catch (err) {
      console.error('Error getting ML predictions:', err);
      setError('Failed to get ML predictions');
    } finally {
      setLoadingPredictions(false);
    }
  }

  // Prepare graph data for NetworkGraph component
  const getGraphData = () => {
    if (!intelligence) return { nodes: [], edges: [] };

    const nodes = [
      {
        id: intelligence.primary_alert.id,
        type: intelligence.primary_alert.type,
        severity: intelligence.primary_alert.severity,
        timestamp: intelligence.primary_alert.timestamp,
      },
      ...intelligence.connected_factors.map(factor => ({
        id: factor.id,
        type: factor.type,
        severity: factor.severity,
        timestamp: factor.timestamp,
      })),
    ];

    const edges = intelligence.connected_factors.map(factor => ({
      source: intelligence.primary_alert.id,
      target: factor.id,
      weight: factor.correlation_score || 0.5,
      type: 'correlation',
    }));

    return { nodes, edges };
  };

  // Prepare cascade data for CascadeFlow component
  const getCascadeData = () => {
    if (!intelligence) return [];

    return [
      {
        id: intelligence.primary_alert.id,
        type: intelligence.primary_alert.type,
        severity: intelligence.primary_alert.severity,
        timestamp: intelligence.primary_alert.timestamp,
        label: getTypeName(intelligence.primary_alert.type),
        level: 0,
      },
      ...intelligence.connected_factors.map((factor, index) => ({
        id: factor.id,
        type: factor.type,
        severity: factor.severity,
        timestamp: factor.timestamp,
        label: getTypeName(factor.type),
        level: 1,
        correlation: factor.correlation_score,
      })),
    ];
  };

  const { nodes: graphNodes, edges: graphEdges } = getGraphData();
  const cascadeNodes = getCascadeData();

  // Filter connected factors based on severity and correlation
  const getFilteredConnections = () => {
    if (!intelligence) return [];

    return intelligence.connected_factors.filter(factor => {
      const severityMatch = severityFilter.length === 0 || severityFilter.includes(factor.severity);
      const correlationMatch = (factor.correlation_score || 0) >= correlationThreshold;
      return severityMatch && correlationMatch;
    });
  };

  // Comparison functions
  const addToComparison = () => {
    if (!intelligence) return;

    // Check if already in comparison
    if (compareAlerts.some(a => a.primary_alert.id === intelligence.primary_alert.id)) {
      alert('This alert is already in comparison');
      return;
    }

    if (compareAlerts.length >= 3) {
      alert('Maximum 3 alerts can be compared at once');
      return;
    }

    setCompareAlerts([...compareAlerts, intelligence]);
  };

  const removeFromComparison = (alertId: string) => {
    setCompareAlerts(compareAlerts.filter(a => a.primary_alert.id !== alertId));
  };

  const resetFilters = () => {
    setSeverityFilter([]);
    setCorrelationThreshold(0.3);
    setTimeWindow(30);
  };

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-4 md:space-y-6 ml-0 md:ml-64">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Interconnected Intelligence</h1>
          <p className="text-gray-600 mt-1">
            Analyze relationships between anomalies to understand cascading impacts
          </p>
        </div>
      </div>

      {/* Subscription Banner */}
      {subscription && usageData && (
        <SubscriptionBanner
          tier={subscription.tier}
          usageCount={usageData.current_month_count}
          monthlyLimit={usageData.monthly_limit}
          message={limitReached ? undefined : undefined}
          showUpgrade={showUpgradePrompt || (usageData && usageData.current_month_count >= usageData.monthly_limit * 0.8)}
          onUpgrade={() => {
            // Handle upgrade action
            window.open('/dashboard/subscription', '_blank');
          }}
        />
      )}

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

          {/* Time Window Selector */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Time Window:</label>
            <select
              value={timeWindow}
              onChange={(e) => setTimeWindow(Number(e.target.value))}
              className="border rounded-lg px-3 py-1.5 text-sm"
              disabled={loading}
            >
              <option value={30}>30 Days (Free tier)</option>
              {subscription?.usage_limits?.max_time_window_days >= 90 && (
                <option value={90}>90 Days (Professional tier)</option>
              )}
              {subscription?.usage_limits?.max_time_window_days >= 180 && (
                <option value={180}>180 Days (Enterprise tier)</option>
              )}
            </select>
            {subscription && (
              <span className="text-xs text-gray-500">
                {subscription.tier.charAt(0).toUpperCase() + subscription.tier.slice(1)} tier
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          {error}
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && <LoadingSkeleton />}

      {/* Tier Limit Notice */}
      {intelligence && intelligence.tier_limit && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <span className="text-blue-600 font-semibold">Free Tier:</span>
            <span className="text-sm text-gray-700">
              Showing top 5 connections. Upgrade to Professional to see all {intelligence.impact_cascade.total_factors} connections.
            </span>
          </div>
        </div>
      )}

      {intelligence && (
        <div className="space-y-6">
          {/* Advanced Filters */}
          <AdvancedFilters
            timeWindow={timeWindow}
            onTimeWindowChange={setTimeWindow}
            severityFilter={severityFilter}
            onSeverityFilterChange={setSeverityFilter}
            correlationThreshold={correlationThreshold}
            onCorrelationThresholdChange={setCorrelationThreshold}
            onReset={resetFilters}
          />

          {/* Impact Cascade Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                <CardTitle className="text-sm">Overall Risk</CardTitle>
              </CardHeader>
              <CardContent>
                <p className={`text-4xl font-bold ${getRiskColor(intelligence.risk_assessment.overall_risk)}`}>
                  {intelligence.risk_assessment.overall_risk}
                </p>
                <p className="text-sm text-gray-600 mt-2">Risk score (0-100)</p>
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

          {/* Export & ML Predictions Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Export Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Export Data</CardTitle>
                  <Download className="h-5 w-5 text-gray-400" />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Button
                    onClick={exportPDF}
                    disabled={exporting || !intelligence}
                    variant="default"
                    className="flex-1"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    {exporting ? 'Exporting...' : 'Export PDF'}
                  </Button>
                  <Button
                    onClick={() => exportData('csv')}
                    disabled={exporting || !intelligence}
                    variant="outline"
                    className="flex-1"
                  >
                    <Database className="h-4 w-4 mr-2" />
                    CSV
                  </Button>
                  <Button
                    onClick={() => exportData('json')}
                    disabled={exporting || !intelligence}
                    variant="outline"
                    className="flex-1"
                  >
                    <Database className="h-4 w-4 mr-2" />
                    JSON
                  </Button>
                </div>
                {intelligence?.tier_limit && (
                  <p className="text-xs text-gray-500">
                    Free tier: PDF shows top 5 connections only
                  </p>
                )}
              </CardContent>
            </Card>

            {/* ML Predictions Card - Enterprise Only */}
            {subscription?.tier === 'enterprise' && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">ML Predictions</CardTitle>
                    <Brain className="h-5 w-5 text-purple-600" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {!mlPredictions ? (
                    <Button
                      onClick={getMLPredictions}
                      disabled={loadingPredictions || !intelligence}
                      variant="default"
                      className="w-full"
                    >
                      <Zap className="h-4 w-4 mr-2" />
                      {loadingPredictions ? 'Analyzing...' : 'Get ML Predictions'}
                    </Button>
                  ) : (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-3 bg-purple-50 rounded-lg">
                          <p className="text-xs text-gray-600">Cascade Likelihood</p>
                          <p className="text-2xl font-bold text-purple-600">{mlPredictions.likelihood}%</p>
                        </div>
                        <div className="p-3 bg-orange-50 rounded-lg">
                          <p className="text-xs text-gray-600">Predicted Impact</p>
                          <p className="text-2xl font-bold text-orange-600">{mlPredictions.predicted_impact}%</p>
                        </div>
                      </div>
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <p className="text-xs text-gray-600">Time to Cascade</p>
                        <p className="text-lg font-semibold text-blue-600">
                          {mlPredictions.estimated_time_to_cascade} days
                        </p>
                      </div>
                      <Button
                        onClick={() => setMlPredictions(null)}
                        variant="outline"
                        className="w-full text-sm"
                      >
                        Clear Predictions
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Non-Enterprise ML Predictions Placeholder */}
            {subscription?.tier !== 'enterprise' && (
              <Card className="opacity-60">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">ML Predictions</CardTitle>
                    <Brain className="h-5 w-5 text-gray-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Zap className="h-4 w-4" />
                      Enterprise tier required
                    </div>
                    <p className="text-xs text-gray-400">
                      Get cascade likelihood predictions, impact forecasts, and time-to-cascade estimates.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Tab Navigation */}
          <Card>
            <div className="border-b">
              <div className="flex space-x-1 px-4 pt-4">
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${viewMode === 'list'
                    ? 'bg-white border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                  List View
                </button>
                <button
                  onClick={() => setViewMode('graph')}
                  className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${viewMode === 'graph'
                    ? 'bg-white border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                  Graph View
                </button>
                <button
                  onClick={() => setViewMode('timeline')}
                  className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${viewMode === 'timeline'
                    ? 'bg-white border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                  Timeline View
                </button>
                <button
                  onClick={() => setViewMode('matrix')}
                  className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${viewMode === 'matrix'
                    ? 'bg-white border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                  Matrix View
                </button>
              </div>
            </div>

            <CardContent className="p-0">
              {/* List View */}
              {viewMode === 'list' && (
                <div className="p-6 space-y-4">
                  {/* Primary Alert Summary */}
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-lg">Primary Alert</h3>
                      <Badge className={getSeverityColor(intelligence.primary_alert.severity)}>
                        {intelligence.primary_alert.severity}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Type</p>
                        <p className="font-medium">{getTypeName(intelligence.primary_alert.type)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Timestamp</p>
                        <p className="font-medium">{new Date(intelligence.primary_alert.timestamp).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Cascading Impact</p>
                        <p className="font-medium">{intelligence.impact_cascade.cascading_impact}%</p>
                      </div>
                    </div>
                  </div>

                  {/* Connected Factors */}
                  {getFilteredConnections().length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-lg">Connected Factors</h3>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-blue-50 text-blue-700">
                            Showing {getFilteredConnections().length} of {intelligence.connected_factors.length}
                          </Badge>
                          <Button
                            onClick={addToComparison}
                            size="sm"
                            variant="outline"
                            className="text-xs"
                          >
                            <GitCompare className="h-4 w-4 mr-1" />
                            Compare
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {getFilteredConnections().map((factor) => (
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
                    </div>
                  )}

                  {/* Recommended Actions */}
                  <div className="border-t pt-4">
                    <h3 className="font-semibold text-lg mb-3">Recommended Actions</h3>
                    <ul className="space-y-2">
                      {intelligence.recommended_actions.map((action, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-blue-600 mt-1">✓</span>
                          <span className="text-sm">{action}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Graph View */}
              {viewMode === 'graph' && (
                <div className="p-4">
                  <NetworkGraph
                    nodes={graphNodes}
                    edges={graphEdges}
                    selectedNodeId={intelligence.primary_alert.id}
                    height={600}
                  />
                </div>
              )}

              {/* Timeline View */}
              {viewMode === 'timeline' && (
                <div className="p-4">
                  <CascadeFlow
                    nodes={cascadeNodes}
                    animated={true}
                    autoPlay={false}
                  />
                </div>
              )}

              {/* Matrix View */}
              {viewMode === 'matrix' && (
                <div className="p-6">
                  <div className="text-center py-12">
                    <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                    <p className="text-gray-500">Matrix view coming soon</p>
                    <p className="text-sm text-gray-400 mt-2">Correlation heatmap visualization will be available in a future update</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {!intelligence && !loading && !error && (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="flex flex-col items-center gap-3">
              <Layers className="h-16 w-16 text-gray-300" />
              <h3 className="text-lg font-semibold text-gray-700">Get Started with Interconnected Intelligence</h3>
              <p className="text-gray-500 max-w-md">
                Select an alert above to analyze relationships between anomalies and understand cascading impacts
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Badge variant="outline">Real-time Analysis</Badge>
                <Badge variant="outline">Network Visualization</Badge>
                <Badge variant="outline">Risk Assessment</Badge>
                <Badge variant="outline">ML Predictions</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Comparison Controls Floating Panel */}
      {compareAlerts.length > 0 && (
        <div className="fixed bottom-4 right-4 z-40">
          <Card className="shadow-2xl border-2 border-blue-600">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <GitCompare className="h-4 w-4" />
                  Comparison ({compareAlerts.length}/3)
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCompareAlerts([])}
                  className="h-6 px-2 text-xs"
                >
                  Clear All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 mb-3">
                {compareAlerts.map((alert, idx) => (
                  <div key={alert.primary_alert.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-xs font-medium">Alert {idx + 1}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFromComparison(alert.primary_alert.id)}
                      className="h-5 w-5 p-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button
                onClick={() => setShowComparison(true)}
                disabled={compareAlerts.length < 2}
                className="w-full text-sm"
                variant="default"
              >
                View Comparison
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Comparison Panel Modal */}
      {showComparison && compareAlerts.length >= 2 && (
        <ComparisonPanel
          alert1={compareAlerts[0]}
          alert2={compareAlerts[1]}
          alert3={compareAlerts[2]}
          onClose={() => setShowComparison(false)}
        />
      )}
    </div>
  );
}
