import { NextResponse } from 'next/server';
import { generateAllAlerts, getAlertStatistics } from '@/lib/anomaly-detection/alert-generator';
import { createClient } from '@/lib/supabase/client';
import { RuleEvaluator } from '@/lib/rules-engine/evaluator';

const supabase = createClient();

/**
 * Run custom rules detection
 */
async function runCustomRulesDetection() {
  try {
    console.log('🔧 Running custom rules detection...');
    
    // Get all active custom rules
    const { data: rules, error: rulesError } = await supabase
      .from('custom_rules')
      .select('*')
      .eq('active', true);

    if (rulesError) {
      console.error('Error fetching custom rules:', rulesError);
      return { alertsCreated: 0, rulesExecuted: 0, errors: [] };
    }

    if (!rules || rules.length === 0) {
      console.log('No active custom rules found');
      return { alertsCreated: 0, rulesExecuted: 0, errors: [] };
    }

    const evaluator = new RuleEvaluator(supabase);
    let totalAlertsCreated = 0;
    const errors: string[] = [];

    // Execute each custom rule
    for (const rule of rules) {
      try {
        console.log(`Executing rule: ${rule.name}`);
        const startTime = Date.now();
        
        // Evaluate the rule
        const matches = await evaluator.evaluateRule(rule.logic_json);
        const executionTime = Date.now() - startTime;
        
        // Create anomalies for matches
        let alertsCreated = 0;
        for (const match of matches) {
          try {
            // Create anomaly record
            const { data: anomaly, error: anomalyError } = await supabase
              .from('anomalies')
              .insert({
                product_id: match.product_id,
                type: rule.logic_json.alert_type || 'CUSTOM_PATTERN',
                severity: match.severity,
                description: `Custom rule "${rule.name}" triggered: ${match.matched_conditions.join(', ')}`,
                metadata: {
                  rule_id: rule.id,
                  rule_name: rule.name,
                  matched_conditions: match.matched_conditions,
                  custom_rule: true,
                  ...match.metadata
                }
              })
              .select()
              .single();

            if (anomalyError) {
              console.error(`Error creating anomaly for rule ${rule.name}:`, anomalyError);
              errors.push(`Failed to create anomaly for rule ${rule.name}`);
              continue;
            }

            // Create alert record
            const { error: alertError } = await supabase
              .from('alerts')
              .insert({
                anomaly_id: anomaly.id,
                status: 'new'
              });

            if (alertError) {
              console.error(`Error creating alert for rule ${rule.name}:`, alertError);
              errors.push(`Failed to create alert for rule ${rule.name}`);
            } else {
              alertsCreated++;
            }
          } catch (error) {
            console.error(`Error processing match for rule ${rule.name}:`, error);
            errors.push(`Error processing match for rule ${rule.name}`);
          }
        }

        // Record execution
        await supabase
          .from('rule_executions')
          .insert({
            rule_id: rule.id,
            matches_found: matches.length,
            anomalies_created: alertsCreated,
            execution_time_ms: executionTime,
            metadata: {
              rule_name: rule.name,
              execution_type: 'scheduled'
            }
          });

        totalAlertsCreated += alertsCreated;
        console.log(`Rule "${rule.name}" completed: ${matches.length} matches, ${alertsCreated} alerts created`);
        
      } catch (error) {
        console.error(`Error executing rule ${rule.name}:`, error);
        errors.push(`Failed to execute rule ${rule.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    console.log(`Custom rules detection completed: ${totalAlertsCreated} alerts created from ${rules.length} rules`);
    
    return {
      alertsCreated: totalAlertsCreated,
      rulesExecuted: rules.length,
      errors
    };
  } catch (error) {
    console.error('Error in custom rules detection:', error);
    return {
      alertsCreated: 0,
      rulesExecuted: 0,
      errors: [`Custom rules detection failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
    };
  }
}

/**
 * POST /api/detect - Run anomaly detection and generate alerts
 */
export async function POST() {
  try {
    console.log('🔍 Detection API called...');
    
    // Run standard anomaly detection
    const result = await generateAllAlerts();
    
    // Run custom rules detection
    const customRulesResult = await runCustomRulesDetection();
    
    return NextResponse.json({
      success: result.success,
      message: `Detection complete. ${result.alertsCreated} standard alerts created, ${customRulesResult.alertsCreated} custom rule alerts created.`,
      data: {
        ...result,
        customRules: customRulesResult
      },
    });
  } catch (error) {
    console.error('Detection API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Detection failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/detect - Get detection statistics
 */
export async function GET() {
  try {
    const stats = await getAlertStatistics();

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Stats API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get statistics',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}