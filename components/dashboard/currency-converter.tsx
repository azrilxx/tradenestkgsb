'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeftRight, Download, TrendingUp, TrendingDown } from 'lucide-react';

interface ExchangeRate {
  currency_pair: string;
  rate: number;
  date: string;
}

interface ConversionResult {
  amount: number;
  fromCurrency: string;
  toCurrency: string;
  convertedAmount: number;
  rate: number;
  date: string;
}

export function CurrencyConverter() {
  const [rates, setRates] = useState<ExchangeRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [fromCurrency, setFromCurrency] = useState('MYR');
  const [toCurrency, setToCurrency] = useState('USD');
  const [amount, setAmount] = useState('');
  const [result, setResult] = useState<ConversionResult | null>(null);
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkInput, setBulkInput] = useState('');

  useEffect(() => {
    fetchRates();
  }, []);

  const fetchRates = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/data-sources/bnm?action=fetch');
      const data = await response.json();

      if (data.success) {
        setRates(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch rates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConvert = () => {
    if (!amount || parseFloat(amount) <= 0) return;

    const rateObj = rates.find(r => r.currency_pair === `${fromCurrency}/${toCurrency}`);

    if (!rateObj) {
      // Try reverse rate
      const reverseObj = rates.find(r => r.currency_pair === `${toCurrency}/${fromCurrency}`);
      if (reverseObj) {
        const reverseRate = 1 / reverseObj.rate;
        const converted = parseFloat(amount) * reverseRate;
        setResult({
          amount: parseFloat(amount),
          fromCurrency,
          toCurrency,
          convertedAmount: converted,
          rate: reverseRate,
          date: reverseObj.date,
        });
      }
      return;
    }

    const converted = parseFloat(amount) * rateObj.rate;
    setResult({
      amount: parseFloat(amount),
      fromCurrency,
      toCurrency,
      convertedAmount: converted,
      rate: rateObj.rate,
      date: rateObj.date,
    });
  };

  const handleSwap = () => {
    const temp = fromCurrency;
    setFromCurrency(toCurrency);
    setToCurrency(temp);
    setResult(null);
  };

  const availableCurrencies = ['MYR', 'USD', 'CNY', 'EUR', 'SGD', 'JPY', 'GBP'];

  const handleBulkConvert = () => {
    const lines = bulkInput.split('\n').filter(line => line.trim());
    const results = lines.map(line => {
      const value = parseFloat(line.trim());
      if (isNaN(value)) return null;

      const rateObj = rates.find(r => r.currency_pair === `${fromCurrency}/${toCurrency}`);
      if (!rateObj) return null;

      return {
        original: value,
        converted: value * rateObj.rate,
      };
    }).filter(r => r !== null);

    // Download as CSV
    const csv = results.map(r => `${r?.original},${r?.converted?.toFixed(2)}`).join('\n');
    const blob = new Blob([`Original (${fromCurrency}),Converted (${toCurrency})\n${csv}`],
      { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `conversion-${fromCurrency}-to-${toCurrency}.csv`;
    a.click();
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Currency Converter</h3>
          <p className="text-sm text-gray-600">Convert between currencies using BNM exchange rates</p>
        </div>
        <Button
          onClick={() => setBulkMode(!bulkMode)}
          variant="outline"
          size="sm"
        >
          {bulkMode ? 'Single Convert' : 'Bulk Convert'}
        </Button>
      </div>

      {!bulkMode ? (
        <div className="space-y-4">
          {/* Amount Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount
            </label>
            <input
              type="number"
              step="0.01"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* From Currency */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              From Currency
            </label>
            <select
              value={fromCurrency}
              onChange={(e) => setFromCurrency(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {availableCurrencies.map(curr => (
                <option key={curr} value={curr}>{curr}</option>
              ))}
            </select>
          </div>

          {/* Swap Button */}
          <div className="flex justify-center">
            <Button
              onClick={handleSwap}
              variant="outline"
              size="sm"
              className="rounded-full"
            >
              <ArrowLeftRight className="w-4 h-4" />
            </Button>
          </div>

          {/* To Currency */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              To Currency
            </label>
            <select
              value={toCurrency}
              onChange={(e) => setToCurrency(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {availableCurrencies.map(curr => (
                <option key={curr} value={curr}>{curr}</option>
              ))}
            </select>
          </div>

          {/* Convert Button */}
          <Button
            onClick={handleConvert}
            className="w-full bg-blue-600 hover:bg-blue-700"
            disabled={loading || !amount}
          >
            Convert
          </Button>

          {/* Result */}
          {result && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-2xl font-bold text-blue-900 mb-2">
                {result.convertedAmount.toFixed(2)} {result.toCurrency}
              </div>
              <div className="text-sm text-blue-700">
                Rate: {result.rate.toFixed(4)} (as of {new Date(result.date).toLocaleDateString('en-MY')})
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amounts (one per line)
            </label>
            <textarea
              value={bulkInput}
              onChange={(e) => setBulkInput(e.target.value)}
              placeholder="Enter amounts, one per line&#10;1000&#10;2500&#10;15000"
              rows={10}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">From</label>
              <select
                value={fromCurrency}
                onChange={(e) => setFromCurrency(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              >
                {availableCurrencies.map(curr => (
                  <option key={curr} value={curr}>{curr}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">To</label>
              <select
                value={toCurrency}
                onChange={(e) => setToCurrency(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              >
                {availableCurrencies.map(curr => (
                  <option key={curr} value={curr}>{curr}</option>
                ))}
              </select>
            </div>
          </div>

          <Button
            onClick={handleBulkConvert}
            className="w-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            Convert & Download CSV
          </Button>
        </div>
      )}
    </Card>
  );
}

