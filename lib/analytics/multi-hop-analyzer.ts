import { supabase } from '@/lib/supabase/client';

/**
 * Multi-hop connection in the network
 */
export interface MultiHopConnection {
  path: string[]; // [alertId1, alertId2, alertId3, ...]
  hops: number;
  total_correlation: number;
  compound_risk: number;
  connection_types: string[];
}

/**
 * Analyze multi-hop cascades in the network
 */
export async function analyzeMultiHopConnections(
  alertId: string,
  maxHops: number = 3,
  timeWindowDays: number = 90
): Promise<MultiHopConnection[]> {
  try {
    // Build graph structure
    const graph = await buildConnectionGraph(alertId, timeWindowDays);

    if (!graph || graph.size === 0) {
      return [];
    }

    // Find all multi-hop paths
    const multiHopPaths = findMultiHopPaths(graph, alertId, maxHops);

    // Convert to MultiHopConnection format
    const connections = multiHopPaths.map((path) => ({
      path,
      hops: path.length - 1,
      total_correlation: calculatePathCorrelation(graph, path),
      compound_risk: calculateCompoundRisk(path),
      connection_types: extractConnectionTypes(graph, path),
    }));

    // Sort by compound risk
    return connections.sort((a, b) => b.compound_risk - a.compound_risk);
  } catch (error) {
    console.error('Error analyzing multi-hop connections:', error);
    return [];
  }
}

/**
 * Build connection graph from alerts
 */
async function buildConnectionGraph(
  alertId: string,
  timeWindowDays: number
): Promise<Map<string, Array<{ target: string; weight: number; type: string }>> | null> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - timeWindowDays);

    const graph = new Map<string, Array<{ target: string; weight: number; type: string }>>();

    // Get all relevant alerts
    const { data: alerts } = await supabase
      .from('alerts')
      .select(
        `
        id,
        created_at,
        anomalies (
          id,
          type,
          severity,
          product_id,
          details
        )
      `
      )
      .gte('created_at', cutoffDate.toISOString())
      .limit(500);

    if (!alerts || alerts.length === 0) return null;

    // Build edges based on correlations
    for (let i = 0; i < alerts.length; i++) {
      for (let j = i + 1; j < alerts.length; j++) {
        const alert1 = alerts[i];
        const alert2 = alerts[j];

        const anom1 = Array.isArray(alert1.anomalies)
          ? alert1.anomalies[0]
          : alert1.anomalies;
        const anom2 = Array.isArray(alert2.anomalies)
          ? alert2.anomalies[0]
          : alert2.anomalies;

        if (!anom1 || !anom2) continue;

        const correlation = calculateConnectionStrength(anom1, anom2, alert1, alert2);

        if (correlation > 0.3) {
          // Add bidirectional edge
          if (!graph.has(alert1.id)) {
            graph.set(alert1.id, []);
          }
          graph.get(alert1.id)!.push({
            target: alert2.id,
            weight: correlation,
            type: `${anom1.type}→${anom2.type}`,
          });

          if (!graph.has(alert2.id)) {
            graph.set(alert2.id, []);
          }
          graph.get(alert2.id)!.push({
            target: alert1.id,
            weight: correlation,
            type: `${anom2.type}→${anom1.type}`,
          });
        }
      }
    }

    return graph;
  } catch (error) {
    console.error('Error building connection graph:', error);
    return null;
  }
}

/**
 * Find all multi-hop paths from a starting node
 */
function findMultiHopPaths(
  graph: Map<string, Array<{ target: string; weight: number; type: string }>>,
  startNode: string,
  maxHops: number
): string[][] {
  const paths: string[][] = [];
  const visited = new Set<string>();

  function dfs(node: string, currentPath: string[], currentHops: number) {
    if (currentHops >= maxHops) return;

    const neighbors = graph.get(node) || [];

    for (const neighbor of neighbors) {
      // Avoid cycles (but allow revisiting after 3+ hops)
      if (currentHops >= 2) {
        if (currentPath.includes(neighbor.target)) {
          continue;
        }
      }

      const newPath = [...currentPath, neighbor.target];
      paths.push(newPath);

      if (currentHops < maxHops - 1) {
        dfs(neighbor.target, newPath, currentHops + 1);
      }
    }
  }

  dfs(startNode, [startNode], 0);

  // Deduplicate paths
  const uniquePaths = Array.from(
    new Map(paths.map((path) => [path.join('→'), path])).values()
  );

  return uniquePaths.slice(0, 50); // Limit to top 50 paths
}

/**
 * Calculate total correlation along a path
 */
function calculatePathCorrelation(
  graph: Map<string, Array<{ target: string; weight: number; type: string }>>,
  path: string[]
): number {
  let totalCorrelation = 1.0;

  for (let i = 0; i < path.length - 1; i++) {
    const current = path[i];
    const next = path[i + 1];

    const neighbors = graph.get(current) || [];
    const edge = neighbors.find((n) => n.target === next);

    if (edge) {
      totalCorrelation *= edge.weight;
    }
  }

  return totalCorrelation;
}

