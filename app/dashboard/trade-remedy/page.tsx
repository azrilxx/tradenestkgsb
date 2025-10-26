'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { generateAndDownloadTradeRemedyReport } from '@/lib/pdf/evidence-generator';
import { TRADE_REMEDY_TEMPLATES, type TradeRemedyTemplate } from '@/lib/trade-remedy/templates';

// Define types for calculations
type SeverityLevel = 'severe' | 'significant' | 'moderate' | 'minimal';

interface TradeRemedyCalculations {
  severity: {
    level: SeverityLevel;
    description: string;
  };
  dumping: {
    margin: number;
    amount: number;
    currency: string;
  };
  price: {
    exportPrice: number;
    normalValue: number;
    depression: number;
  };
  volume: {
    impact?: number;
  };
  injury: {
    estimatedRevenueLoss?: number;
  };
  causation: string;
  recommendedMeasures: {
    measures: string[];
    duration: string;
    justification: string;
  };
}

export default function TradeRemedyWorkbenchPage() {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');

  const [formData, setFormData] = useState({
    caseName: '',
    petitionerName: '',
    subjectProduct: '',
    hsCode: '',
    countryOfOrigin: '',
    exportPrice: '',
    normalValue: '',
    importVolumeCurrent: '',
    importVolumePrevious: '',
    domesticMarketShare: '',
    currency: 'USD',
  });

  const [calculations, setCalculations] = useState<TradeRemedyCalculations | null>(null);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = TRADE_REMEDY_TEMPLATES.find((t) => t.id === templateId);
    if (template) {
      setSelectedTemplate(templateId);
      setFormData(template.formData);
    }
  };

  const handleCalculate = async () => {
    if (!formData.exportPrice || !formData.normalValue) {
      alert('Please enter export price and normal value');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/trade-remedy/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exportPrice: parseFloat(formData.exportPrice),
          normalValue: parseFloat(formData.normalValue),
          importVolumeCurrent: formData.importVolumeCurrent
            ? parseFloat(formData.importVolumeCurrent)
            : null,
          importVolumePrevious: formData.importVolumePrevious
            ? parseFloat(formData.importVolumePrevious)
            : null,
          domesticMarketShare: formData.domesticMarketShare
            ? parseFloat(formData.domesticMarketShare)
            : null,
          currency: formData.currency,
        }),
      });

      const data = await response.json();
      setCalculations(data);
    } catch (error) {
      console.error('Failed to calculate:', error);
      alert('Failed to calculate dumping margin');
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePDF = () => {
    if (!calculations || !formData.caseName) {
      alert('Please calculate dumping margin first and provide a case name');
      return;
    }

    try {
      generateAndDownloadTradeRemedyReport(
        {
          caseName: formData.caseName || 'Trade Remedy Case',
          petitionerName: formData.petitionerName || undefined,
          subjectProduct: formData.subjectProduct || undefined,
          hsCode: formData.hsCode || undefined,
          countryOfOrigin: formData.countryOfOrigin || undefined,
          exportPrice: parseFloat(formData.exportPrice),
          normalValue: parseFloat(formData.normalValue),
          dumpingMargin: calculations.dumping.margin,
          priceDepression: calculations.price.depression,
          volumeImpact: calculations.volume.impact || undefined,
          estimatedRevenueLoss: calculations.injury.estimatedRevenueLoss || undefined,
          causation: calculations.causation,
          recommendedMeasures: calculations.recommendedMeasures,
          severity: calculations.severity,
          currency: calculations.dumping.currency,
        },
        `trade-remedy-report-${formData.caseName.replace(/\s+/g, '-')}.pdf`
      );
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      alert('Failed to generate PDF report');
    }
  };

  const severityColors: Record<SeverityLevel, string> = {
    severe: 'bg-red-100 text-red-800',
    significant: 'bg-orange-100 text-orange-800',
    moderate: 'bg-yellow-100 text-yellow-800',
    minimal: 'bg-blue-100 text-blue-800',
  } as const;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Trade Remedy Workbench</h1>
        <p className="text-gray-600 mt-2">
          Calculate dumping margins and generate evidence for anti-dumping petitions
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Case Information</h2>

          {/* Template Selector */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Load Template (Optional)
            </label>
            <select
              value={selectedTemplate}
              onChange={(e) => {
                setSelectedTemplate(e.target.value);
                if (e.target.value) handleTemplateSelect(e.target.value);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">Select a template...</option>
              {TRADE_REMEDY_TEMPLATES.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name} - {template.category}
                </option>
              ))}
            </select>
            {selectedTemplate && (
              <p className="text-xs text-gray-500 mt-2">
                {
                  TRADE_REMEDY_TEMPLATES.find((t) => t.id === selectedTemplate)
                    ?.description
                }
              </p>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Case Name *
              </label>
              <input
                type="text"
                name="caseName"
                value={formData.caseName}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="e.g., Anti-Dumping on Steel from China"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Petitioner Name
              </label>
              <input
                type="text"
                name="petitionerName"
                value={formData.petitionerName}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="e.g., MegaSteel Industries"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subject Product
              </label>
              <input
                type="text"
                name="subjectProduct"
                value={formData.subjectProduct}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="e.g., Flat-rolled steel products"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  HS Code
                </label>
                <input
                  type="text"
                  name="hsCode"
                  value={formData.hsCode}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="7208"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Country of Origin
                </label>
                <input
                  type="text"
                  name="countryOfOrigin"
                  value={formData.countryOfOrigin}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="China"
                />
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3">Pricing Data *</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Export Price
                  </label>
                  <input
                    type="number"
                    name="exportPrice"
                    value={formData.exportPrice}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Normal Value (Fair Price)
                  </label>
                  <input
                    type="number"
                    name="normalValue"
                    value={formData.normalValue}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="800"
                  />
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3">Volume & Market Impact</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Current Import Volume
                  </label>
                  <input
                    type="number"
                    name="importVolumeCurrent"
                    value={formData.importVolumeCurrent}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="1000000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Previous Volume
                  </label>
                  <input
                    type="number"
                    name="importVolumePrevious"
                    value={formData.importVolumePrevious}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="600000"
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Domestic Market Share Loss (%)
                </label>
                <input
                  type="number"
                  name="domesticMarketShare"
                  value={formData.domesticMarketShare}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="25"
                />
              </div>
            </div>

            <Button
              onClick={handleCalculate}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? 'Calculating...' : 'Calculate Dumping Margin'}
            </Button>
          </div>
        </Card>

        {/* Results */}
        <div className="space-y-4">
          {calculations && (
            <>
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Dumping Analysis</h2>

                <div className="space-y-4">
                  <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600">Dumping Margin</span>
                      <Badge
                        className={`${severityColors[calculations.severity.level]} font-bold`}
                      >
                        {calculations.dumping.margin.toFixed(2)}%
                      </Badge>
                    </div>
                    <div className="text-3xl font-bold text-red-600">
                      {calculations.dumping.amount.toFixed(2)} {calculations.dumping.currency}
                    </div>
                    <div className="text-sm text-gray-600 mt-2">
                      {calculations.severity.description}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Card className="p-3">
                      <div className="text-sm text-gray-600">Export Price</div>
                      <div className="text-xl font-semibold">
                        {calculations.price.exportPrice} {calculations.dumping.currency}
                      </div>
                    </Card>
                    <Card className="p-3">
                      <div className="text-sm text-gray-600">Normal Value</div>
                      <div className="text-xl font-semibold">
                        {calculations.price.normalValue} {calculations.dumping.currency}
                      </div>
                    </Card>
                  </div>

                  {calculations.volume.impact !== null && (
                    <Card className="p-4 bg-orange-50 border border-orange-200">
                      <div className="text-sm text-gray-600 mb-2">Volume Impact</div>
                      <div className="text-2xl font-bold text-orange-600">
                        +{calculations.volume.impact.toFixed(1)}%
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        Import volume surge detected
                      </div>
                    </Card>
                  )}

                  {calculations.injury.estimatedRevenueLoss && (
                    <Card className="p-4 bg-red-50 border border-red-200">
                      <div className="text-sm text-gray-600 mb-2">Estimated Revenue Loss</div>
                      <div className="text-2xl font-bold text-red-600">
                        {calculations.injury.estimatedRevenueLoss.toLocaleString()}{' '}
                        {calculations.dumping.currency}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        Based on market share loss
                      </div>
                    </Card>
                  )}
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="font-semibold mb-3">Causation Analysis</h3>
                <p className="text-sm text-gray-700 bg-gray-50 p-4 rounded-lg">
                  {calculations.causation}
                </p>
              </Card>

              <Card className="p-6">
                <h3 className="font-semibold mb-3">Recommended Measures</h3>
                <div className="space-y-2">
                  {calculations.recommendedMeasures.measures.map(
                    (measure: string, idx: number) => (
                      <Badge key={idx} className="bg-blue-100 text-blue-800">
                        {measure}
                      </Badge>
                    )
                  )}
                </div>
                <div className="mt-3 text-sm text-gray-600">
                  <strong>Duration:</strong> {calculations.recommendedMeasures.duration}
                </div>
                <div className="mt-2 text-sm text-gray-600">
                  {calculations.recommendedMeasures.justification}
                </div>
              </Card>

              {/* Generate PDF Report Button */}
              <Card className="p-6 bg-green-50 border-green-200">
                <h3 className="font-semibold mb-4 text-green-800">Generate Evidence Report</h3>
                <p className="text-sm text-gray-700 mb-4">
                  Generate a professional PDF report with all dumping analysis, injury assessment, and
                  recommended trade remedy measures for legal submission.
                </p>
                <Button
                  onClick={handleGeneratePDF}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  📄 Generate Trade Remedy Report (PDF)
                </Button>
              </Card>
            </>
          )}

          {!calculations && (
            <Card className="p-12 text-center border-dashed border-2 border-gray-300">
              <div className="text-gray-500">
                Enter case information and click "Calculate Dumping Margin" to begin analysis.
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Info Banner */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="flex items-start gap-3">
          <span className="text-2xl">ℹ️</span>
          <div className="text-sm text-blue-800">
            <strong>Trade Remedy Workbench</strong> automates dumping margin calculations and
            generates court-ready evidence for anti-dumping petitions. This tool helps steel mills,
            manufacturers, and law firms prepare trade remedy cases efficiently, reducing preparation
            time from months to days.
          </div>
        </div>
      </Card>
    </div>
  );
}

