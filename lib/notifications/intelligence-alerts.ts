import { supabase } from '@/lib/supabase/client';
import { analyzeInterconnectedIntelligence } from '@/lib/analytics/connection-analyzer';
import { predictCascadeLikelihood } from '@/lib/ml/cascade-predictor';

/**
 * Email notification interface
 */
export interface NotificationConfig {
  recipient_email: string;
  alert_types: string[];
  risk_threshold: number;
  cascade_threshold: number;
  frequency: 'immediate' | 'daily' | 'weekly';
}

export interface NotificationData {
  type: 'new_connection' | 'high_risk' | 'daily_digest' | 'weekly_summary';
  alert_id: string;
  severity: string;
  message: string;
  details: any;
  timestamp: string;
}

/**
 * Send email notification
 * Note: In production, integrate with email service (SendGrid, AWS SES, etc.)
 */
export async function sendNotification(
  recipientEmail: string,
  notification: NotificationData
): Promise<void> {
  try {
    // In production, implement actual email sending here
    console.log('📧 Email notification:', {
      to: recipientEmail,
      type: notification.type,
      alert_id: notification.alert_id,
      message: notification.message,
    });

    // For now, log to console
    // In production: await emailService.send(recipientEmail, notification);
  } catch (error) {
    console.error('Error sending notification:', error);
  }
}

/**
 * Check and send notifications for high-risk alerts
 */
export async function checkHighRiskAlerts(
  userId: string,
  config: NotificationConfig
): Promise<void> {
  try {
    // Get recent alerts for this user
    const { data: alerts, error } = await supabase
      .from('alerts')
      .select('id, created_at, user_id')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error || !alerts) {
      return;
    }

    // Check each alert for high risk
    for (const alert of alerts) {
      const intelligence = await analyzeInterconnectedIntelligence(alert.id, 30);

      if (!intelligence) {
        continue;
      }

      const riskScore = intelligence.risk_assessment.overall_risk;
      const cascadeImpact = intelligence.impact_cascade.cascading_impact;

      // Check if alert exceeds thresholds
      if (
        riskScore >= config.risk_threshold ||
        cascadeImpact >= config.cascade_threshold
      ) {
        await sendNotification(config.recipient_email, {
          type: 'high_risk',
          alert_id: alert.id,
          severity: 'high',
          message: `Alert ${alert.id.substring(0, 8)} has exceeded risk thresholds`,
          details: {
            risk_score: riskScore,
            cascade_impact: cascadeImpact,
            recommendations: intelligence.recommended_actions,
          },
          timestamp: new Date().toISOString(),
        });
      }
    }
  } catch (error) {
    console.error('Error checking high-risk alerts:', error);
  }
}

/**
 * Send daily digest of connection changes
 */
