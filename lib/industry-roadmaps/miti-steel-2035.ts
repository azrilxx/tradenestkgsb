// MITI Steel Industry Roadmap 2035
// Extracted from: https://www.miti.gov.my/miti/resources/E-VERSION_STEEL_INDUSTRY_ROADMAP_2035_V11_FAOL.pdf
// Strategic priorities for Malaysian steel industry development

import { IndustryRoadmap, RoadmapPriority, RoadmapAction } from './types';

export const MITI_STEEL_2035_PRIORITIES: RoadmapPriority[] = [
  // Critical Imports that Malaysia needs to address
  {
    id: 'critical-flat-rolled',
    name: 'Flat-Rolled Steel Products',
    description: 'Malaysia has high dependency on imported flat-rolled steel, particularly from China. Need to develop domestic capacity or secure reliable supply chains.',
    category: 'critical_import',
    severity: 'high',
    affectedProducts: ['Cold-rolled steel', 'Hot-rolled steel', 'Galvanized steel'],
    hsCodes: ['7208', '7209', '7210'],
    affectedCountries: ['China', 'South Korea', 'Japan'],
    timeline: '2025-2030',
    status: 'active',
  },
  {
    id: 'critical-rebar',
    name: 'Rebar (Reinforcing Steel)',
    description: 'Critical component for construction industry. Need stable supply and competitive pricing.',
    category: 'critical_import',
    severity: 'high',
    affectedProducts: ['Reinforcing bars', 'Wire rods'],
    hsCodes: ['7214', '7213'],
    affectedCountries: ['China', 'Turkey', 'Russia'],
    timeline: '2025-2030',
    status: 'active',
  },
  {
    id: 'critical-wire-rod',
    name: 'Wire Rod and Wire Products',
    description: 'Essential for manufacturing sector. Subject to frequent dumping cases.',
    category: 'critical_import',
    severity: 'medium',
    affectedProducts: ['Wire rods', 'Steel wire'],
    hsCodes: ['7213', '7217'],
    affectedCountries: ['China', 'Indonesia'],
    timeline: '2025-2030',
    status: 'active',
  },

  // Dumping Threats
  {
    id: 'dumping-china-flat-rolled',
    name: 'Chinese Flat-Rolled Steel Dumping',
    description: 'Persistent issue of Chinese steel being dumped in Malaysian market, causing material injury to domestic producers.',
    category: 'dumping_threat',
    severity: 'critical',
    affectedProducts: ['Flat-rolled products', 'Cold-rolled steel', 'Hot-rolled steel'],
    hsCodes: ['7208', '7209'],
    affectedCountries: ['China'],
    timeline: 'Ongoing',
    status: 'active',
  },
  {
    id: 'dumping-china-rebar',
    name: 'Chinese Rebar Dumping',
    description: 'Chinese rebar entering at artificially low prices, undercutting local producers.',
    category: 'dumping_threat',
    severity: 'critical',
    affectedProducts: ['Rebar', 'Reinforcing bars'],
    hsCodes: ['7214'],
    affectedCountries: ['China'],
    timeline: 'Ongoing',
    status: 'active',
  },
  {
    id: 'dumping-china-coated',
    name: 'Coated Steel Products from China',
    description: 'Chinese coated steel (galvanized, painted) with suspected subsidies and dumping.',
    category: 'dumping_threat',
    severity: 'high',
    affectedProducts: ['Galvanized steel', 'Color-coated steel', 'Prepainted steel'],
    hsCodes: ['7210', '7212'],
    affectedCountries: ['China'],
    timeline: 'Ongoing',
    status: 'active',
  },

  // Safeguard Measures
  {
    id: 'safeguard-stainless',
    name: 'Stainless Steel Safeguard',
    description: 'Need for safeguard measures on stainless steel products to protect domestic industry.',
    category: 'safeguard_measure',
    severity: 'medium',
    affectedProducts: ['Stainless steel flat products', 'Stainless steel pipes'],
    hsCodes: ['7219', '7220'],
    affectedCountries: ['All countries'],
    timeline: '2025-2027',
    status: 'monitoring',
  },
  {
    id: 'safeguard-steel-pipes',
    name: 'Steel Pipes and Tubes Safeguard',
    description: 'Monitoring steel pipe imports for potential safeguard investigation.',
    category: 'safeguard_measure',
    severity: 'medium',
    affectedProducts: ['Steel pipes', 'Steel tubes', 'Seamless pipes'],
    hsCodes: ['7304', '7305', '7306'],
    affectedCountries: ['All countries'],
    timeline: '2025-2027',
    status: 'monitoring',
  },

  // Industry Growth Priorities
  {
    id: 'growth-high-grade',
    name: 'High-Grade Steel Production',
    description: 'Develop capacity for high-grade steel products (automotive, aerospace grades).',
    category: 'industry_growth',
    severity: 'medium',
    affectedProducts: ['High-tensile steel', 'Automotive steel', 'Aerospace steel'],
    hsCodes: ['7214', '7215', '7219'],
    affectedCountries: [],
    timeline: '2025-2030',
    status: 'monitoring',
  },
  {
    id: 'growth-recycled',
    name: 'Recycled Steel Production',
    description: 'Increase use of recycled steel to reduce environmental impact and costs.',
    category: 'industry_growth',
    severity: 'low',
    affectedProducts: ['Scrap-based steel', 'Recycled rebar'],
    hsCodes: ['7208', '7214'],
    affectedCountries: [],
    timeline: '2025-2035',
    status: 'monitoring',
  },
];

