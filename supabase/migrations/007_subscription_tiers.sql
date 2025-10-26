-- Subscription Management Schema
-- Created: 2025-01-XX
-- Purpose: Enable subscription-based feature gating for Interconnected Intelligence

-- =====================================================
-- ENUM: subscription_tier
-- Defines available subscription tiers
-- =====================================================
CREATE TYPE subscription_tier AS ENUM ('free', 'professional', 'enterprise');

-- =====================================================
-- TABLE: user_subscriptions
-- Tracks user subscription tiers and features
-- =====================================================
CREATE TABLE user_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tier subscription_tier NOT NULL DEFAULT 'free',
  features JSONB NOT NULL DEFAULT '{}',
  usage_limits JSONB NOT NULL DEFAULT '{}',
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX idx_user_subscriptions_user ON user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_tier ON user_subscriptions(tier);
CREATE INDEX idx_user_subscriptions_active ON user_subscriptions(is_active) WHERE is_active = true;

-- =====================================================
-- TABLE: intelligence_analysis_usage
-- Tracks usage of intelligence analysis features
-- =====================================================
CREATE TABLE intelligence_analysis_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  alert_id UUID NOT NULL,
  analysis_type VARCHAR(50) NOT NULL DEFAULT 'connection',
  time_window INTEGER NOT NULL DEFAULT 30,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_intelligence_usage_user ON intelligence_analysis_usage(user_id);
CREATE INDEX idx_intelligence_usage_alert ON intelligence_analysis_usage(alert_id);
CREATE INDEX idx_intelligence_usage_created ON intelligence_analysis_usage(created_at DESC);
CREATE INDEX idx_intelligence_usage_user_created ON intelligence_analysis_usage(user_id, created_at DESC);

-- =====================================================
-- FUNCTION: get_user_subscription_tier
-- Returns the subscription tier for a user
-- =====================================================
CREATE OR REPLACE FUNCTION get_user_subscription_tier(p_user_id UUID)
RETURNS subscription_tier AS $$
DECLARE
  user_tier subscription_tier;
BEGIN
  SELECT tier
  INTO user_tier
  FROM user_subscriptions
  WHERE user_id = p_user_id
    AND is_active = true;
  
  RETURN COALESCE(user_tier, 'free');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION: get_monthly_usage_count
-- Returns the number of analyses used this month
-- =====================================================
CREATE OR REPLACE FUNCTION get_monthly_usage_count(
  p_user_id UUID,
  p_analysis_type VARCHAR DEFAULT 'connection'
)
RETURNS INTEGER AS $$
DECLARE
  usage_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO usage_count
  FROM intelligence_analysis_usage
  WHERE user_id = p_user_id
    AND analysis_type = p_analysis_type
    AND created_at >= date_trunc('month', CURRENT_DATE);
  
  RETURN COALESCE(usage_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION: can_access_feature
-- Checks if user can access a specific feature
-- =====================================================
CREATE OR REPLACE FUNCTION can_access_feature(
  p_user_id UUID,
  p_feature VARCHAR
)
RETURNS BOOLEAN AS $$
DECLARE
  user_tier subscription_tier;
  tier_features JSONB;
BEGIN
  -- Get user's tier
  user_tier := get_user_subscription_tier(p_user_id);
  
  -- Define features by tier
  tier_features := jsonb_build_object(
    'free', jsonb_build_array('basic_list_view', 'basic_analysis'),
    'professional', jsonb_build_array('basic_list_view', 'basic_analysis', 'interactive_graphs', 'advanced_analytics', 'export_pdf', 'extended_time_window'),
    'enterprise', jsonb_build_array('basic_list_view', 'basic_analysis', 'interactive_graphs', 'advanced_analytics', 'export_pdf', 'extended_time_window', 'ml_predictions', 'real_time_monitoring', 'api_access', 'batch_analysis', 'scheduled_reports')
  );
  
  -- Check if feature is available in tier
  RETURN EXISTS (
    SELECT 1
    FROM jsonb_array_elements(tier_features->user_tier::text) AS feature
    WHERE feature = to_jsonb(p_feature)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION: check_usage_limit
-- Checks if user has exceeded their usage limit
-- =====================================================
CREATE OR REPLACE FUNCTION check_usage_limit(
  p_user_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  user_tier subscription_tier;
  usage_count INTEGER;
  tier_limit INTEGER;
BEGIN
  -- Get user's tier
  user_tier := get_user_subscription_tier(p_user_id);
  
  -- Get usage count for this month
  usage_count := get_monthly_usage_count(p_user_id);
  
  -- Define limits by tier
  tier_limit := CASE user_tier
    WHEN 'free' THEN 5
    WHEN 'professional' THEN 999999  -- Unlimited
    WHEN 'enterprise' THEN 999999    -- Unlimited
    ELSE 0
  END;
  
  -- Check if limit exceeded
  RETURN usage_count < tier_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION: get_max_time_window
-- Returns the maximum time window allowed for tier
-- =====================================================
CREATE OR REPLACE FUNCTION get_max_time_window(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  user_tier subscription_tier;
BEGIN
  user_tier := get_user_subscription_tier(p_user_id);
  
  RETURN CASE user_tier
    WHEN 'free' THEN 30
    WHEN 'professional' THEN 90
    WHEN 'enterprise' THEN 180
    ELSE 30
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TRIGGER: update_user_subscriptions_updated_at
-- Auto-update updated_at timestamp
-- =====================================================
CREATE OR REPLACE FUNCTION update_user_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_subscriptions_updated_at
  BEFORE UPDATE ON user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_user_subscriptions_updated_at();

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE intelligence_analysis_usage ENABLE ROW LEVEL SECURITY;

-- Users can read their own subscription data
CREATE POLICY "Users can read own subscription" ON user_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own usage tracking
CREATE POLICY "Users can insert own usage" ON intelligence_analysis_usage
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can read their own usage data
CREATE POLICY "Users can read own usage" ON intelligence_analysis_usage
  FOR SELECT USING (auth.uid() = user_id);

-- =====================================================
-- INITIAL DATA: Create subscriptions for existing users
-- Set all existing users to free tier
-- =====================================================
INSERT INTO user_subscriptions (user_id, tier, features, usage_limits)
SELECT 
  id,
  'free',
  '["basic_list_view", "basic_analysis"]'::jsonb,
  '{"analyses_per_month": 5, "max_time_window_days": 30}'::jsonb
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM user_subscriptions)
ON CONFLICT (user_id) DO NOTHING;

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON TABLE user_subscriptions IS 'User subscription tier and feature access';
COMMENT ON TABLE intelligence_analysis_usage IS 'Tracks usage of intelligence analysis features for billing and limits';
COMMENT ON TYPE subscription_tier IS 'Subscription tiers: free, professional, enterprise';
COMMENT ON FUNCTION get_user_subscription_tier IS 'Returns the current subscription tier for a user';
COMMENT ON FUNCTION get_monthly_usage_count IS 'Returns the number of analyses used this month';
COMMENT ON FUNCTION can_access_feature IS 'Checks if user tier allows access to a specific feature';
COMMENT ON FUNCTION check_usage_limit IS 'Returns true if user has not exceeded usage limit';
COMMENT ON FUNCTION get_max_time_window IS 'Returns the maximum time window (days) allowed for tier';