export async function sendDailyDigest(
  userId: string,
  recipientEmail: string
): Promise<void> {
  try {
    const { data: alerts, error } = await supabase
      .from('alerts')
      .select('id, created_at, user_id')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error || !alerts) {
      return;
    }

    const changes = [];

    for (const alert of alerts) {
      const intelligence = await analyzeInterconnectedIntelligence(alert.id, 30);
      if (intelligence) {
        changes.push({
          alert_id: alert.id,
          cascade_impact: intelligence.impact_cascade.cascading_impact,
          total_connections: intelligence.impact_cascade.total_factors,
          risk_score: intelligence.risk_assessment.overall_risk,
        });
      }
    }

    if (changes.length > 0) {
      await sendNotification(recipientEmail, {
        type: 'daily_digest',
        alert_id: 'daily',
        severity: 'info',
        message: `Daily intelligence digest: ${changes.length} alerts analyzed`,
        details: {
          alert_count: changes.length,
          changes,
        },
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error('Error sending daily digest:', error);
  }
}

/**
 * Send weekly summary report
 */
export async function sendWeeklySummary(
  userId: string,
  recipientEmail: string
): Promise<void> {
  try {
    const { data: alerts, error } = await supabase
      .from('alerts')
      .select('id, created_at, user_id')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error || !alerts) {
      return;
    }

    const analyses = [];

    for (const alert of alerts) {
      const intelligence = await analyzeInterconnectedIntelligence(alert.id, 30);
      if (intelligence) {
        analyses.push({
          alert_id: alert.id,
          risk_score: intelligence.risk_assessment.overall_risk,
          cascade_impact: intelligence.impact_cascade.cascading_impact,
          connections: intelligence.impact_cascade.total_factors,
        });
      }
    }

    // Calculate summary statistics
    const avgRisk = analyses.reduce((sum, a) => sum + a.risk_score, 0) / analyses.length;
    const maxRisk = Math.max(...analyses.map(a => a.risk_score));
    const totalConnections = analyses.reduce((sum, a) => sum + a.connections, 0);
    const highRiskAlerts = analyses.filter(a => a.risk_score >= 70).length;

    await sendNotification(recipientEmail, {
      type: 'weekly_summary',
      alert_id: 'weekly',
      severity: 'info',
      message: 'Weekly intelligence summary report',
      details: {
        total_alerts: analyses.length,
        average_risk_score: Math.round(avgRisk),
        max_risk_score: maxRisk,
        total_connections: totalConnections,
        high_risk_alerts: highRiskAlerts,
        trends: 'Stable', // Would calculate actual trends
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error sending weekly summary:', error);
  }
}

/**
 * Send notification when new connections are detected
 */
export async function sendNewConnectionNotification(
  alertId: string,
  connectionData: any,
  recipientEmail: string
): Promise<void> {
  await sendNotification(recipientEmail, {
    type: 'new_connection',
    alert_id: alertId,
    severity: 'info',
    message: `New connection detected for alert ${alertId.substring(0, 8)}`,
    details: connectionData,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Send ML prediction notification
 */
export async function sendPredictionNotification(
  alertId: string,
  prediction: any,
  recipientEmail: string
): Promise<void> {
  const severity = prediction.likelihood_score >= 80 ? 'critical' : 'warning';

  await sendNotification(recipientEmail, {
    type: 'high_risk',
    alert_id: alertId,
    severity,
    message: `Cascade prediction: ${prediction.likelihood_score}% likelihood`,
    details: {
      predicted_impact: prediction.predicted_impact,
      time_to_cascade: prediction.time_to_cascade_days,
      confidence: prediction.confidence_interval,
      risk_factors: prediction.risk_factors,
      recommendations: prediction.mitigation_recommendations,
    },
    timestamp: new Date().toISOString(),
  });
}

/**
 * Setup notification preferences for a user
 */
export async function setupNotificationPreferences(
  userId: string,
  config: NotificationConfig
): Promise<void> {
  try {
    // In production, store in database
    console.log('Setting up notification preferences:', { userId, config });
    // await supabase.from('notification_preferences').upsert({ user_id: userId, config });
  } catch (error) {
    console.error('Error setting up notification preferences:', error);
  }
}

/**
 * Scheduled task runner for notifications
 * Should be run via cron job or background worker
 */
export async function runScheduledNotifications(): Promise<void> {
  try {
    // Get all users who want notifications
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email');

    if (error || !users) {
      return;
    }

    const now = new Date();
    const hour = now.getHours();

    for (const user of users) {
      // Get user's preferences (in production, from database)
      const config: NotificationConfig = {
        recipient_email: user.email,
        alert_types: ['all'],
        risk_threshold: 70,
        cascade_threshold: 70,
        frequency: 'daily',
      };

      // Check high-risk alerts immediately
      await checkHighRiskAlerts(user.id, config);

      // Send daily digest at 8 AM
      if (hour === 8) {
        await sendDailyDigest(user.id, user.email);
      }

      // Send weekly summary on Mondays at 9 AM
      if (now.getDay() === 1 && hour === 9) {
        await sendWeeklySummary(user.id, user.email);
      }
    }
  } catch (error) {
    console.error('Error running scheduled notifications:', error);
  }
}

