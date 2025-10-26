import { supabase } from '@/lib/supabase/client';

/**
 * Enriched context interface
 */
export interface EnrichedContext {
  company_profile?: {
    revenue: number;
    employees: number;
    sector_rank: number;
    headquarters: string;
    established_year: number;
    website?: string;
  };
  news_sentiment?: {
    score: number; // -1 to 1 (negative to positive)
    article_count: number;
    articles: Array<{
      title: string;
      url: string;
      published_date: string;
      sentiment: number;
    }>;
  };
  market_context?: {
    sector_trend: string;
    competitive_landscape: string;
    market_size: number;
    growth_rate: number;
  };
  economic_indicators?: {
    gdp_correlation: number;
    inflation_impact: number;
    sector_gdp_share: number;
    export_contribution: number;
  };
}

/**
 * Enrich alert data with external context
 */
export async function enrichAlertContext(
  alertId: string,
  companyId?: string,
  productId?: string
): Promise<EnrichedContext> {
  try {
    const enriched: EnrichedContext = {};

    // Get alert details
    const { data: alert } = await supabase
      .from('alerts')
      .select('company_id, product_id')
      .eq('id', alertId)
      .single();

    const companyIdToUse = companyId || alert?.company_id;
    const productIdToUse = productId || alert?.product_id;

    // Parallel enrichment
    const [companyProfile, newsSentiment, marketContext, economicIndicators] = await Promise.all([
      companyIdToUse ? enrichCompanyProfile(companyIdToUse) : Promise.resolve(null),
      newsSentiment ? enrichNewsSentiment(companyIdToUse) : Promise.resolve(null),
      productIdToUse ? enrichMarketContext(productIdToUse) : Promise.resolve(null),
      enrichEconomicIndicators(productIdToUse),
    ]);

    if (companyProfile) enriched.company_profile = companyProfile;
    if (newsSentiment) enriched.news_sentiment = newsSentiment;
    if (marketContext) enriched.market_context = marketContext;
    if (economicIndicators) enriched.economic_indicators = economicIndicators;

    return enriched;
  } catch (error) {
    console.error('Error enriching alert context:', error);
    return {};
  }
}

/**
 * Enrich with company profile data
 */
async function enrichCompanyProfile(companyId: string) {
  try {
    // Get company from database
    const { data: company } = await supabase
      .from('companies')
      .select('name, country, type, sector, revenue, employees, established_year')
      .eq('id', companyId)
      .single();

    if (!company) {
      return null;
    }

    // Get sector rank (simulated - in production, query sector data)
    const sectorRank = await getSectorRank(company.sector || company.type);

    return {
      revenue: company.revenue || 0,
      employees: company.employees || 0,
      sector_rank: sectorRank,
      headquarters: `${company.name}, ${company.country}`,
      established_year: company.established_year || 2000,
      website: undefined,
    };
  } catch (error) {
    console.error('Error enriching company profile:', error);
    return null;
  }
}

/**
 * Enrich with news sentiment analysis
 */
async function enrichNewsSentiment(companyId?: string) {
  try {
    // Simulated news sentiment - in production, integrate with news API
    // For demo purposes, generate synthetic data
    const articleCount = Math.floor(Math.random() * 5) + 1; // 1-5 articles
    const articles = [];

    for (let i = 0; i < articleCount; i++) {
      articles.push({
        title: `Industry Update: ${getRandomIndustry()} Sector`,
        url: 'https://example.com/news/article-' + i,
        published_date: getRandomPastDate(30),
        sentiment: (Math.random() - 0.5) * 2, // -1 to 1
      });
    }

    const avgSentiment = articles.reduce((sum, a) => sum + a.sentiment, 0) / articles.length;

    return {
      score: avgSentiment,
      article_count: articleCount,
      articles: articles,
    };
  } catch (error) {
    console.error('Error enriching news sentiment:', error);
    return null;
  }
}

/**
 * Enrich with market context
 */
async function enrichMarketContext(productId?: string) {
  try {
    if (!productId) return null;

    // Get product details
    const { data: product } = await supabase
      .from('products')
      .select('category, description')
      .eq('id', productId)
      .single();

    if (!product) {
      return null;
    }

    // Simulate market data
    return {
      sector_trend: getMarketTrend(product.category),
      competitive_landscape: getCompetitiveLandscape(product.category),
      market_size: Math.random() * 10 + 5, // 5-15 billion
      growth_rate: (Math.random() * 10 + 2) / 100, // 2-12% growth
    };
  } catch (error) {
    console.error('Error enriching market context:', error);
    return null;
  }
}

/**
 * Enrich with economic indicators
 */
async function enrichEconomicIndicators(productId?: string) {
  try {
    // Simulate economic correlation data
    // In production, integrate with economic data APIs
    return {
      gdp_correlation: Math.random() * 0.3 + 0.5, // 0.5-0.8
      inflation_impact: Math.random() * 0.4 - 0.2, // -0.2 to 0.2
      sector_gdp_share: Math.random() * 5 + 2, // 2-7% of GDP
      export_contribution: Math.random() * 20 + 10, // 10-30%
    };
  } catch (error) {
    console.error('Error enriching economic indicators:', error);
    return null;
  }
}

/**
 * Get sector rank for a company
 */
async function getSectorRank(sector: string): Promise<number> {
  // In production, query database for sector ranking
  // Simulated ranking
  return Math.floor(Math.random() * 100) + 1; // 1-100
}

/**
 * Get market trend for a sector
 */
function getMarketTrend(category: string): string {
  const trends = [
    'Growing',
    'Stable',
    'Declining',
    'Volatile',
    'Emerging',
  ];
  return trends[Math.floor(Math.random() * trends.length)];
}

/**
 * Get competitive landscape
 */
function getCompetitiveLandscape(category: string): string {
  const landscapes = [
    'Highly competitive with many players',
    'Moderate competition, consolidation happening',
    'Oligopoly with few major players',
    'Emerging market with new entrants',
  ];
  return landscapes[Math.floor(Math.random() * landscapes.length)];
}

/**
 * Get random industry
 */
function getRandomIndustry(): string {
  const industries = [
    'Steel Manufacturing',
    'Chemical Processing',
    'Food & Beverage',
    'Textiles',
    'Electronics',
    'Automotive',
  ];
  return industries[Math.floor(Math.random() * industries.length)];
}

/**
 * Get random past date within N days
 */
function getRandomPastDate(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * days));
  return date.toISOString().split('T')[0];
}

/**
 * Enrich multiple alerts at once
 */
export async function enrichMultipleAlerts(alertIds: string[]): Promise<Map<string, EnrichedContext>> {
  const enrichedMap = new Map<string, EnrichedContext>();

  await Promise.all(
    alertIds.map(async (alertId) => {
      const enriched = await enrichAlertContext(alertId);
      enrichedMap.set(alertId, enriched);
    })
  );

  return enrichedMap;
}

/**
 * Get enriched intelligence report
 */
export async function getEnrichedIntelligenceReport(
  alertId: string
): Promise<{
  alert_id: string;
  enriched_context: EnrichedContext;
  intelligence: any;
}> {
  try {
    const [enrichedContext, intelligence] = await Promise.all([
      enrichAlertContext(alertId),
      // In production, fetch intelligence from your existing intelligence API
      null,
    ]);

    return {
      alert_id: alertId,
      enriched_context: enrichedContext,
      intelligence: intelligence || {},
    };
  } catch (error) {
    console.error('Error getting enriched intelligence report:', error);
    throw error;
  }
}

