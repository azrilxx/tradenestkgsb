// Dumping Calculator Engine
// Task 7.2: Trade Remedy Workbench
// Calculate dumping margins and generate evidence for anti-dumping petitions

export interface DumpingCalculationInput {
  exportPrice: number;
  normalValue: number; // Price in home country (fair value)
  currency?: string;
}

export interface DumpingCalculationResult {
  dumpingAmount: number;
  dumpingMargin: number; // Percentage
  priceDepression: number; // Percentage below normal value
  isDumping: boolean;
}

/**
 * Calculate dumping margin
 * Formula: ((Export Price - Normal Value) / Normal Value) × 100
 */
export function calculateDumpingMargin(
  exportPrice: number,
  normalValue: number
): number {
  if (normalValue <= 0) return 0;
  return ((exportPrice - normalValue) / normalValue) * 100;
}

/**
 * Calculate dumping amount (absolute difference)
 */
export function calculateDumpingAmount(
  exportPrice: number,
  normalValue: number
): number {
  return exportPrice - normalValue;
}

/**
 * Determine if dumping is occurring (margin > 0%)
 */
export function isDumpingOccurring(margin: number): boolean {
  return margin > 0;
}

/**
 * Calculate price depression percentage
 * How much lower the export price is compared to normal value
 */
export function calculatePriceDepression(exportPrice: number, normalValue: number): number {
  if (normalValue <= 0) return 0;
  const depression = ((normalValue - exportPrice) / normalValue) * 100;
  return Math.max(0, depression); // Never negative
}

/**
 * Get full dumping calculation result
 */
export function getDumpingCalculation(
  input: DumpingCalculationInput
): DumpingCalculationResult {
  const dumpingAmount = calculateDumpingAmount(input.exportPrice, input.normalValue);
  const dumpingMargin = calculateDumpingMargin(input.exportPrice, input.normalValue);
  const priceDepression = calculatePriceDepression(input.exportPrice, input.normalValue);
  const isDumping = isDumpingOccurring(dumpingMargin);

  return {
    dumpingAmount,
    dumpingMargin,
    priceDepression,
    isDumping,
  };
}

/**
 * Estimate volume impact (percentage change in import volume)
 */
export function estimateVolumeImpact(
  currentVolume: number,
  previousVolume: number
): number {
  if (previousVolume <= 0) return 0;
  return ((currentVolume - previousVolume) / previousVolume) * 100;
}

/**
 * Calculate estimated injury (revenue loss)
 */
export function calculateEstimatedInjury(
  dumpingAmount: number,
  importVolume: number,
  domesticMarketShare: number
): number {
  // Estimated injury = dumping amount per unit × volume × market share
  return dumpingAmount * importVolume * (domesticMarketShare / 100);
}

/**
 * Determine dumping severity level
 */
export function getDumpingSeverity(margin: number): {
  level: 'minimal' | 'moderate' | 'significant' | 'severe';
  description: string;
} {
  if (margin >= 50) {
    return {
      level: 'severe',
      description: 'Severe dumping detected. Strong case for trade remedy measures.',
    };
  } else if (margin >= 20) {
    return {
      level: 'significant',
      description: 'Significant dumping margin. Trade remedy likely justified.',
    };
  } else if (margin >= 5) {
    return {
      level: 'moderate',
      description: 'Moderate dumping. Further analysis recommended.',
    };
  } else {
    return {
      level: 'minimal',
      description: 'Minimal dumping margin. May not justify trade remedy action.',
    };
  }
}

/**
 * Generate causation summary for injury analysis
 */
export function generateCausationSummary(
  dumpingMargin: number,
  importVolumeIncrease: number,
  priceDepression: number,
  domesticMarketLoss: number
): string {
  const factors = [];

  if (dumpingMargin > 20) {
    factors.push(`high dumping margin of ${dumpingMargin.toFixed(1)}%`);
  }

  if (importVolumeIncrease > 30) {
    factors.push(`import volume surge of ${importVolumeIncrease.toFixed(1)}%`);
  }

  if (priceDepression > 15) {
    factors.push(`price depression of ${priceDepression.toFixed(1)}%`);
  }

  if (domesticMarketLoss > 10) {
    factors.push(`domestic market share loss of ${domesticMarketLoss.toFixed(1)}%`);
  }

  if (factors.length === 0) {
    return 'Insufficient evidence to establish causation between imports and injury.';
  }

  return `Causation established based on: ${factors.join(', ')}. The dumped imports from [country] are materially injuring the domestic industry.`;
}

/**
 * Calculate recommended trade remedy measures
 */
export function getRecommendedMeasures(margin: number): {
  measures: string[];
  duration: string;
  justification: string;
} {
  if (margin >= 50) {
    return {
      measures: ['Anti-dumping duty', 'Countervailing duty (if subsidies exist)'],
      duration: '5 years (renewable)',
      justification: 'Severe dumping requires immediate protective measures.',
    };
  } else if (margin >= 20) {
    return {
      measures: ['Anti-dumping duty equivalent to dumping margin'],
      duration: '3-5 years',
      justification: 'Significant dumping requires protection to restore fair competition.',
    };
  } else if (margin >= 5) {
    return {
      measures: ['Monitoring arrangement', 'Possible preliminary measures'],
      duration: 'TBD based on investigation',
      justification: 'Moderate dumping requires investigation and potential measures.',
    };
  } else {
    return {
      measures: ['Continued monitoring'],
      duration: 'Ongoing',
      justification: 'Minimal dumping requires monitoring but may not warrant immediate action.',
    };
  }
}

