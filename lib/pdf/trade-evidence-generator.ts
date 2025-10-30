import { EvidenceGenerator } from './evidence-generator';
import jsPDF from 'jspdf';
import { format } from 'date-fns';

interface TradeIntelligenceData {
  shipments: any[];
  statistics: {
    totalShipments: number;
    totalValue: number;
    averagePrice: number;
    totalWeight: number;
    dateRange: { start: string | null; end: string | null };
  };
  benchmarks: {
    marketAverage: number;
    percentile25: number;
    percentile50: number;
    percentile75: number;
    percentile90: number;
    peerCompanies: Array<{ name: string; totalValue: number; averagePrice: number }>;
  };
  anomalies: {
    critical: any[];
    high: any[];
    medium: any[];
    total: number;
  };
  filters: {
    hs_code?: string;
    company?: string;
    country?: string;
    port?: string;
    start_date?: string;
    end_date?: string;
  };
}

export class TradeEvidenceGenerator extends EvidenceGenerator {
  /**
   * Generate Trade Intelligence Evidence Report
   */
  generateTradeIntelligenceReport(data: TradeIntelligenceData): Blob {
    // Header
    this.addHeader();

    // Title
    this.addTradeReportTitle(data);

    // Executive Summary
    this.addExecutiveSummary(data);

    // Shipment Details Table
    this.addShipmentDetailsTable(data.shipments.slice(0, 20)); // Limit to first 20

    // Price Analysis
    this.addPriceAnalysis(data);

    // Statistical Summary
    this.addStatisticalSummary(data);

    // Market Benchmarks
    this.addMarketBenchmarks(data);

    // Recommendations
    this.addRecommendations(data);

    // Footer
    this.addFooter();

    return this.doc.output('blob');
  }

  private addTradeReportTitle(data: TradeIntelligenceData) {
    this.doc.setFontSize(18);
    this.doc.setTextColor(17, 24, 39);

    let title = 'Trade Intelligence Evidence Report';
    if (data.filters.hs_code) {
      title += ` - HS Code ${data.filters.hs_code}`;
    }

    this.doc.text(title, this.margin, this.yPosition);
    this.yPosition += 12;

    // Subtitle with date range
    if (data.statistics.dateRange.start && data.statistics.dateRange.end) {
      this.doc.setFontSize(10);
      this.doc.setTextColor(107, 114, 128);
      this.doc.text(
        `${format(new Date(data.statistics.dateRange.start), 'PP')} to ${format(new Date(data.statistics.dateRange.end), 'PP')}`,
        this.margin,
        this.yPosition
      );
    }

    this.yPosition += 12;
  }

  private addExecutiveSummary(data: TradeIntelligenceData) {
    this.doc.setFontSize(16);
    this.doc.setTextColor(17, 24, 39);
    this.doc.text('Executive Summary', this.margin, this.yPosition);
    this.yPosition += 10;

    this.doc.setFontSize(10);
    this.doc.setTextColor(75, 85, 99);

    // Key findings
    const findings: string[] = [
      `Total Shipments Analyzed: ${data.statistics.totalShipments}`,
      `Total Value: RM ${data.statistics.totalValue.toLocaleString()}`,
      `Average Price per kg: RM ${data.statistics.averagePrice.toFixed(2)}`,
      `Anomalies Detected: ${data.anomalies.total} (${data.anomalies.critical.length} Critical, ${data.anomalies.high.length} High, ${data.anomalies.medium.length} Medium)`,
    ];

    if (data.anomalies.critical.length > 0) {
      findings.push(`⚠️ ${data.anomalies.critical.length} shipments show signs of potential dumping (price >30% below market average)`);
    }

    findings.forEach(finding => {
      this.doc.text(finding, this.margin + 5, this.yPosition);
      this.yPosition += 7;
    });

    this.yPosition += 8;
  }

