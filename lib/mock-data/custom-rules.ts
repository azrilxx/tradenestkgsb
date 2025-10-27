import { CustomRule, RuleExecution } from '@/types/database';
import { subDays, format } from 'date-fns';

// Demo user ID (consistent UUID for all rules)
const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001';

/**
 * Sample custom rules for TradeNest
 */
export const MOCK_CUSTOM_RULES: Omit<CustomRule, 'id' | 'created_at' | 'updated_at'>[] = [
  {
    name: 'Price Spike >50% in Electronics',
    description: 'Detect when electronics prices increase by more than 50% within 7 days',
    logic_json: {
      conditions: [
        { field: 'percentage_change', operator: '>', value: 50, period: '7d' },
        { field: 'category', operator: '==', value: 'Electronics' }
      ],
      logic: 'AND',
      alert_type: 'price_spike',
      severity: 'high'
    },
    user_id: DEMO_USER_ID,
    active: true,
    alert_type: 'price_spike',
    severity: 'high'
  },
  {
    name: 'Sudden Volume Surge',
    description: 'Alert when shipment volume increases by 300% in a single month',
    logic_json: {
      conditions: [
        { field: 'volume_change', operator: '>', value: 300, period: '30d' }
      ],
      logic: 'AND',
      alert_type: 'volume_spike',
      severity: 'medium'
    },
    user_id: DEMO_USER_ID,
    active: true,
    alert_type: 'volume_spike',
    severity: 'medium'
  },
  {
    name: 'High-Risk Jurisdiction Trade',
    description: 'Monitor trade with countries in high-risk regions',
    logic_json: {
      conditions: [
        { field: 'country', operator: 'in', value: ['CN', 'TH', 'VN', 'MY'] }
      ],
      logic: 'OR',
      alert_type: 'geographic_risk',
      severity: 'medium'
    },
    user_id: DEMO_USER_ID,
    active: true,
    alert_type: 'geographic_risk',
    severity: 'medium'
  },
  {
    name: 'Automotive Tariff Changes',
    description: 'Track tariff changes on automotive products',
    logic_json: {
      conditions: [
        { field: 'alert_type', operator: '==', value: 'tariff_change' },
        { field: 'category', operator: '==', value: 'Automotive' }
      ],
      logic: 'AND',
      alert_type: 'tariff_change',
      severity: 'high'
    },
    user_id: DEMO_USER_ID,
    active: true,
    alert_type: 'tariff_change',
    severity: 'high'
  },
  {
    name: 'Freight Cost Anomaly',
    description: 'Alert when freight costs exceed $2000 per container',
    logic_json: {
      conditions: [
        { field: 'freight_cost', operator: '>', value: 2000 }
      ],
      logic: 'AND',
      alert_type: 'freight_anomaly',
      severity: 'medium'
    },
    user_id: DEMO_USER_ID,
    active: true,
    alert_type: 'freight_anomaly',
    severity: 'medium'
  },
  {
    name: 'FX Volatility MYR/USD',
    description: 'Monitor MYR/USD exchange rate volatility above 5%',
    logic_json: {
      conditions: [
        { field: 'currency_pair', operator: '==', value: 'MYR/USD' },
        { field: 'volatility_score', operator: '>', value: 0.05 }
      ],
      logic: 'AND',
      alert_type: 'fx_volatility',
      severity: 'critical'
    },
    user_id: DEMO_USER_ID,
    active: true,
    alert_type: 'fx_volatility',
    severity: 'critical'
  },
  {
    name: 'Chemical Price Decline >30%',
    description: 'Detect significant drops in chemical prices',
    logic_json: {
      conditions: [
        { field: 'percentage_change', operator: '<', value: -30 },
        { field: 'category', operator: '==', value: 'Chemicals' }
      ],
      logic: 'AND',
      alert_type: 'price_drop',
      severity: 'low'
    },
    user_id: DEMO_USER_ID,
    active: true,
    alert_type: 'price_drop',
    severity: 'low'
  },
  {
    name: 'Weekly Pattern Detection',
    description: 'Detect unusual patterns in weekly trade data',
    logic_json: {
      conditions: [
        { field: 'pattern_deviation', operator: '>', value: 2 }
      ],
      logic: 'AND',
      alert_type: 'pattern_anomaly',
      severity: 'medium'
    },
    user_id: DEMO_USER_ID,
    active: false,
    alert_type: 'pattern_anomaly',
    severity: 'medium'
  },
  {
    name: 'Dual-Use Products Export',
    description: 'Monitor exports of potential dual-use technologies',
    logic_json: {
      conditions: [
        { field: 'hs_code', operator: 'in', value: ['8471', '8542', '8481'] }
      ],
      logic: 'OR',
      alert_type: 'compliance_check',
      severity: 'high'
    },
    user_id: DEMO_USER_ID,
    active: true,
    alert_type: 'compliance_check',
    severity: 'high'
  },
  {
    name: 'Rare Metal Price Anomaly',
    description: 'Track unusual pricing on rare metals and commodities',
    logic_json: {
      conditions: [
        { field: 'category', operator: '==', value: 'Metals' },
        { field: 'price_deviation', operator: '>', value: 50 }
      ],
      logic: 'AND',
      alert_type: 'price_spike',
      severity: 'high'
    },
    user_id: DEMO_USER_ID,
    active: true,
    alert_type: 'price_spike',
    severity: 'high'
  },
  {
    name: 'Cross-Border Arbitrage',
    description: 'Detect price differences between Malaysia and neighboring countries',
    logic_json: {
      conditions: [
        { field: 'price_difference', operator: '>', value: 30, period: '1d' }
      ],
      logic: 'AND',
      alert_type: 'arbitrage',
      severity: 'medium'
    },
    user_id: DEMO_USER_ID,
    active: true,
    alert_type: 'arbitrage',
    severity: 'medium'
  },
  {
    name: 'Supply Chain Disruption',
    description: 'Alert when multiple suppliers show simultaneous issues',
    logic_json: {
      conditions: [
        { field: 'disruption_count', operator: '>', value: 3, period: '24h' }
      ],
      logic: 'AND',
      alert_type: 'supply_chain',
      severity: 'critical'
    },
    user_id: DEMO_USER_ID,
    active: true,
    alert_type: 'supply_chain',
    severity: 'critical'
  },
  {
    name: 'Port Congestion Alert',
    description: 'Monitor delayed shipments from congested ports',
    logic_json: {
      conditions: [
        { field: 'delay_days', operator: '>', value: 7 },
        { field: 'origin_port', operator: 'in', value: ['MYPKG', 'MYTPM'] }
      ],
      logic: 'AND',
      alert_type: 'port_congestion',
      severity: 'medium'
    },
    user_id: DEMO_USER_ID,
    active: false,
    alert_type: 'port_congestion',
    severity: 'medium'
  },
  {
    name: 'Currency Hedging Gap',
    description: 'Identify exposures to currency fluctuations',
    logic_json: {
      conditions: [
        { field: 'hedged_percentage', operator: '<', value: 50 },
        { field: 'transaction_value', operator: '>', value: 1000000 }
      ],
      logic: 'AND',
      alert_type: 'fx_exposure',
      severity: 'high'
    },
    user_id: DEMO_USER_ID,
    active: true,
    alert_type: 'fx_exposure',
    severity: 'high'
  },
  {
    name: 'Vessel Routing Anomaly',
    description: 'Detect unusual routing patterns or stops',
    logic_json: {
      conditions: [
        { field: 'route_deviations', operator: '>', value: 2 }
      ],
      logic: 'AND',
      alert_type: 'routing_anomaly',
      severity: 'low'
    },
    user_id: DEMO_USER_ID,
    active: false,
    alert_type: 'routing_anomaly',
    severity: 'low'
  },
  {
    name: 'Commodity Market Alert',
    description: 'Track commodity price movements above market average',
    logic_json: {
      conditions: [
        { field: 'commodity_volatility', operator: '>', value: 0.15 }
      ],
      logic: 'AND',
      alert_type: 'commodity_market',
      severity: 'medium'
    },
    user_id: DEMO_USER_ID,
    active: true,
    alert_type: 'commodity_market',
    severity: 'medium'
  },
  {
    name: 'Documentation Compliance',
    description: 'Flag incomplete or irregular trade documentation',
    logic_json: {
      conditions: [
        { field: 'missing_docs', operator: '>', value: 2 },
        { field: 'documentation_score', operator: '<', value: 0.7 }
      ],
      logic: 'AND',
      alert_type: 'compliance',
      severity: 'high'
    },
    user_id: DEMO_USER_ID,
    active: true,
    alert_type: 'compliance',
    severity: 'high'
  },
  {
    name: 'Tariff Erosion Detection',
    description: 'Identify products with declining tariff protection',
    logic_json: {
      conditions: [
        { field: 'tariff_decline', operator: '<', value: -20, period: '1y' }
      ],
      logic: 'AND',
      alert_type: 'tariff_change',
      severity: 'medium'
    },
    user_id: DEMO_USER_ID,
    active: false,
    alert_type: 'tariff_change',
    severity: 'medium'
  }
];

