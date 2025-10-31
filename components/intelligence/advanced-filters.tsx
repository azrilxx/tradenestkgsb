'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Filter, Calendar, AlertCircle, Percent } from 'lucide-react';

interface AdvancedFiltersProps {
  timeWindow: number;
  onTimeWindowChange: (window: number) => void;
  severityFilter: string[];
  onSeverityFilterChange: (severities: string[]) => void;
  correlationThreshold: number;
  onCorrelationThresholdChange: (threshold: number) => void;
  onReset: () => void;
}

export function AdvancedFilters({
  timeWindow,
  onTimeWindowChange,
  severityFilter,
  onSeverityFilterChange,
  correlationThreshold,
  onCorrelationThresholdChange,
  onReset,
}: AdvancedFiltersProps) {
  const [showFilters, setShowFilters] = useState(false);

  const severities = ['critical', 'high', 'medium', 'low'];
  const timeWindows = [30, 90, 180];

  const toggleSeverity = (severity: string) => {
    if (severityFilter.includes(severity)) {
      onSeverityFilterChange(severityFilter.filter(s => s !== severity));
    } else {
      onSeverityFilterChange([...severityFilter, severity]);
    }
  };

  const hasActiveFilters = severityFilter.length > 0 || correlationThreshold > 0.3;

  return (
    <Card className="border-2">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-5 w-5 text-blue-600" />
            Advanced Filters
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="text-sm"
          >
            {showFilters ? 'Hide' : 'Show'}
          </Button>
        </div>
        {hasActiveFilters && (
          <div className="flex items-center gap-2 flex-wrap mt-2">
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              Time: {timeWindow} days
            </Badge>
            {severityFilter.length > 0 && (
              <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                Severity: {severityFilter.length}
              </Badge>
            )}
            {correlationThreshold > 0.3 && (
              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                Correlation: {(correlationThreshold * 100).toFixed(0)}%
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onReset}
              className="h-6 px-2 text-xs"
            >
              <X className="h-3 w-3 mr-1" />
              Reset
            </Button>
          </div>
        )}
      </CardHeader>

      {showFilters && (
        <CardContent className="space-y-4 border-t pt-4">
          {/* Time Window Slider */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4 text-gray-600" />
              <label className="text-sm font-medium text-gray-700">Time Window</label>
            </div>
            <div className="flex items-center gap-2">
              {timeWindows.map(window => (
                <Button
                  key={window}
                  variant={timeWindow === window ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => onTimeWindowChange(window)}
                  className="text-xs"
                >
                  {window} Days
                </Button>
              ))}
            </div>
          </div>

          {/* Severity Filter */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-4 w-4 text-gray-600" />
              <label className="text-sm font-medium text-gray-700">Severity Filter</label>
            </div>
            <div className="flex flex-wrap gap-2">
              {severities.map(severity => {
                const isSelected = severityFilter.includes(severity);
                return (
                  <button
                    key={severity}
                    onClick={() => toggleSeverity(severity)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${isSelected
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                  >
                    {severity.charAt(0).toUpperCase() + severity.slice(1)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Correlation Threshold */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Percent className="h-4 w-4 text-gray-600" />
              <label className="text-sm font-medium text-gray-700">
                Correlation Threshold: {(correlationThreshold * 100).toFixed(0)}%
              </label>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={correlationThreshold * 100}
              onChange={(e) => onCorrelationThresholdChange(parseInt(e.target.value) / 100)}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0%</span>
              <span>100%</span>
            </div>
          </div>

          {/* Quick Presets */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Quick Presets</label>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onTimeWindowChange(30);
                  onSeverityFilterChange(['critical', 'high']);
                  onCorrelationThresholdChange(0.7);
                }}
                className="text-xs"
              >
                High Risk Only
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onTimeWindowChange(90);
                  onSeverityFilterChange([]);
                  onCorrelationThresholdChange(0.5);
                }}
                className="text-xs"
              >
                Recent Cascade
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onTimeWindowChange(180);
                  onSeverityFilterChange(['critical']);
                  onCorrelationThresholdChange(0.8);
                }}
                className="text-xs"
              >
                Critical Only
              </Button>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

