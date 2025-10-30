'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, TrendingDown, TrendingUp } from 'lucide-react';
import { RoadmapComplianceScore } from '@/lib/industry-roadmaps/types';

interface SteelComplianceScoreProps {
  score: RoadmapComplianceScore;
}

export function SteelComplianceScore({ score }: SteelComplianceScoreProps) {
  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'high':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default:
        return 'text-green-600 bg-green-50 border-green-200';
    }
  };

  const getRiskIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical':
        return <AlertCircle className="w-6 h-6 text-red-600" />;
      case 'high':
        return <AlertCircle className="w-6 h-6 text-orange-600" />;
      case 'medium':
        return <TrendingDown className="w-6 h-6 text-yellow-600" />;
      default:
        return <CheckCircle className="w-6 h-6 text-green-600" />;
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            MITI Steel Roadmap 2035 Compliance
          </h3>
          <p className="text-sm text-gray-600">
            How well your operations align with MITI priorities
          </p>
        </div>
        <Badge className={`${getRiskColor(score.riskLevel)} border capitalize`}>
          {score.riskLevel} Risk
        </Badge>
      </div>

      {/* Compliance Percentage */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Overall Compliance</span>
          <span className="text-2xl font-bold text-blue-600">{score.compliancePercentage}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-blue-600 h-3 rounded-full transition-all duration-500"
            style={{ width: `${score.compliancePercentage}%` }}
          />
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            <span className="text-xs text-gray-600">Total Priorities</span>
          </div>
          <div className="text-xl font-bold text-gray-900">{score.totalPriorities}</div>
        </div>
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle className="w-4 h-4 text-orange-600" />
            <span className="text-xs text-gray-600">Active Monitoring</span>
          </div>
          <div className="text-xl font-bold text-orange-600">{score.activeMonitoring}</div>
        </div>
      </div>

      {/* Risk Assessment */}
      <div className={`p-4 rounded-lg border ${getRiskColor(score.riskLevel)}`}>
        <div className="flex items-start gap-3">
          {getRiskIcon(score.riskLevel)}
          <div className="flex-1">
            <div className="font-semibold mb-1">Risk Assessment</div>
            <div className="text-sm">
              {score.riskLevel === 'critical' && (
                <>Immediate action required. {score.alertsTriggered} critical issues detected.</>
              )}
              {score.riskLevel === 'high' && (
                <>High priority monitoring. {score.alertsTriggered} major concerns identified.</>
              )}
              {score.riskLevel === 'medium' && (
                <>Moderate risk level. Continue monitoring {score.activeMonitoring} active priorities.</>
              )}
              {score.riskLevel === 'low' && (
                <>Low risk. Good compliance with {score.resolvedIssues} issues resolved.</>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

