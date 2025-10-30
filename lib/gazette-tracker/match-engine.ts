// Gazette Match Engine
// Task 2.3: Auto-Matching to Watchlists
// Matches gazettes to user watchlists and creates alerts

import { supabase } from '@/lib/supabase/client';
import { ExtractedContent } from './content-extractor';

export interface GazetteMatch {
  gazette_id: string;
  user_id: string;
  match_type: 'hs_code' | 'country' | 'sector' | 'company';
  match_value: string;
  confidence_score: number;
  alert_created: boolean;
}

export interface UserWatchlist {
  user_id: string;
  hs_codes: string[];
  countries: string[];
  sectors: string[];
  companies: string[];
}

/**
 * Match gazette to user watchlists and create alerts
 */
export async function matchGazetteToWatchlists(
  gazetteId: string,
  extractedContent: ExtractedContent
): Promise<GazetteMatch[]> {
  console.log(`Matching gazette ${gazetteId} to user watchlists...`);

  // Get all user watchlists
  const { data: watchlists, error: watchlistError } = await supabase
    .from('gazette_subscriptions')
    .select('*');

  if (watchlistError) {
    console.error('Error fetching watchlists:', watchlistError);
    return [];
  }

  if (!watchlists || watchlists.length === 0) {
    console.log('No user watchlists found');
    return [];
  }

  const matches: GazetteMatch[] = [];

  for (const watchlist of watchlists) {
    const userMatches = await matchGazetteToUserWatchlist(
      gazetteId,
      watchlist,
      extractedContent
    );
    matches.push(...userMatches);
  }

  console.log(`Found ${matches.length} matches for gazette ${gazetteId}`);
  return matches;
}

/**
 * Match gazette to a specific user's watchlist
 */
async function matchGazetteToUserWatchlist(
  gazetteId: string,
  watchlist: any,
  extractedContent: ExtractedContent
): Promise<GazetteMatch[]> {
  const matches: GazetteMatch[] = [];

  // Match HS codes
  if (extractedContent.hs_codes.length > 0 && watchlist.hs_codes) {
    for (const gazetteHsCode of extractedContent.hs_codes) {
      if (watchlist.hs_codes.includes(gazetteHsCode)) {
        const confidenceScore = calculateConfidenceScore('hs_code', gazetteHsCode, extractedContent);

        matches.push({
          gazette_id: gazetteId,
          user_id: watchlist.user_id,
          match_type: 'hs_code',
          match_value: gazetteHsCode,
          confidence_score: confidenceScore,
          alert_created: false,
        });
      }
    }
  }

  // Match countries
  if (extractedContent.affected_countries.length > 0 && watchlist.countries) {
    for (const gazetteCountry of extractedContent.affected_countries) {
      if (watchlist.countries.includes(gazetteCountry)) {
        const confidenceScore = calculateConfidenceScore('country', gazetteCountry, extractedContent);

        matches.push({
          gazette_id: gazetteId,
          user_id: watchlist.user_id,
          match_type: 'country',
          match_value: gazetteCountry,
          confidence_score: confidenceScore,
          alert_created: false,
        });
      }
    }
  }

  // Match sectors (based on HS codes)
  if (extractedContent.hs_codes.length > 0 && watchlist.sectors) {
    for (const gazetteHsCode of extractedContent.hs_codes) {
      const sector = getSectorFromHSCode(gazetteHsCode);
      if (sector && watchlist.sectors.includes(sector)) {
        const confidenceScore = calculateConfidenceScore('sector', sector, extractedContent);

        matches.push({
          gazette_id: gazetteId,
          user_id: watchlist.user_id,
          match_type: 'sector',
          match_value: sector,
          confidence_score: confidenceScore,
          alert_created: false,
        });
      }
    }
  }

  // Create alerts for matches
  for (const match of matches) {
    if (match.confidence_score >= 0.7) { // Only create alerts for high-confidence matches
      await createGazetteAlert(match);
      match.alert_created = true;
    }
  }

  return matches;
}

/**
 * Calculate confidence score for a match
 */
function calculateConfidenceScore(
  matchType: string,
  matchValue: string,
  extractedContent: ExtractedContent
): number {
  let score = 0.5; // Base score

  // Boost score based on match type
  switch (matchType) {
    case 'hs_code':
      score += 0.3; // HS code matches are very specific
      break;
    case 'country':
      score += 0.2; // Country matches are important
      break;
    case 'sector':
      score += 0.1; // Sector matches are less specific
      break;
    case 'company':
      score += 0.4; // Company matches are very specific
      break;
  }

  // Boost score if multiple indicators match
  if (extractedContent.hs_codes.length > 1) {
    score += 0.1;
  }
  if (extractedContent.affected_countries.length > 1) {
    score += 0.1;
  }
  if (extractedContent.remedy_type) {
    score += 0.1; // Has specific remedy type
  }

  // Cap at 1.0
  return Math.min(score, 1.0);
}

/**
 * Get sector from HS code
 */
