import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { AnomalyType, AnomalySeverity } from '@/types/database';

interface EvidenceData {
  alert: {
    id: string;
    status: string;
    created_at: string;
  };
  anomaly: {
    type: AnomalyType;
    severity: AnomalySeverity;
    detected_at: string;
    details: Record<string, any>;
  };
  product?: {
    hs_code: string;
    description: string;
    category: string;
  };
}

export class EvidenceGenerator {
  private doc: jsPDF;
  private pageWidth: number;
  private pageHeight: number;
  private margin: number;
  private yPosition: number;

  constructor() {
    this.doc = new jsPDF();
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
    this.margin = 20;
    this.yPosition = this.margin;
  }

  /**
   * Generate PDF evidence report for an anomaly
   */
  generateEvidenceReport(data: EvidenceData): Blob {
    // Header
    this.addHeader();

    // Title
    this.addTitle(data.anomaly.type, data.anomaly.severity);

    // Alert Information
    this.addSection('Alert Information', [
      { label: 'Alert ID', value: data.alert.id },
      { label: 'Status', value: data.alert.status.toUpperCase() },
      { label: 'Created', value: format(new Date(data.alert.created_at), 'PPpp') },
      { label: 'Detected', value: format(new Date(data.anomaly.detected_at), 'PPpp') },
    ]);

    // Product Information (if applicable)
    if (data.product) {
      this.addSection('Product Information', [
        { label: 'HS Code', value: data.product.hs_code },
        { label: 'Description', value: data.product.description },
        { label: 'Category', value: data.product.category },
      ]);
    }

    // Anomaly Details
    this.addAnomalyDetails(data.anomaly);

    // Evidence Summary
    this.addEvidenceSummary(data.anomaly);

    // Recommendations
    this.addRecommendations(data.anomaly.type, data.anomaly.severity);

    // Footer
    this.addFooter();

    // Return as Blob
    return this.doc.output('blob');
  }

  private addHeader() {
    // Logo area (text-based)
    this.doc.setFontSize(20);
    this.doc.setTextColor(37, 99, 235); // Blue-600
    this.doc.text('Trade Nest', this.margin, this.yPosition);

    this.doc.setFontSize(10);
    this.doc.setTextColor(107, 114, 128); // Gray-500
    this.doc.text('Trade Anomaly Detection Platform', this.margin, this.yPosition + 6);

    // Date on right
    this.doc.setFontSize(10);
    this.doc.setTextColor(75, 85, 99); // Gray-600
    const dateText = format(new Date(), 'PPP');
    this.doc.text(dateText, this.pageWidth - this.margin, this.yPosition, { align: 'right' });

    // Line separator
    this.yPosition += 15;
    this.doc.setDrawColor(229, 231, 235); // Gray-200
    this.doc.line(this.margin, this.yPosition, this.pageWidth - this.margin, this.yPosition);
    this.yPosition += 10;
  }

  private addTitle(type: AnomalyType, severity: AnomalySeverity) {
    this.doc.setFontSize(18);
    this.doc.setTextColor(17, 24, 39); // Gray-900

    const typeLabel = this.getTypeLabel(type);
    this.doc.text(`${typeLabel} - Evidence Report`, this.margin, this.yPosition);

    // Severity badge
    this.yPosition += 2;
    const severityColor = this.getSeverityColor(severity);
    this.doc.setFillColor(severityColor.r, severityColor.g, severityColor.b);
    this.doc.roundedRect(this.margin, this.yPosition, 40, 8, 2, 2, 'F');

    this.doc.setFontSize(10);
    this.doc.setTextColor(255, 255, 255);
    this.doc.text(severity.toUpperCase(), this.margin + 20, this.yPosition + 5.5, { align: 'center' });

    this.yPosition += 15;
  }

  private addSection(title: string, items: { label: string; value: string }[]) {
    // Section title
    this.doc.setFontSize(14);
    this.doc.setTextColor(55, 65, 81); // Gray-700
    this.doc.text(title, this.margin, this.yPosition);
    this.yPosition += 8;

    // Section items
    this.doc.setFontSize(10);
    items.forEach(item => {
      this.doc.setTextColor(107, 114, 128); // Gray-500
      this.doc.text(`${item.label}:`, this.margin + 5, this.yPosition);

      this.doc.setTextColor(17, 24, 39); // Gray-900
      const labelWidth = this.doc.getTextWidth(`${item.label}:`) + 5;

      // Handle long values with text wrapping
      const maxWidth = this.pageWidth - this.margin * 2 - labelWidth - 10;
      const lines = this.doc.splitTextToSize(item.value, maxWidth);
      this.doc.text(lines, this.margin + 5 + labelWidth, this.yPosition);

      this.yPosition += 6 * lines.length;
    });

    this.yPosition += 5;
  }

