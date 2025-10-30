// Content Extractor for Gazette Data
// Task 2.2: Content Extractor
// Extracts structured data from gazette content

export interface ExtractedContent {
  hs_codes: string[];
  affected_countries: string[];
  summary: string;
  remedy_type?: string;
  expiry_date?: string;
  effective_date?: string;
  regulatory_authority?: string;
  trade_lanes?: string[];
  duty_rates?: Array<{
    hs_code: string;
    rate: number;
    currency: string;
  }>;
  volume_thresholds?: Array<{
    hs_code: string;
    threshold: number;
    unit: string;
  }>;
}

/**
 * Extract structured data from gazette text content
 */
export function extractStructuredData(text: string, title?: string): ExtractedContent {
  const content: ExtractedContent = {
    hs_codes: [],
    affected_countries: [],
    summary: '',
    trade_lanes: [],
    duty_rates: [],
    volume_thresholds: [],
  };

  const lowerText = text.toLowerCase();

  // Extract HS codes with enhanced patterns
  content.hs_codes = extractHSCodes(text);

  // Extract affected countries
  content.affected_countries = extractAffectedCountries(text);

  // Determine remedy type
  content.remedy_type = determineRemedyType(text);

  // Extract dates
  const dates = extractDates(text);
  content.effective_date = dates.effective;
  content.expiry_date = dates.expiry;

  // Extract regulatory authority
  content.regulatory_authority = extractRegulatoryAuthority(text);

  // Extract trade lanes
  content.trade_lanes = extractTradeLanes(text);

  // Extract duty rates
  content.duty_rates = extractDutyRates(text);

  // Extract volume thresholds
  content.volume_thresholds = extractVolumeThresholds(text);

  // Generate summary
  content.summary = generateSummary(text, title);

  return content;
}

/**
 * Extract HS codes from text
 */
function extractHSCodes(text: string): string[] {
  const hsCodes: string[] = [];

  const patterns = [
    /hs\s*(?:code)?\s*:?\s*(\d{4})/gi,
    /tariff\s*(?:code)?\s*:?\s*(\d{4})/gi,
    /classification\s*:?\s*(\d{4})/gi,
    /\b(\d{4})\s*(?:hs|tariff|classification)/gi,
    /heading\s*(\d{4})/gi,
    /subheading\s*(\d{4})/gi,
  ];

  for (const pattern of patterns) {
    const matches = [...text.matchAll(pattern)];
    for (const match of matches) {
      const hsCode = match[1];
      if (hsCode && hsCode.length === 4 && !hsCodes.includes(hsCode)) {
        hsCodes.push(hsCode);
      }
    }
  }

  return hsCodes;
}

/**
 * Extract affected countries
 */
function extractAffectedCountries(text: string): string[] {
  const countries: string[] = [];
  const lowerText = text.toLowerCase();

  const countryMap: Record<string, string> = {
    'china': 'China',
    'chinese': 'China',
    'singapore': 'Singapore',
    'thailand': 'Thailand',
    'indonesia': 'Indonesia',
    'vietnam': 'Vietnam',
    'india': 'India',
    'south korea': 'South Korea',
    'japan': 'Japan',
    'taiwan': 'Taiwan',
    'philippines': 'Philippines',
    'myanmar': 'Myanmar',
    'laos': 'Laos',
    'cambodia': 'Cambodia',
    'brunei': 'Brunei',
    'malaysia': 'Malaysia',
    'australia': 'Australia',
    'new zealand': 'New Zealand',
    'united states': 'United States',
    'usa': 'United States',
    'canada': 'Canada',
    'mexico': 'Mexico',
    'brazil': 'Brazil',
    'argentina': 'Argentina',
    'germany': 'Germany',
    'france': 'France',
    'italy': 'Italy',
    'spain': 'Spain',
    'united kingdom': 'United Kingdom',
    'uk': 'United Kingdom',
    'russia': 'Russia',
    'turkey': 'Turkey',
    'saudi arabia': 'Saudi Arabia',
    'uae': 'United Arab Emirates',
    'south africa': 'South Africa',
    'egypt': 'Egypt',
  };

  for (const [keyword, countryName] of Object.entries(countryMap)) {
    if (lowerText.includes(keyword) && !countries.includes(countryName)) {
      countries.push(countryName);
    }
  }

  return countries;
}

/**
 * Determine remedy type from text
 */
function determineRemedyType(text: string): string | undefined {
  const lowerText = text.toLowerCase();

  if (lowerText.includes('anti-dumping') || lowerText.includes('anti dumping')) {
    return 'anti_dumping';
  } else if (lowerText.includes('countervailing') || lowerText.includes('cvd')) {
    return 'countervailing';
  } else if (lowerText.includes('safeguard')) {
    return 'safeguard';
  } else if (lowerText.includes('tariff') || lowerText.includes('duty')) {
    return 'tariff_change';
  } else if (lowerText.includes('import restriction') || lowerText.includes('prohibition')) {
    return 'import_restriction';
  }

  return undefined;
}

/**
 * Extract dates from text
 */
