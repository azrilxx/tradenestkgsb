'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, CheckCircle, XCircle, Download, AlertCircle } from 'lucide-react';

interface Declaration {
  hs_code: string;
  description: string;
  value: number;
  currency: string;
  quantity: number;
  unit: string;
  country_of_origin: string;
  port_of_entry: string;
}

interface ComplianceResult {
  total_checked: number;
  passed: number;
  failed: number;
  issues: Array<{
    row: number;
    severity: 'low' | 'medium' | 'high' | 'critical';
    issue_type: string;
    description: string;
    recommendation: string;
    declaration: Declaration;
  }>;
  risk_level: 'low' | 'medium' | 'high';
}

export default function BulkCustomsCheckerPage() {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<Declaration[]>([]);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<ComplianceResult | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const selectedFile = acceptedFiles[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setPreviewError(null);
    setResult(null);

    try {
      const text = await selectedFile.text();
      const rows = parseCSV(text);
      const validated = validateDeclarations(rows);

      setParsedData(validated);
    } catch (error: any) {
      setPreviewError(error.message);
      setParsedData([]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'text/plain': ['.csv']
    },
    multiple: false
  });

  const handleBulkCheck = async () => {
    if (!file || parsedData.length === 0) return;

    setIsChecking(true);
    setResult(null);

    try {
      const response = await fetch('/api/customs/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          declarations: parsedData,
          format: 'json',
        }),
      });

      const data = await response.json();

      if (data.success) {
        setResult(data.data.compliance);
      } else {
        setPreviewError('Check failed: ' + data.error);
      }
    } catch (error: any) {
      setPreviewError(error.message);
    } finally {
      setIsChecking(false);
    }
  };

  const handleExportResults = () => {
    if (!result) return;

    const csvContent = convertToCSV(result);
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bulk-check-results-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Bulk Customs Declaration Checker</h1>
        <p className="text-gray-600 mt-2">
          Upload 100+ declarations at once for batch compliance checking
        </p>
      </div>

      {/* Upload Zone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${isDragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 bg-gray-50 hover:border-gray-400'
          }`}
      >
        <input {...getInputProps()} />

        {!file ? (
          <div className="space-y-4">
            <Upload className="w-16 h-16 mx-auto text-gray-400" />
            <div>
              <p className="text-lg font-medium text-gray-900">
                {isDragActive ? 'Drop your CSV file here' : 'Drag & drop declarations CSV here'}
              </p>
              <p className="text-sm text-gray-500 mt-1">or click to select a file</p>
            </div>
            <p className="text-xs text-gray-400">CSV format with 100+ declarations</p>
          </div>
        ) : (
          <div className="flex items-center justify-center space-x-3">
            <FileText className="w-8 h-8 text-blue-600" />
            <div className="text-left">
              <p className="font-medium text-gray-900">{file.name}</p>
              <p className="text-sm text-gray-500">
                {(file.size / 1024).toFixed(2)} KB • {parsedData.length} declarations
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Error Display */}
      {previewError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
          <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-red-900">Error</h3>
            <p className="text-sm text-red-700 mt-1">{previewError}</p>
          </div>
        </div>
      )}

      {/* Preview */}
      {parsedData.length > 0 && !result && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start space-x-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-medium text-green-900">
              {parsedData.length} declarations ready for checking
            </h3>
            <p className="text-sm text-green-700 mt-1">
              All validations passed. Click "Check Compliance" to proceed.
            </p>
          </div>
          <button
            onClick={handleBulkCheck}
            disabled={isChecking}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium disabled:opacity-50 flex items-center space-x-2"
          >
            {isChecking ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Checking...</span>
              </>
            ) : (
              <>
                <span>Check Compliance</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-6">
          {/* Summary */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Compliance Results</h2>
              <button
                onClick={handleExportResults}
                className="flex items-center space-x-2 text-blue-600 hover:text-blue-700"
              >
                <Download className="w-5 h-5" />
                <span>Export Results</span>
              </button>
            </div>

            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Total Checked</div>
                <div className="text-3xl font-bold text-gray-900">{result.total_checked}</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <div className="text-sm text-green-700 mb-1 flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" />
                  Passed
                </div>
                <div className="text-3xl font-bold text-green-600">{result.passed}</div>
              </div>
              <div className="bg-red-50 rounded-lg p-4">
                <div className="text-sm text-red-700 mb-1 flex items-center gap-1">
                  <XCircle className="w-4 h-4" />
                  Failed
                </div>
                <div className="text-3xl font-bold text-red-600">{result.failed}</div>
              </div>
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-sm text-blue-700 mb-1">Risk Level</div>
                <div className={`text-3xl font-bold ${result.risk_level === 'high' ? 'text-red-600' :
                    result.risk_level === 'medium' ? 'text-yellow-600' :
                      'text-green-600'
                  }`}>
                  {result.risk_level.toUpperCase()}
                </div>
              </div>
            </div>

            {/* Issues Table */}
            {result.issues.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Flagged Issues ({result.issues.length})
                </h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Row</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">HS Code</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Severity</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Issue Type</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Recommendation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {result.issues.map((issue, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">{issue.row}</td>
                          <td className="px-4 py-3 text-sm text-gray-900 font-mono">{issue.declaration.hs_code}</td>
                          <td className="px-4 py-3 text-sm">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${issue.severity === 'critical' ? 'bg-red-100 text-red-800' :
                                issue.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                                  issue.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-blue-100 text-blue-800'
                              }`}>
                              {issue.severity}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">{issue.issue_type}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{issue.description}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{issue.recommendation}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Success Message */}
            {result.issues.length === 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
                <p className="text-green-900 font-semibold mb-1">All Declarations Passed!</p>
                <p className="text-sm text-green-700">
                  All {result.total_checked} declarations passed compliance checks.
                </p>
              </div>
            )}
          </div>

          {/* Restart */}
          <div className="flex justify-end">
            <button
              onClick={() => {
                setFile(null);
                setParsedData([]);
                setResult(null);
              }}
              className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Check Another File
            </button>
          </div>
        </div>
      )}

      {/* CSV Format Guide */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
          <AlertCircle className="w-5 h-5" />
          <span>CSV Format Requirements</span>
        </h2>
        <p className="text-sm text-gray-700 mb-3">
          Your CSV file must include these columns (case-sensitive):
        </p>
        <div className="grid grid-cols-2 gap-3 text-sm text-gray-700">
          <div>• hs_code</div>
          <div>• description</div>
          <div>• value</div>
          <div>• currency</div>
          <div>• quantity</div>
          <div>• unit</div>
          <div>• country_of_origin</div>
          <div>• port_of_entry</div>
        </div>
      </div>
    </div>
  );
}

function parseCSV(text: string): any[] {
  const lines = text.trim().split('\n');
  if (lines.length < 2) throw new Error('CSV must have at least a header and one row');

  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  const rows: any[] = [];

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;

    const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
    const row: any = {};

    headers.forEach((header, idx) => {
      row[header] = values[idx] || '';
    });

    rows.push(row);
  }

  return rows;
}

function validateDeclarations(rows: any[]): Declaration[] {
  const validated: Declaration[] = [];

  rows.forEach((row, idx) => {
    if (!row.hs_code || !row.value || !row.quantity || !row.country_of_origin) {
      throw new Error(`Row ${idx + 2}: Missing required fields`);
    }

    validated.push({
      hs_code: row.hs_code,
      description: row.description || '',
      value: parseFloat(row.value) || 0,
      currency: row.currency || 'MYR',
      quantity: parseFloat(row.quantity) || 0,
      unit: row.unit || 'pcs',
      country_of_origin: row.country_of_origin,
      port_of_entry: row.port_of_entry || '',
    });
  });

  return validated;
}

function convertToCSV(result: ComplianceResult): string {
  const headers = ['Row', 'HS Code', 'Severity', 'Issue Type', 'Description', 'Recommendation'];
  const rows = result.issues.map(issue => [
    issue.row,
    issue.declaration.hs_code,
    issue.severity,
    issue.issue_type,
    issue.description,
    issue.recommendation,
  ]);

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