  private addAnomalyDetails(anomaly: { type: AnomalyType; details: Record<string, any> }) {
    this.doc.setFontSize(14);
    this.doc.setTextColor(55, 65, 81);
    this.doc.text('Anomaly Details', this.margin, this.yPosition);
    this.yPosition += 8;

    this.doc.setFontSize(10);
    const details = anomaly.details;

    // Type-specific details
    switch (anomaly.type) {
      case 'price_spike':
        this.addDetailLine('Previous Price', this.formatCurrency(details.previous_price || details.average_price));
        this.addDetailLine('Current Price', this.formatCurrency(details.current_price));
        this.addDetailLine('Change', `${this.formatNumber(details.percentage_change)}%`);
        this.addDetailLine('Z-Score', this.formatNumber(details.z_score));
        this.addDetailLine('Threshold', this.formatNumber(details.threshold || 2.0));
        break;

      case 'tariff_change':
        this.addDetailLine('Previous Rate', `${this.formatNumber(details.previous_rate)}%`);
        this.addDetailLine('Current Rate', `${this.formatNumber(details.current_rate)}%`);
        this.addDetailLine('Change', `${this.formatNumber(details.percentage_change)}%`);
        this.addDetailLine('Effective Date', details.effective_date || 'N/A');
        break;

      case 'freight_surge':
        this.addDetailLine('Route', details.route || 'N/A');
        this.addDetailLine('Previous Index', this.formatNumber(details.previous_index || details.average_index));
        this.addDetailLine('Current Index', this.formatNumber(details.current_index));
        this.addDetailLine('Change', `${this.formatNumber(details.percentage_change)}%`);
        break;

      case 'fx_volatility':
        this.addDetailLine('Currency Pair', details.currency_pair || 'N/A');
        this.addDetailLine('Current Rate', this.formatNumber(details.current_rate));
        this.addDetailLine('Average Rate', this.formatNumber(details.average_rate));
        this.addDetailLine('Volatility', `${this.formatNumber(details.volatility)}%`);
        this.addDetailLine('Rate Range', details.rate_range || 'N/A');
        break;
    }

    this.yPosition += 5;
  }

  private addDetailLine(label: string, value: string) {
    this.doc.setTextColor(107, 114, 128);
    this.doc.text(`${label}:`, this.margin + 5, this.yPosition);

    this.doc.setTextColor(17, 24, 39);
    this.doc.text(value, this.margin + 60, this.yPosition);

    this.yPosition += 6;
  }

  private addEvidenceSummary(anomaly: { type: AnomalyType; severity: AnomalySeverity; details: Record<string, any> }) {
    this.doc.setFontSize(14);
    this.doc.setTextColor(55, 65, 81);
    this.doc.text('Evidence Summary', this.margin, this.yPosition);
    this.yPosition += 8;

    this.doc.setFontSize(10);
    this.doc.setTextColor(75, 85, 99);

    const summary = this.generateSummary(anomaly);
    const lines = this.doc.splitTextToSize(summary, this.pageWidth - this.margin * 2 - 10);
    this.doc.text(lines, this.margin + 5, this.yPosition);

    this.yPosition += 6 * lines.length + 5;
  }

  private addRecommendations(type: AnomalyType, severity: AnomalySeverity) {
    this.doc.setFontSize(14);
    this.doc.setTextColor(55, 65, 81);
    this.doc.text('Recommended Actions', this.margin, this.yPosition);
    this.yPosition += 8;

    this.doc.setFontSize(10);
    const recommendations = this.getRecommendations(type, severity);

    recommendations.forEach((rec, index) => {
      this.doc.setTextColor(107, 114, 128);
      this.doc.text(`${index + 1}.`, this.margin + 5, this.yPosition);

      this.doc.setTextColor(75, 85, 99);
      const lines = this.doc.splitTextToSize(rec, this.pageWidth - this.margin * 2 - 15);
      this.doc.text(lines, this.margin + 12, this.yPosition);

      this.yPosition += 6 * lines.length + 2;
    });

    this.yPosition += 5;
  }

  private addFooter() {
    const footerY = this.pageHeight - 20;

    this.doc.setDrawColor(229, 231, 235);
    this.doc.line(this.margin, footerY - 5, this.pageWidth - this.margin, footerY - 5);

    this.doc.setFontSize(9);
    this.doc.setTextColor(156, 163, 175); // Gray-400
    this.doc.text(
      'Generated with Trade Nest - Trade Anomaly Detection Platform',
      this.pageWidth / 2,
      footerY,
      { align: 'center' }
    );

    this.doc.text(
      `Page 1 of 1`,
      this.pageWidth - this.margin,
      footerY,
      { align: 'right' }
    );
  }

