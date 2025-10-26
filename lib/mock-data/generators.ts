import { format, subDays, subMonths } from 'date-fns';
import { TariffData, PriceData, FxRate, FreightIndex, Anomaly, AnomalyType, AnomalySeverity } from '@/types/database';

/**
 * Generate random number within range
 */
export function randomInRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

/**
 * Generate random integer within range
 */
export function randomInt(min: number, max: number): number {
  return Math.floor(randomInRange(min, max + 1));
}

/**
 * Generate random date within range
 */
export function randomDate(startDate: Date, endDate: Date): Date {
  const start = startDate.getTime();
  const end = endDate.getTime();
  return new Date(start + Math.random() * (end - start));
}

/**
 * Generate price data with optional anomaly injection
 */
export function generatePriceData(
  productId: string,
  basePrice: number,
  startDate: Date,
  endDate: Date,
  injectAnomaly?: { date: Date; multiplier: number }
): Omit<PriceData, 'id' | 'created_at'>[] {
  const prices: Omit<PriceData, 'id' | 'created_at'>[] = [];
  const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

  for (let i = 0; i < days; i++) {
    const currentDate = subDays(endDate, days - i);
    const dateStr = format(currentDate, 'yyyy-MM-dd');

    // Add some natural volatility (±5%)
    let price = basePrice * randomInRange(0.95, 1.05);

    // Add trend (slight increase over time)
    price = price * (1 + (i / days) * 0.1);

    // Inject anomaly if specified
    if (injectAnomaly && format(currentDate, 'yyyy-MM-dd') === format(injectAnomaly.date, 'yyyy-MM-dd')) {
      price = price * injectAnomaly.multiplier;
    }

    prices.push({
      product_id: productId,
      price: Number(price.toFixed(2)),
      currency: 'MYR',
      date: dateStr,
      source: 'DOSM',
    });
  }

  return prices;
}

/**
 * Generate tariff data with optional changes
 */
export function generateTariffData(
  productId: string,
  baseRate: number,
  startDate: Date,
  endDate: Date,
  changes?: { date: Date; newRate: number }[]
): Omit<TariffData, 'id' | 'created_at'>[] {
  const tariffs: Omit<TariffData, 'id' | 'created_at'>[] = [];
  let currentRate = baseRate;

  // Initial tariff
  tariffs.push({
    product_id: productId,
    rate: baseRate,
    effective_date: format(startDate, 'yyyy-MM-dd'),
    source: 'UN Comtrade',
  });

  // Add changes if specified
  if (changes) {
    changes.forEach((change) => {
      if (change.date >= startDate && change.date <= endDate) {
        tariffs.push({
          product_id: productId,
          rate: change.newRate,
          effective_date: format(change.date, 'yyyy-MM-dd'),
          source: 'UN Comtrade',
        });
        currentRate = change.newRate;
      }
    });
  }

  return tariffs;
}

/**
 * Generate FX rates (MYR pairs)
 */
export function generateFxRates(
  currencyPair: string,
  baseRate: number,
  startDate: Date,
  endDate: Date,
  volatility: number = 0.02
): Omit<FxRate, 'id' | 'created_at'>[] {
  const rates: Omit<FxRate, 'id' | 'created_at'>[] = [];
  const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

  for (let i = 0; i < days; i++) {
    const currentDate = subDays(endDate, days - i);
    const dateStr = format(currentDate, 'yyyy-MM-dd');

    // Add volatility
    const rate = baseRate * randomInRange(1 - volatility, 1 + volatility);

    rates.push({
      currency_pair: currencyPair,
      rate: Number(rate.toFixed(6)),
      date: dateStr,
    });
  }

  return rates;
}

/**
 * Generate freight index data
 */
export function generateFreightIndex(
  route: string,
  baseIndex: number,
  startDate: Date,
  endDate: Date,
  spikes?: { date: Date; multiplier: number }[]
): Omit<FreightIndex, 'id' | 'created_at'>[] {
  const indexes: Omit<FreightIndex, 'id' | 'created_at'>[] = [];
  const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

  for (let i = 0; i < days; i++) {
    const currentDate = subDays(endDate, days - i);
    const dateStr = format(currentDate, 'yyyy-MM-dd');

    // Add natural volatility (±10%)
    let indexValue = baseIndex * randomInRange(0.9, 1.1);

    // Inject spikes if specified
    if (spikes) {
      const spike = spikes.find((s) => format(s.date, 'yyyy-MM-dd') === dateStr);
      if (spike) {
        indexValue = indexValue * spike.multiplier;
      }
    }

    indexes.push({
      route,
      index_value: Number(indexValue.toFixed(2)),
      date: dateStr,
    });
  }

  return indexes;
}

