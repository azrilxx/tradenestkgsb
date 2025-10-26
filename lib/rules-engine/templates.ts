// lib/rules-engine/templates.ts
// Pre-built Rule Templates for TradeNest

export interface RuleTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  logic_json: any;
  severity: 'low' | 'medium' | 'high' | 'critical';
  use_case: string;
  example_scenario: string;
}

export const RULE_TEMPLATES: RuleTemplate[] = [
  {
    id: 'sudden_volume_surge',
    name: 'Sudden Volume Surge',
    description: 'Detects when shipment volume increases dramatically in a short period',
    category: 'Volume Analysis',
    logic_json: {
      conditions: [
        {
          field: 'volume_change_pct',
          operator: '>',
          value: 50,
          period: '1_month'
        }
      ],
      logic: 'AND',
      alert_type: 'VOLUME_SURGE',
      severity: 'high'
    },
    severity: 'high',
    use_case: 'Identify potential dumping or market manipulation through volume spikes',
    example_scenario: 'Chinese steel imports increase by 60% in one month, indicating possible dumping activity'
  },
  {
    id: 'price_freight_mismatch',
    name: 'Price-Freight Mismatch',
    description: 'Detects when product prices drop while freight costs spike, indicating potential TBML',
    category: 'Trade-Based Money Laundering',
    logic_json: {
      conditions: [
        {
          field: 'price_change_pct',
          operator: '<',
          value: -20,
          period: '3_months'
        },
        {
          field: 'freight_change_pct',
          operator: '>',
          value: 25,
          period: '3_months'
        }
      ],
      logic: 'AND',
      alert_type: 'PRICE_FREIGHT_MISMATCH',
      severity: 'critical'
    },
    severity: 'critical',
    use_case: 'Detect Trade-Based Money Laundering patterns where low prices mask high freight costs',
    example_scenario: 'Electronics prices drop 30% while freight costs increase 40% - classic TBML red flag'
  },
  {
    id: 'tariff_evasion_pattern',
    name: 'Tariff Evasion Pattern',
    description: 'Detects sudden price drops following tariff increases, suggesting evasion tactics',
    category: 'Tariff Compliance',
    logic_json: {
      conditions: [
        {
          field: 'tariff_change_pct',
          operator: '>',
          value: 10,
          period: '3_months'
        },
        {
          field: 'price_change_pct',
          operator: '<',
          value: -15,
          period: '1_month'
        }
      ],
      logic: 'AND',
      alert_type: 'TARIFF_EVASION',
      severity: 'high'
    },
    severity: 'high',
    use_case: 'Identify companies attempting to evade tariffs through price manipulation',
    example_scenario: 'After 15% tariff increase, product prices drop 20% suggesting under-invoicing'
  },
  {
    id: 'round_tripping_detection',
    name: 'Round-Tripping Detection',
    description: 'Detects same products being imported and exported by related entities',
    category: 'Circular Trading',
    logic_json: {
      conditions: [
        {
          field: 'unit_price',
          operator: 'BETWEEN',
          value: [0.8, 1.2],
          period: '6_months'
        },
        {
          field: 'total_value',
          operator: '>',
          value: 1000000,
          period: '6_months'
        }
      ],
      logic: 'AND',
      alert_type: 'ROUND_TRIPPING',
      severity: 'medium'
    },
    severity: 'medium',
    use_case: 'Identify circular trading patterns used for tax optimization or money laundering',
    example_scenario: 'Same HS code products imported and exported at similar prices by related companies'
  },
  {
    id: 'under_invoicing_risk',
    name: 'Under-Invoicing Risk',
    description: 'Detects products priced significantly below market average',
    category: 'Price Manipulation',
    logic_json: {
      conditions: [
        {
          field: 'unit_price',
          operator: '<',
          value: 0.7, // 30% below market average
          period: '3_months'
        }
      ],
      logic: 'AND',
      alert_type: 'UNDER_INVOICING',
      severity: 'high'
    },
    severity: 'high',
    use_case: 'Identify potential under-invoicing for tax evasion or money laundering',
    example_scenario: 'Steel products priced 40% below market average, suggesting deliberate under-invoicing'
  },
  {
    id: 'fx_volatility_alert',
    name: 'FX Volatility Alert',
    description: 'Detects high foreign exchange rate volatility affecting trade costs',
    category: 'Currency Risk',
    logic_json: {
      conditions: [
        {
          field: 'fx_volatility',
          operator: '>',
          value: 5, // 5% daily volatility
          period: '7_days'
        }
      ],
      logic: 'AND',
      alert_type: 'FX_VOLATILITY',
      severity: 'medium'
    },
    severity: 'medium',
    use_case: 'Monitor currency volatility that could impact trade profitability',
    example_scenario: 'MYR/USD rate shows 8% daily volatility, affecting import costs significantly'
  },
  {
    id: 'seasonal_anomaly',
    name: 'Seasonal Anomaly',
    description: 'Detects unusual patterns that deviate from seasonal norms',
    category: 'Seasonal Analysis',
    logic_json: {
      conditions: [
        {
          field: 'volume_change_pct',
          operator: '>',
          value: 100,
          period: '3_months'
        },
        {
          field: 'price_change_pct',
          operator: '<',
          value: -10,
          period: '3_months'
        }
      ],
      logic: 'AND',
      alert_type: 'SEASONAL_ANOMALY',
      severity: 'medium'
    },
    severity: 'medium',
    use_case: 'Identify products with unusual seasonal patterns',
    example_scenario: 'Agricultural imports surge 150% during off-season with price drops'
  },
  {
    id: 'supply_chain_disruption',
    name: 'Supply Chain Disruption',
    description: 'Detects patterns indicating supply chain issues',
    category: 'Supply Chain',
    logic_json: {
      conditions: [
        {
          field: 'freight_change_pct',
          operator: '>',
          value: 30,
          period: '1_month'
        },
        {
          field: 'volume_change_pct',
          operator: '<',
          value: -20,
          period: '1_month'
        }
      ],
      logic: 'AND',
      alert_type: 'SUPPLY_CHAIN_DISRUPTION',
      severity: 'high'
    },
    severity: 'high',
    use_case: 'Identify supply chain disruptions affecting trade flows',
    example_scenario: 'Freight costs spike 40% while volumes drop 25% indicating port congestion'
  }
];

export function getTemplateById(id: string): RuleTemplate | undefined {
  return RULE_TEMPLATES.find(template => template.id === id);
}

export function getTemplatesByCategory(category: string): RuleTemplate[] {
  return RULE_TEMPLATES.filter(template => template.category === category);
}

export function getAllCategories(): string[] {
  return [...new Set(RULE_TEMPLATES.map(template => template.category))];
}

export function createRuleFromTemplate(templateId: string, customizations?: Partial<RuleTemplate>): RuleTemplate {
  const template = getTemplateById(templateId);
  if (!template) {
    throw new Error(`Template ${templateId} not found`);
  }

  return {
    ...template,
    ...customizations,
    logic_json: {
      ...template.logic_json,
      ...(customizations?.logic_json || {})
    }
  };
}
