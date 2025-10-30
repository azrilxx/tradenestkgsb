'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface ParsedRow {
  hs_code: string;
  description: string;
  shipment_date: string;
  unit_price: number;
  total_value: number;
  weight_kg: number;
  volume_m3: number;
  origin_country: string;
  destination_country: string;
  currency: string;
  invoice_number?: string;
  bl_number?: string;
  vessel_name?: string;
  container_count?: number;
  freight_cost?: number;
}

interface UploadResponse {
  success: boolean;
  message: string;
  inserted: number;
  errors: Array<{ row: number; error: string }>;
  shareable_count?: number;
}

export default function DataUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResponse | null>(null);
  const [shareData, setShareData] = useState(false); // Opt-in for anonymous aggregation
  const [isValidating, setIsValidating] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const selectedFile = acceptedFiles[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setPreviewError(null);
    setUploadResult(null);

    // Read and parse CSV
    setIsValidating(true);
    try {
      const text = await selectedFile.text();
      const rows = parseCSV(text);
      const validated = validateData(rows);

      setParsedData(validated);
    } catch (error: any) {
      setPreviewError(error.message);
      setParsedData([]);
    } finally {
      setIsValidating(false);
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

  const handleUpload = async () => {
    if (!file || parsedData.length === 0) return;

    setIsUploading(true);
    setUploadResult(null);

    try {
      const response = await fetch('/api/data-upload/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: parsedData,
          share_for_benchmarks: shareData, // User consent for sharing
        }),
      });

      const result = await response.json();
      setUploadResult(result);

      if (result.success) {
        // Clear the form
        setFile(null);
        setParsedData([]);
        setShareData(false);
      }
    } catch (error: any) {
      setUploadResult({
        success: false,
        message: error.message,
        inserted: 0,
        errors: [],
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Upload Shipment Data</h1>
        <p className="text-gray-600 mt-2">
          Upload your shipment data in CSV format to analyze trade patterns and compliance
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
                {isDragActive ? 'Drop your CSV file here' : 'Drag & drop a CSV file here'}
              </p>
              <p className="text-sm text-gray-500 mt-1">or click to select a file</p>
            </div>
            <p className="text-xs text-gray-400">Accepted format: CSV (.csv)</p>
          </div>
        ) : (
          <div className="flex items-center justify-center space-x-3">
            <FileText className="w-8 h-8 text-blue-600" />
            <div className="text-left">
              <p className="font-medium text-gray-900">{file.name}</p>
              <p className="text-sm text-gray-500">
                {(file.size / 1024).toFixed(2)} KB
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Preview Error */}
      {previewError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
          <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-red-900">Validation Error</h3>
            <p className="text-sm text-red-700 mt-1">{previewError}</p>
          </div>
        </div>
      )}

      {/* Preview Table */}
      {parsedData.length > 0 && (
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start space-x-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-green-900">
                Preview: {parsedData.length} rows validated
              </h3>
              <p className="text-sm text-green-700 mt-1">
                All rows passed validation. Ready to upload.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200 rounded-lg">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">HS Code</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Value</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Weight (kg)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {parsedData.slice(0, 10).map((row, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">{row.hs_code}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{row.description}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{row.shipment_date}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{row.unit_price.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{row.total_value.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{row.weight_kg.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {parsedData.length > 10 && (
              <p className="text-sm text-gray-500 mt-2 text-center">
                Showing first 10 rows of {parsedData.length} total rows
              </p>
            )}
          </div>

          {/* Opt-in for sharing */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={shareData}
                onChange={(e) => setShareData(e.target.checked)}
                className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <div>
                <p className="font-medium text-blue-900">
                  Share for anonymous sector benchmarks
                </p>
                <p className="text-sm text-blue-700 mt-1">
                  Allow TradeNest to aggregate your data (anonymized) with others in your sector to provide benchmark comparisons.
                  Your individual company data will never be shared.
                </p>
              </div>
            </label>
          </div>

          {/* Upload Button */}
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => {
                setFile(null);
                setParsedData([]);
                setShareData(false);
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              disabled={isUploading}
            >
              Clear
            </button>
            <button
              onClick={handleUpload}
              disabled={isUploading || isValidating}
              className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isUploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Uploading...</span>
                </>
              ) : (
                <span>Upload {parsedData.length} Shipments</span>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Upload Result */}
      {uploadResult && (
        <div
          className={`rounded-lg p-4 flex items-start space-x-3 ${uploadResult.success
              ? 'bg-green-50 border border-green-200'
              : 'bg-red-50 border border-red-200'
            }`}
        >
          {uploadResult.success ? (
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          ) : (
            <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <h3
              className={`font-medium ${uploadResult.success ? 'text-green-900' : 'text-red-900'
                }`}
            >
              {uploadResult.message}
            </h3>
            {uploadResult.success && (
              <div className="mt-2 text-sm">
                <p className={uploadResult.success ? 'text-green-700' : 'text-red-700'}>
                  ✅ {uploadResult.inserted} shipments inserted successfully
                  {uploadResult.shareable_count && uploadResult.shareable_count > 0 && (
                    <span className="ml-2">
                      ({uploadResult.shareable_count} shared for benchmarks)
                    </span>
                  )}
                </p>
                {uploadResult.errors.length > 0 && (
                  <p className="text-amber-700 mt-1">
                    ⚠️ {uploadResult.errors.length} rows had errors and were skipped
                  </p>
                )}
              </div>
            )}
            {uploadResult.errors.length > 0 && (
              <div className="mt-3 text-sm">
                <p className="font-medium text-gray-900">Errors:</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  {uploadResult.errors.slice(0, 5).map((err, idx) => (
                    <li key={idx} className="text-gray-700">
                      Row {err.row}: {err.error}
                    </li>
                  ))}
                  {uploadResult.errors.length > 5 && (
                    <li className="text-gray-500">
                      ... and {uploadResult.errors.length - 5} more errors
                    </li>
                  )}
                </ul>
              </div>
            )}
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
          Your CSV file should include these columns (case-sensitive):
        </p>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Required Columns:</h3>
            <ul className="space-y-1 text-gray-700">
              <li>• hs_code (e.g., "8517.12")</li>
              <li>• description (product name)</li>
              <li>• shipment_date (YYYY-MM-DD)</li>
              <li>• unit_price (number)</li>
              <li>• total_value (number)</li>
              <li>• weight_kg (number)</li>
              <li>• volume_m3 (number)</li>
              <li>• origin_country (ISO code)</li>
              <li>• destination_country (ISO code)</li>
              <li>• currency (e.g., "MYR", "USD")</li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Optional Columns:</h3>
            <ul className="space-y-1 text-gray-700">
              <li>• invoice_number</li>
              <li>• bl_number (Bill of Lading)</li>
              <li>• vessel_name</li>
              <li>• container_count (integer)</li>
              <li>• freight_cost (number)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

// CSV Parser
function parseCSV(text: string): any[] {
  const lines = text.trim().split('\n');
  if (lines.length < 2) throw new Error('CSV file must have at least a header and one data row');

  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  const rows: any[] = [];

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue; // Skip empty lines

    const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
    const row: any = {};

    headers.forEach((header, idx) => {
      row[header] = values[idx] || '';
    });

    rows.push(row);
  }

  return rows;
}

// Data Validation
function validateData(rows: any[]): ParsedRow[] {
  const validated: ParsedRow[] = [];
  const errors: string[] = [];

  rows.forEach((row, idx) => {
    try {
      // Required fields
      if (!row.hs_code) throw new Error('Missing hs_code');
      if (!row.description) throw new Error('Missing description');
      if (!row.shipment_date) throw new Error('Missing shipment_date');
      if (!row.unit_price) throw new Error('Missing unit_price');
      if (!row.total_value) throw new Error('Missing total_value');
      if (!row.weight_kg) throw new Error('Missing weight_kg');
      if (!row.volume_m3) throw new Error('Missing volume_m3');
      if (!row.origin_country) throw new Error('Missing origin_country');
      if (!row.destination_country) throw new Error('Missing destination_country');
      if (!row.currency) throw new Error('Missing currency');

      // Validate data types
      const unitPrice = parseFloat(row.unit_price);
      if (isNaN(unitPrice)) throw new Error('Invalid unit_price (must be number)');

      const totalValue = parseFloat(row.total_value);
      if (isNaN(totalValue)) throw new Error('Invalid total_value (must be number)');

      const weight = parseFloat(row.weight_kg);
      if (isNaN(weight)) throw new Error('Invalid weight_kg (must be number)');

      const volume = parseFloat(row.volume_m3);
      if (isNaN(volume)) throw new Error('Invalid volume_m3 (must be number)');

      // Validate date format
      if (!/^\d{4}-\d{2}-\d{2}$/.test(row.shipment_date)) {
        throw new Error('Invalid date format (must be YYYY-MM-DD)');
      }

      validated.push({
        hs_code: row.hs_code,
        description: row.description,
        shipment_date: row.shipment_date,
        unit_price: unitPrice,
        total_value: totalValue,
        weight_kg: weight,
        volume_m3: volume,
        origin_country: row.origin_country,
        destination_country: row.destination_country,
        currency: row.currency,
        invoice_number: row.invoice_number || undefined,
        bl_number: row.bl_number || undefined,
        vessel_name: row.vessel_name || undefined,
        container_count: row.container_count ? parseInt(row.container_count) : undefined,
        freight_cost: row.freight_cost ? parseFloat(row.freight_cost) : undefined,
      });
    } catch (error: any) {
      errors.push(`Row ${idx + 2}: ${error.message}`);
    }
  });

  if (validated.length === 0 && errors.length > 0) {
    throw new Error(`All rows failed validation. First error: ${errors[0]}`);
  }

  return validated;
}

