import { supabase } from '@/lib/supabase/client';

export interface ScenarioParameters {
  base_data: {
    price: number;
    volume: number;
    freight_cost: number;
    fx_rate: number;
    tariff_rate: number;
  };
  scenarios: Array<{
    name: string;
    variables: {
      fx_change_pct?: number;
      freight_change_pct?: number;
      tariff_change_pct?: number;
      price_change_pct?: number;
      volume_change_pct?: number;
    };
  }>;
}

export interface ScenarioResult {
  scenario_name: string;
  total_cost_impact: number;
  cost_breakdown: {
    base_cost: number;
    fx_impact: number;
    freight_impact: number;
    tariff_impact: number;
    total_cost: number;
  };
  percentage_change: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  key_metrics: {
    cost_per_unit: number;
    total_value: number;
    freight_per_unit: number;
    landed_cost: number;
  };
}

export interface ScenarioAnalysis {
  base_scenario: ScenarioResult;
  alternative_scenarios: ScenarioResult[];
  best_case: ScenarioResult;
  worst_case: ScenarioResult;
  recommendations: string[];
  sensitivity_analysis: {
    most_sensitive_variable: string;
    sensitivity_score: number;
  };
}

/**
 * Model scenarios to predict "what if" outcomes
 * Inspired by Wood Mackenzie's scenario planning approach
 */
export function modelScenarios(parameters: ScenarioParameters): ScenarioAnalysis {
  const base = parameters.base_data;
  const results: ScenarioResult[] = [];

  // Calculate base scenario (no changes)
  const baseScenario = calculateScenario('Baseline', {
    price: base.price,
    volume: base.volume,
    freight_cost: base.freight_cost,
    fx_rate: base.fx_rate,
    tariff_rate: base.tariff_rate,
  });

  results.push(baseScenario);

  // Calculate alternative scenarios
  parameters.scenarios.forEach((scenario) => {
    const result = calculateScenario(scenario.name, {
      price: base.price * (1 + (scenario.variables.price_change_pct || 0) / 100),
      volume: base.volume * (1 + (scenario.variables.volume_change_pct || 0) / 100),
      freight_cost: base.freight_cost * (1 + (scenario.variables.freight_change_pct || 0) / 100),
      fx_rate: base.fx_rate * (1 + (scenario.variables.fx_change_pct || 0) / 100),
      tariff_rate: base.tariff_rate * (1 + (scenario.variables.tariff_change_pct || 0) / 100),
    });

    results.push(result);
  });

  // Find best and worst case scenarios
  const sortedResults = [...results].sort(
    (a, b) => a.total_cost_impact - b.total_cost_impact
  );
  const bestCase = sortedResults[0];
  const worstCase = sortedResults[sortedResults.length - 1];

  // Generate sensitivity analysis
  const sensitivityAnalysis = calculateSensitivity(results, parameters);

  // Generate recommendations
  const recommendations = generateScenarioRecommendations(
    bestCase,
    worstCase,
    baseScenario
  );

  return {
    base_scenario: baseScenario,
    alternative_scenarios: results.filter((r) => r.scenario_name !== 'Baseline'),
    best_case: bestCase,
    worst_case: worstCase,
    recommendations,
    sensitivity_analysis: sensitivityAnalysis,
  };
}

/**
 * Calculate scenario outcome
 */
function calculateScenario(
  name: string,
  adjustedData: {
    price: number;
    volume: number;
    freight_cost: number;
    fx_rate: number;
    tariff_rate: number;
  }
): ScenarioResult {
  // Calculate base cost (price converted to local currency)
  const baseCost = adjustedData.price * adjustedData.fx_rate * adjustedData.volume;

  // Calculate freight cost
  const freightCost = adjustedData.freight_cost * adjustedData.volume;

  // Calculate tariff cost
  const tariffCost = baseCost * (adjustedData.tariff_rate / 100);

  // Total cost
  const totalCost = baseCost + freightCost + tariffCost;

  // Cost breakdown
  const costBreakdown = {
    base_cost: baseCost,
    fx_impact: 0, // Will be calculated vs baseline in analysis
    freight_impact: 0,
    tariff_impact: 0,
    total_cost: totalCost,
  };

  // Cost per unit
  const costPerUnit = totalCost / adjustedData.volume;
  const freightPerUnit = adjustedData.freight_cost;
  const landedCost = totalCost;

  // Determine risk level
  const percentageChange = ((totalCost - baseCost) / baseCost) * 100;
  let riskLevel: 'low' | 'medium' | 'high' | 'critical';

  if (percentageChange > 30) riskLevel = 'critical';
  else if (percentageChange > 15) riskLevel = 'high';
  else if (percentageChange > 5) riskLevel = 'medium';
  else riskLevel = 'low';

  return {
    scenario_name: name,
    total_cost_impact: totalCost,
    cost_breakdown: costBreakdown,
    percentage_change: percentageChange,
    risk_level: riskLevel,
    key_metrics: {
      cost_per_unit: costPerUnit,
      total_value: totalCost,
      freight_per_unit: freightPerUnit,
      landed_cost: landedCost,
    },
  };
}

