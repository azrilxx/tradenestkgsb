'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ScenarioAnalysis {
  base_scenario: any;
  alternative_scenarios: any[];
  best_case: any;
  worst_case: any;
  recommendations: string[];
  sensitivity_analysis: any;
}

export function WhatIfCalculator() {
  const [baseData, setBaseData] = useState({
    price: 1000,
    volume: 100,
    freight_cost: 200,
    fx_rate: 4.5,
    tariff_rate: 5,
  });

  const [selectedTemplate, setSelectedTemplate] = useState('comprehensive');
  const [results, setResults] = useState<ScenarioAnalysis | null>(null);
  const [loading, setLoading] = useState(false);

  async function runAnalysis() {
    setLoading(true);
    try {
      const response = await fetch('/api/analytics/scenario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          base_data: baseData,
          template: selectedTemplate,
        }),
      });

      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error('Error running scenario analysis:', error);
    } finally {
      setLoading(false);
    }
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Input Panel */}
      <Card>
        <CardHeader>
          <CardTitle>What-If Scenario Calculator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Base Data Inputs */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Unit Price ($)</label>
              <input
                type="number"
                value={baseData.price}
                onChange={(e) => setBaseData({ ...baseData, price: parseFloat(e.target.value) })}
                className="w-full border rounded-lg px-3 py-2 mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Volume (units)</label>
              <input
                type="number"
                value={baseData.volume}
                onChange={(e) => setBaseData({ ...baseData, volume: parseFloat(e.target.value) })}
                className="w-full border rounded-lg px-3 py-2 mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Freight Cost ($/unit)</label>
              <input
                type="number"
                value={baseData.freight_cost}
                onChange={(e) => setBaseData({ ...baseData, freight_cost: parseFloat(e.target.value) })}
                className="w-full border rounded-lg px-3 py-2 mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">FX Rate</label>
              <input
                type="number"
                value={baseData.fx_rate}
                onChange={(e) => setBaseData({ ...baseData, fx_rate: parseFloat(e.target.value) })}
                className="w-full border rounded-lg px-3 py-2 mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Tariff Rate (%)</label>
              <input
                type="number"
                value={baseData.tariff_rate}
                onChange={(e) => setBaseData({ ...baseData, tariff_rate: parseFloat(e.target.value) })}
                className="w-full border rounded-lg px-3 py-2 mt-1"
              />
            </div>
          </div>

          {/* Template Selection */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Scenario Template</label>
            <select
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="comprehensive">Comprehensive Analysis</option>
              <option value="fx_volatility">FX Volatility</option>
              <option value="freight_surge">Freight Surge</option>
              <option value="tariff_change">Tariff Change</option>
            </select>
          </div>

          <Button onClick={runAnalysis} disabled={loading} className="w-full">
            {loading ? 'Calculating...' : 'Run Scenario Analysis'}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {results && (
        <div className="space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-gray-600 mb-1">Best Case</p>
                <p className="text-2xl font-bold text-green-600">
                  ${results.best_case.total_cost_impact.toFixed(2)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-gray-600 mb-1">Base Case</p>
                <p className="text-2xl font-bold text-blue-600">
                  ${results.base_scenario.total_cost_impact.toFixed(2)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-gray-600 mb-1">Worst Case</p>
                <p className="text-2xl font-bold text-red-600">
                  ${results.worst_case.total_cost_impact.toFixed(2)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Scenarios */}
          <Card>
            <CardHeader>
              <CardTitle>Scenario Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[results.best_case, ...results.alternative_scenarios, results.worst_case].map((scenario, idx) => (
                  <div key={idx} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold">{scenario.scenario_name}</span>
                      <Badge className={getRiskColor(scenario.risk_level)}>
                        {scenario.risk_level}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Total Cost</p>
                        <p className="font-semibold">${scenario.total_cost_impact.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Cost/Unit</p>
                        <p className="font-semibold">${scenario.key_metrics.cost_per_unit.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Change</p>
                        <p className={`font-semibold ${scenario.percentage_change > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {scenario.percentage_change > 0 ? '+' : ''}{scenario.percentage_change.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle>Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {results.recommendations.map((rec, idx) => (
                  <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Sensitivity Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Sensitivity Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-700">
                Most sensitive variable: <span className="font-semibold">{results.sensitivity_analysis.most_sensitive_variable}</span>
              </p>
              <p className="text-sm text-gray-700 mt-2">
                Sensitivity score: <span className="font-semibold">{results.sensitivity_analysis.sensitivity_score.toFixed(1)}%</span>
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