/**
 * Calculate compound risk for a path
 */
function calculateCompoundRisk(path: string[]): number {
  // Base risk increases with path length
  let risk = path.length * 20;

  // Add risk based on number of hops
  risk += (path.length - 1) * 15;

  return Math.min(risk, 100);
}

/**
 * Extract connection types from a path
 */
function extractConnectionTypes(
  graph: Map<string, Array<{ target: string; weight: number; type: string }>>,
  path: string[]
): string[] {
  const types: string[] = [];

  for (let i = 0; i < path.length - 1; i++) {
    const current = path[i];
    const next = path[i + 1];

    const neighbors = graph.get(current) || [];
    const edge = neighbors.find((n) => n.target === next);

    if (edge) {
      types.push(edge.type);
    }
  }

  return types;
}

/**
 * Calculate connection strength between two anomalies
 */
function calculateConnectionStrength(
  anomaly1: any,
  anomaly2: any,
  alert1: any,
  alert2: any
): number {
  let correlation = 0.0;

  // Same product correlation
  if (anomaly1.product_id && anomaly2.product_id) {
    if (anomaly1.product_id === anomaly2.product_id) {
      correlation += 0.5;
    }
  }

  // Same type correlation
  if (anomaly1.type === anomaly2.type) {
    correlation += 0.3;
  }

  // Complementary patterns
  const patternScore = calculatePatternMatch(anomaly1.type, anomaly2.type);
  correlation += patternScore;

  // Severity correlation
  const severityScore = calculateSeverityMatch(anomaly1.severity, anomaly2.severity);
  correlation += severityScore * 0.2;

  // Time proximity
  const timeDiff =
    Math.abs(new Date(alert1.created_at).getTime() - new Date(alert2.created_at).getTime()) /
    (1000 * 60 * 60 * 24);
  if (timeDiff < 7) {
    correlation += 0.3 * (1 - timeDiff / 7);
  }

  return Math.min(correlation, 1.0);
}

/**
 * Calculate pattern match score
 */
function calculatePatternMatch(type1: string, type2: string): number {
  if (type1 === type2) return 0.0; // Already counted above

  // High correlation patterns
  if (
    (type1 === 'price_spike' && type2 === 'freight_surge') ||
    (type2 === 'price_spike' && type1 === 'freight_surge')
  ) {
    return 0.8;
  }

  if (
    (type1 === 'tariff_change' && type2 === 'price_spike') ||
    (type2 === 'tariff_change' && type1 === 'price_spike')
  ) {
    return 0.75;
  }

  if (
    (type1 === 'fx_volatility' && type2 === 'price_spike') ||
    (type2 === 'fx_volatility' && type1 === 'price_spike')
  ) {
    return 0.65;
  }

  return 0.1;
}

/**
 * Calculate severity match
 */
function calculateSeverityMatch(severity1: string, severity2: string): number {
  const severityOrder = { low: 1, medium: 2, high: 3, critical: 4 };

  const order1 = severityOrder[severity1 as keyof typeof severityOrder] || 1;
  const order2 = severityOrder[severity2 as keyof typeof severityOrder] || 1;

  // Similar severity = higher correlation
  const diff = Math.abs(order1 - order2);
  return 1 - diff / 4;
}

/**
 * Find transitive risk
 * Calculate how risk propagates through the network
 */
export async function calculateTransitiveRisk(
  alertId: string,
  targetAlertId: string,
  maxHops: number = 3
): Promise<{ risk: number; path: string[] } | null> {
  try {
    const graph = await buildConnectionGraph(alertId, 90);
    if (!graph) return null;

    // Find shortest path
    const path = findShortestPath(graph, alertId, targetAlertId, maxHops);

    if (!path) return null;

    const risk = path.length * 25; // Risk increases with distance

    return {
      risk: Math.min(risk, 100),
      path,
    };
  } catch (error) {
    console.error('Error calculating transitive risk:', error);
    return null;
  }
}

/**
 * Find shortest path between two nodes using BFS
 */
function findShortestPath(
  graph: Map<string, Array<{ target: string; weight: number; type: string }>>,
  start: string,
  target: string,
  maxHops: number
): string[] | null {
  const queue: Array<{ node: string; path: string[] }> = [{ node: start, path: [start] }];
  const visited = new Set([start]);

  while (queue.length > 0) {
    const { node, path } = queue.shift()!;

    if (node === target) {
      return path;
    }

    if (path.length - 1 >= maxHops) continue;

    const neighbors = graph.get(node) || [];

    for (const neighbor of neighbors) {
      if (!visited.has(neighbor.target)) {
        visited.add(neighbor.target);
        queue.push({ node: neighbor.target, path: [...path, neighbor.target] });
      }
    }
  }

  return null;
}