  private getTypeLabel(type: AnomalyType): string {
    const labels: Record<AnomalyType, string> = {
      price_spike: 'Price Spike Alert',
      tariff_change: 'Tariff Change Alert',
      freight_surge: 'Freight Cost Surge Alert',
      fx_volatility: 'FX Volatility Alert',
    };
    return labels[type];
  }

  private getSeverityColor(severity: AnomalySeverity): { r: number; g: number; b: number } {
    const colors: Record<AnomalySeverity, { r: number; g: number; b: number }> = {
      critical: { r: 220, g: 38, b: 38 }, // Red-600
      high: { r: 234, g: 88, b: 12 }, // Orange-600
      medium: { r: 202, g: 138, b: 4 }, // Yellow-600
      low: { r: 37, g: 99, b: 235 }, // Blue-600
    };
    return colors[severity];
  }

  private generateSummary(anomaly: { type: AnomalyType; severity: AnomalySeverity; details: Record<string, any> }): string {
    const details = anomaly.details;

    switch (anomaly.type) {
      case 'price_spike':
        return `A ${anomaly.severity} severity price spike was detected. The current price of ${this.formatCurrency(details.current_price)} represents a ${this.formatNumber(details.percentage_change)}% increase from the baseline of ${this.formatCurrency(details.previous_price || details.average_price)}. This deviation has a Z-score of ${this.formatNumber(details.z_score)}, which exceeds the threshold of ${details.threshold || 2.0} standard deviations.`;

      case 'tariff_change':
        return `A tariff rate change of ${this.formatNumber(details.percentage_change)}% was detected, with rates moving from ${this.formatNumber(details.previous_rate)}% to ${this.formatNumber(details.current_rate)}%. This change became effective on ${details.effective_date} and requires immediate attention for import cost planning.`;

      case 'freight_surge':
        return `Freight costs on the ${details.route} route have surged by ${this.formatNumber(details.percentage_change)}%. The freight index increased from ${this.formatNumber(details.previous_index || details.average_index)} to ${this.formatNumber(details.current_index)}, indicating significant market pressure on this shipping route.`;

      case 'fx_volatility':
        return `High volatility detected in ${details.currency_pair} exchange rate. Current volatility of ${this.formatNumber(details.volatility)}% exceeds normal thresholds. The rate has fluctuated within a range of ${details.rate_range}, posing currency risk for transactions.`;

      default:
        return 'An anomaly was detected that requires review.';
    }
  }

  private getRecommendations(type: AnomalyType, severity: AnomalySeverity): string[] {
    const recs: Record<AnomalyType, string[]> = {
      price_spike: [
        'Review supplier contracts and consider renegotiation',
        'Investigate alternative suppliers or products',
        'Assess impact on profit margins and adjust pricing if needed',
        severity === 'critical' || severity === 'high' ? 'Consider hedging strategies or forward contracts' : 'Monitor price trends for next 30 days',
        'Document this anomaly for compliance and audit purposes'
      ],
      tariff_change: [
        'Update import cost calculations immediately',
        'Review customs classifications for affected products',
        'Consult with customs broker on compliance requirements',
        'Assess impact on total landed cost',
        'Consider alternative sourcing countries with favorable trade agreements'
      ],
      freight_surge: [
        'Evaluate alternative shipping routes',
        'Consider bulk shipping or consolidation opportunities',
        'Review freight contracts and negotiate rates',
        'Assess inventory levels and optimize order timing',
        'Monitor freight market trends for stabilization'
      ],
      fx_volatility: [
        'Implement currency hedging strategies',
        'Review payment terms with suppliers',
        'Consider forward contracts for large transactions',
        'Monitor exchange rates daily',
        'Consult with treasury or finance team on risk management'
      ],
    };

    return recs[type];
  }

  private formatCurrency(value: number | undefined): string {
    if (value === undefined) return 'N/A';
    return `MYR ${value.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  private formatNumber(value: number | undefined): string {
    if (value === undefined) return 'N/A';
    return value.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
}

/**
 * Generate and download PDF evidence report
 */
export function generateAndDownloadEvidence(data: EvidenceData, filename?: string) {
  const generator = new EvidenceGenerator();
  const blob = generator.generateEvidenceReport(data);

  // Create download link
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `evidence-${data.alert.id}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}