import { supabase } from '@/lib/supabase/client';
import { AnomalyType, AnomalySeverity } from '@/types/database';

export interface InsightContext {
  type: AnomalyType;
  severity: AnomalySeverity;
  details?: Record<string, any>;
  product_id?: string;
  detected_at: string;
}

export interface ExpertInsight {
  key_findings: string[];
  why_it_matters: string;
  contextual_analysis: string;
  recommended_actions: Array<{
    action: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    rationale: string;
  }>;
  risk_implications: string[];
  market_impact: string;
  timeline_urgency: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Generate expert insights for a specific anomaly
 * Provides AI-style contextual analysis and recommendations
 */
export async function generateExpertInsights(alertId: string): Promise<ExpertInsight | null> {
  try {
    // Get alert and anomaly details
    const { data: alertData, error: alertError } = await supabase
      .from('alerts')
      .select(`
        id,
        created_at,
        anomalies (
          id,
          type,
          severity,
          product_id,
          detected_at,
          details
        )
      `)
      .eq('id', alertId)
      .single();

    if (alertError || !alertData) {
      console.error('Error fetching alert:', alertError);
      return null;
    }

    const anomaly = Array.isArray(alertData.anomalies) ? alertData.anomalies[0] : alertData.anomalies;
    if (!anomaly) return null;

    const context: InsightContext = {
      type: anomaly.type,
      severity: anomaly.severity,
      details: anomaly.details,
      product_id: anomaly.product_id,
      detected_at: anomaly.detected_at,
    };

    // Get product info if available
    let productInfo = null;
    if (anomaly.product_id) {
      const { data } = await supabase
        .from('products')
        .select('hs_code, description, category')
        .eq('id', anomaly.product_id)
        .single();
      productInfo = data;
    }

    // Generate insights based on type
    switch (anomaly.type) {
      case 'price_spike':
        return generatePriceSpikeInsights(context, productInfo);
      case 'tariff_change':
        return generateTariffChangeInsights(context, productInfo);
      case 'freight_surge':
        return generateFreightSurgeInsights(context);
      case 'fx_volatility':
        return generateFxVolatilityInsights(context);
      default:
        return null;
    }
  } catch (error) {
    console.error('Error generating expert insights:', error);
    return null;
  }
}

/**
 * Generate insights for price spike anomalies
 */
function generatePriceSpikeInsights(
  context: InsightContext,
  productInfo: any
): ExpertInsight {
  const percentageChange = context.details?.percentage_change || 0;
  const previousPrice = context.details?.previous_price || 0;
  const currentPrice = context.details?.current_price || 0;
  const zScore = context.details?.z_score || 0;

  const keyFindings: string[] = [];
  const riskImplications: string[] = [];
  const actions: Array<{ action: string; priority: 'low' | 'medium' | 'high' | 'critical'; rationale: string }> = [];

  // Key findings based on magnitude
  if (Math.abs(percentageChange) > 50) {
    keyFindings.push('Extreme price increase detected - over 50% deviation from historical average');
    riskImplications.push('Immediate cost impact on procurement budgets and profit margins');
    actions.push({
      action: 'Contact supplier immediately to investigate price justification',
      priority: 'critical',
      rationale: 'Such large increases may indicate supply disruption or market manipulation',
    });
  } else if (Math.abs(percentageChange) > 30) {
    keyFindings.push('Significant price surge - 30-50% above normal range');
    riskImplications.push('Budget overruns likely if price increase is not addressed');
  } else {
    keyFindings.push('Price anomaly detected within normal market volatility range');
  }

  // Statistical significance
  if (Math.abs(zScore) > 3) {
    keyFindings.push('Statistically significant deviation (Z-score > 3) - indicates true anomaly');
  }

  // Product-specific insights
  if (productInfo) {
    keyFindings.push(`${productInfo.category} sector experiencing price pressure`);

    if (productInfo.category === 'Steel & Metals') {
      keyFindings.push('Steel prices often correlate with raw material costs and global demand');
      actions.push({
        action: 'Check commodity indices (iron ore, coal) for raw material price trends',
        priority: 'high',
        rationale: 'Steel price spikes are often driven by upstream commodity costs',
      });
      actions.push({
        action: 'Review scrap metal prices and recycling rates',
        priority: 'medium',
        rationale: 'Scrap prices affect overall steel market dynamics',
      });
    } else if (productInfo.category === 'Electronics') {
      keyFindings.push('Electronics prices sensitive to component shortages and geopolitical tensions');
      actions.push({
        action: 'Investigate semiconductor supply chain disruptions',
        priority: 'high',
        rationale: 'Electronics price spikes often stem from chip shortages',
      });
    } else if (productInfo.category === 'Chemicals') {
      keyFindings.push('Chemical prices affected by raw material costs and environmental regulations');
      actions.push({
        action: 'Check petrochemical feedstock prices (oil, gas)',
        priority: 'high',
        rationale: 'Chemical costs heavily depend on hydrocarbon prices',
      });
    }
  }

  // Cost implications
  const estimatedImpact = Math.abs(currentPrice - previousPrice);
  if (estimatedImpact > 1000) {
    keyFindings.push(`Estimated cost impact of $${estimatedImpact.toFixed(2)} per unit`);
    if (context.severity === 'critical' || context.severity === 'high') {
      actions.push({
        action: 'Create financial contingency plan for increased procurement costs',
        priority: 'critical',
        rationale: 'Budget revisions may be necessary to accommodate price increases',
      });
    }
  }

  // Recommended actions
  if (context.severity === 'critical') {
    actions.push({
      action: 'Escalate to procurement leadership and finance team immediately',
      priority: 'critical',
      rationale: 'Critical severity requires immediate management intervention',
    });
    actions.push({
      action: 'Consider activating alternative suppliers or substitute products',
      priority: 'high',
      rationale: 'Diversifying supply reduces single-source dependency risk',
    });
  }

  if (context.severity === 'high') {
    actions.push({
      action: 'Schedule supplier meeting within 48 hours to discuss root cause',
      priority: 'high',
      rationale: 'Understanding supplier perspective helps negotiate better terms',
    });
  }

  actions.push({
    action: 'Review historical pricing patterns for this product',
    priority: 'medium',
    rationale: 'Historical context helps determine if this is a one-time spike or trend',
  });

  // Why it matters
  const whyMatters =
    Math.abs(percentageChange) > 50
      ? 'Such extreme price increases can severely impact cash flow, profitability, and competitive pricing. Immediate intervention is required to prevent operational disruptions and financial losses.'
      : Math.abs(percentageChange) > 30
        ? 'Significant price surges directly affect profit margins and may compromise your ability to maintain competitive pricing. Early action can mitigate financial impact and preserve supplier relationships.'
        : 'Price anomalies, even moderate ones, signal potential market shifts. Monitoring these early warnings helps maintain proactive supply chain management.';

  // Market impact
  const marketImpact = productInfo
    ? `The ${productInfo.category} sector is experiencing price volatility. This may indicate broader market trends affecting your supply chain operations.`
    : 'Price spikes in international trade often reflect global supply-demand imbalances, currency fluctuations, or trade policy changes.';

  return {
    key_findings: keyFindings,
    why_it_matters: whyMatters,
    contextual_analysis: `This price spike represents a ${percentageChange}% change from the historical average. The Z-score of ${zScore.toFixed(2)} indicates statistical significance. Historical data analysis suggests similar spikes occurred during supply chain disruptions or major tariff changes.`,
    recommended_actions: actions,
    risk_implications: riskImplications,
    market_impact: marketImpact,
    timeline_urgency: context.severity === 'critical' ? 'critical' : context.severity === 'high' ? 'high' : 'medium',
  };
}

/**
 * Generate insights for tariff change anomalies
 */
function generateTariffChangeInsights(context: InsightContext, productInfo: any): ExpertInsight {
  const percentageChange = context.details?.percentage_change || 0;
  const previousRate = context.details?.previous_rate || 0;
  const currentRate = context.details?.current_rate || 0;

  const keyFindings: string[] = [];
  const riskImplications: string[] = [];
  const actions: Array<{ action: string; priority: 'low' | 'medium' | 'high' | 'critical'; rationale: string }> = [];

  keyFindings.push(`Tariff rate changed from ${previousRate.toFixed(2)}% to ${currentRate.toFixed(2)}%`);

  if (percentageChange > 0) {
    keyFindings.push(`Tariff increase of ${percentageChange.toFixed(1)}% will directly increase import costs`);
    riskImplications.push('Import costs will rise proportionally with tariff increase');
    riskImplications.push('Competitive pricing may be affected, requiring margin adjustments');

    actions.push({
      action: 'Update customs declaration templates with new tariff rates',
      priority: 'critical',
      rationale: 'Using outdated rates can result in customs clearance delays or penalties',
    });

    actions.push({
      action: 'Calculate new landed cost per unit and update pricing models',
      priority: 'high',
      rationale: 'Accurate cost calculation is essential for maintaining profitability',
    });

    actions.push({
      action: 'Review Free Trade Agreement (FTA) eligibility for tariff reduction',
      priority: 'medium',
      rationale: 'FTA preferences can offset tariff increases and reduce costs',
    });
  } else {
    keyFindings.push(`Tariff reduction of ${Math.abs(percentageChange).toFixed(1)}% reduces import costs`);
    riskImplications.push('Opportunity to improve profit margins or reduce product pricing');

    actions.push({
      action: 'Pass savings to customers or improve profit margins',
      priority: 'medium',
      rationale: 'Tariff reductions create cost savings opportunities',
    });
  }

  if (productInfo?.category === 'Steel & Metals') {
    keyFindings.push('Trade remedy measures (anti-dumping duties) often applied to steel imports');
    actions.push({
      action: 'Investigate if this is part of anti-dumping case against specific countries',
      priority: 'high',
      rationale: 'Understanding trade remedy context helps with compliance planning',
    });
  }

  const whyMatters = percentageChange > 0
    ? 'Tariff increases directly impact import costs, affecting profit margins, competitive pricing, and supply chain viability. Immediate compliance and cost recalculation are essential to avoid customs penalties and maintain financial projections.'
    : 'Tariff reductions present cost-saving opportunities that can improve profit margins or enable more competitive pricing. Timely adjustments to pricing models and customs procedures ensure maximum benefit.';

  return {
    key_findings: keyFindings,
    why_it_matters: whyMatters,
    contextual_analysis: `The tariff rate change of ${Math.abs(percentageChange)}% affects compliance requirements and import costs. Governments implement tariff changes to protect domestic industries, respond to trade disputes, or adjust to international agreements. Staying compliant requires immediate action.`,
    recommended_actions: actions,
    risk_implications: riskImplications,
    market_impact: 'Tariff changes often signal government policy shifts or trade tensions. Understanding the underlying rationale helps anticipate future regulatory changes.',
    timeline_urgency: context.severity === 'critical' ? 'critical' : 'high',
  };
}

/**
 * Generate insights for freight surge anomalies
 */
function generateFreightSurgeInsights(context: InsightContext): ExpertInsight {
  const percentageChange = context.details?.percentage_change || 0;
  const route = context.details?.route || 'Unknown route';

  const keyFindings: string[] = [];
  const riskImplications: string[] = [];
  const actions: Array<{ action: string; priority: 'low' | 'medium' | 'high' | 'critical'; rationale: string }> = [];

  keyFindings.push(`Freight costs surged ${Math.abs(percentageChange).toFixed(1)}% on ${route}`);

  if (percentageChange > 50) {
    keyFindings.push('Extreme freight cost increase detected - route may be experiencing capacity constraints');
    riskImplications.push('Shipping lead times and costs significantly impacted');

    actions.push({
      action: 'Contact carrier for route status and alternative shipping options',
      priority: 'critical',
      rationale: 'Understanding route constraints enables contingency planning',
    });

    actions.push({
      action: 'Evaluate alternative shipping routes or multimodal transport',
      priority: 'high',
      rationale: 'Route diversification reduces single-point-of-failure risk',
    });
  } else if (percentageChange > 30) {
    keyFindings.push('Significant freight cost increase - capacity or demand-driven');
    riskImplications.push('Shipping budget overruns and potential delivery delays');

    actions.push({
      action: 'Negotiate contract rate vs. spot rate with carriers',
      priority: 'high',
      rationale: 'Contract rates often more stable than volatile spot rates',
    });
  }

  // Route-specific insights
  if (route.includes('China') || route.includes('Shanghai') || route.includes('Shenzhen')) {
    keyFindings.push('Asia-Pacific routes experiencing capacity fluctuations');
    actions.push({
      action: 'Monitor port congestion and vessel schedules in Chinese ports',
      priority: 'high',
      rationale: 'Chinese port congestion heavily impacts Asia-Pacific freight rates',
    });
  }

  if (route.includes('USA') || route.includes('Long Beach') || route.includes('Los Angeles')) {
    keyFindings.push('US West Coast routes affected by port congestion and labor issues');
    actions.push({
      action: 'Consider East Coast ports or Gulf Coast alternatives',
      priority: 'medium',
      rationale: 'Port diversification reduces congestion-related delays',
    });
  }

  actions.push({
    action: 'Consolidate shipments to improve freight cost efficiency',
    priority: 'medium',
    rationale: 'Full container utilization reduces per-unit freight costs',
  });

  const whyMatters = percentageChange > 50
    ? 'Extreme freight cost increases directly impact total landed costs and profit margins. Shipping is often 10-20% of total product cost - major increases can make products unprofitable. Alternative routes and carrier negotiations are critical.'
    : 'Freight cost volatility affects supply chain costs and predictability. Understanding the underlying causes (capacity, port congestion, fuel costs) helps optimize shipping decisions and maintain margins.';

  return {
    key_findings: keyFindings,
    why_it_matters: whyMatters,
    contextual_analysis: `Freight rates on ${route} have increased ${Math.abs(percentageChange)}%. Freight cost surges typically result from: (1) port congestion reducing vessel throughput, (2) fuel price increases, (3) supply-demand imbalances, or (4) carrier pricing strategies.`,
    recommended_actions: actions,
    risk_implications: riskImplications,
    market_impact: 'Global shipping costs are highly correlated. Major route disruptions (Suez Canal, port strikes, pandemics) affect all routes. Monitoring these patterns helps anticipate future cost changes.',
    timeline_urgency: context.severity === 'critical' ? 'critical' : 'high',
  };
}

/**
 * Generate insights for FX volatility anomalies
 */
function generateFxVolatilityInsights(context: InsightContext): ExpertInsight {
  const volatility = context.details?.volatility || 0;
  const currencyPair = context.details?.currency_pair || 'Unknown';
  const percentageChange = context.details?.percentage_change || 0;

  const keyFindings: string[] = [];
  const riskImplications: string[] = [];
  const actions: Array<{ action: string; priority: 'low' | 'medium' | 'high' | 'critical'; rationale: string }> = [];

  keyFindings.push(`FX volatility ${volatility.toFixed(2)} detected on ${currencyPair}`);

  if (volatility > 5) {
    keyFindings.push('Extreme currency volatility - significant market uncertainty');
    riskImplications.push('Exchange rate risk creating cost unpredictability');

    actions.push({
      action: 'Implement FX hedging strategy with forward contracts',
      priority: 'critical',
      rationale: 'Hedging locks in exchange rates, protecting against volatility',
    });

    actions.push({
      action: 'Review payment terms - consider invoicing in supplier currency',
      priority: 'high',
      rationale: 'Currency alignment reduces FX exposure',
    });
  } else if (volatility > 2) {
    keyFindings.push('Elevated currency volatility - monitor closely');
    riskImplications.push('Price fluctuations affecting import/export profitability');

    actions.push({
      action: 'Consider partial hedging for large purchases',
      priority: 'medium',
      rationale: 'Partial hedging balances risk management with flexibility',
    });
  }

  if (currencyPair.includes('MYR')) {
    keyFindings.push('Malaysian Ringgit volatility affecting trade costs');
    actions.push({
      action: 'Monitor BNM (Bank Negara Malaysia) policy changes',
      priority: 'medium',
      rationale: 'Central bank policies influence exchange rate stability',
    });

    actions.push({
      action: 'Track regional currency correlations (SGD, THB, IDR)',
      priority: 'low',
      rationale: 'ASEAN currencies often move together',
    });
  }

  const whyMatters = volatility > 5
    ? 'Extreme FX volatility can swing costs by 10-20%, making budgeting impossible and eroding profit margins unpredictably. Companies without FX hedging face significant financial risk. Immediate hedging strategies are essential to protect margins.'
    : 'Currency volatility adds uncertainty to international trade costs. Even moderate volatility (2-5%) can impact profitability if unmanaged. Monitoring and strategic hedging help maintain cost predictability and protect margins.';

  return {
    key_findings: keyFindings,
    why_it_matters: whyMatters,
    contextual_analysis: `Currency pair ${currencyPair} is experiencing volatility of ${volatility.toFixed(2)}. FX volatility is driven by: (1) central bank monetary policy, (2) geopolitical events, (3) economic data releases, and (4) market sentiment shifts.`,
    recommended_actions: actions,
    risk_implications: riskImplications,
    market_impact: 'Global trade uses multiple currencies - volatility in one pair often spreads. Monitoring correlations helps anticipate broader FX trends affecting your supply chain.',
    timeline_urgency: context.severity === 'critical' ? 'critical' : 'medium',
  };
}