/**
 * Generate rule execution history
 */
export function generateRuleExecutions(
  ruleIds: string[],
  days: number = 30
): Omit<RuleExecution, 'id'>[] {
  const executions: Omit<RuleExecution, 'id'>[] = [];
  const now = new Date();
  const analysisTypes = ['connection_analysis', 'multi_hop_analysis', 'temporal_analysis', 'cascade_prediction'];

  for (let i = 0; i < ruleIds.length; i++) {
    const ruleId = ruleIds[i];
    const executionCount = Math.floor(Math.random() * 5) + 3; // 3-7 executions per rule

    for (let j = 0; j < executionCount; j++) {
      const daysAgo = Math.floor(Math.random() * days);
      const executedAt = subDays(now, daysAgo);
      const matched = Math.random() > 0.6; // 40% match rate

      executions.push({
        rule_id: ruleId,
        executed_at: executedAt.toISOString(),
        matches_found: matched ? Math.floor(Math.random() * 10) + 1 : 0,
        anomalies_created: matched ? Math.floor(Math.random() * 5) + 1 : 0,
        execution_time_ms: Math.floor(Math.random() * 500) + 50,
        metadata: {
          triggered_by: 'scheduled',
          analysis_type: analysisTypes[Math.floor(Math.random() * analysisTypes.length)],
          success: matched,
        }
      });
    }
  }

  return executions;
}