export const MITI_STEEL_2035_ACTIONS: RoadmapAction[] = [
  {
    id: 'action-1',
    name: 'Monitor Chinese Steel Imports',
    description: 'Implement continuous monitoring of Chinese flat-rolled steel imports for dumping indicators',
    priority: 1,
    responsibleParty: 'MITI / Domestic Steel Producers',
    deadline: '2025-12-31',
    relatedPriorities: ['dumping-china-flat-rolled', 'dumping-china-rebar'],
  },
  {
    id: 'action-2',
    name: 'Initiate Anti-Dumping Investigation',
    description: 'File petition for anti-dumping investigation on Chinese rebar if dumping margin exceeds 15%',
    priority: 1,
    responsibleParty: 'Domestic Steel Producers Association',
    deadline: '2025-06-30',
    relatedPriorities: ['dumping-china-rebar'],
  },
  {
    id: 'action-3',
    name: 'Gazette Compliance Monitoring',
    description: 'Track all Federal Gazette publications related to steel trade remedies',
    priority: 2,
    responsibleParty: 'MITI / Industry Stakeholders',
    deadline: 'Ongoing',
    relatedPriorities: ['critical-flat-rolled', 'critical-rebar', 'safeguard-stainless'],
  },
  {
    id: 'action-4',
    name: 'Diversify Import Sources',
    description: 'Reduce dependency on Chinese steel by identifying alternative suppliers',
    priority: 2,
    responsibleParty: 'Industry Importers',
    deadline: '2025-09-30',
    relatedPriorities: ['critical-flat-rolled', 'critical-rebar'],
  },
  {
    id: 'action-5',
    name: 'Safeguard Investigation Preparation',
    description: 'Prepare case for safeguard measure on stainless steel products',
    priority: 3,
    responsibleParty: 'Stainless Steel Producers',
    deadline: '2026-03-31',
    relatedPriorities: ['safeguard-stainless'],
  },
];

export const MITI_STEEL_2035_ROADMAP: IndustryRoadmap = {
  id: 'miti-steel-2035',
  name: 'Malaysian Steel Industry Roadmap 2035',
  industry: 'steel',
  version: 'V1.1',
  year: 2035,
  documentUrl: 'https://www.miti.gov.my/miti/resources/E-VERSION_STEEL_INDUSTRY_ROADMAP_2035_V11_FAOL.pdf',
  priorities: MITI_STEEL_2035_PRIORITIES,
  actions: MITI_STEEL_2035_ACTIONS,
  lastUpdated: '2024-01-15',
};

// Helper functions
export function getPriorityById(id: string): RoadmapPriority | undefined {
  return MITI_STEEL_2035_PRIORITIES.find(p => p.id === id);
}

export function getPrioritiesByCategory(category: RoadmapPriority['category']): RoadmapPriority[] {
  return MITI_STEEL_2035_PRIORITIES.filter(p => p.category === category);
}

export function getCriticalPriorities(): RoadmapPriority[] {
  return MITI_STEEL_2035_PRIORITIES.filter(p => p.severity === 'critical' || p.severity === 'high');
}

export function getActiveDumpingThreats(): RoadmapPriority[] {
  return MITI_STEEL_2035_PRIORITIES.filter(
    p => p.category === 'dumping_threat' && p.status === 'active'
  );
}

export function calculateComplianceScore(): {
  totalPriorities: number;
  activeMonitoring: number;
  resolvedIssues: number;
  alertsTriggered: number;
  compliancePercentage: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
} {
  const total = MITI_STEEL_2035_PRIORITIES.length;
  const active = MITI_STEEL_2035_PRIORITIES.filter(p => p.status === 'active').length;
  const resolved = MITI_STEEL_2035_PRIORITIES.filter(p => p.status === 'resolved').length;
  const critical = MITI_STEEL_2035_PRIORITIES.filter(p => p.severity === 'critical').length;
  const high = MITI_STEEL_2035_PRIORITIES.filter(p => p.severity === 'high').length;

  // Compliance percentage based on resolved vs active issues
  const compliancePercentage = resolved > 0 ? Math.round((resolved / total) * 100) : 0;

  // Risk level based on critical and high severity issues
  let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
  if (critical > 2) {
    riskLevel = 'critical';
  } else if (critical > 0 || high > 3) {
    riskLevel = 'high';
  } else if (high > 0 || active > total / 2) {
    riskLevel = 'medium';
  }

  return {
    totalPriorities: total,
    activeMonitoring: active,
    resolvedIssues: resolved,
    alertsTriggered: critical + high,
    compliancePercentage,
    riskLevel,
  };
}

