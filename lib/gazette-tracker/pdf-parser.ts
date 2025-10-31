// PDF Content Parser for Malaysian Federal Gazette
// Task 2.2: PDF Content Parsing
// Extracts structured data from gazette PDFs

import * as pdfParse from 'pdf-parse';

export interface ParsedGazetteData {
  hs_codes: string[];
  affected_countries: string[];
  summary: string;
  remedy_type?: string;
  expiry_date?: string;
  effective_date?: string;
  regulatory_authority?: string;
  full_text_length: number;
  num_pages: number;
}

/**
 * Download and parse PDF content
 */
export async function downloadAndParsePdf(pdfUrl: string): Promise<ParsedGazetteData> {
  try {
    console.log(`Downloading PDF: ${pdfUrl}`);

    const response = await fetch(pdfUrl);
    if (!response.ok) {
      throw new Error(`Failed to download PDF: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const pdfData = await (pdfParse as any)(buffer);

    console.log(`PDF parsed: ${pdfData.numpages} pages, ${pdfData.text.length} characters`);

    // Extract structured data from text
    const extractedData = extractDataFromText(pdfData.text);

    return {
      ...extractedData,
      full_text_length: pdfData.text.length,
      num_pages: pdfData.numpages,
    };

  } catch (error) {
    console.error(`Error parsing PDF ${pdfUrl}:`, error);
    throw error;
  }
}

/**
 * Extract structured data from PDF text content
 */
export function extractDataFromText(text: string): Omit<ParsedGazetteData, 'full_text_length' | 'num_pages'> {
  const data = {
    hs_codes: [] as string[],
    affected_countries: [] as string[],
    summary: '',
    remedy_type: undefined as string | undefined,
    expiry_date: undefined as string | undefined,
    effective_date: undefined as string | undefined,
    regulatory_authority: undefined as string | undefined,
  };

  const lowerText = text.toLowerCase();

  // Extract HS codes (4-digit codes)
  const hsCodePatterns = [
    /hs\s*(?:code)?\s*:?\s*(\d{4})/gi,
    /tariff\s*(?:code)?\s*:?\s*(\d{4})/gi,
    /classification\s*:?\s*(\d{4})/gi,
    /\b(\d{4})\s*(?:hs|tariff|classification)/gi,
  ];

  for (const pattern of hsCodePatterns) {
    const matches = [...text.matchAll(pattern)];
    for (const match of matches) {
      const hsCode = match[1];
      if (hsCode && hsCode.length === 4 && !data.hs_codes.includes(hsCode)) {
        data.hs_codes.push(hsCode);
      }
    }
  }

  // Extract affected countries
  const countryKeywords = [
    'china', 'chinese', 'singapore', 'thailand', 'indonesia', 'vietnam',
    'india', 'south korea', 'japan', 'taiwan', 'philippines', 'myanmar',
    'laos', 'cambodia', 'brunei', 'malaysia', 'australia', 'new zealand',
    'united states', 'usa', 'canada', 'mexico', 'brazil', 'argentina',
    'germany', 'france', 'italy', 'spain', 'united kingdom', 'uk',
    'russia', 'turkey', 'saudi arabia', 'uae', 'south africa', 'egypt'
  ];

  for (const keyword of countryKeywords) {
    if (lowerText.includes(keyword)) {
      const countryName = keyword.charAt(0).toUpperCase() + keyword.slice(1);
      if (!data.affected_countries.includes(countryName)) {
        data.affected_countries.push(countryName);
      }
    }
  }

  // Determine remedy type
  if (lowerText.includes('anti-dumping') || lowerText.includes('anti dumping')) {
    data.remedy_type = 'anti_dumping';
  } else if (lowerText.includes('countervailing') || lowerText.includes('cvd')) {
    data.remedy_type = 'countervailing';
  } else if (lowerText.includes('safeguard')) {
    data.remedy_type = 'safeguard';
  } else if (lowerText.includes('tariff') || lowerText.includes('duty')) {
    data.remedy_type = 'tariff_change';
  }

  // Extract dates
  const datePatterns = [
    /effective\s*(?:date)?\s*:?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/gi,
    /commence\s*(?:date)?\s*:?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/gi,
    /expiry\s*(?:date)?\s*:?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/gi,
    /expire\s*(?:date)?\s*:?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/gi,
    /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/g,
  ];

  for (const pattern of datePatterns) {
    const matches = [...text.matchAll(pattern)];
    for (const match of matches) {
      const dateStr = match[1] || match[0];
      const normalizedDate = normalizeDate(dateStr);

      if (pattern.source.includes('effective') || pattern.source.includes('commence')) {
        data.effective_date = normalizedDate;
      } else if (pattern.source.includes('expiry') || pattern.source.includes('expire')) {
        data.expiry_date = normalizedDate;
      }
    }
  }

  // Extract regulatory authority
  const authorityPatterns = [
    /ministry\s+of\s+([^,\n]+)/gi,
    /department\s+of\s+([^,\n]+)/gi,
    /royal\s+malaysian\s+customs/gi,
    /malaysian\s+external\s+trade\s+development\s+corporation/gi,
    /matrade/gi,
    /miti/gi,
  ];

  for (const pattern of authorityPatterns) {
    const match = text.match(pattern);
    if (match) {
      data.regulatory_authority = match[0];
      break;
    }
  }

  // Generate summary from first few sentences
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
  data.summary = sentences.slice(0, 3).join('. ').trim() || text.substring(0, 200);

  return data;
}

/**
 * Normalize date format to YYYY-MM-DD
 */
function normalizeDate(dateStr: string): string {
  try {
    // Handle various date formats
    const formats = [
      /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/, // DD/MM/YYYY or DD-MM-YYYY
      /(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/, // YYYY/MM/DD or YYYY-MM-DD
    ];

    for (const format of formats) {
      const match = dateStr.match(format);
      if (match) {
        if (format.source.includes('^\\d{4}')) {
          // YYYY-MM-DD format
          return match[0];
        } else {
          // DD/MM/YYYY or DD-MM-YYYY
          const [, day, month, year] = match;
          return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
      }
    }

    // Try to parse as Date object
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }

    return dateStr; // Return original if can't parse
  } catch (error) {
    return dateStr;
  }
}

/**
 * Enhanced content extraction with AI-powered analysis
 * This could be enhanced with OpenAI API for better text understanding
 */
export async function extractDataWithAI(text: string): Promise<ParsedGazetteData> {
  // For now, use the basic extraction
  // In the future, this could call OpenAI API for better analysis
  const basicData = extractDataFromText(text);

  return {
    ...basicData,
    full_text_length: text.length,
    num_pages: 1, // Would need to be passed from PDF parsing
  };
}