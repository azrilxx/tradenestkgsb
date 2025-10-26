// Malaysia-Focused Port Data
// Task 6.1: Company & Transaction Drill-Down

export interface PortTemplate {
  name: string;
  code: string;
  country: string;
  type: string;
}

// 25 ports: 6 Malaysian + 19 major trading partner ports
export const MALAYSIA_PORTS: PortTemplate[] = [
  // =====================================================
  // MALAYSIAN PORTS (6) - Primary hubs
  // =====================================================
  { name: 'Port Klang', code: 'MYPKG', country: 'Malaysia', type: 'container' },
  { name: 'Penang Port', code: 'MYPEN', country: 'Malaysia', type: 'container' },
  { name: 'Johor Port', code: 'MYJHB', country: 'Malaysia', type: 'container' },
  { name: 'Kuantan Port', code: 'MYKUA', country: 'Malaysia', type: 'bulk' },
  { name: 'Bintulu Port', code: 'MYBTU', country: 'Malaysia', type: 'oil' },
  { name: 'Tanjung Pelepas', code: 'MYTPP', country: 'Malaysia', type: 'container' },

  // =====================================================
  // CHINA PORTS (5) - Major trading partner
  // =====================================================
  { name: 'Shanghai Port', code: 'CNSHA', country: 'China', type: 'container' },
  { name: 'Shenzhen Port', code: 'CNSZN', country: 'China', type: 'container' },
  { name: 'Ningbo Port', code: 'CNNGB', country: 'China', type: 'container' },
  { name: 'Qingdao Port', code: 'CNTAO', country: 'China', type: 'container' },
  { name: 'Guangzhou Port', code: 'CNGZG', country: 'China', type: 'container' },

  // =====================================================
  // SINGAPORE (1) - Re-export hub
  // =====================================================
  { name: 'Port of Singapore', code: 'SGSIN', country: 'Singapore', type: 'container' },

  // =====================================================
  // ASEAN PORTS (4) - Regional trade
  // =====================================================
  { name: 'Port of Bangkok', code: 'THBKK', country: 'Thailand', type: 'container' },
  { name: 'Ho Chi Minh Port', code: 'VNSGN', country: 'Vietnam', type: 'container' },
  { name: 'Jakarta Port', code: 'IDJKT', country: 'Indonesia', type: 'container' },
  { name: 'Manila Port', code: 'PHMNL', country: 'Philippines', type: 'container' },

  // =====================================================
  // ASIA-PACIFIC PORTS (4) - High-value goods
  // =====================================================
  { name: 'Tokyo Port', code: 'JPTYO', country: 'Japan', type: 'container' },
  { name: 'Busan Port', code: 'KRPUS', country: 'South Korea', type: 'container' },
  { name: 'Hong Kong Port', code: 'HKHKG', country: 'Hong Kong', type: 'container' },
  { name: 'Sydney Port', code: 'AUSYD', country: 'Australia', type: 'container' },

  // =====================================================
  // EUROPEAN PORTS (3) - Long-haul trade
  // =====================================================
  { name: 'Port of Rotterdam', code: 'NLRTM', country: 'Netherlands', type: 'container' },
  { name: 'Port of Hamburg', code: 'DEHAM', country: 'Germany', type: 'container' },
  { name: 'Port of Antwerp', code: 'BEANR', country: 'Belgium', type: 'container' },

  // =====================================================
  // AMERICAS PORTS (2) - Agricultural commodities
  // =====================================================
  { name: 'Port of Los Angeles', code: 'USLAX', country: 'United States', type: 'container' },
  { name: 'Port of Santos', code: 'BRSSZ', country: 'Brazil', type: 'container' },
];

// Verify count
console.log('Malaysia Port Distribution:', {
  malaysian: MALAYSIA_PORTS.filter(p => p.country === 'Malaysia').length,
  international: MALAYSIA_PORTS.filter(p => p.country !== 'Malaysia').length,
  total: MALAYSIA_PORTS.length
});
// Expected: Malaysian: 6, International: 19, Total: 25
