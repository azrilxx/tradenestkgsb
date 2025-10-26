import { NextRequest, NextResponse } from 'next/server';
import { modelScenarios, scenarioTemplates } from '@/lib/analytics/scenario-modeler';

/**
 * POST /api/analytics/scenario
 * Model scenarios for what-if analysis
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { base_data, scenarios, template } = body;

    // If template is provided, use pre-built scenarios
    if (template && scenarioTemplates[template as keyof typeof scenarioTemplates]) {
      const templateData = scenarioTemplates[template as keyof typeof scenarioTemplates];

      if (!base_data) {
        return NextResponse.json(
          { error: 'base_data is required when using template' },
          { status: 400 }
        );
      }

      const parameters = {
        base_data,
        scenarios: templateData.scenarios,
      };

      const analysis = modelScenarios(parameters);
      return NextResponse.json(analysis);
    }

    // Use custom scenarios
    if (!base_data || !scenarios) {
      return NextResponse.json(
        { error: 'base_data and scenarios are required' },
        { status: 400 }
      );
    }

    const parameters = {
      base_data,
      scenarios,
    };

    const analysis = modelScenarios(parameters);
    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Error in POST /api/analytics/scenario:', error);
    return NextResponse.json(
      { error: 'Failed to model scenarios' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/analytics/scenario/templates
 * Get available scenario templates
 */
export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      templates: scenarioTemplates,
    });
  } catch (error) {
    console.error('Error in GET /api/analytics/scenario/templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}
