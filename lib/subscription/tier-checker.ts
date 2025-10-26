import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export type SubscriptionTier = 'free' | 'professional' | 'enterprise';

export interface UserSubscription {
  user_id: string;
  tier: SubscriptionTier;
  features: string[];
  usage_limits: {
    analyses_per_month: number;
    max_time_window_days: number;
  };
  started_at: string;
  expires_at: string | null;
  is_active: boolean;
}

export interface UsageData {
  current_month_count: number;
  monthly_limit: number;
  can_use: boolean;
}

/**
 * Get user's subscription tier and details
 */
export async function getUserSubscription(userId: string): Promise<UserSubscription | null> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { data, error } = await supabase
    .from('user_subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .single();

  if (error || !data) {
    // Return default free tier
    return {
      user_id: userId,
      tier: 'free',
      features: ['basic_list_view', 'basic_analysis'],
      usage_limits: {
        analyses_per_month: 5,
        max_time_window_days: 30,
      },
      started_at: new Date().toISOString(),
      expires_at: null,
      is_active: true,
    };
  }

  return {
    user_id: data.user_id,
    tier: data.tier,
    features: Object.values(data.features || {}) as string[],
    usage_limits: data.usage_limits as any,
    started_at: data.started_at,
    expires_at: data.expires_at,
    is_active: data.is_active,
  };
}

/**
 * Check if user can access a specific feature
 */
export async function canAccessFeature(
  userId: string,
  feature: string
): Promise<boolean> {
  const subscription = await getUserSubscription(userId);
  if (!subscription) return false;

  // Feature mapping by tier
  const tierFeatures: Record<SubscriptionTier, string[]> = {
    free: ['basic_list_view', 'basic_analysis'],
    professional: [
      'basic_list_view',
      'basic_analysis',
      'interactive_graphs',
      'advanced_analytics',
      'export_pdf',
      'extended_time_window',
    ],
    enterprise: [
      'basic_list_view',
      'basic_analysis',
      'interactive_graphs',
      'advanced_analytics',
      'export_pdf',
      'extended_time_window',
      'ml_predictions',
      'real_time_monitoring',
      'api_access',
      'batch_analysis',
      'scheduled_reports',
    ],
  };

  const allowedFeatures = tierFeatures[subscription.tier] || [];
  return allowedFeatures.includes(feature);
}

/**
 * Track usage of a feature
 */
export async function trackUsage(
  userId: string,
  alertId: string,
  analysisType: string = 'connection',
  timeWindow: number = 30,
  metadata: Record<string, any> = {}
): Promise<void> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  await supabase.from('intelligence_analysis_usage').insert({
    user_id: userId,
    alert_id: alertId,
    analysis_type: analysisType,
    time_window: timeWindow,
    metadata,
  });
}

/**
 * Check if user has exceeded usage limit
 */
export async function checkUsageLimit(userId: string): Promise<UsageData> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const subscription = await getUserSubscription(userId);

  // Get current month usage count
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { count, error } = await supabase
    .from('intelligence_analysis_usage')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('analysis_type', 'connection')
    .gte('created_at', startOfMonth.toISOString());

  const currentMonthCount = count || 0;
  const monthlyLimit = subscription.usage_limits.analyses_per_month;

  return {
    current_month_count: currentMonthCount,
    monthly_limit: monthlyLimit,
    can_use: currentMonthCount < monthlyLimit,
  };
}

/**
 * Get features available for a tier
 */
export function getFeaturesByTier(tier: SubscriptionTier): string[] {
  const tierFeatures: Record<SubscriptionTier, string[]> = {
    free: ['basic_list_view', 'basic_analysis'],
    professional: [
      'basic_list_view',
      'basic_analysis',
      'interactive_graphs',
      'advanced_analytics',
      'export_pdf',
      'extended_time_window',
    ],
    enterprise: [
      'basic_list_view',
      'basic_analysis',
      'interactive_graphs',
      'advanced_analytics',
      'export_pdf',
      'extended_time_window',
      'ml_predictions',
      'real_time_monitoring',
      'api_access',
      'batch_analysis',
      'scheduled_reports',
    ],
  };

  return tierFeatures[tier] || [];
}

/**
 * Get maximum time window allowed for a tier
 */
export function getMaxTimeWindow(tier: SubscriptionTier): number {
  const maxTimeWindows: Record<SubscriptionTier, number> = {
    free: 30,
    professional: 90,
    enterprise: 180,
  };

  return maxTimeWindows[tier] || 30;
}

/**
 * Upgrade user subscription tier
 */
export async function upgradeUserTier(
  userId: string,
  newTier: SubscriptionTier
): Promise<boolean> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const features = getFeaturesByTier(newTier);
  const maxTimeWindow = getMaxTimeWindow(newTier);

  const { error } = await supabase
    .from('user_subscriptions')
    .upsert({
      user_id: userId,
      tier: newTier,
      features: features,
      usage_limits: {
        analyses_per_month: newTier === 'free' ? 5 : 999999,
        max_time_window_days: maxTimeWindow,
      },
      is_active: true,
    });

  return !error;
}

/**
 * Get subscription promotion message
 */
export function getPromotionMessage(reachedLimit: boolean, currentTier: SubscriptionTier): {
  message: string;
  cta: string;
  upgradeTo?: SubscriptionTier;
} {
  if (!reachedLimit) {
    return {
      message: '',
      cta: '',
    };
  }

  if (currentTier === 'free') {
    return {
      message: 'You\'ve reached your monthly limit of 5 analyses. Upgrade to Professional for unlimited access.',
      cta: 'Upgrade to Professional - RM 499/month',
      upgradeTo: 'professional',
    };
  }

  return {
    message: 'You\'ve reached your monthly limit. Contact us for an Enterprise plan.',
    cta: 'Contact Sales',
    upgradeTo: 'enterprise',
  };
}

