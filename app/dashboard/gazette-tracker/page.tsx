'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Gazette } from '@/types/database';
import { TrendingUp, AlertCircle, BarChart3, Globe, Calendar } from 'lucide-react';
import { SectorImpactChart } from '@/components/gazette/sector-impact-chart';
import { TimelineChart } from '@/components/gazette/timeline-chart';
import { isSteelRelatedGazette } from '@/lib/gazette-tracker/steel-matcher';

const CATEGORY_COLORS = {
  trade_remedy: 'bg-blue-100 text-blue-800',
  tariff_change: 'bg-green-100 text-green-800',
  import_restriction: 'bg-red-100 text-red-800',
  anti_dumping: 'bg-orange-100 text-orange-800',
};

const CATEGORY_LABELS = {
  trade_remedy: 'Trade Remedy',
  tariff_change: 'Tariff Change',
  import_restriction: 'Import Restriction',
  anti_dumping: 'Anti-Dumping',
};

type Tab = 'overview' | 'analytics';

export default function GazetteTrackerPage() {
  const [gazettes, setGazettes] = useState<Gazette[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [steelFilter, setSteelFilter] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  // Analytics data
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<any>(null);

  useEffect(() => {
    fetchGazettes();
  }, [categoryFilter]);

  const fetchGazettes = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (categoryFilter) params.append('category', categoryFilter);

      const response = await fetch(`/api/gazette?${params.toString()}`);
      const data = await response.json();
      setGazettes(data.gazettes || []);
    } catch (error) {
      console.error('Failed to fetch gazettes:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    setAnalyticsLoading(true);
    try {
      const response = await fetch('/api/gazette/analytics');
      const data = await response.json();
      if (data.success) {
        setAnalyticsData(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  // Fetch analytics when switching to analytics tab
  useEffect(() => {
    if (activeTab === 'analytics') {
      fetchAnalytics();
    }
  }, [activeTab]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-MY', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Generate gazette URL dynamically based on gazette number and type
  const getGazetteUrl = (gazetteNumber: string, pdfUrl?: string): string => {
    // If we have a specific PDF URL, use that
    if (pdfUrl && pdfUrl !== 'https://lom.agc.gov.my' && pdfUrl !== 'https://lom.agc.gov.my/') {
      return pdfUrl;
    }

    // For P.U.(A) and P.U.(B) gazettes, construct direct search URL
    if (gazetteNumber.includes('P.U.(A)')) {
      // Extract the number part, e.g., "P.U.(A) 371/2025" -> "371"
      const match = gazetteNumber.match(/P\.U\.\(A\)\s*(\d+)\/2025/);
      if (match && match[1]) {
        return `https://lom.agc.gov.my/subsid.php?type=pua&year=2025&gazette=${match[1]}`;
      }
      return `https://lom.agc.gov.my/subsid.php?type=pua&year=2025`;
    }

    if (gazetteNumber.includes('P.U.(B)')) {
      const match = gazetteNumber.match(/P\.U\.\(B\)\s*(\d+)\/2025/);
      if (match && match[1]) {
        return `https://lom.agc.gov.my/subsid.php?type=pub&year=2025&gazette=${match[1]}`;
      }
      return `https://lom.agc.gov.my/subsid.php?type=pub&year=2025`;
    }

    // For Act numbers (e.g., "Act 502", "Act 871") - extract number and link directly
    if (gazetteNumber.match(/Act\s+\d+/i)) {
      const actMatch = gazetteNumber.match(/Act\s+(\d+)/i);
      if (actMatch && actMatch[1]) {
        const actNumber = actMatch[1]; // Just the number, no "A" prefix
        return `https://lom.agc.gov.my/act-detail.php?language=BI&act=${actNumber}`;
      }
    }

    // For CAP numbers (e.g., "SABAH CAP. 67")
    if (gazetteNumber.match(/CAP\.\s*\d+/i)) {
      return `https://lom.agc.gov.my/index.php?search=${encodeURIComponent(gazetteNumber)}`;
    }

    // For A-numbers (e.g., "A1651", "A1648") - extract number and link directly
    if (gazetteNumber.match(/^A\d+$/i)) {
      const actMatch = gazetteNumber.match(/^A(\d+)$/i);
      if (actMatch && actMatch[1]) {
        const actNumber = actMatch[1]; // Just the number, no "A" prefix
        return `https://lom.agc.gov.my/act-detail.php?language=BI&act=${actNumber}`;
      }
    }

    // For "FEDERAL CONSTITUTION" - direct link to constitution page
    if (gazetteNumber.includes('FEDERAL CONSTITUTION')) {
      return `https://lom.agc.gov.my/fed/federal-constitution.php?language=BI`;
    }

    // Generic fallback - search by encoded gazette number
    const encodedNumber = encodeURIComponent(gazetteNumber);
    return `https://lom.agc.gov.my/index.php?search=${encodedNumber}`;
  };

  const filteredGazettes = gazettes.filter(gazette => {
    // Steel filter
    if (steelFilter && !isSteelRelatedGazette(gazette.title || '', gazette.summary || '')) {
      return false;
    }

    // Search filter
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      gazette.title?.toLowerCase().includes(search) ||
      gazette.gazette_number?.toLowerCase().includes(search) ||
      gazette.summary?.toLowerCase().includes(search)
    );
  });

  const renderOverviewTab = () => (
    <>
      {/* Filters */}
      <Card className="p-4">
        <div className="flex gap-4 items-center">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search gazettes by title, number, or summary..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="">All Categories</option>
            <option value="trade_remedy">Trade Remedy</option>
            <option value="tariff_change">Tariff Change</option>
            <option value="import_restriction">Import Restriction</option>
            <option value="anti_dumping">Anti-Dumping</option>
          </select>
          <label className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
            <input
              type="checkbox"
              checked={steelFilter}
              onChange={(e) => setSteelFilter(e.target.checked)}
              className="w-4 h-4 text-blue-600"
            />
            <span className="text-sm font-medium">Steel Products Only</span>
          </label>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-sm text-gray-600">Total Gazettes</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{gazettes.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">Trade Remedies</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">
            {gazettes.filter(g => g.category === 'trade_remedy').length}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">Tariff Changes</div>
          <div className="text-2xl font-bold text-green-600 mt-1">
            {gazettes.filter(g => g.category === 'tariff_change').length}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">Anti-Dumping</div>
          <div className="text-2xl font-bold text-orange-600 mt-1">
            {gazettes.filter(g => g.category === 'anti_dumping').length}
          </div>
        </Card>
      </div>

      {/* Gazette List */}
      {loading ? (
        <Card className="p-12 text-center">
          <div className="text-gray-500">Loading gazettes...</div>
        </Card>
      ) : filteredGazettes.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="text-gray-500">
            {gazettes.length === 0
              ? 'No gazettes found. Run the seed script to populate sample data.'
              : 'No gazettes match your filters.'}
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredGazettes.map((gazette) => (
            <Card key={gazette.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Badge
                      className={`${CATEGORY_COLORS[gazette.category]} font-medium`}
                    >
                      {CATEGORY_LABELS[gazette.category]}
                    </Badge>
                    <span className="text-sm text-gray-500">
                      {formatDate(gazette.publication_date)}
                    </span>
                    {(gazette as any).sector && (
                      <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                        {(gazette as any).sector}
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {gazette.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-3">{gazette.summary}</p>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-500">
                      <strong>Gazette No:</strong> {gazette.gazette_number}
                    </span>
                    {(gazette as any).duty_rate_min && (gazette as any).duty_rate_max && (
                      <span className="text-sm text-gray-500">
                        <strong>Duty Rate:</strong> {(gazette as any).duty_rate_min}% - {(gazette as any).duty_rate_max}%
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  {gazette.gazette_number && (
                    <Button
                      onClick={() => {
                        const url = getGazetteUrl(gazette.gazette_number || '', gazette.pdf_url);
                        console.log('Opening gazette URL:', url, 'for gazette:', gazette.gazette_number);
                        window.open(url, '_blank');
                      }}
                      variant="outline"
                      className="w-full"
                    >
                      🔗 View on Official Site
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );

  const renderAnalyticsTab = () => (
    <div className="space-y-6">
      {analyticsLoading ? (
        <Card className="p-12 text-center">
          <div className="text-gray-500">Loading analytics...</div>
        </Card>
      ) : analyticsData ? (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                <div className="text-sm text-gray-600">Sectors Affected</div>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {analyticsData.sector_impact?.length || 0}
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <div className="text-sm text-gray-600">Total Value at Risk</div>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                RM {(analyticsData.sector_impact?.reduce((sum: number, s: any) => sum + s.total_value_at_risk, 0) / 1000000).toFixed(0)}M
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Globe className="w-5 h-5 text-purple-600" />
                <div className="text-sm text-gray-600">Countries Affected</div>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {analyticsData.geographic_distribution?.length || 0}
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <div className="text-sm text-gray-600">Expiring Measures</div>
              </div>
              <div className="text-2xl font-bold text-red-600">
                {analyticsData.expiring_measures?.length || 0}
              </div>
            </Card>
          </div>

          {/* Sector Impact Chart */}
          {analyticsData.sector_impact && analyticsData.sector_impact.length > 0 && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Sector Impact Analysis</h3>
              <SectorImpactChart data={analyticsData.sector_impact} />
            </Card>
          )}

          {/* Monthly Trends */}
          {analyticsData.monthly_trends && analyticsData.monthly_trends.length > 0 && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Monthly Trend Analysis</h3>
              <TimelineChart data={analyticsData.monthly_trends} />
            </Card>
          )}

          {/* Expiring Measures */}
          {analyticsData.expiring_measures && analyticsData.expiring_measures.length > 0 && (
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-5 h-5 text-red-600" />
                <h3 className="text-lg font-semibold">Expiring Measures</h3>
              </div>
              <div className="space-y-3">
                {analyticsData.expiring_measures.slice(0, 5).map((measure: any) => (
                  <div key={measure.gazette_id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div>
                      <div className="font-medium">{measure.title}</div>
                      <div className="text-sm text-gray-600">{measure.gazette_number}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-red-600">
                        {measure.days_remaining} days left
                      </div>
                      <div className="text-xs text-gray-500">
                        Expires: {formatDate(measure.expiry_date)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      ) : (
        <Card className="p-12 text-center">
          <div className="text-gray-500">
            No analytics data available. Apply migration 015 and seed enhanced data.
          </div>
        </Card>
      )}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gazette Tracker</h1>
          <p className="text-gray-600 mt-2">
            Monitor Malaysian Federal Gazette for trade remedy announcements
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
          onClick={() => setActiveTab('analytics')}
          className={`px-4 py-2 font-medium transition-colors ${activeTab === 'analytics'
            ? 'text-blue-600 border-b-2 border-blue-600'
            : 'text-gray-600 hover:text-gray-900'
            }`}
        >
          Analytics
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' ? renderOverviewTab() : renderAnalyticsTab()}

      {/* Info Banner */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="flex items-start gap-3">
          <span className="text-2xl">ℹ️</span>
          <div className="text-sm text-blue-800">
            <strong>Gazette Tracker</strong> monitors Malaysian Federal Gazette publications for
            trade remedy announcements, tariff changes, import restrictions, and anti-dumping
            duties. Set up watchlist subscriptions to receive notifications when gazettes affect
            your products or countries.
          </div>
        </div>
      </Card>

      {/* Link Information Banner */}
      <Card className="p-4 bg-yellow-50 border-yellow-200">
        <div className="flex items-start gap-3">
          <span className="text-2xl">🔗</span>
          <div className="text-sm text-yellow-800">
            <strong>Note:</strong> "View on Official Site" button links to the Malaysian Federal Legislation website where you can search for the gazette.
            Some recent gazettes may not have PDFs uploaded yet. For full search functionality, visit <a href="https://lom.agc.gov.my" target="_blank" rel="noopener noreferrer" className="underline font-semibold">https://lom.agc.gov.my</a>
          </div>
        </div>
      </Card>
    </div>
  );
}
