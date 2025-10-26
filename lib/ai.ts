/**
 * OpenRouter AI Integration
 *
 * This module provides AI-powered features for TradeNest using OpenRouter.
 * OpenRouter provides access to multiple AI models through a single API.
 */

import { openai } from '@ai-sdk/openai';
import { generateText, streamText } from 'ai';

// Configure OpenAI provider to use OpenRouter
const openrouterClient = openai({
  apiKey: process.env.OPENAI_API_KEY, // Uses OpenRouter key (sk-or-v1-...)
  baseURL: 'https://openrouter.ai/api/v1',
  defaultHeaders: {
    'HTTP-Referer': process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3005',
    'X-Title': 'TradeNest AI Assistant',
  },
});

/**
 * AI-powered risk analyst specialized in trade-based money laundering detection
 */
export const riskAnalyst = {
  /**
   * Explain why an alert was triggered in plain language
   */
  async explainAlert(alert: {
    id: string;
    type: string;
    severity: 'high' | 'medium' | 'low';
    companyName: string;
    description: string;
    shipmentDetails?: any;
  }) {
    const { text } = await generateText({
      model: openrouterClient('openai/gpt-4-turbo'),
      system: `You are a trade-based money laundering (TBML) expert helping compliance officers understand risk alerts.

Your role:
- Explain alerts in clear, professional language
- Identify specific red flags in the transaction
- Suggest concrete next steps for investigation
- Reference Malaysian compliance regulations where relevant

Keep explanations concise (3-5 sentences) and actionable.`,
      prompt: `Explain this TBML alert:

Type: ${alert.type}
Severity: ${alert.severity}
Company: ${alert.companyName}
Description: ${alert.description}
${alert.shipmentDetails ? `Shipment Details: ${JSON.stringify(alert.shipmentDetails, null, 2)}` : ''}

Provide:
1. What triggered this alert
2. Why it's suspicious
3. Recommended investigation steps`,
    });

    return text;
  },

  /**
   * Analyze a company's risk profile based on their data
   */
  async analyzeCompany(company: {
    name: string;
    country: string;
    type: 'importer' | 'exporter';
    sector: string;
    recentShipments?: any[];
    products?: string[];
  }) {
    const { text } = await generateText({
      model: openrouterClient('openai/gpt-4-turbo'),
      system: `You are a trade compliance analyst assessing companies for trade-based money laundering risk.

Analyze companies based on:
- Industry sector risk levels
- Geographic risk (high-risk jurisdictions)
- Trade patterns and anomalies
- Product types (dual-use goods, commodities, luxury items)

Provide a risk score (Low/Medium/High) and specific justification.`,
      prompt: `Analyze this company's TBML risk profile:

Company: ${company.name}
Country: ${company.country}
Type: ${company.type}
Sector: ${company.sector}
${company.products ? `Products: ${company.products.join(', ')}` : ''}
${company.recentShipments ? `Recent Shipments: ${company.recentShipments.length}` : ''}

Provide:
1. Overall Risk Score (Low/Medium/High)
2. Key risk factors
3. Recommended monitoring approach`,
    });

    return text;
  },

  /**
   * Answer natural language questions about TradeNest data
   */
  async answerQuery(query: string, context?: {
    companies?: any[];
    alerts?: any[];
    shipments?: any[];
  }) {
    const contextStr = context ? `

Available Data:
${context.companies ? `- ${context.companies.length} companies` : ''}
${context.alerts ? `- ${context.alerts.length} alerts` : ''}
${context.shipments ? `- ${context.shipments.length} shipments` : ''}

Detailed Context:
${JSON.stringify(context, null, 2)}` : '';

    const { text } = await generateText({
      model: openrouterClient('openai/gpt-4-turbo'),
      system: `You are TradeNest AI Assistant, helping users analyze trade-based money laundering data.

Your capabilities:
- Analyze trade patterns for suspicious activity
- Explain money laundering techniques
- Provide compliance recommendations
- Interpret Malaysian trade regulations

Be specific, cite data from the context provided, and give actionable insights.`,
      prompt: `${query}${contextStr}`,
    });

    return text;
  },

  /**
   * Generate a streaming response for chat interactions
   */
  streamAnswer(query: string, context?: any) {
    return streamText({
      model: openrouterClient('openai/gpt-4-turbo'),
      system: `You are TradeNest AI Assistant, a trade compliance expert specializing in Malaysian trade and money laundering detection.`,
      prompt: query + (context ? `\n\nContext: ${JSON.stringify(context)}` : ''),
    });
  },
};

/**
 * Generate insights from MATRADE statistical data
 */
export async function analyzeMatradeStats(stats: {
  sector: string;
  totalCompanies: number;
  smePercentage?: number;
  exportingPercentage?: number;
}) {
  const { text } = await generateText({
    model: openrouterClient('openai/gpt-4-turbo'),
    system: `You are a Malaysian trade analyst interpreting MATRADE (Malaysia External Trade Development Corporation) statistics.

Provide insights on:
- Market opportunities
- Industry trends
- Risk considerations for TBML monitoring`,
    prompt: `Analyze these MATRADE statistics for the ${stats.sector} sector:

Total Registered Companies: ${stats.totalCompanies}
${stats.smePercentage ? `SME Percentage: ${stats.smePercentage}%` : ''}
${stats.exportingPercentage ? `Currently Exporting: ${stats.exportingPercentage}%` : ''}

Provide 3-5 key insights for TradeNest platform users.`,
  });

  return text;
}

/**
 * Auto-categorize companies into risk tiers based on multiple factors
 */
export async function categorizeCompanyRisk(companies: any[]) {
  const { text } = await generateText({
    model: openrouterClient('openai/gpt-4-turbo'),
    system: `You are a risk categorization AI for trade compliance.

Categorize companies into:
- High Risk: Requires enhanced due diligence
- Medium Risk: Standard monitoring
- Low Risk: Basic oversight

Consider: sector, country, trade patterns, products.`,
    prompt: `Categorize these ${companies.length} companies by TBML risk:

${JSON.stringify(companies.slice(0, 20), null, 2)}

Return a JSON array with: { companyName, riskLevel, reason }`,
  });

  return text;
}
