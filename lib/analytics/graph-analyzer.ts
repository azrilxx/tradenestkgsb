import { supabase } from '@/lib/supabase/client';

/**
 * Network metrics for graph analysis
 */
export interface NetworkMetrics {
  pagerank_scores: Record<string, number>;
  centrality_scores: Record<string, number>;
  communities: Array<{ id: string; members: string[] }>;
  critical_paths: Array<{ from: string; to: string; impact: number }>;
}

/**
 * Edge in the graph network
 */
export interface GraphEdge {
  source: string;
  target: string;
  weight: number;
  type: string;
}

/**
 * Node in the graph network
 */
export interface GraphNode {
  id: string;
  type: string;
  severity: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

/**
 * Complete graph structure
 */
export interface NetworkGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

/**
 * Analyze network structure using graph theory algorithms
 */
export async function analyzeNetworkMetrics(
  alertId: string,
  timeWindowDays: number = 30
): Promise<NetworkMetrics | null> {
  try {
    // Build the graph from anomalies and connections
    const graph = await buildNetworkGraph(alertId, timeWindowDays);

    if (!graph || graph.nodes.length === 0) {
      return null;
    }

    // Calculate metrics
    const pagerankScores = calculatePageRank(graph);
    const centralityScores = calculateBetweennessCentrality(graph);
    const communities = detectCommunities(graph);
    const criticalPaths = identifyCriticalPaths(graph, pagerankScores);

    return {
      pagerank_scores: pagerankScores,
      centrality_scores: centralityScores,
      communities,
      critical_paths: criticalPaths,
    };
  } catch (error) {
    console.error('Error analyzing network metrics:', error);
    return null;
  }
}

/**
 * Build network graph from alerts and anomalies
 */
async function buildNetworkGraph(
  alertId: string,
  timeWindowDays: number
): Promise<NetworkGraph | null> {
  try {
    // Get primary alert
    const { data: primaryAlert, error: alertError } = await supabase
      .from('alerts')
      .select(`
        id,
        created_at,
        anomalies (
          id,
          type,
          severity,
          detected_at,
          details
        )
      `)
      .eq('id', alertId)
      .single();

    if (alertError || !primaryAlert) {
      return null;
    }

    const primaryAnomaly = Array.isArray(primaryAlert.anomalies)
      ? primaryAlert.anomalies[0]
      : primaryAlert.anomalies;

    if (!primaryAnomaly) return null;

    // Build nodes
    const nodes: GraphNode[] = [
      {
        id: alertId,
        type: primaryAnomaly.type,
        severity: primaryAnomaly.severity,
        timestamp: primaryAlert.created_at,
        metadata: primaryAnomaly.details,
      },
    ];

    const edges: GraphEdge[] = [];

    // Get related alerts within time window
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - timeWindowDays);

    const { data: relatedAlerts } = await supabase
      .from('alerts')
      .select(`
        id,
        created_at,
        anomalies (
          id,
          type,
          severity,
          detected_at,
          details
        )
      `)
      .neq('id', alertId)
      .gte('created_at', cutoffDate.toISOString())
      .limit(100);

    // Build edges based on correlations
    relatedAlerts?.forEach((alert: any) => {
      const anom = Array.isArray(alert.anomalies) ? alert.anomalies[0] : alert.anomalies;
      if (!anom) return;

      const correlation = calculateCorrelation(primaryAnomaly, anom);

      if (correlation > 0.3) {
        nodes.push({
          id: alert.id,
          type: anom.type,
          severity: anom.severity,
          timestamp: alert.created_at,
          metadata: anom.details,
        });

        edges.push({
          source: alertId,
          target: alert.id,
          weight: correlation,
          type: 'correlation',
        });
      }
    });

    // Remove duplicates
    const uniqueNodes = Array.from(new Map(nodes.map((n) => [n.id, n])).values());

    return { nodes: uniqueNodes, edges };
  } catch (error) {
    console.error('Error building network graph:', error);
    return null;
  }
}

/**
 * Calculate PageRank scores for each node
 * Higher scores indicate more important/central nodes
 */
