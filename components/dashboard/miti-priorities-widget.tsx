'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RoadmapPriority } from '@/lib/industry-roadmaps/types';
import {
  AlertTriangle,
  TrendingUp,
  Shield,
  Factory,
  Zap,
  ExternalLink
} from 'lucide-react';

interface MitiPrioritiesWidgetProps {
  priorities: RoadmapPriority[];
  maxItems?: number
}

export function MitiPrioritiesWidget({ priorities, maxItems = 5 }: MitiPrioritiesWidgetProps) {
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'critical_import':
        return <Factory className="w-5 h-5" />;
      case 'dumping_threat':
        return <TrendingUp className="w-5 h-5" />;
      case 'safeguard_measure':
        return <Shield className="w-5 h-5" />;
      case 'industry_growth':
        return <Zap className="w-5 h-5" />;
      case 'technology_adoption':
        return <Zap className="w-5 h-5" />;
      default:
        return <AlertTriangle className="w-5 h-5" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'critical_import':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'dumping_threat':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'safeguard_measure':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'industry_growth':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'technology_adoption':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCategoryLabel = (category: string) => {
    return category.split('_').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const getSeverityBadge = (severity: string) => {
    const colors = {
      'critical': 'bg-red-600',
      'high': 'bg-orange-600',
      'medium': 'bg-yellow-600',
      'low': 'bg-green-600',
    };
    return (
      <span className={`text-xs px-2 py-1 rounded-full text-white ${colors[severity as keyof typeof colors]}`}>
        {severity.toUpperCase()}
      </span>
    );
  };

  const displayedPriorities = priorities.slice(0, maxItems);

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">MITI Priorities</h3>
          <p className="text-sm text-gray-600">Steel Roadmap 2035 - Active concerns</p>
        </div>
        <Badge className="bg-blue-100 text-blue-800">
          {priorities.length} Total
        </Badge>
      </div>

      <div className="space-y-3">
        {displayedPriorities.map((priority) => (
          <div
            key={priority.id}
            className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all"
          >
            <div className="flex items-start gap-3 mb-2">
              <div className={`p-2 rounded-lg ${getCategoryColor(priority.category).replace('text-', 'bg-').replace('border-', '')}`}>
                {getCategoryIcon(priority.category)}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-gray-900 text-sm">{priority.name}</h4>
                  {getSeverityBadge(priority.severity)}
                </div>
                <p className="text-xs text-gray-600 mb-2">{priority.description}</p>

                {/* Affected Products */}
                {priority.affectedProducts.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {priority.affectedProducts.slice(0, 2).map((product, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {product}
                      </Badge>
                    ))}
                    {priority.affectedProducts.length > 2 && (
                      <Badge variant="outline" className="text-xs">
                        +{priority.affectedProducts.length - 2} more
                      </Badge>
                    )}
                  </div>
                )}

                {/* HS Codes and Countries */}
                <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
                  {priority.hsCodes && priority.hsCodes.length > 0 && (
                    <span>HS: {priority.hsCodes.join(', ')}</span>
                  )}
                  {priority.affectedCountries && priority.affectedCountries.length > 0 && (
                    <span>Countries: {priority.affectedCountries.slice(0, 2).join(', ')}</span>
                  )}
                </div>

                {/* Timeline */}
                <div className="mt-2 text-xs text-gray-500">
                  Timeline: {priority.timeline}
                </div>
              </div>
            </div>

            {/* Status and Action */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
              <Badge className={`${priority.status === 'active'
                  ? 'bg-red-100 text-red-800'
                  : priority.status === 'monitoring'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-green-100 text-green-800'
                }`}>
                {priority.status.toUpperCase()}
              </Badge>
              <Button variant="ghost" size="sm" className="text-xs">
                View Details <ExternalLink className="w-3 h-3 ml-1" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {priorities.length > maxItems && (
        <div className="mt-4 text-center">
          <Button variant="outline" size="sm">
            View All {priorities.length} Priorities
          </Button>
        </div>
      )}
    </Card>
  );
}