/**
 * Generate anomaly record
 */
export function generateAnomaly(
  type: AnomalyType,
  productId: string | null,
  severity: AnomalySeverity,
  detectedAt: Date,
  details: Record<string, any>
): Omit<Anomaly, 'id' | 'created_at'> {
  return {
    type,
    product_id: productId || '',
    severity,
    detected_at: detectedAt.toISOString(),
    details,
  };
}

/**
 * Generate demo anomalies for various scenarios
 */
export function generateDemoAnomalies(): Omit<Anomaly, 'id' | 'created_at'>[] {
  const anomalies: Omit<Anomaly, 'id' | 'created_at'>[] = [];
  const now = new Date();

  // Critical: Major price spike on electronics
  anomalies.push(
    generateAnomaly(
      'price_spike',
      'product-electronics-1',
      'critical',
      subDays(now, 2),
      {
        previous_price: 1500.0,
        current_price: 3200.0,
        z_score: 4.5,
        threshold: 2.0,
        percentage_change: 113.3,
      }
    )
  );

  // High: Tariff change on textiles
  anomalies.push(
    generateAnomaly(
      'tariff_change',
      'product-textiles-1',
      'high',
      subDays(now, 5),
      {
        previous_rate: 5.0,
        current_rate: 15.0,
        percentage_change: 200.0,
        effective_date: format(subDays(now, 5), 'yyyy-MM-dd'),
      }
    )
  );

  // High: Freight surge on China-Malaysia route
  anomalies.push(
    generateAnomaly(
      'freight_surge',
      null,
      'high',
      subDays(now, 3),
      {
        route: 'China-Malaysia',
        previous_index: 1200.0,
        current_index: 1680.0,
        percentage_change: 40.0,
      }
    )
  );

  // Medium: FX volatility MYR/USD
  anomalies.push(
    generateAnomaly(
      'fx_volatility',
      null,
      'medium',
      subDays(now, 1),
      {
        currency_pair: 'MYR/USD',
        volatility_score: 0.035,
        threshold: 0.025,
        recent_range: '4.45 - 4.68',
      }
    )
  );

  // Medium: Price spike on palm oil
  anomalies.push(
    generateAnomaly(
      'price_spike',
      'product-palm-oil-1',
      'medium',
      subDays(now, 7),
      {
        previous_price: 3200.0,
        current_price: 3850.0,
        z_score: 2.3,
        threshold: 2.0,
        percentage_change: 20.3,
      }
    )
  );

  // Critical: Major freight cost increase
  anomalies.push(
    generateAnomaly(
      'freight_surge',
      null,
      'critical',
      subDays(now, 4),
      {
        route: 'Europe-Malaysia',
        previous_index: 2100.0,
        current_index: 3360.0,
        percentage_change: 60.0,
      }
    )
  );

  // High: Price spike on automotive parts
  anomalies.push(
    generateAnomaly(
      'price_spike',
      'product-automotive-1',
      'high',
      subDays(now, 6),
      {
        previous_price: 450.0,
        current_price: 720.0,
        z_score: 3.2,
        threshold: 2.0,
        percentage_change: 60.0,
      }
    )
  );

  // Low: Minor tariff adjustment
  anomalies.push(
    generateAnomaly(
      'tariff_change',
      'product-furniture-1',
      'low',
      subDays(now, 10),
      {
        previous_rate: 8.0,
        current_rate: 10.0,
        percentage_change: 25.0,
        effective_date: format(subDays(now, 10), 'yyyy-MM-dd'),
      }
    )
  );

  // Medium: Rubber price increase
  anomalies.push(
    generateAnomaly(
      'price_spike',
      'product-rubber-1',
      'medium',
      subDays(now, 8),
      {
        previous_price: 5.8,
        current_price: 7.2,
        z_score: 2.1,
        threshold: 2.0,
        percentage_change: 24.1,
      }
    )
  );

  // High: Sudden chemical price jump
  anomalies.push(
    generateAnomaly(
      'price_spike',
      'product-chemicals-1',
      'high',
      subDays(now, 4),
      {
        previous_price: 850.0,
        current_price: 1360.0,
        z_score: 3.8,
        threshold: 2.0,
        percentage_change: 60.0,
      }
    )
  );

  return anomalies;
}

/**
 * Get historical date range (6 months)
 */
export function getHistoricalDateRange() {
  const endDate = new Date();
  const startDate = subMonths(endDate, 6);
  return { startDate, endDate };
}