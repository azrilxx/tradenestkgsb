-- FMM Association Portal Database Schema
-- Created: January 2025
-- Purpose: Multi-tenant association management for FMM partnership

-- =====================================================
-- TABLE: associations
-- Stores association/organization information
-- =====================================================
CREATE TABLE associations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL UNIQUE,
  sector VARCHAR(100) NOT NULL, -- Steel, Electronics, Chemicals, etc.
  member_count INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'active', -- active, pending, archived
  description TEXT,
  admin_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_associations_sector ON associations(sector);
CREATE INDEX idx_associations_status ON associations(status);
CREATE INDEX idx_associations_admin ON associations(admin_user_id);

-- =====================================================
-- TABLE: association_members
-- Links users to associations with roles
-- =====================================================
CREATE TYPE member_role AS ENUM ('admin', 'member', 'viewer');
CREATE TYPE member_status AS ENUM ('active', 'pending', 'inactive');

CREATE TABLE association_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  association_id UUID NOT NULL REFERENCES associations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role member_role DEFAULT 'member',
  status member_status DEFAULT 'active',
  permissions JSONB DEFAULT '{}', -- Additional permissions
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(association_id, user_id)
);

CREATE INDEX idx_members_association ON association_members(association_id);
CREATE INDEX idx_members_user ON association_members(user_id);
CREATE INDEX idx_members_role ON association_members(role);
CREATE INDEX idx_members_status ON association_members(status);

-- =====================================================
-- TABLE: shared_watchlists
-- HS codes monitored by association
-- =====================================================
CREATE TABLE shared_watchlists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  association_id UUID NOT NULL REFERENCES associations(id) ON DELETE CASCADE,
  hs_codes TEXT[] NOT NULL, -- Array of HS codes
  alert_types TEXT[] DEFAULT '{}', -- Price spike, tariff change, etc.
  watchlist_name VARCHAR(255) NOT NULL,
  description TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_watchlist_association ON shared_watchlists(association_id);
CREATE INDEX idx_watchlist_created_by ON shared_watchlists(created_by);

-- =====================================================
-- TABLE: group_alerts
-- Alerts broadcast to all association members
-- =====================================================
CREATE TYPE alert_broadcast_type AS ENUM ('info', 'warning', 'critical', 'sector_update');

CREATE TABLE group_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  association_id UUID NOT NULL REFERENCES associations(id) ON DELETE CASCADE,
  alert_type alert_broadcast_type NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  hs_codes TEXT[],
  affected_products JSONB,
  broadcast_to_all BOOLEAN DEFAULT true,
  priority VARCHAR(50) DEFAULT 'medium', -- low, medium, high, urgent
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  read_by JSONB DEFAULT '[]', -- Array of user IDs who read the alert
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_group_alerts_association ON group_alerts(association_id);
CREATE INDEX idx_group_alerts_type ON group_alerts(alert_type);
CREATE INDEX idx_group_alerts_created ON group_alerts(created_at DESC);
CREATE INDEX idx_group_alerts_expires ON group_alerts(expires_at);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================
ALTER TABLE associations ENABLE ROW LEVEL SECURITY;
ALTER TABLE association_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_watchlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_alerts ENABLE ROW LEVEL SECURITY;

-- Associations: Members can view their associations
CREATE POLICY "Members can view their associations" ON associations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM association_members
      WHERE association_members.association_id = associations.id
        AND association_members.user_id = auth.uid()
        AND association_members.status = 'active'
    )
  );

-- Association Members: Users can view their own memberships
CREATE POLICY "Users can view their memberships" ON association_members
  FOR SELECT USING (user_id = auth.uid());

-- Shared Watchlists: Members can view association watchlists
CREATE POLICY "Members can view association watchlists" ON shared_watchlists
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM association_members
      WHERE association_members.association_id = shared_watchlists.association_id
        AND association_members.user_id = auth.uid()
        AND association_members.status = 'active'
    )
  );

-- Group Alerts: Members can view association alerts
CREATE POLICY "Members can view association alerts" ON group_alerts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM association_members
      WHERE association_members.association_id = group_alerts.association_id
        AND association_members.user_id = auth.uid()
        AND association_members.status = 'active'
    )
  );

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Update member count for association
CREATE OR REPLACE FUNCTION update_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE associations SET member_count = member_count + 1 WHERE id = NEW.association_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE associations SET member_count = GREATEST(0, member_count - 1) WHERE id = OLD.association_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_member_count
  AFTER INSERT OR DELETE ON association_members
  FOR EACH ROW EXECUTE FUNCTION update_member_count();

-- =====================================================
-- INSERT SAMPLE FMM ASSOCIATIONS
-- =====================================================

-- Note: These will be populated by the API/data seeding
-- Sample associations based on FMM sectors:
-- - Steel & Metals Association
-- - Electronics & Electrical Association
-- - Chemicals & Petrochemicals Association
-- - Food & Beverage Association
-- - Textiles & Apparel Association
-- - Automotive & Parts Association

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON TABLE associations IS 'FMM sector associations and organizations';
COMMENT ON TABLE association_members IS 'User membership in associations';
COMMENT ON TABLE shared_watchlists IS 'HS codes monitored by associations';
COMMENT ON TABLE group_alerts IS 'Alerts broadcast to all association members';

