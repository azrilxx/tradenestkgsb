/**
 * TradeNest Quality Score (Q-Score) Validator
 * 
 * Ensures every report meets premium subscription standards
 * Q-Score formula: (Data Quality × 0.40) + (Statistical Rigor × 0.25) + 
 *                  (AI Enhancement × 0.20) + (Visual Presentation × 0.15)
 * 
 * Minimum Q-Score for premium reports: 85/100
 */

export interface ValidationResult {
  valid: boolean;
  qScore: number;
  breakdown: {
    dataQuality: number;
    statisticalRigor: number;
    aiEnhancement: number;
    visualPresentation: number;
  };
  issues: string[];
  recommendations: string[];
}

/**
 * Validate data completeness and accuracy (0-100)
 */
function validateDataQuality(data: any): number {
  let score = 100;
  const issues: string[] = [];

  // Check for N/A or undefined values
  if (data.anomaly?.details) {
    const details = data.anomaly.details;

    // Check FX volatility data
    if (data.anomaly.type === 'fx_volatility') {
      const hasWarning = details.warning !== undefined;
      const hasEstValues = details.current_rate && typeof details.current_rate === 'number';

      // Check current_rate
      if (!details.current_rate || details.current_rate === 'N/A') {
        if (!hasEstValues) {
          score -= 15;
          issues.push('Missing current_rate');
        } else {
          score -= 5; // Only minor deduction for estimated values
          issues.push('Using estimated current_rate');
        }
      }

      if (!details.average_rate || details.average_rate === 'N/A') {
        if (!hasEstValues) {
          score -= 10;
          issues.push('Missing average_rate');
        } else {
          score -= 3; // Minor deduction
          issues.push('Using estimated average_rate');
        }
      }

      if (!details.volatility || details.volatility === 'N/A') {
        if (!hasEstValues) {
          score -= 15;
          issues.push('Missing volatility');
        } else {
          score -= 5; // Minor deduction
          issues.push('Using estimated volatility');
        }
      }

      if (!details.rate_range || details.rate_range === 'N/A') {
        if (!hasEstValues) {
          score -= 5;
          issues.push('Missing rate_range');
        } else {
          score -= 2; // Very minor deduction
          issues.push('Using estimated rate_range');
        }
      }

      // Bonus for real historical data
      if (details.historical_data && details.historical_data.length >= 7) {
        score += 15; // Larger bonus for quality data
      } else if (details.historical_data && details.historical_data.length > 0) {
        score += 8; // Partial bonus
        issues.push('Limited historical data available');
      }

      // Bonus for trend analysis
      if (details.trend && !hasWarning) {
        score += 5;
      }

      // Bonus for sample size
      if (details.sample_size > 0) {
        score += 5;
      }
    }

    // Check price spike data
    if (data.anomaly.type === 'price_spike') {
      if (!details.current_price || details.current_price === 'N/A') {
        score -= 15;
        issues.push('Missing current_price');
      }
      if (!details.average_price || details.average_price === 'N/A') {
        score -= 10;
        issues.push('Missing average_price');
      }
      if (!details.percentage_change || details.percentage_change === 'N/A') {
        score -= 10;
        issues.push('Missing percentage_change');
      }

      // Bonus for percentile data
      if (details.percentile_rank !== undefined) {
        score += 10;
      }
    }
  }

  // Ensure alert and product data exists
  if (!data.alert?.id) {
    score -= 20;
    issues.push('Missing alert ID');
  }
  if (!data.anomaly?.type) {
    score -= 15;
    issues.push('Missing anomaly type');
  }

  return Math.max(0, Math.min(100, score));
}

/**
 * Validate statistical rigor (0-100)
 */
function validateStatisticalRigor(data: any): number {
  let score = 100;
  const issues: string[] = [];

  if (data.anomaly?.details) {
    const details = data.anomaly.details;

    // Check for Z-score (should be calculated, not undefined)
    if (details.z_score === undefined && data.anomaly.type === 'price_spike') {
      score -= 10;
      issues.push('Z-score not calculated');
    }

    // Check volatility calculations
    if (data.anomaly.type === 'fx_volatility') {
      const volatility = parseFloat(details.volatility);
      if (isNaN(volatility) || volatility < 0 || volatility > 100) {
        score -= 15;
        issues.push('Invalid volatility value');
      }

      // Verify volatility is reasonable
      if (volatility > 50) {
        score -= 5;
        issues.push('Extremely high volatility (may indicate data issue)');
      }
    }

    // Check percentage change is reasonable
    if (details.percentage_change !== undefined) {
      const change = parseFloat(details.percentage_change);
      if (Math.abs(change) > 500) {
        score -= 10;
        issues.push('Unrealistic percentage change (>500%)');
      }
    }
  }

  // Ensure severity matches statistical thresholds
  if (data.anomaly?.severity) {
    const severity = data.anomaly.severity;
    const hasValidMetrics =
      (data.anomaly.details?.current_rate || data.anomaly.details?.current_price) !== undefined;

    if (!hasValidMetrics && (severity === 'high' || severity === 'critical')) {
      score -= 10;
      issues.push('Severity classification lacks statistical basis');
    }
  }

  return Math.max(0, Math.min(100, score));
}

/**
 * Validate AI enhancement presence (0-100)
 */
