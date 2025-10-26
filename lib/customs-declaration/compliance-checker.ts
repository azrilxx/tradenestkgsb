/**
 * Customs Declaration Compliance Checker
 * Validates declarations and flags potential compliance issues
 */

import { CustomsDeclaration } from './parser';

export interface ComplianceIssue {
  declaration: CustomsDeclaration;
  severity: 'low' | 'medium' | 'high' | 'critical';
  issue_type: string;
  description: string;
  recommendation: string;
  flagged_fields: string[];
}

export interface ComplianceResult {
  total_checked: number;
  passed: number;
  failed: number;
  issues: ComplianceIssue[];
  risk_level: 'low' | 'medium' | 'high';
  recommendations: string[];
}

/**
 * Check HS code accuracy against common customs database
 */
function checkHSCode(code: string): { valid: boolean; warning: string } {
  // Basic validation - in production, check against real customs database
  const cleanCode = code.replace(/[^0-9]/g, '');

  if (cleanCode.length < 4 || cleanCode.length > 10) {
    return {
      valid: false,
      warning: 'HS code length must be between 4-10 digits',
    };
  }

  // Check for common HS code patterns
  const commonPrefixes = [
    '72', // Iron and steel
    '85', // Electrical machinery
    '39', // Plastics
    '29', // Organic chemicals
    '87', // Vehicles
    '61', // Knitted apparel
    '62', // Woven apparel
  ];

  const isValidPrefix = commonPrefixes.some(prefix => cleanCode.startsWith(prefix));

  if (!isValidPrefix && cleanCode.length >= 4) {
    return {
      valid: true,
      warning: 'HS code prefix not in common Malaysian imports - verify classification',
    };
  }

  return { valid: true, warning: '' };
}

/**
 * Validate declared price against benchmark
 */
function validatePrice(declaration: CustomsDeclaration, benchmarkPrice?: number): ComplianceIssue | null {
  if (!benchmarkPrice) return null;

  const deviation = ((declaration.value - benchmarkPrice) / benchmarkPrice) * 100;

  if (Math.abs(deviation) > 30) {
    return {
      declaration,
      severity: deviation < -30 ? 'high' : 'medium',
      issue_type: 'price_deviation',
      description: `Declared price is ${Math.abs(deviation).toFixed(1)}% ${deviation < 0 ? 'below' : 'above'} benchmark`,
      recommendation: 'Verify pricing and provide supporting documents',
      flagged_fields: ['value'],
    };
  }

  if (Math.abs(deviation) > 20) {
    return {
      declaration,
      severity: 'medium',
      issue_type: 'price_deviation',
      description: `Price deviation: ${deviation.toFixed(1)}%`,
      recommendation: 'Review pricing documentation',
      flagged_fields: ['value'],
    };
  }

  return null;
}

/**
 * Check for common compliance issues
 */
function checkCommonIssues(declaration: CustomsDeclaration): ComplianceIssue[] {
  const issues: ComplianceIssue[] = [];

  // Check HS code
  const hsCheck = checkHSCode(declaration.hs_code);
  if (!hsCheck.valid || hsCheck.warning) {
    issues.push({
      declaration,
      severity: hsCheck.warning ? 'medium' : 'high',
      issue_type: 'hs_code_issue',
      description: hsCheck.warning || 'Invalid HS code format',
      recommendation: 'Verify HS code classification with customs',
      flagged_fields: ['hs_code'],
    });
  }

  // Check for suspiciously low prices (potential under-invoicing)
  const unitPrice = declaration.value / declaration.quantity;
  if (unitPrice < 0.01 && declaration.value > 100) {
    issues.push({
      declaration,
      severity: 'high',
      issue_type: 'suspicious_pricing',
      description: 'Unit price is suspiciously low',
      recommendation: 'Review pricing - potential under-invoicing',
      flagged_fields: ['value', 'quantity'],
    });
  }

  // Check for missing critical information
  if (!declaration.country_of_origin) {
    issues.push({
      declaration,
      severity: 'critical',
      issue_type: 'missing_data',
      description: 'Country of origin is required for customs clearance',
      recommendation: 'Provide country of origin information',
      flagged_fields: ['country_of_origin'],
    });
  }

  if (!declaration.port_of_entry) {
    issues.push({
      declaration,
      severity: 'high',
      issue_type: 'missing_data',
      description: 'Port of entry is required',
      recommendation: 'Specify port of entry',
      flagged_fields: ['port_of_entry'],
    });
  }

  return issues;
}

/**
 * Run compliance check on declarations
 */
export function checkCompliance(
  declarations: CustomsDeclaration[],
  benchmarkData?: Map<string, number>
): ComplianceResult {
  const issues: ComplianceIssue[] = [];
  let passed = 0;
  let failed = 0;

  for (const declaration of declarations) {
    let hasIssues = false;

    // Check common compliance issues
    const commonIssues = checkCommonIssues(declaration);
    if (commonIssues.length > 0) {
      issues.push(...commonIssues);
      hasIssues = true;
    }

    // Check price against benchmark if available
    const priceIssue = validatePrice(declaration, benchmarkData?.get(declaration.hs_code));
    if (priceIssue) {
      issues.push(priceIssue);
      hasIssues = true;
    }

    if (hasIssues) {
      failed++;
    } else {
      passed++;
    }
  }

  // Determine overall risk level
  const criticalCount = issues.filter(i => i.severity === 'critical').length;
  const highCount = issues.filter(i => i.severity === 'high').length;
  const mediumCount = issues.filter(i => i.severity === 'medium').length;

  let risk_level: 'low' | 'medium' | 'high' = 'low';
  if (criticalCount > 0 || highCount > 3) {
    risk_level = 'high';
  } else if (highCount > 0 || mediumCount > 5) {
    risk_level = 'medium';
  }

  // Generate recommendations
  const recommendations: string[] = [];

  if (criticalCount > 0) {
    recommendations.push('Address critical compliance issues immediately before filing');
  }
  if (highCount > 0) {
    recommendations.push('Review high-priority issues and prepare supporting documentation');
  }
  if (mediumCount > 0) {
    recommendations.push('Verify flagged items with customs officer before submission');
  }

  if (issues.length === 0) {
    recommendations.push('Declarations appear compliant - proceed with filing');
  }

  return {
    total_checked: declarations.length,
    passed,
    failed,
    issues,
    risk_level,
    recommendations,
  };
}

