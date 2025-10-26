// app/api/rules/test/route.ts
// Custom Rule Testing API

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';
import { RuleEvaluator } from '@/lib/rules-engine/evaluator';

const supabase = createClient();

// POST /api/rules/test - Test a custom rule against historical data
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { rule_logic, context = {} } = body;

    if (!rule_logic) {
      return NextResponse.json({ error: 'Rule logic is required' }, { status: 400 });
    }

    // Validate rule logic structure
    if (!validateRuleLogic(rule_logic)) {
      return NextResponse.json({ error: 'Invalid rule logic structure' }, { status: 400 });
    }

    // Create rule evaluator
    const evaluator = new RuleEvaluator(supabase);

    // Test the rule
    const testResult = await evaluator.testRule(rule_logic, context);

    // Store execution record
    await supabase
      .from('rule_executions')
      .insert({
        rule_id: null, // No rule ID for test runs
        matches_found: testResult.matches.length,
        anomalies_created: 0, // Test runs don't create anomalies
        execution_time_ms: testResult.execution_time_ms,
        metadata: {
          test_run: true,
          context,
          rule_logic
        }
      });

    return NextResponse.json({
      success: true,
      ...testResult,
      sample_matches: testResult.matches.slice(0, 5) // Return first 5 matches as samples
    });
  } catch (error) {
    console.error('Error testing rule:', error);
    return NextResponse.json({ 
      error: 'Rule testing failed', 
      details: error.message 
    }, { status: 500 });
  }
}

// Validate rule logic structure
function validateRuleLogic(logic_json: any): boolean {
  try {
    // Check if required fields exist
    if (!logic_json.conditions || !Array.isArray(logic_json.conditions)) {
      return false;
    }

    if (!logic_json.logic || !['AND', 'OR'].includes(logic_json.logic)) {
      return false;
    }

    // Validate each condition
    for (const condition of logic_json.conditions) {
      if (!condition.field || !condition.operator || condition.value === undefined) {
        return false;
      }

      // Validate operator
      const validOperators = ['>', '<', '>=', '<=', '==', '!=', 'BETWEEN', 'CONTAINS'];
      if (!validOperators.includes(condition.operator)) {
        return false;
      }

      // Validate BETWEEN operator has array value
      if (condition.operator === 'BETWEEN' && (!Array.isArray(condition.value) || condition.value.length !== 2)) {
        return false;
      }
    }

    return true;
  } catch (error) {
    return false;
  }
}