  private addShipmentDetailsTable(shipments: any[]) {
    // Check if we need a new page
    if (this.yPosition > this.pageHeight - 100) {
      this.doc.addPage();
      this.yPosition = this.margin;
    }

    this.doc.setFontSize(16);
    this.doc.setTextColor(17, 24, 39);
    this.doc.text('Shipment Details (Sample)', this.margin, this.yPosition);
    this.yPosition += 10;

    if (!shipments || shipments.length === 0) {
      this.doc.setFontSize(10);
      this.doc.setTextColor(107, 114, 128);
      this.doc.text('No shipments to display', this.margin + 5, this.yPosition);
      this.yPosition += 10;
      return;
    }

    // Table header
    this.doc.setFontSize(8);
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFillColor(55, 65, 81); // Gray-700
    this.doc.rect(this.margin, this.yPosition, this.pageWidth - this.margin * 2, 8, 'F');

    const colWidths = [25, 50, 35, 40, 30];
    const headers = ['Date', 'Company', 'Origin', 'Value', 'Price/kg'];
    let xPos = this.margin + 2;

    headers.forEach((header, idx) => {
      this.doc.text(header, xPos, this.yPosition + 5);
      xPos += colWidths[idx];
    });

    this.yPosition += 9;

    // Table rows
    shipments.forEach((shipment, idx) => {
      // Alternate row colors
      if (idx % 2 === 0) {
        this.doc.setFillColor(249, 250, 251); // Gray-50
        this.doc.rect(this.margin, this.yPosition, this.pageWidth - this.margin * 2, 8, 'F');
      }

      this.doc.setFontSize(7);
      this.doc.setTextColor(17, 24, 39);

      xPos = this.margin + 2;

      // Date
      const dateText = shipment.shipment_date?.substring(0, 10).split('-').join('/') || 'N/A';
      this.doc.text(dateText, xPos, this.yPosition + 5);
      xPos += colWidths[0];

      // Company
      const companyText = shipment.company_name?.substring(0, 20) || 'N/A';
      this.doc.text(companyText, xPos, this.yPosition + 5);
      xPos += colWidths[1];

      // Origin
      const originText = `${shipment.origin_country?.substring(0, 15)}` || 'N/A';
      this.doc.text(originText, xPos, this.yPosition + 5);
      xPos += colWidths[2];

      // Value
      const valueText = `RM ${Math.round(shipment.total_value || 0).toLocaleString()}`;
      this.doc.text(valueText, xPos, this.yPosition + 5);
      xPos += colWidths[3];

      // Price/kg
      const priceText = `RM ${(shipment.unit_price || 0).toFixed(2)}`;
      this.doc.text(priceText, xPos, this.yPosition + 5);

      this.yPosition += 8;

      // Add page break if needed
      if (this.yPosition > this.pageHeight - 30 && idx < shipments.length - 1) {
        this.doc.addPage();
        this.yPosition = this.margin;

        // Re-add header on new page
        this.doc.setFillColor(55, 65, 81);
        this.doc.rect(this.margin, this.yPosition, this.pageWidth - this.margin * 2, 8, 'F');
        xPos = this.margin + 2;
        headers.forEach((header, hIdx) => {
          this.doc.setFontSize(8);
          this.doc.setTextColor(255, 255, 255);
          this.doc.text(header, xPos, this.yPosition + 5);
          xPos += colWidths[hIdx];
        });
        this.yPosition += 9;
      }
    });

    this.yPosition += 10;
  }

  private addPriceAnalysis(data: TradeIntelligenceData) {
    this.doc.setFontSize(16);
    this.doc.setTextColor(17, 24, 39);
    this.doc.text('Price Analysis', this.margin, this.yPosition);
    this.yPosition += 10;

    this.doc.setFontSize(10);

    // Price vs Market
    const deviation = data.statistics.averagePrice - data.benchmarks.marketAverage;
    const deviationPercent = data.benchmarks.marketAverage > 0
      ? ((deviation / data.benchmarks.marketAverage) * 100).toFixed(1)
      : '0';

    const comparison: string[] = [
      `Your Average Price: RM ${data.statistics.averagePrice.toFixed(2)}/kg`,
      `Market Average: RM ${data.benchmarks.marketAverage.toFixed(2)}/kg`,
      `Deviation: ${deviationPercent}% ${Math.sign(parseFloat(deviationPercent)) > 0 ? 'above' : 'below'} market`,
    ];

    if (Math.abs(parseFloat(deviationPercent)) > 30) {
      comparison.push('⚠️ Significant price deviation detected');
    }

    this.doc.setTextColor(75, 85, 99);
    comparison.forEach(line => {
      this.doc.text(line, this.margin + 5, this.yPosition);
      this.yPosition += 6;
    });

    this.yPosition += 8;
  }

