/**
 * Statistical utility functions for anomaly detection
 */

export interface PriceDataPoint {
  price: number;
  date: string;
}

/**
 * Calculate mean (average) of an array of numbers
 */
export function calculateMean(values: number[]): number {
  if (values.length === 0) return 0;
  const sum = values.reduce((acc, val) => acc + val, 0);
  return sum / values.length;
}

/**
 * Calculate standard deviation
 */
export function calculateStdDev(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = calculateMean(values);
  const squaredDiffs = values.map((value) => Math.pow(value - mean, 2));
  const variance = calculateMean(squaredDiffs);
  return Math.sqrt(variance);
}

/**
 * Calculate Z-score for a value
 * Z-score tells us how many standard deviations away from the mean a value is
 */
export function calculateZScore(value: number, mean: number, stdDev: number): number {
  if (stdDev === 0) return 0;
  return (value - mean) / stdDev;
}

/**
 * Calculate moving average for a given window size
 */
export function calculateMovingAverage(
  dataPoints: PriceDataPoint[],
  windowSize: number
): { date: string; movingAvg: number }[] {
  const result: { date: string; movingAvg: number }[] = [];

  for (let i = windowSize - 1; i < dataPoints.length; i++) {
    const window = dataPoints.slice(i - windowSize + 1, i + 1);
    const avg = calculateMean(window.map((dp) => dp.price));
    result.push({
      date: dataPoints[i].date,
      movingAvg: avg,
    });
  }

  return result;
}

/**
 * Calculate percentage change between two values
 */
export function calculatePercentageChange(oldValue: number, newValue: number): number {
  if (oldValue === 0) return 0;
  return ((newValue - oldValue) / oldValue) * 100;
}

/**
 * Calculate volatility (standard deviation of percentage changes)
 */
export function calculateVolatility(values: number[]): number {
  if (values.length < 2) return 0;

  const percentageChanges: number[] = [];
  for (let i = 1; i < values.length; i++) {
    const change = calculatePercentageChange(values[i - 1], values[i]);
    percentageChanges.push(change);
  }

  return calculateStdDev(percentageChanges);
}

/**
 * Find outliers using Z-score method
 * Returns indices of values that exceed the threshold
 */
export function findOutliers(
  values: number[],
  threshold: number = 2.0
): { index: number; value: number; zScore: number }[] {
  const mean = calculateMean(values);
  const stdDev = calculateStdDev(values);

  const outliers: { index: number; value: number; zScore: number }[] = [];

  values.forEach((value, index) => {
    const zScore = calculateZScore(value, mean, stdDev);
    if (Math.abs(zScore) > threshold) {
      outliers.push({ index, value, zScore });
    }
  });

  return outliers;
}

/**
 * Calculate simple moving average (SMA)
 */
export function calculateSMA(prices: number[], period: number): number[] {
  const sma: number[] = [];

  for (let i = 0; i < prices.length; i++) {
    if (i < period - 1) {
      sma.push(0); // Not enough data yet
    } else {
      const window = prices.slice(i - period + 1, i + 1);
      sma.push(calculateMean(window));
    }
  }

  return sma;
}

/**
 * Detect sudden spikes (value significantly higher than recent average)
 */
export function detectSpike(
  currentValue: number,
  recentValues: number[],
  multiplier: number = 1.5
): { isSpike: boolean; baseline: number; percentageIncrease: number } {
  const baseline = calculateMean(recentValues);
  const percentageIncrease = calculatePercentageChange(baseline, currentValue);
  const threshold = baseline * multiplier;
  const isSpike = currentValue > threshold;

  return {
    isSpike,
    baseline,
    percentageIncrease,
  };
}

/**
 * Calculate min and max values
 */
export function getMinMax(values: number[]): { min: number; max: number } {
  if (values.length === 0) return { min: 0, max: 0 };
  return {
    min: Math.min(...values),
    max: Math.max(...values),
  };
}