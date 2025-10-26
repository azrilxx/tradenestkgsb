import { supabase } from '@/lib/supabase/client';
import { analyzeInterconnectedIntelligence } from '@/lib/analytics/connection-analyzer';

/**
 * Types for real-time updates
 */
export interface ConnectionUpdate {
  type: 'new_connection' | 'risk_change' | 'cascade_update';
  alert_id: string;
  timestamp: string;
  data: {
    connection_id?: string;
    correlation_score?: number;
    risk_change?: number;
    cascade_impact?: number;
  };
}

export type UnsubscribeFunction = () => void;

/**
 * Subscribe to real-time connection updates for a specific alert
 * 
 * @param alertId - The alert ID to monitor
 * @param onUpdate - Callback function for updates
 * @param options - Optional configuration
 * @returns Unsubscribe function
 */
export function subscribeToConnectionUpdates(
  alertId: string,
  onUpdate: (update: ConnectionUpdate) => void,
  options: {
    timeWindow?: number;
    riskThreshold?: number;
  } = {}
): UnsubscribeFunction {
  const { timeWindow = 30, riskThreshold = 80 } = options;

  let previousCascadeImpact = 0;
  let monitoringInterval: NodeJS.Timeout | null = null;

  // Poll for updates every 10 seconds
  monitoringInterval = setInterval(async () => {
    try {
      // Re-analyze connections for this alert
      const intelligence = await analyzeInterconnectedIntelligence(alertId, timeWindow);

      if (!intelligence) {
        return;
      }

      const currentCascadeImpact = intelligence.impact_cascade.cascading_impact;

      // Check if cascade impact has changed significantly
      if (Math.abs(currentCascadeImpact - previousCascadeImpact) > 5) {
        onUpdate({
          type: 'cascade_update',
          alert_id: alertId,
          timestamp: new Date().toISOString(),
          data: {
            cascade_impact: currentCascadeImpact,
            risk_change: currentCascadeImpact - previousCascadeImpact,
          },
        });

        previousCascadeImpact = currentCascadeImpact;
      }

      // Check if risk threshold exceeded
      if (currentCascadeImpact >= riskThreshold && previousCascadeImpact < riskThreshold) {
        onUpdate({
          type: 'risk_change',
          alert_id: alertId,
          timestamp: new Date().toISOString(),
          data: {
            cascade_impact: currentCascadeImpact,
            risk_change: currentCascadeImpact - previousCascadeImpact,
          },
        });
      }

      // Check for new connections
      // This would typically use Supabase real-time subscriptions
      const newConnections = await checkForNewConnections(alertId, timeWindow);
      if (newConnections.length > 0) {
        onUpdate({
          type: 'new_connection',
          alert_id: alertId,
          timestamp: new Date().toISOString(),
          data: {
            connection_id: newConnections[0],
          },
        });
      }
    } catch (error) {
      console.error('Error monitoring connections:', error);
    }
  }, 10000); // Poll every 10 seconds

  // Return unsubscribe function
  return () => {
    if (monitoringInterval) {
      clearInterval(monitoringInterval);
    }
  };
}

/**
 * Subscribe to new anomaly insertions for all alerts
 */
export function subscribeToNewAnomalies(
  onNewAnomaly: (anomaly: any) => void
): UnsubscribeFunction {
  // Subscribe to anomaly table changes
  const channel = supabase
    .channel('new_anomalies')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'anomalies',
      },
      (payload) => {
        onNewAnomaly(payload.new);
      }
    )
    .subscribe();

  // Return unsubscribe function
  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Subscribe to alert risk score changes
 */
export function subscribeToRiskChanges(
  onRiskChange: (update: ConnectionUpdate) => void
): UnsubscribeFunction {
  let monitoringInterval: NodeJS.Timeout | null = null;

  monitoringInterval = setInterval(async () => {
    try {
      // Get recent alerts with anomalies
      const { data: alerts, error } = await supabase
        .from('alerts')
        .select('id, created_at')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching alerts:', error);
        return;
      }

      // Check each alert for risk changes
      for (const alert of alerts || []) {
        const intelligence = await analyzeInterconnectedIntelligence(alert.id, 30);
        if (intelligence) {
          const riskScore = intelligence.risk_assessment.overall_risk;

          // If risk is high, send notification
          if (riskScore >= 80) {
            onRiskChange({
              type: 'risk_change',
              alert_id: alert.id,
              timestamp: new Date().toISOString(),
              data: {
                cascade_impact: intelligence.impact_cascade.cascading_impact,
                risk_change: riskScore,
              },
            });
          }
        }
      }
    } catch (error) {
      console.error('Error monitoring risk changes:', error);
    }
  }, 30000); // Poll every 30 seconds

  return () => {
    if (monitoringInterval) {
      clearInterval(monitoringInterval);
    }
  };
}

/**
 * Helper: Check for new connections to an alert
 */
async function checkForNewConnections(alertId: string, timeWindow: number): Promise<string[]> {
  try {
    const intelligence = await analyzeInterconnectedIntelligence(alertId, timeWindow);
    if (!intelligence) {
      return [];
    }

    // Return IDs of connected factors
    return intelligence.connected_factors.map((factor) => factor.id);
  } catch (error) {
    console.error('Error checking for new connections:', error);
    return [];
  }
}

/**
 * Get current connection status for an alert
 */
export async function getConnectionStatus(alertId: string, timeWindow: number = 30) {
  try {
    const intelligence = await analyzeInterconnectedIntelligence(alertId, timeWindow);

    if (!intelligence) {
      return {
        status: 'no_data',
        message: 'No intelligence data available for this alert',
      };
    }

    const riskScore = intelligence.risk_assessment.overall_risk;
    const cascadeImpact = intelligence.impact_cascade.cascading_impact;
    const totalConnections = intelligence.impact_cascade.total_factors;

    let status: 'stable' | 'monitoring' | 'critical' | 'warning';
    let message: string;

    if (riskScore >= 80 || cascadeImpact >= 80) {
      status = 'critical';
      message = 'Critical cascade risk detected. Immediate attention required.';
    } else if (riskScore >= 60 || cascadeImpact >= 60) {
      status = 'warning';
      message = 'Elevated cascade risk. Monitor closely.';
    } else if (totalConnections > 0) {
      status = 'monitoring';
      message = 'Active connections detected. Continuing monitoring.';
    } else {
      status = 'stable';
      message = 'No active connections detected. Risk level is stable.';
    }

    return {
      status,
      message,
      risk_score: riskScore,
      cascade_impact: cascadeImpact,
      total_connections: totalConnections,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error getting connection status:', error);
    return {
      status: 'error',
      message: 'Failed to retrieve connection status',
    };
  }
}

/**
 * Batch subscribe to multiple alerts at once
 */
export function subscribeToMultipleAlerts(
  alertIds: string[],
  onUpdate: (alertId: string, update: ConnectionUpdate) => void,
  options: {
    timeWindow?: number;
    riskThreshold?: number;
  } = {}
): UnsubscribeFunction {
  const unsubscribes: UnsubscribeFunction[] = [];

  // Subscribe to each alert
  alertIds.forEach((alertId) => {
    const unsubscribe = subscribeToConnectionUpdates(
      alertId,
      (update) => onUpdate(alertId, update),
      options
    );
    unsubscribes.push(unsubscribe);
  });

  // Return combined unsubscribe function
  return () => {
    unsubscribes.forEach((unsubscribe) => unsubscribe());
  };
}

