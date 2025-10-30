'use client';

import { useState } from 'react';
import { SteelComplianceScore } from '@/components/dashboard/steel-compliance-score';
import { MitiPrioritiesWidget } from '@/components/dashboard/miti-priorities-widget';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  MITI_STEEL_2035_ROADMAP,
  MITI_STEEL_2035_PRIORITIES,
  MITI_STEEL_2035_ACTIONS,
  calculateComplianceScore,
  getCriticalPriorities,
  getActiveDumpingThreats,
  getPrioritiesByCategory,
} from '@/lib/industry-roadmaps/miti-steel-2035';
import {
  FileText,
  Download,
  ExternalLink,
  AlertCircle,
  TrendingUp,
  Shield,
  Factory,
} from 'lucide-react';

export default function SteelRoadmapPage() {
  const complianceScore = calculateComplianceScore();
  const criticalPriorities = getCriticalPriorities();
  const dumpingThreats = getActiveDumpingThreats();

  const [activeTab, setActiveTab] = useState<'overview' | 'priorities' | 'actions'>('overview');

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Roadmap Header */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Malaysian Steel Industry Roadmap 2035
            </h2>
            <p className="text-gray-700 mb-4">
              Ministry of International Trade and Industry (MITI) - Version {MITI_STEEL_2035_ROADMAP.version}
            </p>
            <div className="flex items-center gap-4 text-sm">
              <Badge className="bg-blue-100 text-blue-800">
                {MITI_STEEL_2035_ROADMAP.priorities.length} Priorities
              </Badge>
              <Badge className="bg-green-100 text-green-800">
                {MITI_STEEL_2035_ROADMAP.actions.length} Action Items
              </Badge>
              <span className="text-gray-600">
                Last updated: {new Date(MITI_STEEL_2035_ROADMAP.lastUpdated).toLocaleDateString()}
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            {MITI_STEEL_2035_ROADMAP.documentUrl && (
              <Button
                onClick={() => window.open(MITI_STEEL_2035_ROADMAP.documentUrl, '_blank')}
                variant="outline"
                className="bg-white"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Full Roadmap
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Compliance Score */}
      <SteelComplianceScore score={complianceScore} />

      {/* Key Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-3 mb-2">
            <Factory className="w-8 h-8 text-blue-600" />
            <div>
              <div className="text-sm text-gray-600">Critical Imports</div>
              <div className="text-2xl font-bold text-blue-600">
                {getPrioritiesByCategory('critical_import').length}
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-600">
            Products Malaysia needs to secure supply for
          </p>
        </Card>

        <Card className="p-4 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-8 h-8 text-red-600" />
            <div>
              <div className="text-sm text-gray-600">Dumping Threats</div>
              <div className="text-2xl font-bold text-red-600">
                {getPrioritiesByCategory('dumping_threat').length}
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-600">
            Active anti-dumping monitoring required
          </p>
        </Card>

        <Card className="p-4 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-8 h-8 text-orange-600" />
            <div>
              <div className="text-sm text-gray-600">Safeguard Measures</div>
              <div className="text-2xl font-bold text-orange-600">
                {getPrioritiesByCategory('safeguard_measure').length}
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-600">
            Under review for protective measures
          </p>
        </Card>

        <Card className="p-4 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-3 mb-2">
            <Factory className="w-8 h-8 text-green-600" />
            <div>
              <div className="text-sm text-gray-600">Industry Growth</div>
              <div className="text-2xl font-bold text-green-600">
                {getPrioritiesByCategory('industry_growth').length}
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-600">
            Development opportunities
          </p>
        </Card>
      </div>

      {/* Dumping Threats Alert */}
      {dumpingThreats.length > 0 && (
        <Card className="p-6 bg-red-50 border-red-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-red-600 mt-1" />
            <div className="flex-1">
              <h3 className="font-semibold text-red-900 mb-2">
                Active Dumping Threats Detected
              </h3>
              <p className="text-sm text-red-800 mb-3">
                {dumpingThreats.length} active dumping threat{dumpingThreats.length > 1 ? 's' : ''} require immediate attention.
                These may require anti-dumping investigations or safeguard measures.
              </p>
              <ul className="space-y-1">
                {dumpingThreats.slice(0, 3).map(threat => (
                  <li key={threat.id} className="text-sm text-red-700">
                    • {threat.name} - Affecting {threat.affectedProducts[0]}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      )}
    </div>
  );

  const renderPrioritiesTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">All Priorities</h3>
          <p className="text-sm text-gray-600">Complete list of MITI Steel Roadmap priorities</p>
        </div>
        <Badge className="bg-blue-100 text-blue-800">
          {MITI_STEEL_2035_PRIORITIES.length} Total
        </Badge>
      </div>

      <MitiPrioritiesWidget
        priorities={MITI_STEEL_2035_PRIORITIES}
        maxItems={MITI_STEEL_2035_PRIORITIES.length}
      />
    </div>
  );

  const renderActionsTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Action Items</h3>
          <p className="text-sm text-gray-600">Required actions to address roadmap priorities</p>
        </div>
        <Badge className="bg-green-100 text-green-800">
          {MITI_STEEL_2035_ACTIONS.length} Actions
        </Badge>
      </div>

      <div className="space-y-4">
        {MITI_STEEL_2035_ACTIONS.map((action) => (
          <Card key={action.id} className="p-6">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className={`${action.priority === 1 ? 'bg-red-100 text-red-800' :
                    action.priority === 2 ? 'bg-orange-100 text-orange-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                    Priority {action.priority}
                  </Badge>
                  <h4 className="font-semibold text-gray-900">{action.name}</h4>
                </div>
                <p className="text-sm text-gray-600 mb-3">{action.description}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4 border-t">
              <div>
                <div className="text-xs text-gray-500 mb-1">Responsible Party</div>
                <div className="text-sm font-medium">{action.responsibleParty}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Deadline</div>
                <div className="text-sm font-medium">{action.deadline}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Related Priorities</div>
                <div className="text-sm font-medium">{action.relatedPriorities.length}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Steel Roadmap</h1>
          <p className="text-gray-600 mt-2">
            Monitor alignment with MITI Steel Industry Roadmap 2035
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 font-medium transition-colors ${activeTab === 'overview'
            ? 'text-blue-600 border-b-2 border-blue-600'
            : 'text-gray-600 hover:text-gray-900'
            }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('priorities')}
          className={`px-4 py-2 font-medium transition-colors ${activeTab === 'priorities'
            ? 'text-blue-600 border-b-2 border-blue-600'
            : 'text-gray-600 hover:text-gray-900'
            }`}
        >
          Priorities ({MITI_STEEL_2035_PRIORITIES.length})
        </button>
        <button
          onClick={() => setActiveTab('actions')}
          className={`px-4 py-2 font-medium transition-colors ${activeTab === 'actions'
            ? 'text-blue-600 border-b-2 border-blue-600'
            : 'text-gray-600 hover:text-gray-900'
            }`}
        >
          Actions ({MITI_STEEL_2035_ACTIONS.length})
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && renderOverviewTab()}
      {activeTab === 'priorities' && renderPrioritiesTab()}
      {activeTab === 'actions' && renderActionsTab()}

      {/* Info Banner */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="flex items-start gap-3">
          <FileText className="w-6 h-6 text-blue-600 mt-1" />
          <div className="text-sm text-blue-800">
            <strong>How TradeNest Aligns with MITI Steel Roadmap 2035</strong>
            <p className="mt-2">
              This dashboard monitors your operations against the strategic priorities identified in the
              Malaysian Steel Industry Roadmap 2035. Track compliance, receive alerts for dumping threats,
              and access steel-specific trade remedy templates designed for the Malaysian market.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

