// lib/rules-engine/evaluator.ts
// Custom Rule Evaluation Engine for TradeNest

export interface RuleCondition {
  field: string;
  operator: '>' | '<' | '>=' | '<=' | '==' | '!=' | 'BETWEEN' | 'CONTAINS';
  value: number | string | [number, number];
  period?: '7_days' | '1_month' | '3_months' | '6_months';
}

export interface RuleLogic {
  conditions: RuleCondition[];
  logic: 'AND' | 'OR';
  alert_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface RuleMatch {
  product_id: string;
  company_id?: string;
  matched_conditions: string[];
  severity: string;
  metadata: Record<string, any>;
}

export interface EvaluationContext {
  product_id?: string;
  company_id?: string;
  date_range?: {
    start: Date;
    end: Date;
  };
}

export class RuleEvaluator {
  private supabase: any;

  constructor(supabaseClient: any) {
    this.supabase = supabaseClient;
  }

  /**
   * Evaluate a custom rule against the database
   */
  async evaluateRule(
    ruleLogic: RuleLogic,
    context: EvaluationContext = {}
  ): Promise<RuleMatch[]> {
    const matches: RuleMatch[] = [];
    
    try {
      // Get all products to evaluate (or specific product if provided)
      const products = await this.getProductsToEvaluate(context);
      
      for (const product of products) {
        const productMatches = await this.evaluateProduct(ruleLogic, product.id, context);
        matches.push(...productMatches);
      }
      
      return matches;
    } catch (error) {
      console.error('Error evaluating rule:', error);
      throw new Error(`Rule evaluation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Evaluate rule against a specific product
   */
  private async evaluateProduct(
    ruleLogic: RuleLogic,
    productId: string,
    context: EvaluationContext
  ): Promise<RuleMatch[]> {
    const matches: RuleMatch[] = [];
    
    try {
      // Evaluate each condition
      const conditionResults = await Promise.all(
        ruleLogic.conditions.map(condition => 
          this.evaluateCondition(condition, productId, context)
        )
      );

      // Apply logic (AND/OR)
      const shouldAlert = this.applyLogic(conditionResults, ruleLogic.logic);
      
      if (shouldAlert) {
        const matchedConditions = ruleLogic.conditions
          .filter((_, index) => conditionResults[index])
          .map(c => `${c.field} ${c.operator} ${c.value}`);

        matches.push({
          product_id: productId,
          company_id: context.company_id,
          matched_conditions: matchedConditions,
          severity: ruleLogic.severity,
          metadata: {
            rule_type: ruleLogic.alert_type,
            evaluation_date: new Date().toISOString(),
            condition_count: ruleLogic.conditions.length
          }
        });
      }
      
      return matches;
    } catch (error) {
      console.error(`Error evaluating product ${productId}:`, error);
      return [];
    }
  }

  /**
   * Evaluate a single condition
   */
  private async evaluateCondition(
    condition: RuleCondition,
    productId: string,
    context: EvaluationContext
  ): Promise<boolean> {
    try {
      const { field, operator, value, period } = condition;
      
      // Get data based on field type
      const data = await this.getFieldData(field, productId, context, period);
      
      if (!data || data.length === 0) {
        return false;
      }

      // Apply operator logic
      return this.applyOperator(data, operator, value);
    } catch (error) {
      console.error(`Error evaluating condition ${condition.field}:`, error);
      return false;
    }
  }

  /**
   * Get data for a specific field
   */
  private async getFieldData(
    field: string,
    productId: string,
    context: EvaluationContext,
    period?: string
  ): Promise<any[]> {
    const dateRange = this.getDateRange(period);
    
    switch (field) {
      case 'price_change_pct':
        return this.getPriceChangeData(productId, dateRange);
      
      case 'volume_change_pct':
        return this.getVolumeChangeData(productId, dateRange);
      
      case 'freight_change_pct':
        return this.getFreightChangeData(productId, dateRange);
      
      case 'fx_volatility':
        return this.getFXVolatilityData(productId, dateRange);
      
      case 'tariff_change_pct':
        return this.getTariffChangeData(productId, dateRange);
      
      case 'unit_price':
        return this.getUnitPriceData(productId, dateRange);
      
      case 'total_value':
        return this.getTotalValueData(productId, dateRange);
      
      default:
        throw new Error(`Unknown field: ${field}`);
    }
  }

  /**
   * Get price change percentage data
   */
  private async getPriceChangeData(productId: string, dateRange: { start: Date; end: Date }): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('price_data')
      .select('price, date')
      .eq('product_id', productId)
      .gte('date', dateRange.start.toISOString().split('T')[0])
      .lte('date', dateRange.end.toISOString().split('T')[0])
      .order('date', { ascending: true });

    if (error) throw error;
    
    // Calculate percentage changes
    const changes = [];
    for (let i = 1; i < data.length; i++) {
      const change = ((data[i].price - data[i-1].price) / data[i-1].price) * 100;
      changes.push({ value: change, date: data[i].date });
    }
    
    return changes;
  }

  /**
   * Get volume change percentage data
   */
  private async getVolumeChangeData(productId: string, dateRange: { start: Date; end: Date }): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('shipments')
      .select('container_count, shipment_date')
      .eq('product_id', productId)
      .gte('shipment_date', dateRange.start.toISOString().split('T')[0])
      .lte('shipment_date', dateRange.end.toISOString().split('T')[0])
      .order('shipment_date', { ascending: true });

    if (error) throw error;
    
    // Group by month and calculate changes
    const monthlyVolumes = this.groupByMonth(data, 'shipment_date', 'container_count');
    const changes = [];
    
    for (let i = 1; i < monthlyVolumes.length; i++) {
      const change = ((monthlyVolumes[i].total - monthlyVolumes[i-1].total) / monthlyVolumes[i-1].total) * 100;
      changes.push({ value: change, month: monthlyVolumes[i].month });
    }
    
    return changes;
  }

  /**
   * Get freight change percentage data
   */
  private async getFreightChangeData(productId: string, dateRange: { start: Date; end: Date }): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('freight_index')
      .select('index_value, date')
      .gte('date', dateRange.start.toISOString().split('T')[0])
      .lte('date', dateRange.end.toISOString().split('T')[0])
      .order('date', { ascending: true });

    if (error) throw error;
    
    const changes = [];
    for (let i = 1; i < data.length; i++) {
      const change = ((data[i].index_value - data[i-1].index_value) / data[i-1].index_value) * 100;
      changes.push({ value: change, date: data[i].date });
    }
    
    return changes;
  }

  /**
   * Get FX volatility data
   */
  private async getFXVolatilityData(productId: string, dateRange: { start: Date; end: Date }): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('fx_rates')
      .select('rate, date')
      .gte('date', dateRange.start.toISOString().split('T')[0])
      .lte('date', dateRange.end.toISOString().split('T')[0])
      .order('date', { ascending: true });

    if (error) throw error;
    
    // Calculate volatility (standard deviation of daily changes)
    const changes = [];
    for (let i = 1; i < data.length; i++) {
      const change = Math.abs((data[i].rate - data[i-1].rate) / data[i-1].rate) * 100;
      changes.push({ value: change, date: data[i].date });
    }
    
    return changes;
  }

  /**
   * Get tariff change percentage data
   */
  private async getTariffChangeData(productId: string, dateRange: { start: Date; end: Date }): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('tariff_data')
      .select('rate, effective_date')
      .eq('product_id', productId)
      .gte('effective_date', dateRange.start.toISOString().split('T')[0])
      .lte('effective_date', dateRange.end.toISOString().split('T')[0])
      .order('effective_date', { ascending: true });

    if (error) throw error;
    
    const changes = [];
    for (let i = 1; i < data.length; i++) {
      const change = ((data[i].rate - data[i-1].rate) / data[i-1].rate) * 100;
      changes.push({ value: change, date: data[i].effective_date });
    }
    
    return changes;
  }

  /**
   * Get unit price data
   */
  private async getUnitPriceData(productId: string, dateRange: { start: Date; end: Date }): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('shipments')
      .select('unit_price, shipment_date')
      .eq('product_id', productId)
      .gte('shipment_date', dateRange.start.toISOString().split('T')[0])
      .lte('shipment_date', dateRange.end.toISOString().split('T')[0])
      .not('unit_price', 'is', null);

    if (error) throw error;
    
    return data.map(item => ({ value: item.unit_price, date: item.shipment_date }));
  }

  /**
   * Get total value data
   */
  private async getTotalValueData(productId: string, dateRange: { start: Date; end: Date }): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('shipments')
      .select('total_value, shipment_date')
      .eq('product_id', productId)
      .gte('shipment_date', dateRange.start.toISOString().split('T')[0])
      .lte('shipment_date', dateRange.end.toISOString().split('T')[0])
      .not('total_value', 'is', null);

    if (error) throw error;
    
    return data.map(item => ({ value: item.total_value, date: item.shipment_date }));
  }

  /**
   * Apply operator logic to data
   */
  private applyOperator(data: any[], operator: string, value: number | string | [number, number]): boolean {
    if (data.length === 0) return false;

    const values = data.map(item => item.value);
    const latestValue = values[values.length - 1];
    const avgValue = values.reduce((sum, val) => sum + val, 0) / values.length;
    const maxValue = Math.max(...values);
    const minValue = Math.min(...values);

    switch (operator) {
      case '>':
        return latestValue > (value as number);
      case '<':
        return latestValue < (value as number);
      case '>=':
        return latestValue >= (value as number);
      case '<=':
        return latestValue <= (value as number);
      case '==':
        return Math.abs(latestValue - (value as number)) < 0.01;
      case '!=':
        return Math.abs(latestValue - (value as number)) >= 0.01;
      case 'BETWEEN':
        const [min, max] = value as [number, number];
        return latestValue >= min && latestValue <= max;
      case 'CONTAINS':
        return values.some(val => val.toString().includes(value as string));
      default:
        return false;
    }
  }

  /**
   * Apply AND/OR logic to condition results
   */
  private applyLogic(results: boolean[], logic: 'AND' | 'OR'): boolean {
    if (logic === 'AND') {
      return results.every(result => result);
    } else {
      return results.some(result => result);
    }
  }

  /**
   * Get products to evaluate
   */
  private async getProductsToEvaluate(context: EvaluationContext): Promise<any[]> {
    if (context.product_id) {
      const { data, error } = await this.supabase
        .from('products')
        .select('id')
        .eq('id', context.product_id)
        .single();
      
      if (error) throw error;
      return data ? [data] : [];
    }

    const { data, error } = await this.supabase
      .from('products')
      .select('id')
      .limit(100); // Limit for performance

    if (error) throw error;
    return data || [];
  }

  /**
   * Get date range based on period
   */
  private getDateRange(period?: string): { start: Date; end: Date } {
    const end = new Date();
    const start = new Date();

    switch (period) {
      case '7_days':
        start.setDate(end.getDate() - 7);
        break;
      case '1_month':
        start.setMonth(end.getMonth() - 1);
        break;
      case '3_months':
        start.setMonth(end.getMonth() - 3);
        break;
      case '6_months':
        start.setMonth(end.getMonth() - 6);
        break;
      default:
        start.setMonth(end.getMonth() - 3); // Default to 3 months
    }

    return { start, end };
  }

  /**
   * Group data by month
   */
  private groupByMonth(data: any[], dateField: string, valueField: string): any[] {
    const grouped = new Map();
    
    data.forEach(item => {
      const date = new Date(item[dateField]);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!grouped.has(monthKey)) {
        grouped.set(monthKey, { month: monthKey, total: 0, count: 0 });
      }
      
      const group = grouped.get(monthKey);
      group.total += item[valueField] || 0;
      group.count += 1;
    });
    
    return Array.from(grouped.values()).sort((a, b) => a.month.localeCompare(b.month));
  }

  /**
   * Test a rule against historical data
   */
  async testRule(ruleLogic: RuleLogic, context: EvaluationContext = {}): Promise<{
    matches: RuleMatch[];
    total_products_evaluated: number;
    execution_time_ms: number;
  }> {
    const startTime = Date.now();
    
    try {
      const matches = await this.evaluateRule(ruleLogic, context);
      const executionTime = Date.now() - startTime;
      
      const products = await this.getProductsToEvaluate(context);
      
      return {
        matches,
        total_products_evaluated: products.length,
        execution_time_ms: executionTime
      };
    } catch (error) {
      console.error('Error testing rule:', error);
      throw error;
    }
  }
}
