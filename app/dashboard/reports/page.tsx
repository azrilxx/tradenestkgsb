'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function ReportsPage() {
  const [reportType, setReportType] = useState<'executive_summary' | 'quarterly_analysis' | 'sector_specific' | 'risk_assessment'>('executive_summary');
  const [sector, setSector] = useState<string>('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [loading, setLoading] = useState(false);

  const generateReport = async () => {
    setLoading(true);
    try {
      // Fetch alerts for the date range
      const response = await fetch('/api/alerts?limit=1000');
      const data = await response.json();
      const alerts = data.data || [];

      // Generate report data
      const reportData = {
        reportType,
        alerts,
        dateRange: {
          start: dateRange.start || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
          end: dateRange.end || new Date().toISOString(),
        },
        sector: sector || undefined,
      };

      // Dynamically import and use the report generator
      const { generateAndDownloadExecutiveReport } = await import('@/lib/pdf/evidence-generator');
      generateAndDownloadExecutiveReport(reportData);
    } catch (error) {
      console.error('Error generating report:', error);
      window.alert('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const reportTemplates = [
    {
      id: 'executive_summary',
      name: 'Executive Summary',
      description: 'High-level overview for executives',
      icon: '📊',
    },
    {
      id: 'quarterly_analysis',
      name: 'Quarterly Analysis',
      description: 'Quarterly trend and pattern analysis',
      icon: '📈',
    },
    {
      id: 'sector_specific',
      name: 'Sector-Specific Analysis',
      description: 'Focus on specific industry sector',
      icon: '🏭',
    },
    {
      id: 'risk_assessment',
      name: 'Risk Assessment',
      description: 'Comprehensive risk analysis',
      icon: '⚠️',
    },
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Executive Intelligence Reports</h1>
        <p className="text-gray-600 mt-1">
          Generate professional intelligence reports with interconnected analysis
        </p>
      </div>

      {/* Report Templates */}
      <Card>
        <CardHeader>
          <CardTitle>Select Report Type</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reportTemplates.map((template) => (
              <button
                key={template.id}
                onClick={() => setReportType(template.id as any)}
                className={`p-4 border-2 rounded-lg text-left transition-all ${reportType === template.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-3xl">{template.icon}</span>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{template.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                    {reportType === template.id && (
                      <Badge className="mt-2 bg-blue-500 text-white">Selected</Badge>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Report Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Report Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
              />
            </div>
          </div>

          {reportType === 'sector_specific' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sector (Optional)
              </label>
              <input
                type="text"
                value={sector}
                onChange={(e) => setSector(e.target.value)}
                placeholder="e.g., Electronics, Steel, Chemicals"
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Generate Button */}
      <Card>
        <CardContent className="py-6">
          <Button
            onClick={generateReport}
            disabled={loading}
            className="w-full"
            size="lg"
          >
            {loading ? 'Generating Report...' : 'Generate Executive Intelligence Report'}
          </Button>
          <p className="text-sm text-gray-600 text-center mt-4">
            Report will include: alerts, interconnected intelligence, expert insights, and recommendations
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

