// Bank Negara Malaysia (BNM) API Fetcher
// Task 3.1: Integration with BNM Open API for exchange rates and financial data
// API Documentation: https://api.bnm.gov.my/
// Interactive Portal: https://apikijangportal.bnm.gov.my/openapi

export interface BNMExchangeRate {
  base_currency: string;
  target_currency: string;
  rate: number;
  date: string;
  source: string;
}

export interface BNMResponse {
  meta: {
    code?: number;
    message?: string;
    total_result?: number;
    last_updated?: string;
    quote?: string;
    session?: string;
  };
  data: any;
}

// BNM API Configuration
// Portal URL: https://apikijangportal.bnm.gov.my (for documentation)
// API Base URL: https://api.bnm.gov.my (for actual API calls)
const BNM_API_BASE_URL = 'https://api.bnm.gov.my/public';
const REQUIRED_HEADERS = {
  'Accept': 'application/vnd.BNM.API.v1+json',
};

// Primary currency pairs for Malaysian trade
export const PRIORITY_CURRENCY_PAIRS = [
  { pair: 'MYR/USD', code: 'USD' },
  { pair: 'MYR/CNY', code: 'CNY' },
  { pair: 'MYR/EUR', code: 'EUR' },
  { pair: 'MYR/SGD', code: 'SGD' },
  { pair: 'MYR/JPY', code: 'JPY' },
  { pair: 'MYR/GBP', code: 'GBP' },
  { pair: 'MYR/THB', code: 'THB' },
  { pair: 'MYR/IDR', code: 'IDR' },
];

/**
 * Fetch exchange rate from BNM API
 * @param currencyCode - Currency code (e.g., 'USD', 'CNY')
 * @param date - Date in format 'YYYY-MM-DD' (optional, defaults to today)
 * @returns Exchange rate data
 */
export async function fetchBNMExchangeRate(
  currencyCode: string,
  date?: string
): Promise<BNMExchangeRate | null> {
  try {
    // BNM API returns all currencies in a single endpoint
    const endpoint = date
      ? `/exchange-rate/year/${date.split('-')[0]}/month/${date.split('-')[1]}`
      : `/exchange-rate`;

    const response = await fetch(`${BNM_API_BASE_URL}${endpoint}`, {
      headers: REQUIRED_HEADERS,
    });

    if (!response.ok) {
      console.error(`BNM API error: ${response.status}`);
      return null;
    }

    const data: BNMResponse = await response.json();

    // Check if meta exists and has error code
    if (data.meta && data.meta.code && data.meta.code !== 200) {
      console.error(`BNM API returned error: ${data.meta.message || 'Unknown error'}`);
      return null;
    }

    // Find the specific currency from the data array
    const rates = data.data;
    if (!rates || rates.length === 0) {
      return null;
    }

    const currencyData = Array.isArray(rates)
      ? rates.find((r: any) => r.currency_code === currencyCode)
      : rates;

    if (!currencyData || !currencyData.rate) {
      return null;
    }

    // Extract middle_rate from rate object and adjust for unit
    const middleRate = currencyData.rate.middle_rate;
    const unit = currencyData.unit || 1;
    const adjustedRate = parseFloat(middleRate) / unit;

    return {
      base_currency: 'MYR',
      target_currency: currencyCode,
      rate: adjustedRate,
      date: currencyData.rate.date || date || new Date().toISOString().split('T')[0],
      source: 'BNM',
    };
  } catch (error) {
    console.error(`Error fetching BNM rate for ${currencyCode}:`, error);
    return null;
  }
}

/**
 * Fetch all priority exchange rates
 * @param date - Optional date filter
 * @returns Array of exchange rates
 */
export async function fetchAllPriorityRates(date?: string): Promise<BNMExchangeRate[]> {
  const rates: BNMExchangeRate[] = [];

  try {
    // BNM API returns all currencies in a single endpoint - fetch once
    const endpoint = date
      ? `/exchange-rate/year/${date.split('-')[0]}/month/${date.split('-')[1]}`
      : `/exchange-rate`;

    const response = await fetch(`${BNM_API_BASE_URL}${endpoint}`, {
      headers: REQUIRED_HEADERS,
    });

    if (!response.ok) {
      console.error(`BNM API error: ${response.status}`);
      return [];
    }

    const data: BNMResponse = await response.json();

    // Check if meta exists and has error code
    if (data.meta && data.meta.code && data.meta.code !== 200) {
      console.error(`BNM API returned error: ${data.meta.message || 'Unknown error'}`);
      return [];
    }

    // Extract all rates from the data array
    const allRates = data.data;
    if (!allRates || allRates.length === 0) {
      return [];
    }

    // Filter and transform only priority currency pairs
    for (const { code } of PRIORITY_CURRENCY_PAIRS) {
      const currencyData = Array.isArray(allRates)
        ? allRates.find((r: any) => r.currency_code === code)
        : null;

      if (currencyData && currencyData.rate) {
        const middleRate = currencyData.rate.middle_rate;
        const unit = currencyData.unit || 1;
        const adjustedRate = parseFloat(middleRate) / unit;

        rates.push({
          base_currency: 'MYR',
          target_currency: code,
          rate: adjustedRate,
          date: currencyData.rate.date || date || new Date().toISOString().split('T')[0],
          source: 'BNM',
        });
      }
    }

    return rates;
  } catch (error) {
    console.error('Error fetching all BNM rates:', error);
    return [];
  }
}

/**
 * Fetch KL Interbank Offered Rate (KLIBOR)
 * @param date - Optional date filter
 * @returns KLIBOR data
 */
export async function fetchKLIBOR(date?: string): Promise<any> {
  try {
    const endpoint = date
      ? `/klibor-rate/year/${date.split('-')[0]}/month/${date.split('-')[1]}`
      : '/klibor-rate';

    const response = await fetch(`${BNM_API_BASE_URL}${endpoint}`, {
      headers: REQUIRED_HEADERS,
    });

    if (!response.ok) {
      return null;
    }

    const data: BNMResponse = await response.json();
    return data.meta.code === 200 ? data.data : null;
  } catch (error) {
    console.error('Error fetching KLIBOR:', error);
    return null;
  }
}

/**
 * Fetch Islamic Interbank Money Market (IIMM) Rate
 * @param date - Optional date filter
 * @returns IIMM rate data
 */
export async function fetchIIMMRate(date?: string): Promise<any> {
  try {
    const endpoint = date
      ? `/iimm-rate/year/${date.split('-')[0]}/month/${date.split('-')[1]}`
      : '/iimm-rate';

    const response = await fetch(`${BNM_API_BASE_URL}${endpoint}`, {
      headers: REQUIRED_HEADERS,
    });

    if (!response.ok) {
      return null;
    }

    const data: BNMResponse = await response.json();
    return data.meta.code === 200 ? data.data : null;
  } catch (error) {
    console.error('Error fetching IIMM rate:', error);
    return null;
  }
}

/**
 * Get data source attribution for BNM
 */
export function getBNMAttribution(): string {
  return 'Bank Negara Malaysia (BNM) Open API - https://api.bnm.gov.my/';
}

