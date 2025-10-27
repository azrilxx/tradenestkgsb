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
  details: Record<string, any>,
  description?: string
): Omit<Anomaly, 'id' | 'created_at'> {
  // Generate a description if not provided
  let desc = description;
  if (!desc) {
    switch (type) {
      case 'price_spike':
        desc = `Price spike detected: ${details.percentage_change?.toFixed(1)}% increase`;
        break;
      case 'tariff_change':
        desc = `Tariff rate change: ${details.previous_rate?.toFixed(1)}% to ${details.current_rate?.toFixed(1)}%`;
        break;
      case 'freight_surge':
        desc = `Freight index surge on ${details.route}: ${details.percentage_change?.toFixed(1)}% increase`;
        break;
      case 'fx_volatility':
        desc = `Currency volatility detected in ${details.currency_pair}: ${details.percentage_change?.toFixed(1)}% change`;
        break;
      default:
        desc = `Anomaly detected: ${type}`;
    }
  }

  return {
    type,
    product_id: productId || null,
    severity,
    description: desc,
    detected_at: detectedAt.toISOString(),
    details,
  };
}

/**
 * Generate demo anomalies for various scenarios
 * @param count - Number of anomalies to generate (default: 10, recommended: 100+)
 */
export function generateDemoAnomalies(count: number = 10): Omit<Anomaly, 'id' | 'created_at'>[] {
  const anomalies: Omit<Anomaly, 'id' | 'created_at'>[] = [];
  const now = new Date();
  const anomalyTypes: AnomalyType[] = ['price_spike', 'tariff_change', 'freight_surge', 'fx_volatility'];
  const severities: AnomalySeverity[] = ['low', 'medium', 'high', 'critical'];

  const categories = ['Electronics', 'Textiles', 'Agriculture', 'Automotive', 'Furniture',
    'Rubber', 'Chemicals', 'Petroleum', 'Machinery', 'Food'];
  const routes = ['China-Malaysia', 'Europe-Malaysia', 'USA-Malaysia', 'Singapore-Malaysia', 'Thailand-Malaysia'];
  const currencyPairs = ['MYR/USD', 'MYR/CNY', 'MYR/EUR', 'MYR/SGD', 'MYR/JPY'];

  // Generate diverse anomalies
  for (let i = 0; i < count; i++) {
    const type = anomalyTypes[randomInt(0, anomalyTypes.length - 1)];
    const severity = severities[randomInt(0, severities.length - 1)];
    const daysAgo = randomInt(1, 90); // Spread over past 90 days
    const detectedAt = subDays(now, daysAgo);
    const category = categories[randomInt(0, categories.length - 1)];

    let productId: string | null = `product-${category.toLowerCase()}-${randomInt(1, 10)}`;

    let details: Record<string, any> = {};

    switch (type) {
      case 'price_spike':
        {
          const basePrice = randomInRange(50, 5000);
          const percentageChange = severity === 'critical'
            ? randomInRange(100, 200)
            : severity === 'high'
              ? randomInRange(50, 100)
              : severity === 'medium'
                ? randomInRange(20, 50)
                : randomInRange(5, 20);
          const newPrice = basePrice * (1 + percentageChange / 100);
          const zScore = severity === 'critical' ? randomInRange(4.0, 6.0)
            : severity === 'high' ? randomInRange(3.0, 4.0)
              : randomInRange(2.0, 3.0);

          details = {
            previous_price: basePrice,
            current_price: newPrice,
            z_score: zScore,
            threshold: 2.0,
            percentage_change: percentageChange,
          };
        }
        break;

      case 'tariff_change':
        {
          const baseRate = randomInRange(0, 20);
          const changeFactor = severity === 'critical' || severity === 'high'
            ? randomInRange(1.5, 3.0)
            : severity === 'medium'
              ? randomInRange(1.2, 1.5)
              : randomInRange(1.05, 1.2);
          const newRate = baseRate * changeFactor;

          details = {
            previous_rate: baseRate,
            current_rate: newRate,
            percentage_change: (changeFactor - 1) * 100,
            effective_date: format(detectedAt, 'yyyy-MM-dd'),
          };
        }
        break;

      case 'freight_surge':
        productId = null; // Freight is not product-specific
        {
          const route = routes[randomInt(0, routes.length - 1)];
          const baseIndex = randomInRange(400, 2500);
          const multiplier = severity === 'critical'
            ? randomInRange(1.6, 2.0)
            : severity === 'high'
              ? randomInRange(1.4, 1.6)
              : severity === 'medium'
                ? randomInRange(1.2, 1.4)
                : randomInRange(1.1, 1.2);
          const newIndex = baseIndex * multiplier;

          details = {
            route,
            previous_index: baseIndex,
            current_index: newIndex,
            percentage_change: (multiplier - 1) * 100,
          };
        }
        break;

      case 'fx_volatility':
        productId = null; // FX is not product-specific
        {
          const pair = currencyPairs[randomInt(0, currencyPairs.length - 1)];
          const baseRate = randomInRange(0.01, 10);
          const volatility = severity === 'critical' || severity === 'high'
            ? randomInRange(0.04, 0.08)
            : severity === 'medium'
              ? randomInRange(0.03, 0.04)
              : randomInRange(0.02, 0.03);
          const threshold = 0.025;
          const percentageChange = volatility * 100;

          details = {
            currency_pair: pair,
            volatility_score: volatility,
            threshold,
            percentage_change: percentageChange,
            recent_range: `${(baseRate * (1 - volatility / 2)).toFixed(2)} - ${(baseRate * (1 + volatility / 2)).toFixed(2)}`,
          };
        }
        break;
    }

    anomalies.push(generateAnomaly(type, productId, severity, detectedAt, details));
  }

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