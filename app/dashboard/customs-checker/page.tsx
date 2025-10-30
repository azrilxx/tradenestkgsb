'use client';

import { useState } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, Download, Info, Search, FileCheck, FileSearch } from 'lucide-react';
import { searchHSCodes, findHSCode, getCategories, type HSCodeTariff, type TariffRate } from '@/lib/customs-declaration/hs-code-data-enhanced';

// All trade agreements from EZHS (extracted to avoid re-creating on every render)
const TARIFF_TYPES = [
  { value: 'All', label: 'All Trade Agreements' },
  { value: 'PDK 2022', label: 'PDK 2022 - PERINTAH DUTI KASTAM 2022' },
  { value: 'ATIGA', label: 'PDK (ATIGA) - ASEAN TRADE GOODS AGREEMENT (ATIGA) 2022' },
  { value: 'ACFTA', label: 'ACFTA - ASEAN CHINA FREE TRADE AGREEMENT' },
  { value: 'AHKFTA', label: 'AHKFTA - ASEAN HONG KONG FREE TRADE AGREEMENT' },
  { value: 'MPCEPA', label: 'MPCEPA - MALAYSIA PAKISTAN CLOSER ECONOMIC PARTNERSHIP AGREEMENT' },
  { value: 'AKFTA', label: 'AKFTA - ASEAN KOREA FREE TRADE AGREEMENT' },
  { value: 'AJCEP', label: 'AJCEP - ASEAN JAPAN COMPREHENSIVE ECONOMIC PARTNERSHIP' },
  { value: 'AANZFTA', label: 'AANZFTA - ASEAN AUSTRALIA NEW ZEALAND FREE TRADE AGREEMENT' },
  { value: 'AINDFTA', label: 'AINDFTA - ASEAN INDIA FREE TRADE AGREEMENT' },
  { value: 'MNZFTA', label: 'MNZFTA - MALAYSIA NEW ZEALAND FREE TRADE AGREEMENT' },
  { value: 'MICECA', label: 'MICECA - MALAYSIA INDIA COMPREHENSIVE ECONOMIC COOPERATION AGREEMENT' },
  { value: 'D8PTA', label: 'D8PTA - Developing Eight (D-8) Preferential Tariff Agreement' },
  { value: 'MCFTA', label: 'MCFTA - MALAYSIA CHILE FREE TRADE AGREEMENT' },
  { value: 'MAFTA', label: 'MAFTA - MALAYSIA AUSTRALIA FREE TRADE AGREEMENT' },
  { value: 'MTFTA', label: 'MTFTA - MALAYSIA TURKEY FREE TRADE AGREEMENT' },
  { value: 'RCEP', label: 'RCEP - REGIONAL COMPREHENSIVE ECONOMIC PARTNERSHIP' },
  { value: 'CPTPP', label: 'CPTPP - The COMPREHENSIVE AND PROGRESSIVE AGREEMENT FOR TRANS-PACIFIC PARTNERSHIP' },
  { value: 'TPS-OIC', label: 'TPS-OIC - Trade Preferential System among the Member States of the Organisation of the Islamic Conference' },
  { value: 'MY-UAE-CEPA', label: 'MY-UAE-CEPA - MALAYSIA-UNITED ARAB EMIRATES COMPREHENSIVE ECONOMIC PARTNERSHIP AGREEMENT' },
];

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
  const [activeTab, setActiveTab] = useState<'explorer' | 'checker'>('explorer');
  const [manualEntry, setManualEntry] = useState(true);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ComplianceResult | null>(null);

  // HS Code Explorer state
  const [hsSearchQuery, setHsSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedHSCode, setSelectedHSCode] = useState<HSCodeTariff | null>(null);
  const [hsSearchResults, setHsSearchResults] = useState<HSCodeTariff[]>([]);

  // EZHS-style filters
  const [selectedTariffType, setSelectedTariffType] = useState<string>('PDK 2022');
  const [searchCriteria, setSearchCriteria] = useState<'hs_code' | 'description'>('hs_code');
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

  // HS Code Explorer handlers
  const handleHSSearch = () => {
    if (hsSearchQuery.trim()) {
      const results = searchHSCodes(hsSearchQuery);
      setHsSearchResults(results);
    } else {
      setHsSearchResults([]);
    }
  };

  const handleSelectHSCode = (hsCodeTariff: HSCodeTariff) => {
    setSelectedHSCode(hsCodeTariff);
    // Auto-fill the declaration form if on checker tab
    if (declarations.length > 0) {
      handleDeclarationChange(0, 'hs_code', hsCodeTariff.hs_code.code);
      handleDeclarationChange(0, 'description', hsCodeTariff.hs_code.description);
      handleDeclarationChange(0, 'unit', hsCodeTariff.hs_code.unit);
    }
  };

  const handleClearSelection = () => {
    setSelectedHSCode(null);
    setHsSearchResults([]);
    setHsSearchQuery('');
  };

  // Declaration Checker handlers
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

  const categories = ['All', ...getCategories()];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Customs Tools</h1>
        <p className="text-gray-600">
          Look up HS codes and tariff rates, or check customs declarations for compliance
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-4">
          <button
            onClick={() => setActiveTab('explorer')}
            className={`px-4 py-3 font-medium text-sm flex items-center gap-2 transition-colors ${activeTab === 'explorer'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            <FileSearch className="w-5 h-5" />
            HS Code Explorer
          </button>
          <button
            onClick={() => setActiveTab('checker')}
            className={`px-4 py-3 font-medium text-sm flex items-center gap-2 transition-colors ${activeTab === 'checker'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            <FileCheck className="w-5 h-5" />
            Declaration Checker
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'explorer' && (
        <div className="space-y-6">
          {/* HS Code Search */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Search HS Codes & Tariff Rates
            </h2>

            {/* EZHS-style Filters */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tariff Type *
                </label>
                <select
                  value={selectedTariffType}
                  onChange={(e) => setSelectedTariffType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  {TARIFF_TYPES.map(tt => (
                    <option key={tt.value} value={tt.value}>{tt.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search Criteria *
                </label>
                <select
                  value={searchCriteria}
                  onChange={(e) => setSearchCriteria(e.target.value as 'hs_code' | 'description')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="hs_code">HS Code</option>
                  <option value="description">Description</option>
                </select>
              </div>
            </div>

            {/* Search Bar */}
            <div className="flex gap-3 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={hsSearchQuery}
                  onChange={(e) => setHsSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleHSSearch()}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={searchCriteria === 'hs_code' ? 'Enter HS Code (e.g., 7208, 7206)' : 'Enter product description'}
                />
              </div>
              <button
                onClick={handleHSSearch}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2"
              >
                <Search className="w-5 h-5" />
                Search
              </button>
            </div>

            {/* Category Filter */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-1">How to use</h3>
                <p className="text-sm text-blue-800">
                  Search for HS codes by code number or product description. View tariff rates for different trade agreements (ATIGA, ACFTA, RCEP, etc.).
                  Click a code to view details and use it in the Declaration Checker.
                </p>
              </div>
            </div>

            {/* Selected HS Code Details */}
            {selectedHSCode && (
              <div className="mt-6 border-2 border-blue-200 rounded-lg p-6 bg-blue-50">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      HS Code: {selectedHSCode.hs_code.code}
                    </h3>
                    <p className="text-gray-600 mt-1">{selectedHSCode.hs_code.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                        {selectedHSCode.hs_code.category}
                      </span>
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded">
                        Unit: {selectedHSCode.hs_code.unit}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={handleClearSelection}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>

                {/* Tariff Rates */}
                <div className="mt-4">
                  <h4 className="font-semibold text-gray-900 mb-3">
                    Tariff Rates by Trade Agreement
                    {selectedTariffType !== 'All' && ` (Filtered: ${selectedTariffType})`}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {selectedHSCode.tariffs
                      .filter(tariff => selectedTariffType === 'All' || tariff.agreement === selectedTariffType)
                      .map((tariff, idx) => (
                        <div
                          key={idx}
                          className={`border rounded-lg p-4 ${tariff.rate === 0
                            ? 'bg-green-50 border-green-200'
                            : 'bg-white border-gray-200'
                            }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-sm text-gray-900">
                              {tariff.agreement}
                            </span>
                            <span className={`text-lg font-bold ${tariff.rate === 0 ? 'text-green-600' : 'text-gray-900'
                              }`}>
                              {tariff.rate}%
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 mb-1">{tariff.agreement_full_name}</p>
                          {tariff.note && (
                            <p className="text-xs text-blue-600 mt-2">
                              ℹ️ {tariff.note}
                            </p>
                          )}
                        </div>
                      ))}
                  </div>
                </div>

                {/* Use in Declaration Button */}
                <button
                  onClick={() => setActiveTab('checker')}
                  className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium"
                >
                  Use this HS Code in Declaration Checker →
                </button>
              </div>
            )}

            {/* Search Results */}
            {hsSearchResults.length > 0 && !selectedHSCode && (
              <div className="mt-6">
                <h3 className="font-semibold text-gray-900 mb-3">
                  Search Results ({hsSearchResults.length})
                </h3>
                <div className="space-y-2">
                  {hsSearchResults.map((item, idx) => (
                    <div
                      key={idx}
                      className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-colors"
                      onClick={() => handleSelectHSCode(item)}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-semibold text-lg text-gray-900">
                              {item.hs_code.code}
                            </span>
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded">
                              {item.hs_code.category}
                            </span>
                          </div>
                          <p className="text-gray-600 mt-1 text-sm">{item.hs_code.description}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            <span>Unit: {item.hs_code.unit}</span>
                            <span>•</span>
                            <span>MFN Rate: {item.tariffs[0]?.rate || 0}%</span>
                          </div>
                        </div>
                        <span className="text-blue-600 text-sm font-medium">View Details →</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No Results */}
            {hsSearchQuery && hsSearchResults.length === 0 && !selectedHSCode && (
              <div className="mt-6 text-center py-8 text-gray-500">
                <Search className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No results found for "{hsSearchQuery}"</p>
                <p className="text-sm mt-1">Try searching by HS code (e.g., 7208) or description</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'checker' && (
        <div className="space-y-6">
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
      )}
    </div>
  );
}

