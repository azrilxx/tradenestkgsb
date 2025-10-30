/**
 * BNM (Bank Negara Malaysia) FX Rate Integration
 * Fetches daily exchange rates from official BNM API
 * API Documentation: https://api.bnm.gov.my/
 */

import { DataSource, FXRate, BNMResponse } from './types';
import { validateFXRate, retryWithBackoff, logDataSourceOperation } from './utils';

// Portal URL: https://apikijangportal.bnm.gov.my (for documentation)
// API Base URL: https://api.bnm.gov.my (for actual API calls)
const BNM_API_BASE_URL = process.env.BNM_API_URL || 'https://api.bnm.gov.my/public';
const DEFAULT_CURRENCY_PAIRS = ['USD', 'CNY', 'EUR', 'SGD', 'JPY'];

/**
 * Fetch latest FX rates from BNM API for all major currency pairs
 */
export async function fetchBNMFXRates(): Promise<FXRate[]> {
  const rates: FXRate[] = [];

  logDataSourceOperation(DataSource.BNM, 'Fetching FX rates', { pairs: DEFAULT_CURRENCY_PAIRS });

  for (const currency of DEFAULT_CURRENCY_PAIRS) {
    try {
      const rate = await fetchBNMSingleRate(currency);
      if (rate) {
        rates.push(rate);
      }
    } catch (error) {
      console.error(`Failed to fetch ${currency} rate from BNM:`, error);
      // Continue with other currencies on error
    }
  }

  logDataSourceOperation(DataSource.BNM, 'FX fetch complete', {
    successful: rates.length,
    total: DEFAULT_CURRENCY_PAIRS.length
  });

  return rates;
}

/**
 * Fetch FX rate for a single currency pair
 */
async function fetchBNMSingleRate(currency: string): Promise<FXRate | null> {
  const url = `${BNM_API_BASE_URL}/exchange-rate`;
  const params = new URLSearchParams({ session: '0730' }); // Morning session

  return await retryWithBackoff(async () => {
    const response = await fetch(`${url}?${params}`, {
      headers: {
        'Accept': 'application/vnd.BNM.API.v1+json'
      }
    });

    if (!response.ok) {
      throw new Error(`BNM API returned ${response.status}`);
    }

    const data: BNMResponse = await response.json();

    // Find the rate for the requested currency
    const currencyData = data.data.find(item =>
      item.currency_code === currency || item.currency_code === `${currency}`
    );

    if (!currencyData || !currencyData.rate) {
      return null;
    }

    // Format: "4.7235" -> 4.7235
    const rate = parseFloat(currencyData.rate);

    if (!validateFXRate(rate)) {
      console.warn(`Invalid FX rate for ${currency}: ${rate}`);
      return null;
    }

    return {
      currency_pair: `MYR/${currency}`,
      rate: rate,
      date: new Date(),
      source: DataSource.BNM
    };
  });
}

/**
 * Fetch historical FX rates for a date range
 */
export async function fetchBNMHistoricalRates(
  startDate: Date,
  endDate: Date,
  currency: string = 'USD'
): Promise<FXRate[]> {
  const rates: FXRate[] = [];

  logDataSourceOperation(DataSource.BNM, 'Fetching historical rates', {
    currency,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString()
  });

  // BNM API uses different endpoint for historical data
  const url = `${BNM_API_BASE_URL}/exchange-rate/history`;

  return await retryWithBackoff(async () => {
    const params = new URLSearchParams({
      session: '0730',
      quote: currency,
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0]
    });

    const response = await fetch(`${url}?${params}`, {
      headers: {
        'Accept': 'application/vnd.BNM.API.v1+json'
      }
    });

    if (!response.ok) {
      throw new Error(`BNM API returned ${response.status}`);
    }

    const data: BNMResponse = await response.json();

    // Transform BNM data to TradeNest format
    for (const item of data.data) {
      const rate = parseFloat(item.rate);

      if (validateFXRate(rate)) {
        rates.push({
          currency_pair: `MYR/${currency}`,
          rate: rate,
          date: new Date(item.date),
          source: DataSource.BNM
        });
      }
    }

    return rates;
  });
}

/**
 * Get available currency pairs from BNM
 */
export async function getAvailableCurrencies(): Promise<string[]> {
  const url = `${BNM_API_BASE_URL}/exchange-rate`;

  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/vnd.BNM.API.v1+json'
      }
    });

    if (!response.ok) {
      return DEFAULT_CURRENCY_PAIRS; // Fallback
    }

    const data: BNMResponse = await response.json();
    return data.data.map(item => item.currency_code);
  } catch (error) {
    console.error('Failed to fetch available currencies:', error);
    return DEFAULT_CURRENCY_PAIRS;
  }
}
