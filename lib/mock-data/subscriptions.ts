import { UserSubscription, IntelligenceAnalysisUsage, SubscriptionTier } from '@/types/database';
import { subDays, format } from 'date-fns';

/**
 * Mock user ID for demo user
 */
const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001';

/**
 * Generate subscription data for demo user
 */
export function generateSubscriptions(): Omit<UserSubscription, 'id' | 'created_at' | 'updated_at'>[] {
  const subscriptions: Omit<UserSubscription, 'id' | 'created_at' | 'updated_at'>[] = [];
  const now = new Date();

  // Professional tier subscription
  subscriptions.push({
    user_id: DEMO_USER_ID,
    tier: 'professional' as SubscriptionTier,
    features: {
      basic_list_view: true,
      basic_analysis: true,
      interactive_graphs: true,
      advanced_analytics: true,
      export_pdf: true,
      extended_time_window: true,
    },
    usage_limits: {
      analyses_per_month: 999999,
      max_time_window_days: 90,
    },
    started_at: subDays(now, 90).toISOString(),
    expires_at: null,
    is_active: true,
  });

  return subscriptions;
}

/**
 * Generate intelligence analysis usage data
 */
export function generateIntelligenceUsage(alertIds: string[]): Omit<IntelligenceAnalysisUsage, 'id'>[] {
  const usage: Omit<IntelligenceAnalysisUsage, 'id'>[] = [];
  const now = new Date();
  const analysisTypes = ['connection', 'multi_hop', 'temporal', 'cascade_prediction'];

  // Generate 50+ usage records over the past 30 days
  for (let i = 0; i < 55; i++) {
    const daysAgo = Math.floor(Math.random() * 30);
    const executedAt = subDays(now, daysAgo);
    const analysisType = analysisTypes[Math.floor(Math.random() * analysisTypes.length)];
    const alertId = alertIds.length > 0 ? alertIds[Math.floor(Math.random() * alertIds.length)] : '00000000-0000-0000-0000-000000000001';
    const timeWindow = [7, 14, 30, 60, 90][Math.floor(Math.random() * 5)];

    usage.push({
      user_id: DEMO_USER_ID,
      alert_id: alertId,
      analysis_type: analysisType,
      time_window: timeWindow,
      metadata: {
        triggered_by: 'user',
        success: true,
      },
      created_at: executedAt.toISOString(),
    });
  }

  return usage;
}