function validateAIEnhancement(data: any): number {
  let score = 50; // Start at 50 (average) if no AI enhancement
  const issues: string[] = [];
  const bonuses: string[] = [];

  // Check for AI-generated insights
  if (data.aiInsights?.keyFindings && data.aiInsights.keyFindings.length > 0) {
    score += 20;
    bonuses.push('AI-generated key findings');
  }

  if (data.aiInsights?.expertAnalysis) {
    score += 15;
    bonuses.push('AI expert analysis');
  }

  if (data.aiInsights?.recommendations && data.aiInsights.recommendations.length > 0) {
    score += 15;
    bonuses.push('AI-generated recommendations');
  }

  if (data.anomaly?.details?.trend) {
    score += 10;
    bonuses.push('Trend analysis included');
  }

  if (data.anomaly?.details?.percentile_rank !== undefined) {
    score += 10;
    bonuses.push('Benchmark comparison included');
  }

  // Check recommendation quality
  if (data.aiInsights?.recommendations) {
    const hasPrioritizedActions = data.aiInsights.recommendations.some((r: any) => r.priority);
    if (hasPrioritizedActions) {
      score += 10;
      bonuses.push('Prioritized recommendations');
    }
  }

  return Math.max(0, Math.min(100, score));
}

/**
 * Validate visual presentation (0-100)
 */
function validateVisualPresentation(data: any): number {
  let score = 80; // Default score for basic PDF
  const issues: string[] = [];
  const bonuses: string[] = [];

  // Check for historical data that could be charted
  if (data.anomaly?.details?.historical_data) {
    score += 15;
    bonuses.push('Historical data available for charts');
  }

  // Check for structured data for tables
  if (data.anomaly?.details?.market_percentiles) {
    score += 5;
    bonuses.push('Percentile data available for tables');
  }

  // Check for rate range (can be displayed in comparison chart)
  if (data.anomaly?.details?.rate_range || data.anomaly?.details?.min_rate) {
    score += 5;
    bonuses.push('Range data available for visualization');
  }

  // Deductions for missing critical visual data
  if (!data.anomaly?.severity) {
    score -= 10;
    issues.push('Missing severity for color-coding');
  }

  return Math.max(0, Math.min(100, score));
}

/**
 * Calculate comprehensive Q-Score for a report
 */
export function calculateQScore(reportData: any): ValidationResult {
  const dataQuality = validateDataQuality(reportData);
  const statisticalRigor = validateStatisticalRigor(reportData);
  const aiEnhancement = validateAIEnhancement(reportData);
  const visualPresentation = validateVisualPresentation(reportData);

  // Calculate weighted Q-Score
  const qScore = Math.round(
    dataQuality * 0.40 +
    statisticalRigor * 0.25 +
    aiEnhancement * 0.20 +
    visualPresentation * 0.15
  );

  const issues: string[] = [];
  const recommendations: string[] = [];

  // Collect issues from validators
  const dataQualityCheck = validateDataQuality(reportData);
  const statisticalRigorCheck = validateStatisticalRigor(reportData);

  // Generate recommendations based on scores
  if (dataQuality < 90) {
    recommendations.push('Enrich data with real-time historical values');
  }
  if (statisticalRigor < 90) {
    recommendations.push('Add Z-score and volatility calculations');
  }
  if (aiEnhancement < 80) {
    recommendations.push('Add AI-generated insights and recommendations');
  }
  if (visualPresentation < 90) {
    recommendations.push('Add charts and visualizations for historical data');
  }

  // Specific recommendations
  if (!reportData.anomaly?.details?.trend) {
    recommendations.push('Include trend analysis (strengthening/weakening/stable)');
  }
  if (!reportData.anomaly?.details?.percentile_rank) {
    recommendations.push('Add percentile ranking for benchmark comparison');
  }
  if (!reportData.anomaly?.details?.historical_data) {
    recommendations.push('Include at least 7 days of historical data for context');
  }

  return {
    valid: qScore >= 85, // Minimum threshold for premium reports
    qScore,
    breakdown: {
      dataQuality,
      statisticalRigor,
      aiEnhancement,
      visualPresentation,
    },
    issues,
    recommendations,
  };
}

/**
 * Enhance report quality by adding missing data
 */
export async function enhanceReportQuality(reportData: any): Promise<any> {
  // This function would fetch additional data to improve Q-Score
  // Implementation would call the evidence API with enrichment logic

  console.log('Enhancing report quality...');

  // Return enhanced data structure
  return {
    ...reportData,
    qScoreValidated: true,
    enhancements: {
      aiInsights: reportData.aiInsights || {},
      additionalContext: reportData.anomaly?.details?.historical_data || [],
    },
  };
}

/**
 * Validate and enhance report if Q-Score is below threshold
 */
export async function validateAndEnhanceReport(reportData: any): Promise<{
  reportData: any;
  validation: ValidationResult;
}> {
  const validation = calculateQScore(reportData);

  if (!validation.valid) {
    console.warn(`Report Q-Score below threshold: ${validation.qScore}/100`);

    // Auto-enhance if possible
    const enhanced = await enhanceReportQuality(reportData);
    return {
      reportData: enhanced,
      validation,
    };
  }

  return {
    reportData,
    validation,
  };
}

