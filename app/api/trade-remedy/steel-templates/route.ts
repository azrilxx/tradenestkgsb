// API Route for Steel-Specific Trade Remedy Templates
// Task 1.3: API endpoint to access steel templates

import { NextResponse } from 'next/server';
import {
  getAllSteelTemplates,
  getSteelTemplateById
} from '@/lib/trade-remedy/steel-specific-templates';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      // Return specific template by ID
      const template = getSteelTemplateById(id);

      if (!template) {
        return NextResponse.json(
          { error: 'Template not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        template,
      });
    }

    // Return all steel templates
    const templates = getAllSteelTemplates();

    return NextResponse.json({
      success: true,
      templates,
      count: templates.length,
    });
  } catch (error) {
    console.error('Error fetching steel templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch steel templates' },
      { status: 500 }
    );
  }
}

