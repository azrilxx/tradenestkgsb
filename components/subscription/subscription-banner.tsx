'use client';

import { useState } from 'react';
import { X, Zap, BarChart3, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export interface SubscriptionBannerProps {
  tier: 'free' | 'professional' | 'enterprise';
  usageCount: number;
  monthlyLimit: number;
  message?: string;
  showUpgrade?: boolean;
  onUpgrade?: () => void;
  onDismiss?: () => void;
}

export function SubscriptionBanner({
  tier,
  usageCount,
  monthlyLimit,
  message,
  showUpgrade = true,
  onUpgrade,
  onDismiss,
}: SubscriptionBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const isAtLimit = usageCount >= monthlyLimit;
  const isNearLimit = usageCount >= monthlyLimit * 0.8;
  const usagePercentage = (usageCount / monthlyLimit) * 100;

  const tierColors = {
    free: {
      background: 'bg-gray-50 border-gray-200',
      accent: 'bg-blue-500',
      text: 'text-gray-700',
    },
    professional: {
      background: 'bg-blue-50 border-blue-200',
      accent: 'bg-blue-600',
      text: 'text-blue-700',
    },
    enterprise: {
      background: 'bg-purple-50 border-purple-200',
      accent: 'bg-purple-600',
      text: 'text-purple-700',
    },
  };

  const colors = tierColors[tier];

  return (
    <Card
      className={`${colors.background} border-2 p-4 rounded-lg shadow-sm`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          {/* Icon */}
          <div className={`${colors.accent} text-white p-2 rounded-lg`}>
            {isAtLimit ? (
              <Lock className="h-5 w-5" />
            ) : isNearLimit ? (
              <Zap className="h-5 w-5" />
            ) : (
              <BarChart3 className="h-5 w-5" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-lg text-gray-900">
                {isAtLimit
                  ? 'Monthly Limit Reached'
                  : isNearLimit
                    ? 'Approaching Monthly Limit'
                    : 'Subscription Status'}
              </h3>
              <Badge variant="outline" className="text-xs">
                {tier.charAt(0).toUpperCase() + tier.slice(1)} Tier
              </Badge>
            </div>

            {message ? (
              <p className="text-sm text-gray-600 mb-2">{message}</p>
            ) : (
              <p className="text-sm text-gray-600 mb-2">
                {isAtLimit
                  ? `You've used all ${monthlyLimit} analyses for this month. Upgrade to continue using Interconnected Intelligence.`
                  : isNearLimit
                    ? `You've used ${usageCount} of ${monthlyLimit} analyses this month. Consider upgrading for unlimited access.`
                    : `You've used ${usageCount} of ${monthlyLimit} analyses this month.`}
              </p>
            )}

            {/* Progress bar */}
            <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${isAtLimit
                    ? 'bg-red-500'
                    : isNearLimit
                      ? 'bg-yellow-500'
                      : colors.accent
                  }`}
                style={{ width: `${Math.min(usagePercentage, 100)}%` }}
              />
            </div>

            {/* Upgrade CTA */}
            {showUpgrade && isAtLimit && (
              <div className="flex gap-2">
                <Button
                  onClick={onUpgrade}
                  variant="primary"
                  className={`${colors.accent} text-white`}
                >
                  Upgrade to Professional
                </Button>
                <Button
                  onClick={onUpgrade}
                  variant="outline"
                  className="border-gray-300"
                >
                  View Plans
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Dismiss button */}
        {onDismiss && (
          <button
            onClick={() => {
              setDismissed(true);
              onDismiss?.();
            }}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Dismiss banner"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
    </Card>
  );
}

/**
 * Usage Limit Banner Component
 * Shows when user is near or at limit
 */
export function UsageLimitBanner({
  currentCount,
  limit,
  tier,
  onUpgrade,
  onDismiss,
}: {
  currentCount: number;
  limit: number;
  tier: string;
  onUpgrade?: () => void;
  onDismiss?: () => void;
}) {
  const reachedLimit = currentCount >= limit;
  const percentage = (currentCount / limit) * 100;

  if (!reachedLimit && percentage < 80) {
    return null; // Only show when near or at limit
  }

  return (
    <div
      className={`border rounded-lg p-4 ${reachedLimit
          ? 'bg-red-50 border-red-200'
          : 'bg-yellow-50 border-yellow-200'
        }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`p-2 rounded ${reachedLimit ? 'bg-red-500' : 'bg-yellow-500'
              } text-white`}
          >
            {reachedLimit ? <Lock className="h-5 w-5" /> : <Zap className="h-5 w-5" />}
          </div>
          <div>
            <h4 className="font-semibold text-gray-900">
              {reachedLimit
                ? 'Limit Reached'
                : 'Approaching Monthly Limit'}
            </h4>
            <p className="text-sm text-gray-600">
              {reachedLimit
                ? `You've used all ${limit} analyses this month. Upgrade to continue.`
                : `${currentCount}/${limit} analyses used this month`}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {reachedLimit && onUpgrade && (
            <Button onClick={onUpgrade} variant="primary">
              Upgrade
            </Button>
          )}
          {onDismiss && (
            <Button onClick={onDismiss} variant="ghost" size="sm">
              Dismiss
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Feature Lock Modal Component
 * Shows when a feature is locked behind a subscription tier
 */
export function FeatureLockModal({
  featureName,
  currentTier,
  requiredTier,
  onUpgrade,
  onClose,
}: {
  featureName: string;
  currentTier: string;
  requiredTier: string;
  onUpgrade?: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900">Feature Locked</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Lock className="h-6 w-6 text-gray-400" />
            <p className="text-gray-900 font-medium">{featureName}</p>
          </div>
          <p className="text-sm text-gray-600">
            This feature requires <strong>{requiredTier}</strong> tier. You
            are currently on <strong>{currentTier}</strong> tier.
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={onUpgrade}
            variant="primary"
            className="flex-1"
          >
            Upgrade to {requiredTier}
          </Button>
          <Button onClick={onClose} variant="outline" className="flex-1">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

