/**
 * MATRADE CSV Parser Service
 * Parses Malaysian government trade statistics from downloaded CSV files
 */

import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';
import { DataSource, TradeStatistic, MatradeCSVRow } from './types';

const MATRADE_DATA_PATH = process.env.MATRADE_DATA_PATH || 'scripts/matrade-importer/downloads';

/**
 * Parse trade summary CSV (overall trade statistics)
 */
export function parseTradeSummary(filePath: string): TradeStatistic[] {
  const content = fs.readFileSync(filePath, 'utf-8');

  // Skip header rows (first 2 lines)
  const records: any[] = parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    from: 3 // Start from line 3 (0-indexed: headers)
  });

  const statistics: TradeStatistic[] = [];

  for (const record of records) {
    try {
      const year = parseInt(record.Year);
      const month = parseInt(record.Month);

      // Parse export and import values (remove commas, quotes)
      const exportValue = parseValue(record['Total Export (USD)'] || record['TotalExport (USD)']);
      const importValue = parseValue(record['Total Import (USD)'] || record['TotalImport (USD)']);

      if (!isNaN(year) && !isNaN(month) && !isNaN(exportValue) && !isNaN(importValue)) {
        statistics.push({
          year,
          month,
          export_value: exportValue,
          import_value: importValue,
          source: DataSource.MATRADE
        });
      }
    } catch (error) {
      console.warn(`Error parsing trade summary row:`, error);
    }
  }

  return statistics;
}

/**
 * Parse geographical trade CSV (by region)
 */
export function parseGeographicalTrade(filePath: string): TradeStatistic[] {
  const content = fs.readFileSync(filePath, 'utf-8');

  // Skip header rows
  const records: any[] = parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    from: 3
  });

  const statistics: TradeStatistic[] = [];

  for (const record of records) {
    try {
      const year = parseInt(record.Year);
      const month = parseInt(record.Month);
      const region = record['Geographical Region'] || record['GeographicalRegion'];

      // Check if this is export or import data
      const isExport = filePath.includes('export');
      const exportValue = isExport ? parseValue(record['Total Export (USD)'] || record['TotalExport (USD)']) : 0;
      const importValue = !isExport ? parseValue(record['Total Import (USD)'] || record['TotalImport (USD)']) : 0;

      if (!isNaN(year) && !isNaN(month) && !isNaN(exportValue) && !isNaN(importValue)) {
        statistics.push({
          year,
          month,
          country: region, // Using country field for region
          export_value: exportValue,
          import_value: importValue,
          source: DataSource.MATRADE
        });
      }
    } catch (error) {
      console.warn(`Error parsing geographical trade row:`, error);
    }
  }

  return statistics;
}

/**
 * Parse sector-specific CSV (by industry)
 */
export function parseSectorTrade(filePath: string): TradeStatistic[] {
  const content = fs.readFileSync(filePath, 'utf-8');

  // Skip header rows
  const records: any[] = parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    from: 3
  });

  const statistics: TradeStatistic[] = [];

  for (const record of records) {
    try {
      const year = parseInt(record.Year);
      const month = parseInt(record.Month);
      const sector = record.Sector || record['ProductCategory'];

      const exportValue = parseValue(record['Total Export (USD)'] || record['TotalExport (USD)'] || record.Value);
      const importValue = parseValue(record['Total Import (USD)'] || record['TotalImport (USD)'] || '0');

      if (!isNaN(year) && !isNaN(month) && sector) {
        statistics.push({
          year,
          month,
          sector: sector.trim(),
          export_value: exportValue,
          import_value: importValue,
          source: DataSource.MATRADE
        });
      }
    } catch (error) {
      console.warn(`Error parsing sector trade row:`, error);
    }
  }

  return statistics;
}

/**
 * Parse SITC trade data (by product category)
 */
export function parseSITCTrade(filePath: string): TradeStatistic[] {
  const content = fs.readFileSync(filePath, 'utf-8');

  const records: any[] = parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    from: 3
  });

  const statistics: TradeStatistic[] = [];

  for (const record of records) {
    try {
      const year = parseInt(record.Year);
      const month = parseInt(record.Month);
      const sitcCode = record['SITC Code'] || record['SITCCode'] || record.Code;

      const exportValue = parseValue(record['Total Export (USD)'] || record['TotalExport (USD)'] || record.Value);
      const importValue = parseValue(record['Total Import (USD)'] || record['TotalImport (USD)'] || '0');

      if (!isNaN(year) && !isNaN(month) && sitcCode) {
        statistics.push({
          year,
          month,
          sector: `SITC-${sitcCode}`,
          export_value: exportValue,
          import_value: importValue,
          source: DataSource.MATRADE
        });
      }
    } catch (error) {
      console.warn(`Error parsing SITC trade row:`, error);
    }
  }

  return statistics;
}

/**
 * Parse all MATRADE CSV files in the downloads directory
 */
export function parseAllMatradeData(): TradeStatistic[] {
  const downloadsPath = path.join(process.cwd(), MATRADE_DATA_PATH);

  if (!fs.existsSync(downloadsPath)) {
    console.error(`MATRADE data path not found: ${downloadsPath}`);
    return [];
  }

  const allStatistics: TradeStatistic[] = [];
  const files = fs.readdirSync(downloadsPath);

  console.log(`Found ${files.length} CSV files to parse`);

  for (const file of files) {
    if (!file.endsWith('.csv')) continue;

    const filePath = path.join(downloadsPath, file);

    try {
      let statistics: TradeStatistic[] = [];

      if (file.includes('trade-summary') || file.includes('Summary')) {
        statistics = parseTradeSummary(filePath);
      } else if (file.includes('export-geo') || file.includes('import-geo')) {
        statistics = parseGeographicalTrade(filePath);
      } else if (file.includes('export-sitc') || file.includes('import-sitc')) {
        statistics = parseSITCTrade(filePath);
      } else {
        // Try sector-specific parsing
        statistics = parseSectorTrade(filePath);
      }

      allStatistics.push(...statistics);
      console.log(`✅ Parsed ${file}: ${statistics.length} records`);

    } catch (error) {
      console.error(`❌ Error parsing ${file}:`, error);
    }
  }

  console.log(`Total records parsed: ${allStatistics.length}`);
  return allStatistics;
}

/**
 * Helper: Parse numeric value from CSV (remove commas, quotes, etc.)
 */
function parseValue(value: string): number {
  if (!value) return 0;

  // Remove quotes, commas, spaces
  const cleaned = value.toString().replace(/[",\s]/g, '');
  return parseFloat(cleaned) || 0;
}

/**
 * Get list of available MATRADE CSV files
 */
export function getAvailableMatradeFiles(): string[] {
  const downloadsPath = path.join(process.cwd(), MATRADE_DATA_PATH);

  if (!fs.existsSync(downloadsPath)) {
    return [];
  }

  return fs.readdirSync(downloadsPath).filter(file => file.endsWith('.csv'));
}

