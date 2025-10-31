'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { Badge } from '@/components/ui/badge';

// Dynamically import ForceGraph to avoid SSR issues
const ForceGraph = dynamic(() => import('react-force-graph-2d'), { ssr: false });

interface GraphNode {
  id: string;
  type: string;
  severity: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

interface GraphEdge {
  source: string;
  target: string;
  weight: number;
  type: string;
}

interface NetworkGraphProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  selectedNodeId?: string;
  onNodeClick?: (node: GraphNode) => void;
  height?: number;
}

/**
 * Interactive network graph visualization component
 * Uses force-directed layout to display connections between anomalies
 */
export function NetworkGraph({
  nodes,
  edges,
  selectedNodeId,
  onNodeClick,
  height = 600
}: NetworkGraphProps) {
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const graphRef = useRef<any>(null);

  // Get severity color
  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'critical':
        return '#ef4444'; // red-500
      case 'high':
        return '#f97316'; // orange-500
      case 'medium':
        return '#eab308'; // yellow-500
      case 'low':
        return '#3b82f6'; // blue-500
      default:
        return '#6b7280'; // gray-500
    }
  };

  // Get node size based on connections
  const getNodeSize = (nodeId: string): number => {
    const connectionCount = edges.filter(
      e => e.source === nodeId || e.target === nodeId
    ).length;

    // Base size on number of connections
    const baseSize = 8;
    const connectionBonus = Math.min(connectionCount * 2, 20);
    return baseSize + connectionBonus;
  };

  // Get edge width based on weight
  const getEdgeWidth = (edge: GraphEdge): number => {
    return edge.weight * 3 + 1; // 1-4px based on weight (0-1)
  };

  // Get edge color based on weight
  const getEdgeColor = (edge: GraphEdge): string => {
    if (edge.weight >= 0.7) return '#ef4444'; // strong red
    if (edge.weight >= 0.5) return '#f97316'; // moderate orange
    return '#eab308'; // weak yellow
  };

  // Format type name
  const getTypeName = (type: string): string => {
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Handle node click
  const handleNodeClick = (node: any) => {
    const graphNode = nodes.find(n => n.id === node.id);
    if (graphNode && onNodeClick) {
      onNodeClick(graphNode);
      setSelectedNode(graphNode);
    }
  };

  // Prepare graph data
  const graphData = {
    nodes: nodes.map(node => ({
      ...node,
      size: getNodeSize(node.id),
      color: getSeverityColor(node.severity),
    })),
    links: edges.map(edge => ({
      ...edge,
      width: getEdgeWidth(edge),
      color: getEdgeColor(edge),
    })),
  };

  if (!nodes || nodes.length === 0) {
    return (
      <div className="w-full border rounded-lg p-12 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          <p className="text-gray-500 text-sm">No network data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full border rounded-lg overflow-hidden bg-white">
      {/* Header */}
      <div className="border-b p-4 bg-gray-50">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Network Graph</h3>
          <div className="flex items-center gap-4 text-xs text-gray-600">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span>Low</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <span>Medium</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-orange-500"></div>
              <span>High</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span>Critical</span>
            </div>
          </div>
        </div>
      </div>

      {/* Graph */}
      <div style={{ width: '100%', height: `${height}px` }}>
        <ForceGraph
          ref={graphRef}
          graphData={graphData}
          linkWidth={(link: any) => link.width}
          linkColor={(link: any) => link.color}
          linkDirectionalArrowLength={6}
          linkDirectionalArrowRelPos={0.5}
          nodeLabel={(node: any) => {
            const graphNode = nodes.find(n => n.id === node.id);
            if (!graphNode) return '';
            return `${getTypeName(graphNode.type)} (${graphNode.severity})`;
          }}
          nodeColor={(node: any) => node.color}
          nodeVal={(node: any) => node.size}
          onNodeClick={handleNodeClick}
          onNodeHover={(node: any) => setHoveredNode(node?.id || null)}
          cooldownTicks={100}
          onEngineStop={() => graphRef.current?.zoomToFit(400, 20)}
        />
      </div>

      {/* Selected Node Info */}
      {selectedNode && (
        <div className="border-t p-4 bg-gray-50">
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <h4 className="font-semibold text-sm mb-2">Selected Node</h4>
              <div className="flex items-center gap-2 mb-2">
                <Badge className={`bg-${getSeverityColor(selectedNode.severity).replace('#', '')}`}>
                  {selectedNode.severity}
                </Badge>
                <span className="text-sm font-medium">{getTypeName(selectedNode.type)}</span>
              </div>
              <p className="text-xs text-gray-600">
                {new Date(selectedNode.timestamp).toLocaleString()}
              </p>
            </div>
            <button
              onClick={() => setSelectedNode(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="border-t p-2 bg-gray-50 text-xs text-gray-600">
        <div className="flex items-center gap-4">
          <span className="font-medium">Legend:</span>
          <span>Node size = connections</span>
          <span>Edge thickness = correlation strength</span>
          <span>Click node for details</span>
        </div>
      </div>
    </div>
  );
}

