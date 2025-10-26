'use client';

import { useState } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, Download, Info } from 'lucide-react';

interface Declaration {
  hs_code: string;
  description: string;
  value: number;
  currency: string;
  quantity: number;
  unit: string;
  country_of_origin: string;
  port_of_entry: string;
  importer_name: string;
  exporter_name: string;
}

interface ComplianceIssue {
  declaration: Declaration;
  severity: 'low' | 'medium' | 'high' | 'critical';
  issue_type: string;
  description: string;
  recommendation: string;
}

interface ComplianceResult {
  total_checked: number;
  passed: number;
  failed: number;
  issues: ComplianceIssue[];
  risk_level: 'low' | 'medium' | 'high';
  recommendations: string[];
}

export default function CustomsCheckerPage() {
  const [manualEntry, setManualEntry] = useState(true);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ComplianceResult | null>(null);
  const [declarations, setDeclarations] = useState<Declaration[]>([
    {
      hs_code: '',
      description: '',
      value: 0,
      currency: 'MYR',
      quantity: 0,
      unit: 'pcs',
      country_of_origin: '',
      port_of_entry: '',
      importer_name: '',
      exporter_name: '',
    },
  ]);

  const handleAddDeclaration = () => {
    setDeclarations([
      ...declarations,
      {
        hs_code: '',
        description: '',
        value: 0,
        currency: 'MYR',
        quantity: 0,
        unit: 'pcs',
        country_of_origin: '',
        port_of_entry: '',
        importer_name: '',
        exporter_name: '',
      },
    ]);
  };

  const handleDeclarationChange = (index: number, field: keyof Declaration, value: any) => {
    const updated = [...declarations];
    updated[index] = { ...updated[index], [field]: value };
    setDeclarations(updated);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/customs/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          declarations,
          format: 'json',
        }),
      });

      const data = await response.json();

      if (data.success) {
        setResult(data.data.compliance);
      } else {
        alert('Error: ' + data.error);
      }
    } catch (error) {
      console.error('Error checking compliance:', error);
      alert('Failed to check compliance');
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high':
        return 'text-red-600';
      case 'medium':
        return 'text-yellow-600';
      case 'low':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Customs Declaration Checker</h1>
        <p className="text-gray-600">
          Pre-screen your customs declarations for compliance before filing
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
        <div>
          <h3 className="font-semibold text-blue-900 mb-1">How it works</h3>
          <p className="text-sm text-blue-800">
            Enter your customs declaration details below. Our system will check HS code accuracy,
            validate pricing against market benchmarks, and flag potential compliance issues.
            Recommendations help you prepare proper documentation before filing with customs.
          </p>
        </div>
      </div>

      {/* Manual Entry Form */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Declaration Details
        </h2>

        <div className="space-y-4">
          {declarations.map((decl, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-3">
              <div className="text-sm font-medium text-gray-700 mb-2">
                Declaration #{index + 1}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    HS Code *
                  </label>
                  <input
                    type="text"
                    value={decl.hs_code}
                    onChange={(e) => handleDeclarationChange(index, 'hs_code', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="e.g., 7208"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description *
                  </label>
                  <input
                    type="text"
                    value={decl.description}
                    onChange={(e) => handleDeclarationChange(index, 'description', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Product description"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Value *
                  </label>
                  <input
                    type="number"
                    value={decl.value}
                    onChange={(e) => handleDeclarationChange(index, 'value', parseFloat(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Currency
                  </label>
                  <select
                    value={decl.currency}
                    onChange={(e) => handleDeclarationChange(index, 'currency', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option>MYR</option>
                    <option>USD</option>
                    <option>CNY</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity *
                  </label>
                  <input
                    type="number"
                    value={decl.quantity}
                    onChange={(e) => handleDeclarationChange(index, 'quantity', parseFloat(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unit
                  </label>
                  <input
                    type="text"
                    value={decl.unit}
                    onChange={(e) => handleDeclarationChange(index, 'unit', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="pcs, kg, m3"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Country of Origin *
                  </label>
                  <input
                    type="text"
                    value={decl.country_of_origin}
                    onChange={(e) => handleDeclarationChange(index, 'country_of_origin', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="e.g., China"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Port of Entry *
                  </label>
                  <input
                    type="text"
                    value={decl.port_of_entry}
                    onChange={(e) => handleDeclarationChange(index, 'port_of_entry', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="e.g., Port Klang"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={handleAddDeclaration}
          className="mt-4 text-blue-600 hover:text-blue-700 text-sm font-medium"
        >
          + Add Another Declaration
        </button>

        <div className="mt-6 flex gap-3">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium disabled:opacity-50"
          >
            {loading ? 'Checking...' : 'Check Compliance'}
          </button>
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Compliance Results</h2>
            <div className={`font-semibold text-lg ${getRiskColor(result.risk_level)}`}>
              Risk Level: {result.risk_level.toUpperCase()}
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">Total Checked</div>
              <div className="text-2xl font-bold text-gray-900">{result.total_checked}</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1 flex items-center gap-1">
                <CheckCircle className="w-4 h-4 text-green-600" />
                Passed
              </div>
              <div className="text-2xl font-bold text-green-600">{result.passed}</div>
            </div>
            <div className="bg-red-50 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1 flex items-center gap-1">
                <AlertCircle className="w-4 h-4 text-red-600" />
                Failed
              </div>
              <div className="text-2xl font-bold text-red-600">{result.failed}</div>
            </div>
          </div>

          {/* Recommendations */}
          {result.recommendations.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Recommendations</h3>
              <ul className="space-y-2">
                {result.recommendations.map((rec, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-gray-700">
                    <span className="text-blue-600 mt-1">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Issues */}
          {result.issues.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Flagged Issues</h3>
              <div className="space-y-3">
                {result.issues.map((issue, idx) => (
                  <div
                    key={idx}
                    className={`border-2 rounded-lg p-4 ${getSeverityColor(issue.severity)}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <span className="font-semibold">{issue.issue_type.replace(/_/g, ' ').toUpperCase()}</span>
                        <span className="ml-2 text-sm opacity-75">
                          HS: {issue.declaration.hs_code}
                        </span>
                      </div>
                      <span className="text-xs font-semibold">{issue.severity}</span>
                    </div>
                    <p className="text-sm mb-2">{issue.description}</p>
                    <p className="text-sm font-medium">💡 {issue.recommendation}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.issues.length === 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
              <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
              <p className="text-green-900 font-semibold mb-1">All Clear!</p>
              <p className="text-sm text-green-700">
                Your declarations passed all compliance checks.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