function calculatePageRank(graph: NetworkGraph, damping: number = 0.85): Record<string, number> {
  const nodeIds = graph.nodes.map((n) => n.id);
  const scores: Record<string, number> = {};
  const oldScores: Record<string, number> = {};

  // Initialize scores
  nodeIds.forEach((id) => {
    scores[id] = 1.0 / nodeIds.length;
    oldScores[id] = 1.0 / nodeIds.length;
  });

  // Iterate until convergence
  for (let iteration = 0; iteration < 50; iteration++) {
    // Calculate outgoing link counts
    const outLinks: Record<string, number> = {};
    nodeIds.forEach((id) => {
      outLinks[id] = graph.edges.filter((e) => e.source === id).length || 1;
    });

    // Update scores
    nodeIds.forEach((nodeId) => {
      let sum = 0;

      graph.edges.forEach((edge) => {
        if (edge.target === nodeId) {
          sum += oldScores[edge.source] / outLinks[edge.source];
        }
      });

      scores[nodeId] = (1 - damping) / nodeIds.length + damping * sum;
    });

    // Check convergence
    let maxDiff = 0;
    nodeIds.forEach((id) => {
      maxDiff = Math.max(maxDiff, Math.abs(scores[id] - oldScores[id]));
    });

    if (maxDiff < 0.0001) break;

    // Copy scores
    nodeIds.forEach((id) => {
      oldScores[id] = scores[id];
    });
  }

  return scores;
}

/**
 * Calculate betweenness centrality
 * Identifies nodes that lie on many shortest paths
 */
function calculateBetweennessCentrality(graph: NetworkGraph): Record<string, number> {
  const nodeIds = graph.nodes.map((n) => n.id);
  const centrality: Record<string, number> = {};
  nodeIds.forEach((id) => {
    centrality[id] = 0;
  });

  // For each pair of nodes, find shortest paths
  for (let i = 0; i < nodeIds.length; i++) {
    for (let j = i + 1; j < nodeIds.length; j++) {
      const paths = findShortestPaths(nodeIds[i], nodeIds[j], graph);
      const nodeCounts: Record<string, number> = {};

      paths.forEach((path) => {
        const nodesOnPath = new Set([path[0], path[path.length - 1]]);
        for (let k = 1; k < path.length - 1; k++) {
          nodesOnPath.add(path[k]);
        }
        nodesOnPath.forEach((node) => {
          nodeCounts[node] = (nodeCounts[node] || 0) + 1 / paths.length;
        });
      });

      Object.keys(nodeCounts).forEach((node) => {
        centrality[node] = (centrality[node] || 0) + nodeCounts[node];
      });
    }
  }

  // Normalize
  const maxCentrality = Math.max(...Object.values(centrality));
  if (maxCentrality > 0) {
    nodeIds.forEach((id) => {
      centrality[id] = centrality[id] / maxCentrality;
    });
  }

  return centrality;
}

/**
 * Detect communities (clusters) in the network
 * Uses simple label propagation algorithm
 */
function detectCommunities(graph: NetworkGraph): Array<{ id: string; members: string[] }> {
  const nodeIds = graph.nodes.map((n) => n.id);
  const communities: Record<string, string> = {};

  // Initialize each node to its own community
  nodeIds.forEach((id) => {
    communities[id] = id;
  });

  // Run label propagation for a few iterations
  for (let iteration = 0; iteration < 10; iteration++) {
    let changed = false;

    nodeIds.forEach((nodeId) => {
      const neighbors = graph.edges
        .filter((e) => e.source === nodeId || e.target === nodeId)
        .map((e) => (e.source === nodeId ? e.target : e.source));

      // Count communities of neighbors
      const neighborComms: Record<string, number> = {};
      neighbors.forEach((neighbor) => {
        const comm = communities[neighbor];
        neighborComms[comm] = (neighborComms[comm] || 0) + 1;
      });

      // Update to most common community
      const mostCommon = Object.entries(neighborComms).sort((a, b) => b[1] - a[1])[0];
      if (mostCommon && mostCommon[0] !== communities[nodeId]) {
        communities[nodeId] = mostCommon[0];
        changed = true;
      }
    });

    if (!changed) break;
  }

  // Group by community
  const communityMap: Record<string, string[]> = {};
  Object.entries(communities).forEach(([node, comm]) => {
    if (!communityMap[comm]) {
      communityMap[comm] = [];
    }
    communityMap[comm].push(node);
  });

  // Filter communities with at least 2 members
  return Object.entries(communityMap)
    .filter(([_, members]) => members.length >= 2)
    .map(([id, members]) => ({ id, members }))
    .slice(0, 10); // Top 10 communities
}

/**
 * Identify critical paths in the network
 * Paths with high-impact connections
 */
function identifyCriticalPaths(
  graph: NetworkGraph,
  pagerankScores: Record<string, number>
): Array<{ from: string; to: string; impact: number }> {
  const criticalPaths: Array<{ from: string; to: string; impact: number }> = [];

  // Find paths between high PageRank nodes
  const highRankNodes = Object.entries(pagerankScores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([id]) => id);

  for (let i = 0; i < highRankNodes.length; i++) {
    for (let j = i + 1; j < highRankNodes.length; j++) {
      const source = highRankNodes[i];
      const target = highRankNodes[j];

      // Check if there's a direct or multi-hop connection
      const path = findPath(source, target, graph);
      if (path) {
        const pathWeight = calculatePathWeight(path, graph);
        criticalPaths.push({
          from: source,
          to: target,
          impact: pathWeight * (pagerankScores[source] + pagerankScores[target]),
        });
      }
    }
  }

  return criticalPaths.sort((a, b) => b.impact - a.impact).slice(0, 20);
}