  private addStatisticalSummary(data: TradeIntelligenceData) {
    this.doc.setFontSize(16);
    this.doc.setTextColor(17, 24, 39);
    this.doc.text('Statistical Summary', this.margin, this.yPosition);
    this.yPosition += 10;

    this.doc.setFontSize(10);
    this.doc.setTextColor(75, 85, 99);

    const summary: string[] = [
      `Total Weight: ${(data.statistics.totalWeight / 1000).toFixed(1)} tons`,
      `Price Percentiles:`,
      `  - 25th: RM ${data.benchmarks.percentile25.toFixed(2)}`,
      `  - 50th (Median): RM ${data.benchmarks.percentile50.toFixed(2)}`,
      `  - 75th: RM ${data.benchmarks.percentile75.toFixed(2)}`,
      `  - 90th: RM ${data.benchmarks.percentile90.toFixed(2)}`,
    ];

    summary.forEach(line => {
      this.doc.text(line, this.margin + 5, this.yPosition);
      this.yPosition += 6;
    });

    this.yPosition += 8;
  }

  private addMarketBenchmarks(data: TradeIntelligenceData) {
    if (!data.benchmarks.peerCompanies || data.benchmarks.peerCompanies.length === 0) {
      return;
    }

    this.doc.setFontSize(16);
    this.doc.setTextColor(17, 24, 39);
    this.doc.text('Peer Company Comparison', this.margin, this.yPosition);
    this.yPosition += 10;

    this.doc.setFontSize(10);
    this.doc.setTextColor(75, 85, 99);
    this.doc.text('Top companies by import value:', this.margin + 5, this.yPosition);
    this.yPosition += 7;

    data.benchmarks.peerCompanies.slice(0, 5).forEach((company, idx) => {
      this.doc.text(
        `${idx + 1}. ${company.name}: RM ${company.averagePrice.toFixed(2)}/kg avg`,
        this.margin + 10,
        this.yPosition
      );
      this.yPosition += 6;
    });

    this.yPosition += 8;
  }

  private addRecommendations(data: TradeIntelligenceData) {
    this.doc.setFontSize(16);
    this.doc.setTextColor(17, 24, 39);
    this.doc.text('Recommended Actions', this.margin, this.yPosition);
    this.yPosition += 10;

    const recommendations: string[] = [];

    if (data.anomalies.critical.length > 0) {
      recommendations.push(
        `1. Investigate ${data.anomalies.critical.length} critical anomalies showing potential dumping behavior`,
        '2. Consider filing a dumping petition with MITI for extreme cases',
        '3. Gather additional evidence for the identified shipments'
      );
    } else if (data.anomalies.high.length > 0) {
      recommendations.push(
        `1. Monitor ${data.anomalies.high.length} high-risk shipments closely`,
        '2. Collect supporting documentation from customs declarations',
        '3. Engage with trade associations to validate findings'
      );
    } else {
      recommendations.push(
        '1. Continue regular monitoring of imports in this category',
        '2. Set up automated alerts for future anomalies',
        '3. Track market trends for early detection'
      );
    }

    recommendations.push(
      '4. Consult with trade lawyers specializing in anti-dumping cases',
      '5. Coordinate with industry peers on potential joint actions'
    );

    this.doc.setFontSize(10);
    recommendations.forEach(rec => {
      this.doc.setTextColor(55, 65, 81);
      const maxWidth = this.pageWidth - this.margin * 2 - 20;
      const lines = this.doc.splitTextToSize(rec, maxWidth);
      this.doc.text(lines, this.margin + 5, this.yPosition);
      this.yPosition += 6 * lines.length + 2;
    });

    this.yPosition += 8;
  }

  private addFooter() {
    const currentPage = this.doc.getCurrentPageInfo().pageNumber;
    const totalPages = (this.doc as any).internal.pages.length;

    this.doc.setFontSize(8);
    this.doc.setTextColor(107, 114, 128);
    this.doc.text(
      `Page ${currentPage} of ${totalPages}`,
      this.pageWidth - this.margin,
      this.pageHeight - 10,
      { align: 'right' }
    );

    this.doc.text(
      'Generated by Trade Nest Intelligence Platform',
      this.margin,
      this.pageHeight - 10
    );
  }
}

/**
 * Generate and download Trade Intelligence PDF
 */
export async function generateAndDownloadTradeIntelligencePDF(
  data: TradeIntelligenceData,
  filename?: string
) {
  const generator = new TradeEvidenceGenerator();
  const blob = generator.generateTradeIntelligenceReport(data);

  // Create download link
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `trade-intelligence-${data.filters.hs_code || 'report'}-${Date.now()}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