function extractDates(text: string): { effective?: string; expiry?: string } {
  const dates: { effective?: string; expiry?: string } = {};

  const patterns = [
    {
      type: 'effective',
      regex: /effective\s*(?:date)?\s*:?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/gi,
    },
    {
      type: 'effective',
      regex: /commence\s*(?:date)?\s*:?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/gi,
    },
    {
      type: 'expiry',
      regex: /expiry\s*(?:date)?\s*:?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/gi,
    },
    {
      type: 'expiry',
      regex: /expire\s*(?:date)?\s*:?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/gi,
    },
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern.regex);
    if (match) {
      const dateStr = match[1];
      const normalizedDate = normalizeDate(dateStr);
      dates[pattern.type as keyof typeof dates] = normalizedDate;
    }
  }

  return dates;
}

/**
 * Extract regulatory authority
 */
function extractRegulatoryAuthority(text: string): string | undefined {
  const patterns = [
    /ministry\s+of\s+([^,\n]+)/gi,
    /department\s+of\s+([^,\n]+)/gi,
    /royal\s+malaysian\s+customs/gi,
    /malaysian\s+external\s+trade\s+development\s+corporation/gi,
    /matrade/gi,
    /miti/gi,
    /bank\s+negara\s+malaysia/gi,
    /bnm/gi,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return match[0];
    }
  }

  return undefined;
}

/**
 * Extract trade lanes (origin-destination pairs)
 */
function extractTradeLanes(text: string): string[] {
  const tradeLanes: string[] = [];
  const lowerText = text.toLowerCase();

  // Common trade lane patterns
  const lanePatterns = [
    /from\s+([^,\n]+)\s+to\s+([^,\n]+)/gi,
    /export\s+from\s+([^,\n]+)\s+to\s+([^,\n]+)/gi,
    /import\s+from\s+([^,\n]+)\s+to\s+([^,\n]+)/gi,
  ];

  for (const pattern of lanePatterns) {
    const matches = [...text.matchAll(pattern)];
    for (const match of matches) {
      const origin = match[1].trim();
      const destination = match[2].trim();
      const lane = `${origin} → ${destination}`;
      if (!tradeLanes.includes(lane)) {
        tradeLanes.push(lane);
      }
    }
  }

  return tradeLanes;
}

/**
 * Extract duty rates
 */
function extractDutyRates(text: string): Array<{ hs_code: string; rate: number; currency: string }> {
  const dutyRates: Array<{ hs_code: string; rate: number; currency: string }> = [];

  const patterns = [
    /(\d{4})\s*:?\s*(\d+(?:\.\d+)?)\s*%?/g,
    /hs\s*(\d{4})\s*:?\s*(\d+(?:\.\d+)?)\s*%?/gi,
    /tariff\s*(\d{4})\s*:?\s*(\d+(?:\.\d+)?)\s*%?/gi,
  ];

  for (const pattern of patterns) {
    const matches = [...text.matchAll(pattern)];
    for (const match of matches) {
      const hsCode = match[1];
      const rate = parseFloat(match[2]);

      if (hsCode && hsCode.length === 4 && !isNaN(rate)) {
        dutyRates.push({
          hs_code: hsCode,
          rate: rate,
          currency: 'MYR', // Default to Malaysian Ringgit
        });
      }
    }
  }

  return dutyRates;
}

/**
 * Extract volume thresholds
 */
function extractVolumeThresholds(text: string): Array<{ hs_code: string; threshold: number; unit: string }> {
  const thresholds: Array<{ hs_code: string; threshold: number; unit: string }> = [];

  const patterns = [
    /(\d{4})\s*:?\s*(\d+(?:,\d{3})*(?:\.\d+)?)\s*(kg|tonnes?|tons?|units?|pieces?)/gi,
    /threshold\s*(\d{4})\s*:?\s*(\d+(?:,\d{3})*(?:\.\d+)?)\s*(kg|tonnes?|tons?|units?|pieces?)/gi,
  ];

  for (const pattern of patterns) {
    const matches = [...text.matchAll(pattern)];
    for (const match of matches) {
      const hsCode = match[1];
      const threshold = parseFloat(match[2].replace(/,/g, ''));
      const unit = match[3];

      if (hsCode && hsCode.length === 4 && !isNaN(threshold)) {
        thresholds.push({
          hs_code: hsCode,
          threshold: threshold,
          unit: unit,
        });
      }
    }
  }

  return thresholds;
}

/**
 * Generate summary from text
 */
function generateSummary(text: string, title?: string): string {
  // Extract first few meaningful sentences
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);

  if (sentences.length === 0) {
    return text.substring(0, 200);
  }

  // Take first 3 sentences or first 200 characters, whichever is shorter
  const summary = sentences.slice(0, 3).join('. ').trim();

  if (summary.length > 200) {
    return summary.substring(0, 200) + '...';
  }

  return summary;
}

/**
 * Normalize date format to YYYY-MM-DD
 */
function normalizeDate(dateStr: string): string {
  try {
    const formats = [
      /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/, // DD/MM/YYYY or DD-MM-YYYY
      /(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/, // YYYY/MM/DD or YYYY-MM-DD
    ];

    for (const format of formats) {
      const match = dateStr.match(format);
      if (match) {
        if (format.source.includes('^\\d{4}')) {
          return match[0];
        } else {
          const [, day, month, year] = match;
          return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
      }
    }

    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }

    return dateStr;
  } catch (error) {
    return dateStr;
  }
}