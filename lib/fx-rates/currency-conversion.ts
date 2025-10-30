// Currency Conversion Utility
// Integrates BNM exchange rates with trade remedy calculations

import { createClient } from '@/lib/supabase/server';

export interface ConversionOptions {
  fromCurrency: string;
  toCurrency: string;
  amount: number;
  date?: string; // Optional: use historical rate
}

/**
 * Get latest exchange rate from database
 */
export async function getLatestRate(
  currencyPair: string
): Promise<number | null> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('fx_rates')
      .select('rate')
      .eq('currency_pair', currencyPair)
      .order('date', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      console.error(`Error fetching rate for ${currencyPair}:`, error);
      return null;
    }

    return data.rate;
  } catch (error) {
    console.error('Error in getLatestRate:', error);
    return null;
  }
}

/**
 * Convert amount from one currency to another
 */
export async function convertCurrency(
  options: ConversionOptions
): Promise<number | null> {
  const { fromCurrency, toCurrency, amount, date } = options;

  // Same currency, no conversion needed
  if (fromCurrency === toCurrency) {
    return amount;
  }

  // Build currency pair
  const currencyPair = `${fromCurrency}/${toCurrency}`;

  // Try direct rate
  let rate = await getLatestRate(currencyPair);

  if (rate) {
    return amount * rate;
  }

  // Try reverse rate (e.g., USD/MYR = 1 / MYR/USD)
  const reversePair = `${toCurrency}/${fromCurrency}`;
  const reverseRate = await getLatestRate(reversePair);

  if (reverseRate) {
    return amount / reverseRate;
  }

  console.error(`No rate found for ${currencyPair} or ${reversePair}`);
  return null;
}

/**
 * Get BNM data source attribution
 */
export function getBNMAttribution(): { source: string; url: string } {
  return {
    source: 'Bank Negara Malaysia (BNM)',
    url: 'https://api.bnm.gov.my',
  };
}