/**
 * Helper: Find shortest paths between two nodes (BFS)
 */
function findShortestPaths(source: string, target: string, graph: NetworkGraph): string[][] {
  const queue: Array<{ node: string; path: string[] }> = [{ node: source, path: [source] }];
  const visited = new Set([source]);
  const paths: string[][] = [];

  while (queue.length > 0) {
    const { node, path } = queue.shift()!;

    if (node === target) {
      if (paths.length === 0 || paths[0].length === path.length) {
        paths.push([...path]);
      } else if (path.length < paths[0].length) {
        return [[...path]];
      }
      continue;
    }

    graph.edges
      .filter((e) => e.source === node || e.target === node)
      .forEach((edge) => {
        const neighbor = edge.source === node ? edge.target : edge.source;
        if (!visited.has(neighbor) || path.length + 1 === paths[0]?.length) {
          visited.add(neighbor);
          queue.push({ node: neighbor, path: [...path, neighbor] });
        }
      });
  }

  return paths.slice(0, 5); // Return up to 5 shortest paths
}

/**
 * Helper: Find any path between two nodes (DFS)
 */
function findPath(source: string, target: string, graph: NetworkGraph): string[] | null {
  const visited = new Set<string>();

  function dfs(node: string, path: string[]): string[] | null {
    if (node === target) return path;
    if (visited.has(node)) return null;
    visited.add(node);

    const neighbors = graph.edges
      .filter((e) => e.source === node || e.target === node)
      .map((e) => (e.source === node ? e.target : e.source));

    for (const neighbor of neighbors) {
      const result = dfs(neighbor, [...path, neighbor]);
      if (result) {
        return result;
      }
    }

    return null;
  }

  return dfs(source, [source]);
}

/**
 * Helper: Calculate path weight
 */
function calculatePathWeight(path: string[], graph: NetworkGraph): number {
  let weight = 0;
  for (let i = 0; i < path.length - 1; i++) {
    const edge = graph.edges.find((e) =>
      (e.source === path[i] && e.target === path[i + 1]) ||
      (e.target === path[i] && e.source === path[i + 1])
    );
    if (edge) {
      weight += edge.weight;
    }
  }
  return weight;
}

/**
 * Helper: Calculate correlation between anomalies
 */
function calculateCorrelation(anomaly1: any, anomaly2: any): number {
  // High correlation for same product
  if (anomaly1.product_id && anomaly2.product_id && anomaly1.product_id === anomaly2.product_id) {
    return 0.7;
  }

  // Complementary patterns
  if (
    (anomaly1.type === 'price_spike' && anomaly2.type === 'freight_surge') ||
    (anomaly2.type === 'price_spike' && anomaly1.type === 'freight_surge')
  ) {
    return 0.9;
  }

  if (
    (anomaly1.type === 'tariff_change' && anomaly2.type === 'price_spike') ||
    (anomaly2.type === 'tariff_change' && anomaly1.type === 'price_spike')
  ) {
    return 0.85;
  }

  return 0.3;
}

/**
 * Calculate clustering coefficient for the network
 * Measures how interconnected neighbors are
 */
export function calculateClusteringCoefficient(graph: NetworkGraph): number {
  let totalCoefficient = 0;
  let nodeCount = 0;

  graph.nodes.forEach((node) => {
    const neighbors = graph.edges
      .filter((e) => e.source === node.id || e.target === node.id)
      .map((e) => (e.source === node.id ? e.target : e.source));

    if (neighbors.length < 2) {
      totalCoefficient += 0;
      nodeCount++;
      return;
    }

    // Count edges between neighbors
    let neighborEdges = 0;
    for (let i = 0; i < neighbors.length; i++) {
      for (let j = i + 1; j < neighbors.length; j++) {
        if (
          graph.edges.some(
            (e) =>
              (e.source === neighbors[i] && e.target === neighbors[j]) ||
              (e.target === neighbors[i] && e.source === neighbors[j])
          )
        ) {
          neighborEdges++;
        }
      }
    }

    const possibleEdges = (neighbors.length * (neighbors.length - 1)) / 2;
    const coefficient = neighborEdges / possibleEdges;
    totalCoefficient += coefficient;
    nodeCount++;
  });

  return totalCoefficient / nodeCount;
}