function getSectorFromHSCode(hsCode: string): string | null {
  const sectorMap: Record<string, string> = {
    '72': 'Steel & Metals',
    '73': 'Steel & Metals',
    '74': 'Steel & Metals',
    '75': 'Steel & Metals',
    '76': 'Steel & Metals',
    '78': 'Steel & Metals',
    '79': 'Steel & Metals',
    '80': 'Steel & Metals',
    '81': 'Steel & Metals',
    '82': 'Steel & Metals',
    '83': 'Steel & Metals',
    '84': 'Machinery & Equipment',
    '85': 'Electronics & Electrical',
    '86': 'Transportation',
    '87': 'Transportation',
    '88': 'Transportation',
    '89': 'Transportation',
    '90': 'Electronics & Electrical',
    '91': 'Electronics & Electrical',
    '92': 'Electronics & Electrical',
    '93': 'Electronics & Electrical',
    '94': 'Furniture & Home',
    '95': 'Toys & Games',
    '96': 'Miscellaneous',
    '97': 'Art & Antiques',
    '15': 'Chemicals & Petrochemicals',
    '16': 'Food & Beverages',
    '17': 'Food & Beverages',
    '18': 'Food & Beverages',
    '19': 'Food & Beverages',
    '20': 'Food & Beverages',
    '21': 'Food & Beverages',
    '22': 'Food & Beverages',
    '23': 'Food & Beverages',
    '24': 'Food & Beverages',
    '25': 'Chemicals & Petrochemicals',
    '26': 'Chemicals & Petrochemicals',
    '27': 'Chemicals & Petrochemicals',
    '28': 'Chemicals & Petrochemicals',
    '29': 'Chemicals & Petrochemicals',
    '30': 'Chemicals & Petrochemicals',
    '31': 'Chemicals & Petrochemicals',
    '32': 'Chemicals & Petrochemicals',
    '33': 'Chemicals & Petrochemicals',
    '34': 'Chemicals & Petrochemicals',
    '35': 'Chemicals & Petrochemicals',
    '36': 'Chemicals & Petrochemicals',
    '37': 'Chemicals & Petrochemicals',
    '38': 'Chemicals & Petrochemicals',
    '39': 'Chemicals & Petrochemicals',
    '40': 'Chemicals & Petrochemicals',
    '41': 'Textiles & Apparel',
    '42': 'Textiles & Apparel',
    '43': 'Textiles & Apparel',
    '44': 'Textiles & Apparel',
    '45': 'Textiles & Apparel',
    '46': 'Textiles & Apparel',
    '47': 'Textiles & Apparel',
    '48': 'Textiles & Apparel',
    '49': 'Textiles & Apparel',
    '50': 'Textiles & Apparel',
    '51': 'Textiles & Apparel',
    '52': 'Textiles & Apparel',
    '53': 'Textiles & Apparel',
    '54': 'Textiles & Apparel',
    '55': 'Textiles & Apparel',
    '56': 'Textiles & Apparel',
    '57': 'Textiles & Apparel',
    '58': 'Textiles & Apparel',
    '59': 'Textiles & Apparel',
    '60': 'Textiles & Apparel',
    '61': 'Textiles & Apparel',
    '62': 'Textiles & Apparel',
    '63': 'Textiles & Apparel',
    '64': 'Textiles & Apparel',
    '65': 'Textiles & Apparel',
    '66': 'Textiles & Apparel',
    '67': 'Textiles & Apparel',
    '68': 'Textiles & Apparel',
    '69': 'Textiles & Apparel',
    '70': 'Textiles & Apparel',
    '71': 'Textiles & Apparel',
  };

  const prefix = hsCode.substring(0, 2);
  return sectorMap[prefix] || null;
}

/**
 * Create alert for gazette match
 */
async function createGazetteAlert(match: GazetteMatch): Promise<void> {
  try {
    // Get gazette details
    const { data: gazette, error: gazetteError } = await supabase
      .from('gazettes')
      .select('*')
      .eq('id', match.gazette_id)
      .single();

    if (gazetteError || !gazette) {
      console.error('Error fetching gazette:', gazetteError);
      return;
    }

    // Create alert
    const { error: alertError } = await supabase
      .from('alerts')
      .insert({
        user_id: match.user_id,
        type: 'gazette_match',
        severity: 'medium',
        title: `New Gazette Affects Your ${match.match_type}: ${match.match_value}`,
        description: `Gazette ${gazette.gazette_number} affects your watched ${match.match_type}: ${match.match_value}`,
        metadata: {
          gazette_id: match.gazette_id,
          gazette_number: gazette.gazette_number,
          match_type: match.match_type,
          match_value: match.match_value,
          confidence_score: match.confidence_score,
          gazette_url: gazette.pdf_url,
        },
        is_read: false,
      });

    if (alertError) {
      console.error('Error creating alert:', alertError);
    } else {
      console.log(`✅ Created alert for user ${match.user_id} - ${match.match_type}: ${match.match_value}`);
    }
  } catch (error) {
    console.error('Error creating gazette alert:', error);
  }
}

/**
 * Get user watchlist
 */
export async function getUserWatchlist(userId: string): Promise<UserWatchlist | null> {
  try {
    const { data: watchlist, error } = await supabase
      .from('gazette_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching user watchlist:', error);
      return null;
    }

    return {
      user_id: userId,
      hs_codes: watchlist?.hs_codes || [],
      countries: watchlist?.countries || [],
      sectors: watchlist?.sectors || [],
      companies: watchlist?.companies || [],
    };
  } catch (error) {
    console.error('Error fetching user watchlist:', error);
    return null;
  }
}

/**
 * Update user watchlist
 */
export async function updateUserWatchlist(
  userId: string,
  watchlist: Partial<UserWatchlist>
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('gazette_subscriptions')
      .upsert({
        user_id: userId,
        hs_codes: watchlist.hs_codes || [],
        countries: watchlist.countries || [],
        sectors: watchlist.sectors || [],
        companies: watchlist.companies || [],
        updated_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Error updating watchlist:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error updating watchlist:', error);
    return false;
  }
}