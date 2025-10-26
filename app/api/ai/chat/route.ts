import { NextRequest } from 'next/server';
import { riskAnalyst } from '@/lib/ai';
import { createClient } from '@/lib/supabase/client';

/**
 * POST /api/ai/chat
 *
 * AI chat endpoint with streaming responses
 * Allows natural language queries about TradeNest data
 */
export async function POST(request: NextRequest) {
  try {
    const { query, includeContext } = await request.json();

    if (!query) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: query' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    let context = undefined;

    // Optionally fetch context from database
    if (includeContext) {
      const supabase = createClient();

      const [companiesRes, alertsRes] = await Promise.all([
        supabase.from('companies').select('*').limit(50),
        supabase.from('alerts').select('*').limit(50),
      ]);

      context = {
        companies: companiesRes.data || [],
        alerts: alertsRes.data || [],
      };
    }

    // Generate streaming response
    const result = await riskAnalyst.streamAnswer(query, context);

    // Return as Server-Sent Events stream
    return result.toTextStreamResponse();
  } catch (error) {
    console.error('AI chat error:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to process query',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
