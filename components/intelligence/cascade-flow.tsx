'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, RotateCcw } from 'lucide-react';

interface CascadeNode {
  id: string;
  type: string;
  severity: string;
  timestamp: string;
  label: string;
  level: number; // 0 = primary, 1 = 1-hop, 2 = 2-hop, etc.
  correlation?: number;
}

interface CascadeFlowProps {
  nodes: CascadeNode[];
  animated?: boolean;
  autoPlay?: boolean;
  onNodeClick?: (node: CascadeNode) => void;
}

/**
 * Animated cascade flow visualization
 * Shows propagation of risk through the network in a timeline flow
 */
export function CascadeFlow({
  nodes,
  animated = true,
  autoPlay = false,
  onNodeClick
}: CascadeFlowProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [selected, setSelected] = useState<string | null>(null);

  // Group nodes by level
  const levels = nodes.reduce((acc, node) => {
    if (!acc[node.level]) acc[node.level] = [];
    acc[node.level].push(node);
    return acc;
  }, {} as Record<number, CascadeNode[]>);

  // Calculate total steps (one per level)
  const totalSteps = Object.keys(levels).length;

  // Auto-play animation
  useEffect(() => {
    if (!animated || !isPlaying) return;

    const interval = setInterval(() => {
      setCurrentStep(prev => {
        const next = prev + 1;
        if (next >= totalSteps) {
          setIsPlaying(false);
          return totalSteps - 1;
        }
        return next;
      });
    }, 2000); // 2 seconds per step

    return () => clearInterval(interval);
  }, [isPlaying, animated, totalSteps]);

  const handlePlay = () => {
    setIsPlaying(true);
    if (currentStep >= totalSteps - 1) {
      setCurrentStep(0);
    }
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  const handleReset = () => {
    setCurrentStep(0);
    setIsPlaying(false);
  };

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'critical': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-white';
      case 'low': return 'bg-blue-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getTypeName = (type: string): string => {
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Get nodes visible at current step
  const getVisibleNodes = (level: number): CascadeNode[] => {
    return levels[level] || [];
  };

  // Check if level should be visible
  const isLevelVisible = (level: number): boolean => {
    return level <= currentStep;
  };

  // Check if node should be animated
  const shouldAnimate = (level: number): boolean => {
    return level === currentStep && isPlaying;
  };

  if (!nodes || nodes.length === 0) {
    return (
      <div className="w-full border rounded-lg p-12 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <p className="text-gray-500 text-sm">No cascade data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full border rounded-lg overflow-hidden bg-white">
      {/* Header Controls */}
      <div className="border-b p-4 bg-gray-50">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Cascade Flow Animation</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePlay}
              disabled={isPlaying}
              className="flex items-center gap-2 px-3 py-1.5 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              <Play className="w-4 h-4" />
              Play
            </button>
            <button
              onClick={handlePause}
              disabled={!isPlaying}
              className="flex items-center gap-2 px-3 py-1.5 rounded bg-gray-600 text-white hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              <Pause className="w-4 h-4" />
              Pause
            </button>
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-3 py-1.5 rounded bg-gray-600 text-white hover:bg-gray-700 text-sm"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
            <span className="text-xs text-gray-600">
              Step {currentStep + 1} of {totalSteps}
            </span>
          </div>
        </div>
      </div>

      {/* Flow Visualization */}
      <div className="p-6 overflow-x-auto">
        <div className="flex gap-4 min-h-[400px]">
          {Object.entries(levels).map(([levelStr, levelNodes]) => {
            const level = parseInt(levelStr);
            const visible = isLevelVisible(level);
            const animate = shouldAnimate(level);

            return (
              <div
                key={level}
                className={`flex-1 min-w-[200px] relative ${visible ? 'opacity-100' : 'opacity-30'
                  } ${animate ? 'animate-pulse' : ''}`}
              >
                {/* Level Label */}
                <div className="mb-4">
                  <div className="inline-block px-3 py-1 rounded bg-blue-100 text-blue-800 text-sm font-semibold">
                    {level === 0 ? 'Primary Alert' : `Hop ${level}`}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    {levelNodes.length} node{levelNodes.length !== 1 ? 's' : ''}
                  </div>
                </div>

                {/* Nodes in Level */}
                <div className="space-y-2">
                  {levelNodes.map(node => (
                    <div
                      key={node.id}
                      onClick={() => {
                        setSelected(node.id);
                        onNodeClick?.(node);
                      }}
                      className={`p-3 rounded-lg border-2 cursor-pointer transition-all hover:scale-105 ${selected === node.id ? 'border-blue-500 shadow-lg' : 'border-gray-200'
                        }`}
                    >
                      <div className="flex items-start gap-2">
                        <Badge className={getSeverityColor(node.severity)}>
                          {node.severity}
                        </Badge>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {getTypeName(node.type)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(node.timestamp).toLocaleDateString()}
                          </p>
                          {node.correlation && (
                            <p className="text-xs text-blue-600 mt-1">
                              {(node.correlation * 100).toFixed(0)}% correlation
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Arrow to next level */}
                {level < totalSteps - 1 && (
                  <div className="absolute top-8 right-0 transform translate-x-1/2 z-10">
                    <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="border-t p-2 bg-gray-50">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-600">Progress:</span>
          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all duration-300"
              style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
            />
          </div>
          <span className="text-xs text-gray-600">
            {Math.round(((currentStep + 1) / totalSteps) * 100)}%
          </span>
        </div>
      </div>
    </div>
  );
}

