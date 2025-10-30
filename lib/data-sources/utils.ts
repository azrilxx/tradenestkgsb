/**
 * Shared utilities for data source operations
 * Validation, transformation, and helper functions
 */

import { DataSource, DataQuality, ValidationReport } from './types';

/**
 * Validate currency pair format (e.g., "MYR/USD")
 */
export function validateCurrencyPair(pair: string): boolean {
  const pattern = /^[A-Z]{3}\/[A-Z]{3}$/;
  return pattern.test(pair);
}

/**
 * Validate date range is reasonable
 */
export function validateDateRange(startDate: Date, endDate: Date): boolean {
  if (startDate > endDate) return false;

  const maxRange = 365 * 24 * 60 * 60 * 1000; // 1 year in ms
  return (endDate.getTime() - startDate.getTime()) <= maxRange;
}

/**
 * Validate FX rate is in reasonable range (avoid data corruption)
 */
export function validateFXRate(rate: number): boolean {
  return rate > 0 && rate < 10000; // Sanity check
}

/**
 * Validate trade value is positive
 */
export function validateTradeValue(value: number): boolean {
  return value >= 0 && value < 1e15; // Max 1 quadrillion
}

/**
 * Calculate data quality score based on source
 */
export function calculateDataQuality(source: DataSource): DataQuality {
  switch (source) {
    case DataSource.BNM:
    case DataSource.MATRADE:
      return DataQuality.REAL;
    case DataSource.MOCK:
      return DataQuality.MOCK;
    default:
      return DataQuality.UNKNOWN;
  }
}

/**
 * Create validation report
 */
export function createValidationReport(
  errors: string[],
  warnings: string[],
  recordCount: number
): ValidationReport {
  const isValid = errors.length === 0;
  const qualityScore = calculateQualityScore(errors, warnings, recordCount);

  return {
    isValid,
    errors,
    warnings,
    recordCount,
    qualityScore
  };
}

/**
 * Calculate quality score from errors and warnings
 */
function calculateQualityScore(
  errors: string[],
  warnings: string[],
  recordCount: number
): number {
  if (recordCount === 0) return 0;

  const errorPenalty = errors.length * 10;
  const warningPenalty = warnings.length * 2;

  const score = Math.max(0, 100 - errorPenalty - warningPenalty);
  return Math.round(score);
}

/**
 * Transform currency pair to standard format
 */
export function normalizeCurrencyPair(pair: string): string {
  return pair.toUpperCase().trim();
}

/**
 * Format date to ISO string (YYYY-MM-DD)
 */
export function formatDateISO(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Parse date from various formats
 */
export function parseDate(dateStr: string): Date {
  return new Date(dateStr);
}

/**
 * Retry function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | null = null;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (i < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, i);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

/**
 * Log data source operations
 */
export function logDataSourceOperation(
  source: DataSource,
  operation: string,
  details: any
): void {
  console.log(`[Data Source: ${source}] ${operation}`, details);
}

/**
 * Sanitize data source name for database
 */
export function sanitizeDataSource(name: string): string {
  return name.toUpperCase().trim().substring(0, 50);
}

