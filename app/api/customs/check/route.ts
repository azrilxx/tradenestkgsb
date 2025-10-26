import { NextResponse } from 'next/server';
import { parseCSV, parseJSON, analyzeDeclarations } from '@/lib/customs-declaration/parser';
import { checkCompliance } from '@/lib/customs-declaration/compliance-checker';
import { getServerUser } from '@/lib/supabase/server';

/**
 * POST /api/customs/check - Check customs declaration compliance
 */
export async function POST(request: Request) {
  try {
    const user = await getServerUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { declarations, format, benchmark_data } = body;

    if (!declarations || declarations.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Declarations are required' },
        { status: 400 }
      );
    }

    let parsedDeclarations;

    // Parse based on format
    if (format === 'csv' && typeof declarations === 'string') {
      parsedDeclarations = parseCSV(declarations);
    } else if (format === 'json' || Array.isArray(declarations)) {
      parsedDeclarations = parseJSON(declarations);
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid format. Use CSV or JSON' },
        { status: 400 }
      );
    }

    if (!parsedDeclarations || parsedDeclarations.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid declarations found' },
        { status: 400 }
      );
    }

    // Analyze declarations
    const analysis = analyzeDeclarations(parsedDeclarations);

    // Check compliance
    // Convert benchmark_data to Map<string, number>
    let benchmarkMap: Map<string, number> | undefined;
    if (benchmark_data && typeof benchmark_data === 'object') {
      const entries: [string, number][] = Object.entries(benchmark_data).map(([key, value]) => [
        key,
        typeof value === 'number' ? value : parseFloat(String(value)) || 0,
      ] as [string, number]);
      benchmarkMap = new Map(entries);
    }
    
    const complianceResult = checkCompliance(parsedDeclarations, benchmarkMap);

    return NextResponse.json({
      success: true,
      data: {
        analysis,
        compliance: complianceResult,
      },
    });
  } catch (error) {
    console.error('Customs check error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check compliance' },
      { status: 500 }
    );
  }
}

