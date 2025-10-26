'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Gazette, GazetteAffectedItem } from '@/types/database';

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

export default function GazetteTrackerPage() {
  const [gazettes, setGazettes] = useState<Gazette[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-MY', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const filteredGazettes = gazettes.filter(gazette => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      gazette.title?.toLowerCase().includes(search) ||
      gazette.gazette_number?.toLowerCase().includes(search) ||
      gazette.summary?.toLowerCase().includes(search)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gazette Tracker</h1>
          <p className="text-gray-600 mt-2">
            Monitor Malaysian Federal Gazette for trade remedy announcements
          </p>
        </div>
      </div>

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
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {gazette.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-3">{gazette.summary}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>
                      <strong>Gazette No:</strong> {gazette.gazette_number}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  {gazette.pdf_url && (
                    <Button
                      onClick={() => window.open(gazette.pdf_url, '_blank')}
                      variant="outline"
                      className="w-full"
                    >
                      📄 View PDF
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

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
    </div>
  );
}

