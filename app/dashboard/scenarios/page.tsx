'use client';

import { WhatIfCalculator } from '@/components/dashboard/what-if-calculator';

export default function ScenariosPage() {
  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Scenario Analysis</h1>
        <p className="text-gray-600 mt-1">
          Run "what-if" analysis to model potential impacts of market changes
        </p>
      </div>
      <WhatIfCalculator />
    </div>
  );
}

