import { supabase } from '@/lib/supabase/client';
import { calculateMean, calculatePercentageChange, calculateStdDev } from './statistics';
import { AnomalySeverity } from '@/types/database';

export interface FreightAnomalyResult {
  route: string;
  currentIndex: number;
  averageIndex: number;
  percentageChange: number;
  severity: AnomalySeverity;
  detectedAt: string;
  details: Record<string, any>;
}

/**
 * Detect freight cost surges for a specific route
 */
export async function detectFreightSurge(
  route: string,
  lookbackDays: number = 30,
  surgeThreshold: number = 15 // percentage
): Promise<FreightAnomalyResult | null> {
  try {
    // Fetch recent freight index data
    const { data: freightData, error } = await supabase
      .from('freight_index')
      .select('index_value, date')
      .eq('route', route)
      .order('date', { ascending: true })
      .limit(lookbackDays + 1);

    if (error || !freightData || freightData.length < 2) {
      return null;
    }

    // Separate current from historical
    const currentData = freightData[freightData.length - 1];
    const historicalData = freightData.slice(0, -1);

    const currentIndex = currentData.index_value;
    const historicalIndexes = historicalData.map((d) => d.index_value);
    const averageIndex = calculateMean(historicalIndexes);
    const percentageChange = calculatePercentageChange(averageIndex, currentIndex);

    // Check if surge exceeds threshold
    if (percentageChange < surgeThreshold) {
      return null; // Not a surge
    }

    const severity = determineFreightSeverity(percentageChange);

    return {
      route,
      currentIndex,
      averageIndex,
      percentageChange,
      severity,
      detectedAt: new Date().toISOString(),
      details: {
        lookback_days: lookbackDays,
        threshold: surgeThreshold,
        historical_min: Math.min(...historicalIndexes),
        historical_max: Math.max(...historicalIndexes),
        std_dev: calculateStdDev(historicalIndexes),
      },
    };
  } catch (error) {
    console.error('Error detecting freight surge:', error);
    return null;
  }
}

/**
 * Detect freight surges across all routes
 */
export async function detectAllFreightSurges(
  lookbackDays: number = 30,
  surgeThreshold: number = 15
): Promise<FreightAnomalyResult[]> {
  try {
    // Get all unique routes
    const { data: routes, error } = await supabase
      .from('freight_index')
      .select('route')
      .order('route');

    if (error || !routes) {
      return [];
    }

    // Get unique routes
    const uniqueRoutes = [...new Set(routes.map((r) => r.route))];
    const anomalies: FreightAnomalyResult[] = [];

    // Check each route for surges
    for (const route of uniqueRoutes) {
      const anomaly = await detectFreightSurge(route, lookbackDays, surgeThreshold);
      if (anomaly) {
        anomalies.push(anomaly);
      }
    }

    return anomalies;
  } catch (error) {
    console.error('Error detecting all freight surges:', error);
    return [];
  }
}

/**
 * Detect sudden drops in freight costs (potential opportunity alerts)
 */
export async function detectFreightDrop(
  route: string,
  lookbackDays: number = 30,
  dropThreshold: number = 15 // percentage
): Promise<FreightAnomalyResult | null> {
  try {
    const { data: freightData, error } = await supabase
      .from('freight_index')
      .select('index_value, date')
      .eq('route', route)
      .order('date', { ascending: true })
      .limit(lookbackDays + 1);

    if (error || !freightData || freightData.length < 2) {
      return null;
    }

    const currentData = freightData[freightData.length - 1];
    const historicalData = freightData.slice(0, -1);

    const currentIndex = currentData.index_value;
    const historicalIndexes = historicalData.map((d) => d.index_value);
    const averageIndex = calculateMean(historicalIndexes);
    const percentageChange = calculatePercentageChange(averageIndex, currentIndex);

    // Check if drop exceeds threshold (negative percentage)
    if (percentageChange > -dropThreshold) {
      return null; // Not a significant drop
    }

    return {
      route,
      currentIndex,
      averageIndex,
      percentageChange,
      severity: 'low', // Drops are opportunities, not risks
      detectedAt: new Date().toISOString(),
      details: {
        lookback_days: lookbackDays,
        threshold: dropThreshold,
        change_type: 'decrease',
        opportunity: true,
      },
    };
  } catch (error) {
    console.error('Error detecting freight drop:', error);
    return null;
  }
}

/**
 * Get freight trend for a route (increasing/decreasing/stable)
 */
export async function getFreightTrend(
  route: string,
  lookbackDays: number = 30
): Promise<'increasing' | 'decreasing' | 'stable' | null> {
  try {
    const { data: freightData, error } = await supabase
      .from('freight_index')
      .select('index_value, date')
      .eq('route', route)
      .order('date', { ascending: true })
      .limit(lookbackDays);

    if (error || !freightData || freightData.length < 7) {
      return null;
    }

    // Compare first week average to last week average
    const firstWeek = freightData.slice(0, 7);
    const lastWeek = freightData.slice(-7);

    const firstWeekAvg = calculateMean(firstWeek.map((d) => d.index_value));
    const lastWeekAvg = calculateMean(lastWeek.map((d) => d.index_value));

    const percentageChange = calculatePercentageChange(firstWeekAvg, lastWeekAvg);

    if (percentageChange > 5) return 'increasing';
    if (percentageChange < -5) return 'decreasing';
    return 'stable';
  } catch (error) {
    console.error('Error getting freight trend:', error);
    return null;
  }
}

/**
 * Determine severity based on percentage change
 */
function determineFreightSeverity(percentageChange: number): AnomalySeverity {
  const absChange = Math.abs(percentageChange);

  // Critical: Extreme surge
  if (absChange >= 60) {
    return 'critical';
  }

  // High: Major surge
  if (absChange >= 40) {
    return 'high';
  }

  // Medium: Significant surge
  if (absChange >= 25) {
    return 'medium';
  }

  // Low: Moderate surge
  return 'low';
}

/**
 * Get current freight index for a route
 */
export async function getCurrentFreightIndex(route: string): Promise<number | null> {
  try {
    const { data, error } = await supabase
      .from('freight_index')
      .select('index_value')
      .eq('route', route)
      .order('date', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) return null;
    return data.index_value;
  } catch (error) {
    return null;
  }
}