'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, TrendingUp, AlertTriangle, XCircle } from 'lucide-react';

interface ExpertInsight {
  key_findings: string[];
  why_it_matters: string;
  contextual_analysis: string;
  recommended_actions: Array<{
    action: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    rationale: string;
  }>;
  risk_implications: string[];
  market_impact: string;
  timeline_urgency: 'low' | 'medium' | 'high' | 'critical';
}

interface SmartInsightsProps {
  alertId: string;
  compact?: boolean;
}

export function SmartInsights({ alertId, compact = false }: SmartInsightsProps) {
  const [insights, setInsights] = useState<ExpertInsight | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchInsights() {
      setLoading(true);
      try {
        const response = await fetch(`/api/analytics/insights/${alertId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch insights');
        }
        const data = await response.json();
        setInsights(data);
      } catch (err) {
        setError('Unable to generate insights');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    if (alertId) {
      fetchInsights();
    }
  }, [alertId]);

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
        <CardContent className="p-4">
          <div className="animate-pulse flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-300 rounded-full"></div>
            <span className="text-sm text-gray-600">Generating insights...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !insights) {
    return null; // Fail silently
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'high':
        return <AlertTriangle className="w-4 h-4 text-orange-600" />;
      case 'medium':
        return <TrendingUp className="w-4 h-4 text-yellow-600" />;
      case 'low':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  if (compact) {
    return (
      <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-sm text-gray-900 mb-1">Key Findings</h4>
              <ul className="space-y-1">
                {insights.key_findings.slice(0, 2).map((finding, idx) => (
                  <li key={idx} className="text-xs text-gray-700 flex items-start gap-1">
                    <span className="text-blue-600 mt-0.5">•</span>
                    <span>{finding}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {insights.recommended_actions.length > 0 && (
            <div className="pt-2 border-t border-blue-200">
              <p className="text-xs font-semibold text-gray-600 mb-1">Top Action</p>
              <div className="flex items-start gap-2">
                {getPriorityIcon(insights.recommended_actions[0].priority)}
                <p className="text-xs text-gray-700">{insights.recommended_actions[0].action}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
      <CardContent className="p-6 space-y-6">
        {/* Key Findings */}
        <div>
          <h3 className="font-semibold text-lg text-gray-900 mb-3 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-blue-600" />
            Key Findings
          </h3>
          <ul className="space-y-2">
            {insights.key_findings.map((finding, idx) => (
              <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span>{finding}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Why It Matters */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-sm text-blue-900 mb-2">Why This Matters</h4>
          <p className="text-sm text-gray-700">{insights.why_it_matters}</p>
        </div>

        {/* Recommended Actions */}
        {insights.recommended_actions.length > 0 && (
          <div>
            <h3 className="font-semibold text-lg text-gray-900 mb-3">Recommended Actions</h3>
            <ul className="space-y-3">
              {insights.recommended_actions.map((action, idx) => (
                <li key={idx} className="border rounded-lg p-3 bg-white">
                  <div className="flex items-start gap-2 mb-1">
                    {getPriorityIcon(action.priority)}
                    <Badge className={getPriorityColor(action.priority)}>
                      {action.priority.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-sm font-medium text-gray-900 mb-1">{action.action}</p>
                  <p className="text-xs text-gray-600">{action.rationale}</p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Contextual Analysis */}
        {insights.contextual_analysis && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold text-sm text-gray-900 mb-2">Contextual Analysis</h4>
            <p className="text-sm text-gray-700">{insights.contextual_analysis}</p>
          </div>
        )}

        {/* Market Impact */}
        {insights.market_impact && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-semibold text-sm text-green-900 mb-2">Market Impact</h4>
            <p className="text-sm text-gray-700">{insights.market_impact}</p>
          </div>
        )}

        {/* Risk Implications */}
        {insights.risk_implications.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h4 className="font-semibold text-sm text-red-900 mb-2">Risk Implications</h4>
            <ul className="space-y-1">
              {insights.risk_implications.map((risk, idx) => (
                <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                  <span className="text-red-600 mt-0.5">⚠</span>
                  <span>{risk}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
