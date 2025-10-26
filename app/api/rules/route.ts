// app/api/rules/route.ts
// Custom Rules Management API

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';
import { RuleEvaluator } from '@/lib/rules-engine/evaluator';

const supabase = createClient();

// GET /api/rules - List all custom rules
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const active = searchParams.get('active');
    const user_id = searchParams.get('user_id') || 'default-user'; // Mock user for demo

    let query = supabase
      .from('custom_rules')
      .select('*')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false });

    if (active !== null) {
      query = query.eq('active', active === 'true');
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching rules:', error);
      return NextResponse.json({ error: 'Failed to fetch rules' }, { status: 500 });
    }

    // Get performance stats for each rule
    const rulesWithStats = await Promise.all(
      data.map(async (rule) => {
        const { data: stats } = await supabase
          .from('rule_executions')
          .select('matches_found, anomalies_created, execution_time_ms, executed_at')
          .eq('rule_id', rule.id)
          .order('executed_at', { ascending: false })
          .limit(10);

        const performance = stats && stats.length > 0 ? {
          total_executions: stats.length,
          avg_matches_found: stats.reduce((sum, s) => sum + (s.matches_found || 0), 0) / stats.length,
          avg_execution_time_ms: stats.reduce((sum, s) => sum + (s.execution_time_ms || 0), 0) / stats.length,
          total_anomalies_created: stats.reduce((sum, s) => sum + (s.anomalies_created || 0), 0),
          last_execution: stats[0]?.executed_at
        } : {
          total_executions: 0,
          avg_matches_found: 0,
          avg_execution_time_ms: 0,
          total_anomalies_created: 0,
          last_execution: null
        };

        return {
          ...rule,
          performance
        };
      })
    );

    return NextResponse.json({ rules: rulesWithStats });
  } catch (error) {
    console.error('Error in GET /api/rules:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/rules - Create a new custom rule
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, logic_json, alert_type, severity } = body;

    // Validate required fields
    if (!name || !logic_json) {
      return NextResponse.json({ error: 'Name and logic_json are required' }, { status: 400 });
    }

    // Validate rule logic structure
    if (!validateRuleLogic(logic_json)) {
      return NextResponse.json({ error: 'Invalid rule logic structure' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('custom_rules')
      .insert({
        name,
        description: description || '',
        logic_json,
        alert_type: alert_type || 'CUSTOM_PATTERN',
        severity: severity || 'medium',
        user_id: 'default-user', // Mock user for demo
        active: true
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating rule:', error);
      return NextResponse.json({ error: 'Failed to create rule' }, { status: 500 });
    }

    return NextResponse.json({ rule: data }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/rules:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/rules - Update an existing custom rule
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, description, logic_json, alert_type, severity, active } = body;

    if (!id) {
      return NextResponse.json({ error: 'Rule ID is required' }, { status: 400 });
    }

    // Validate rule logic structure if provided
    if (logic_json && !validateRuleLogic(logic_json)) {
      return NextResponse.json({ error: 'Invalid rule logic structure' }, { status: 400 });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (logic_json !== undefined) updateData.logic_json = logic_json;
    if (alert_type !== undefined) updateData.alert_type = alert_type;
    if (severity !== undefined) updateData.severity = severity;
    if (active !== undefined) updateData.active = active;

    const { data, error } = await supabase
      .from('custom_rules')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating rule:', error);
      return NextResponse.json({ error: 'Failed to update rule' }, { status: 500 });
    }

    return NextResponse.json({ rule: data });
  } catch (error) {
    console.error('Error in PUT /api/rules:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/rules - Delete a custom rule
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Rule ID is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('custom_rules')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting rule:', error);
      return NextResponse.json({ error: 'Failed to delete rule' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Rule deleted successfully' });
  } catch (error) {
    console.error('Error in DELETE /api/rules:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
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
