-- Migration: Create intelligence webhook subscriptions table
-- Date: January 2025

-- Create intelligence webhook subscriptions table
CREATE TABLE IF NOT EXISTS intelligence_webhook_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  webhook_url TEXT NOT NULL,
  alert_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  filters JSONB DEFAULT '{}'::jsonb,
  time_window INTEGER DEFAULT 30,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_triggered_at TIMESTAMPTZ,
  trigger_count INTEGER DEFAULT 0,
  
  -- Ensure user can only subscribe to their own content
  CONSTRAINT valid_webhook_url CHECK (webhook_url ~* '^https?://.+'),
  CONSTRAINT valid_alert_ids CHECK (jsonb_typeof(alert_ids) = 'array')
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_webhook_subscriptions_user_id 
  ON intelligence_webhook_subscriptions(user_id);

CREATE INDEX IF NOT EXISTS idx_webhook_subscriptions_active 
  ON intelligence_webhook_subscriptions(is_active) 
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_webhook_subscriptions_created 
  ON intelligence_webhook_subscriptions(created_at DESC);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_intelligence_webhook_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_intelligence_webhook_subscriptions_updated_at
  BEFORE UPDATE ON intelligence_webhook_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_intelligence_webhook_updated_at();

-- Enable RLS
ALTER TABLE intelligence_webhook_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can only see their own subscriptions
CREATE POLICY "Users can view their own webhook subscriptions"
  ON intelligence_webhook_subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only create subscriptions for themselves
CREATE POLICY "Users can create their own webhook subscriptions"
  ON intelligence_webhook_subscriptions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can only update their own subscriptions
CREATE POLICY "Users can update their own webhook subscriptions"
  ON intelligence_webhook_subscriptions
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can only delete their own subscriptions
CREATE POLICY "Users can delete their own webhook subscriptions"
  ON intelligence_webhook_subscriptions
  FOR DELETE
  USING (auth.uid() = user_id);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON intelligence_webhook_subscriptions TO authenticated;

COMMENT ON TABLE intelligence_webhook_subscriptions IS 'Webhook subscriptions for real-time interconnection intelligence updates';
COMMENT ON COLUMN intelligence_webhook_subscriptions.webhook_url IS 'URL to receive webhook notifications';
COMMENT ON COLUMN intelligence_webhook_subscriptions.alert_ids IS 'Array of alert IDs to monitor';
COMMENT ON COLUMN intelligence_webhook_subscriptions.filters IS 'JSON object with filter criteria (min_risk, min_correlation, etc.)';
COMMENT ON COLUMN intelligence_webhook_subscriptions.time_window IS 'Time window in days for analysis';
COMMENT ON COLUMN intelligence_webhook_subscriptions.last_triggered_at IS 'Timestamp of last webhook notification';
COMMENT ON COLUMN intelligence_webhook_subscriptions.trigger_count IS 'Total number of times webhook has been triggered';

