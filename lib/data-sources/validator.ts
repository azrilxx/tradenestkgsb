/**
 * Data Validation Layer
 * Validates data quality from all sources
 */

import { FXRate, TradeStatistic, ValidationReport } from './types';
import { createValidationReport } from './utils';

/**
 * Validate FX rate data
 */
export function validateFXRateData(rates: FXRate[]): ValidationReport {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (rates.length === 0) {
    errors.push('No FX rates provided');
    return createValidationReport(errors, warnings, 0);
  }

  // Check for missing required fields
  rates.forEach((rate, index) => {
    if (!rate.currency_pair) {
      errors.push(`Rate ${index}: missing currency_pair`);
    }
    if (!rate.rate || rate.rate <= 0) {
      errors.push(`Rate ${index}: invalid rate value`);
    }
    if (!rate.date) {
      errors.push(`Rate ${index}: missing date`);
    }
    if (rate.rate > 10000) {
      warnings.push(`Rate ${index}: unusually high rate value ${rate.rate}`);
    }
  });

  // Check for duplicate entries
  const uniquePairs = new Set(rates.map(r => `${r.currency_pair}-${r.date.toISOString().split('T')[0]}`));
  if (uniquePairs.size !== rates.length) {
    warnings.push(`${rates.length - uniquePairs.size} duplicate rates detected`);
  }

  return createValidationReport(errors, warnings, rates.length);
}

/**
 * Validate trade statistics data
 */
export function validateTradeStatistics(stats: TradeStatistic[]): ValidationReport {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (stats.length === 0) {
    errors.push('No trade statistics provided');
    return createValidationReport(errors, warnings, 0);
  }

  stats.forEach((stat, index) => {
    if (!stat.year || stat.year < 1990 || stat.year > new Date().getFullYear() + 1) {
      errors.push(`Stat ${index}: invalid year ${stat.year}`);
    }
    if (!stat.month || stat.month < 1 || stat.month > 12) {
      errors.push(`Stat ${index}: invalid month ${stat.month}`);
    }
    if (stat.export_value < 0) {
      errors.push(`Stat ${index}: negative export value`);
    }
    if (stat.import_value < 0) {
      errors.push(`Stat ${index}: negative import value`);
    }
    if (stat.export_value > 1e15) {
      warnings.push(`Stat ${index}: unusually large export value`);
    }
    if (stat.import_value > 1e15) {
      warnings.push(`Stat ${index}: unusually large import value`);
    }
  });

  return createValidationReport(errors, warnings, stats.length);
}

/**
 * Generic data validation with basic checks
 */
export function validateData<T extends { id?: string; created_at?: Date | string }>(
  data: T[],
  validator: (item: T, index: number) => { valid: boolean; errors: string[]; warnings: string[] }
): ValidationReport {
  const allErrors: string[] = [];
  const allWarnings: string[] = [];

  if (data.length === 0) {
    return createValidationReport(['No data provided'], [], 0);
  }

  data.forEach((item, index) => {
    const result = validator(item, index);
    allErrors.push(...result.errors);
    allWarnings.push(...result.warnings);
  });

  return createValidationReport(allErrors, allWarnings, data.length);
}

/**
 * Validate shipment data quality
 */
export function validateShipmentData(shipments: any[]): ValidationReport {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (shipments.length === 0) {
    return createValidationReport(['No shipments provided'], [], 0);
  }

  shipments.forEach((shipment, index) => {
    // Check for critical missing fields
    if (!shipment.hs_code) {
      warnings.push(`Shipment ${index}: missing HS code`);
    }
    if (!shipment.company_name) {
      warnings.push(`Shipment ${index}: missing company name`);
    }
    if (!shipment.shipment_date) {
      errors.push(`Shipment ${index}: missing shipment date`);
    }

    // Check for data quality issues
    if (shipment.unit_price && shipment.unit_price < 0) {
      errors.push(`Shipment ${index}: negative unit price`);
    }
    if (shipment.total_value && shipment.total_value < 0) {
      errors.push(`Shipment ${index}: negative total value`);
    }
    if (shipment.weight_kg && shipment.weight_kg < 0) {
      errors.push(`Shipment ${index}: negative weight`);
    }

    // Check for suspicious values
    if (shipment.unit_price && shipment.unit_price > 1000000) {
      warnings.push(`Shipment ${index}: unusually high unit price ${shipment.unit_price}`);
    }
  });

  return createValidationReport(errors, warnings, shipments.length);
}

