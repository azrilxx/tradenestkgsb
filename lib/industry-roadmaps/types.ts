// Industry Roadmap Types
// Defines the structure for industry-specific roadmaps and strategic priorities

export interface RoadmapPriority {
  id: string;
  name: string;
  description: string;
  category: 'critical_import' | 'dumping_threat' | 'safeguard_measure' | 'industry_growth' | 'technology_adoption';
  severity: 'low' | 'medium' | 'high' | 'critical';
  affectedProducts: string[];
  hsCodes?: string[];
  affectedCountries?: string[];
  timeline: string;
  status: 'active' | 'monitoring' | 'resolved';
}

export interface RoadmapAction {
  id: string;
  name: string;
  description: string;
  priority: number;
  responsibleParty: string;
  deadline: string;
  relatedPriorities: string[];
}

export interface IndustryRoadmap {
  id: string;
  name: string;
  industry: 'steel' | 'chemicals' | 'electronics' | 'textiles' | 'food';
  version: string;
  year: number;
  documentUrl?: string;
  priorities: RoadmapPriority[];
  actions: RoadmapAction[];
  lastUpdated: string;
}

export interface RoadmapComplianceScore {
  totalPriorities: number;
  activeMonitoring: number;
  resolvedIssues: number;
  alertsTriggered: number;
  compliancePercentage: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