/**
 * Calculate sensitivity analysis
 */
function calculateSensitivity(
  results: ScenarioResult[],
  parameters: ScenarioParameters
): { most_sensitive_variable: string; sensitivity_score: number } {
  // This is a simplified sensitivity calculation
  // In a real system, you would vary each variable individually

  // For now, identify which scenario has the biggest impact change
  const variations = results.map((r) => Math.abs(r.percentage_change));
  const maxVariation = Math.max(...variations);

  // Determine which variable is most sensitive by examining scenarios
  let mostSensitive = 'fx_rate';
  let highestSensitivity = 0;

  parameters.scenarios.forEach((scenario) => {
    const vars = scenario.variables;
    if (vars.fx_change_pct && Math.abs(vars.fx_change_pct) > highestSensitivity) {
      highestSensitivity = Math.abs(vars.fx_change_pct);
      mostSensitive = 'fx_rate';
    }
    if (vars.freight_change_pct && Math.abs(vars.freight_change_pct) > highestSensitivity) {
      highestSensitivity = Math.abs(vars.freight_change_pct);
      mostSensitive = 'freight_cost';
    }
    if (vars.tariff_change_pct && Math.abs(vars.tariff_change_pct) > highestSensitivity) {
      highestSensitivity = Math.abs(vars.tariff_change_pct);
      mostSensitive = 'tariff_rate';
    }
  });

  return {
    most_sensitive_variable: mostSensitive,
    sensitivity_score: highestSensitivity,
  };
}

/**
 * Generate recommendations based on scenario analysis
 */
function generateScenarioRecommendations(
  bestCase: ScenarioResult,
  worstCase: ScenarioResult,
  baseline: ScenarioResult
): string[] {
  const recommendations: string[] = [];

  const worstImpact = Math.abs(worstCase.percentage_change);
  const bestBenefit = Math.abs(bestCase.percentage_change);

  if (worstImpact > 20) {
    recommendations.push(
      `CRITICAL: Worst-case scenario shows ${worstImpact.toFixed(1)}% cost increase. Implement hedging and contingency plans immediately.`
    );
  }

  if (bestBenefit > 10) {
    recommendations.push(
      `OPPORTUNITY: Best-case scenario shows ${bestBenefit.toFixed(1)}% cost savings. Capitalize on favorable market conditions.`
    );
  }

  const range = worstCase.total_cost_impact - bestCase.total_cost_impact;
  if (range > baseline.total_cost_impact * 0.2) {
    recommendations.push(
      'HIGH VOLATILITY: Scenario range indicates significant cost uncertainty. Consider hedging strategies.'
    );
  }

  // FX-related recommendations
  if (worstCase.percentage_change < -5) {
    recommendations.push(
      'FX Exposure: Implement currency hedging to protect against exchange rate volatility.'
    );
  }

  // Freight recommendations
  if (worstCase.key_metrics.freight_per_unit > bestCase.key_metrics.freight_per_unit * 1.5) {
    recommendations.push(
      'Freight Risk: High freight cost volatility detected. Consider multi-modal transportation or alternative routes.'
    );
  }

  // Tariff recommendations
  if (worstCase.percentage_change > 15) {
    recommendations.push(
      'Tariff Impact: Tariff increases significantly affect costs. Review FTA eligibility and trade agreements.'
    );
  }

  recommendations.push(
    `Cost Range: Budget for cost range between $${bestCase.total_cost_impact.toFixed(2)} and $${worstCase.total_cost_impact.toFixed(2)}.`
  );

  return recommendations;
}

/**
 * Pre-built scenario templates
 */
export const scenarioTemplates = {
  'fx_volatility': {
    name: 'FX Volatility',
    scenarios: [
      { name: 'FX +10%', variables: { fx_change_pct: 10 } },
      { name: 'FX -10%', variables: { fx_change_pct: -10 } },
      { name: 'FX +20%', variables: { fx_change_pct: 20 } },
      { name: 'FX -20%', variables: { fx_change_pct: -20 } },
    ],
  },
  'freight_surge': {
    name: 'Freight Surge',
    scenarios: [
      { name: 'Freight +25%', variables: { freight_change_pct: 25 } },
      { name: 'Freight +50%', variables: { freight_change_pct: 50 } },
      { name: 'Freight +75%', variables: { freight_change_pct: 75 } },
    ],
  },
  'tariff_change': {
    name: 'Tariff Change',
    scenarios: [
      { name: 'Tariff +5%', variables: { tariff_change_pct: 5 } },
      { name: 'Tariff +10%', variables: { tariff_change_pct: 10 } },
      { name: 'Tariff +15%', variables: { tariff_change_pct: 15 } },
    ],
  },
  'comprehensive': {
    name: 'Comprehensive Analysis',
    scenarios: [
      { name: 'Best Case', variables: { fx_change_pct: -10, freight_change_pct: -20, tariff_change_pct: 0 } },
      { name: 'Base Case', variables: {} },
      { name: 'Worst Case', variables: { fx_change_pct: 20, freight_change_pct: 50, tariff_change_pct: 15 } },
    ],
  },
};
