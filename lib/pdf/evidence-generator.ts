import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { AnomalyType, AnomalySeverity } from '@/types/database';
import { generateLineChartSVG, generateRangeChartSVG, generateChartDescription } from './chart-generator';
import { calculateQScore, validateAndEnhanceReport } from '@/lib/quality/q-score-validator';

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
  protected doc: jsPDF;
  protected pageWidth: number;
  protected pageHeight: number;
  protected margin: number;
  protected yPosition: number;

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

    // ✅ PREMIUM: Add Historical Chart for FX Volatility
    if (data.anomaly.type === 'fx_volatility' && data.anomaly.details.historical_data) {
      this.addHistoricalChart(data.anomaly.details);
    }

    // Evidence Summary
    this.addEvidenceSummary(data.anomaly);

    // ✅ PREMIUM: Add Q-Score validation badge
    const validation = calculateQScore(data);
    this.addQualityScore(validation);

    // Recommendations
    this.addAnomalyRecommendations(data.anomaly.type, data.anomaly.severity);

    // Footer
    this.addFooter();

    // Return as Blob
    return this.doc.output('blob');
  }

  protected addHeader() {
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

  private addTextSection(title: string, textLines: string[]) {
    // Section title
    this.doc.setFontSize(14);
    this.doc.setTextColor(55, 65, 81); // Gray-700
    this.doc.text(title, this.margin, this.yPosition);
    this.yPosition += 8;

    // Text lines
    this.doc.setFontSize(10);
    this.doc.setTextColor(17, 24, 39); // Gray-900
    textLines.forEach(line => {
      if (line === '') {
        this.yPosition += 3;
      } else {
        const maxWidth = this.pageWidth - this.margin * 2;
        const lines = this.doc.splitTextToSize(line, maxWidth);
        this.doc.text(lines, this.margin + 5, this.yPosition);
        this.yPosition += 6 * lines.length;
      }
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

        // Show warning if data is estimated
        if (details.warning) {
          this.doc.setTextColor(234, 88, 12); // Orange for warnings
          const warningText = this.doc.splitTextToSize(
            `⚠️ ${details.warning}`,
            this.pageWidth - this.margin * 2 - 60
          );
          this.doc.text(warningText, this.margin + 5, this.yPosition);
          this.yPosition += 6 * warningText.length;
          this.doc.setTextColor(17, 24, 39); // Reset to black
        }

        this.addDetailLine('Current Rate', this.formatNumber(details.current_rate));
        this.addDetailLine('Average Rate', this.formatNumber(details.average_rate));
        this.addDetailLine('Volatility', `${this.formatNumber(details.volatility)}%`);
        this.addDetailLine('Rate Range', details.rate_range || 'N/A');
        this.addDetailLine('Trend', (details.trend || 'stable').charAt(0).toUpperCase() + (details.trend || 'stable').slice(1));

        if (details.sample_size) {
          this.addDetailLine('Sample Size', `${details.sample_size} days`);
        }
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

  protected addAnomalyRecommendations(type: AnomalyType, severity: AnomalySeverity) {
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

  protected addFooter() {
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

  // ✅ PREMIUM: Add historical chart section
  private addHistoricalChart(details: Record<string, any>) {
    if (!details.historical_data || details.historical_data.length === 0) {
      return;
    }

    this.yPosition += 10;
    this.doc.setFontSize(14);
    this.doc.setTextColor(55, 65, 81);
    this.doc.text('Historical Context', this.margin, this.yPosition);
    this.yPosition += 8;

    // Generate chart description since jsPDF doesn't support SVG directly
    const chartData = {
      labels: details.historical_data.map((d: any) => new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
      values: details.historical_data.map((d: any) => parseFloat(d.rate)),
      datasetLabel: details.currency_pair || 'Rate',
    };

    const chartDescription = generateChartDescription(chartData, 'line');

    this.doc.setFontSize(10);
    this.doc.setTextColor(75, 85, 99);
    const lines = this.doc.splitTextToSize(chartDescription, this.pageWidth - this.margin * 2 - 10);
    this.doc.text(lines, this.margin + 5, this.yPosition);
    this.yPosition += 6 * lines.length;

    // Add key statistics
    this.yPosition += 5;
    this.doc.setFontSize(12);
    this.doc.setTextColor(55, 65, 81);
    this.doc.text('Key Statistics:', this.margin, this.yPosition);
    this.yPosition += 6;

    this.doc.setFontSize(10);
    this.addDetailLine('7-Day Average', details.average_rate?.toFixed(6) || 'N/A');
    this.addDetailLine('Trend', details.trend || 'N/A');
    this.addDetailLine('Percentage Change', details.percentage_change ? `${details.percentage_change}%` : 'N/A');
    this.addDetailLine('Volatility', details.volatility ? `${details.volatility}%` : 'N/A');
    this.addDetailLine('Sample Size', details.sample_size ? `${details.sample_size} days` : 'N/A');

    this.yPosition += 5;
  }

  // ✅ PREMIUM: Add quality score badge
  private addQualityScore(validation: any) {
    if (!validation || !validation.qScore) {
      return;
    }

    this.yPosition += 5;

    // Quality Score Box
    this.doc.setFontSize(14);
    this.doc.setTextColor(55, 65, 81);
    this.doc.text('Quality Validation', this.margin, this.yPosition);
    this.yPosition += 8;

    // Q-Score with color-coded badge
    const qScore = validation.qScore;
    let badgeColor: { r: number; g: number; b: number };

    if (qScore >= 90) {
      badgeColor = { r: 16, g: 185, b: 129 }; // Green-500
    } else if (qScore >= 85) {
      badgeColor = { r: 59, g: 130, b: 246 }; // Blue-500
    } else if (qScore >= 75) {
      badgeColor = { r: 245, g: 158, b: 11 }; // Amber-500
    } else {
      badgeColor = { r: 239, g: 68, b: 68 }; // Red-500
    }

    this.doc.setFillColor(badgeColor.r, badgeColor.g, badgeColor.b);
    this.doc.roundedRect(this.margin + 5, this.yPosition, 60, 8, 2, 2, 'F');

    this.doc.setFontSize(11);
    this.doc.setTextColor(255, 255, 255);
    this.doc.text(`Q-Score: ${qScore}/100`, this.margin + 35, this.yPosition + 5.5, { align: 'center' });

    this.yPosition += 10;

    // Show breakdown
    if (validation.breakdown) {
      this.doc.setFontSize(10);
      this.doc.setTextColor(107, 114, 128);
      this.doc.text('Quality Breakdown:', this.margin + 5, this.yPosition);
      this.yPosition += 6;

      this.doc.setFontSize(9);
      const breakdown = validation.breakdown;
      this.doc.text(`• Data Quality: ${breakdown.dataQuality.toFixed(0)}/100`, this.margin + 10, this.yPosition);
      this.yPosition += 5;
      this.doc.text(`• Statistical Rigor: ${breakdown.statisticalRigor.toFixed(0)}/100`, this.margin + 10, this.yPosition);
      this.yPosition += 5;
      this.doc.text(`• AI Enhancement: ${breakdown.aiEnhancement.toFixed(0)}/100`, this.margin + 10, this.yPosition);
      this.yPosition += 5;
      this.doc.text(`• Visual Presentation: ${breakdown.visualPresentation.toFixed(0)}/100`, this.margin + 10, this.yPosition);

      this.yPosition += 5;
    }
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
        const trendInfo = details.trend === 'strengthening' ? 'trending upward'
          : details.trend === 'weakening' ? 'trending downward'
            : 'relatively stable';
        const dataQualityNote = details.warning
          ? ` Note: ${details.warning.toLowerCase()} - values are estimated.`
          : '';
        const sampleNote = details.sample_size > 0
          ? ` Analysis based on ${details.sample_size} days of historical data.`
          : '';

        return `High volatility detected in ${details.currency_pair} exchange rate. Current volatility of ${this.formatNumber(details.volatility)}% exceeds normal thresholds. The rate has fluctuated within a range of ${details.rate_range}, ${trendInfo}, posing currency risk for transactions.${dataQualityNote}${sampleNote}`;

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

  private formatCurrency(value: number | string | undefined): string {
    if (value === undefined || value === 'N/A') return 'N/A';
    if (typeof value === 'string') {
      const numValue = parseFloat(value);
      if (isNaN(numValue)) return value;
      return `MYR ${numValue.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `MYR ${value.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  private formatNumber(value: number | string | undefined): string {
    if (value === undefined || value === 'N/A') return 'N/A';
    if (typeof value === 'string') {
      const numValue = parseFloat(value);
      if (isNaN(numValue)) return value; // Return original string if not numeric
      return numValue.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    return value.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  /**
   * Generate Trade Remedy Report for anti-dumping cases
   */
  generateTradeRemedyReport(data: {
    caseName: string;
    petitionerName?: string;
    subjectProduct?: string;
    hsCode?: string;
    countryOfOrigin?: string;
    exportPrice: number;
    normalValue: number;
    dumpingMargin: number;
    priceDepression: number;
    volumeImpact?: number;
    estimatedRevenueLoss?: number;
    causation: string;
    recommendedMeasures: {
      measures: string[];
      duration: string;
      justification: string;
    };
    severity: {
      level: string;
      description: string;
    };
    currency?: string;
  }): Blob {
    // Reset for new document
    this.yPosition = this.margin;

    // Header
    this.addHeader();
    this.yPosition += 5;

    // Title
    this.doc.setFontSize(18);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Trade Remedy Evidence Report', this.margin, this.yPosition);
    this.yPosition += 12;

    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(100, 100, 100);
    this.doc.text(
      `Case: ${data.caseName}`,
      this.margin,
      this.yPosition
    );
    this.yPosition += 15;

    // Executive Summary
    this.addTextSection('Executive Summary', [
      `Petitioner: ${data.petitionerName || 'Not specified'}`,
      `Subject Product: ${data.subjectProduct || 'Not specified'}`,
      `HS Code: ${data.hsCode || 'Not specified'}`,
      `Country of Origin: ${data.countryOfOrigin || 'Not specified'}`,
      '',
      `Dumping Margin: ${data.dumpingMargin.toFixed(2)}%`,
      `Severity Assessment: ${data.severity.level.toUpperCase()}`,
      data.severity.description,
    ]);
    this.yPosition += 5;

    // Dumping Analysis
    this.addTextSection('Dumping Analysis', [
      'Calculation: Dumping Margin = (Export Price - Normal Value) / Normal Value × 100',
      '',
      `Export Price: ${data.currency || 'USD'} ${data.exportPrice.toFixed(2)}`,
      `Normal Value (Fair Price): ${data.currency || 'USD'} ${data.normalValue.toFixed(2)}`,
      `Dumping Amount: ${data.currency || 'USD'} ${(data.exportPrice - data.normalValue).toFixed(2)}`,
      `Dumping Margin: ${data.dumpingMargin.toFixed(2)}%`,
      `Price Depression: ${data.priceDepression.toFixed(2)}%`,
    ]);

    // Volume Impact
    if (data.volumeImpact) {
      this.addTextSection('Volume Impact', [
        `Import volume change: ${data.volumeImpact > 0 ? '+' : ''}${data.volumeImpact.toFixed(1)}%`,
        data.volumeImpact > 30
          ? 'Significant volume surge indicating market disruption'
          : 'Moderate volume impact',
      ]);
    }

    // Injury Analysis
    if (data.estimatedRevenueLoss) {
      this.addTextSection('Estimated Injury Impact', [
        `Estimated Revenue Loss: ${data.currency || 'USD'} ${data.estimatedRevenueLoss.toLocaleString()}`,
        'Injury established through:',
        '- Market share loss',
        '- Price depression',
        '- Profit margin erosion',
        '- Volume impact on domestic industry',
      ]);
    }

    // Causation
    this.addTextSection('Causation Analysis', [data.causation]);

    // Recommended Measures
    this.addTextSection('Recommended Trade Remedy Measures', [
      ...data.recommendedMeasures.measures,
      '',
      `Duration: ${data.recommendedMeasures.duration}`,
      '',
      data.recommendedMeasures.justification,
    ]);

    // Footer
    this.addFooter();

    return this.doc.output('blob');
  }

  /**
   * Generate Interconnected Intelligence Report
   * PDF with network visualization, cascade analysis, and recommendations
   */
  generateInterconnectedIntelligenceReport(data: {
    alertId: string;
    intelligence: {
      primary_alert: any;
      connected_factors: any[];
      impact_cascade: any;
      correlation_matrix: any;
      recommended_actions: string[];
      risk_assessment: any;
    };
    networkMetrics?: any;
    tierLimit?: boolean;
  }): Blob {
    // Cover Page
    this.addCoverPage('interconnected_intelligence');
    this.doc.addPage();
    this.yPosition = this.margin;

    // Title
    this.doc.setFontSize(20);
    this.doc.setTextColor(17, 24, 39);
    this.doc.text('Interconnected Intelligence Analysis', this.margin, this.yPosition);
    this.yPosition += 15;

    // Alert Information
    this.addSection('Primary Alert', [
      { label: 'Alert ID', value: data.alertId },
      { label: 'Type', value: data.intelligence.primary_alert.type },
      { label: 'Severity', value: data.intelligence.primary_alert.severity.toUpperCase() },
      { label: 'Timestamp', value: new Date(data.intelligence.primary_alert.timestamp).toLocaleString() },
    ]);

    // Impact Metrics
    this.doc.setFontSize(14);
    this.doc.setTextColor(55, 65, 81);
    this.doc.text('Impact Metrics', this.margin, this.yPosition);
    this.yPosition += 8;

    const cascadeImpact = data.intelligence.impact_cascade.cascading_impact;
    const riskScore = data.intelligence.risk_assessment.overall_risk;
    const totalFactors = data.intelligence.impact_cascade.total_factors;

    // Large metrics display
    this.doc.setFontSize(16);
    this.doc.setTextColor(220, 38, 38);
    this.doc.text(`Cascading Impact: ${cascadeImpact}%`, this.margin, this.yPosition);
    this.yPosition += 8;

    this.doc.setFontSize(14);
    this.doc.setTextColor(234, 88, 12);
    this.doc.text(`Overall Risk: ${riskScore}/100`, this.margin, this.yPosition);
    this.yPosition += 8;

    this.doc.setFontSize(12);
    this.doc.setTextColor(37, 99, 235);
    this.doc.text(`Total Connections: ${totalFactors}`, this.margin, this.yPosition);
    this.yPosition += 15;

    // Connected Factors
    if (data.intelligence.connected_factors.length > 0) {
      this.doc.setFontSize(14);
      this.doc.setTextColor(55, 65, 81);
      this.doc.text('Connected Factors', this.margin, this.yPosition);
      this.yPosition += 10;

      this.doc.setFontSize(9);
      const factorsToShow = data.tierLimit
        ? data.intelligence.connected_factors.slice(0, 5)
        : data.intelligence.connected_factors;

      factorsToShow.forEach((factor: any, idx: number) => {
        if (this.yPosition > this.pageHeight - 60) {
          this.doc.addPage();
          this.yPosition = this.margin;
        }

        this.doc.setTextColor(107, 114, 128);
        this.doc.text(`${idx + 1}. `, this.margin, this.yPosition);

        this.doc.setTextColor(17, 24, 39);
        this.doc.text(factor.type, this.margin + 15, this.yPosition);

        const severity = factor.severity.toUpperCase();
        const xPos = this.pageWidth - this.margin - 60;
        this.doc.setTextColor(156, 163, 175);
        this.doc.text(`Severity: ${severity}`, xPos, this.yPosition);

        this.yPosition += 5;

        if (factor.correlation_score) {
          this.doc.setTextColor(75, 85, 99);
          this.doc.text(`Correlation: ${(factor.correlation_score * 100).toFixed(0)}%`, this.margin + 15, this.yPosition);
          this.yPosition += 5;
        }

        const timestamp = new Date(factor.timestamp).toLocaleDateString();
        this.doc.setTextColor(156, 163, 175);
        this.doc.text(timestamp, this.margin + 15, this.yPosition);
        this.yPosition += 8;
      });

      if (data.tierLimit && data.intelligence.connected_factors.length > 5) {
        this.doc.setFontSize(10);
        this.doc.setTextColor(37, 99, 235);
        this.doc.text(
          `Note: Showing top 5 connections. Upgrade to Professional to see all ${data.intelligence.connected_factors.length} connections.`,
          this.margin,
          this.yPosition
        );
        this.yPosition += 10;
      }
    }

    // Network Metrics (if available)
    if (data.networkMetrics) {
      this.doc.addPage();
      this.yPosition = this.margin;

      this.doc.setFontSize(14);
      this.doc.setTextColor(55, 65, 81);
      this.doc.text('Network Analysis Metrics', this.margin, this.yPosition);
      this.yPosition += 10;

      if (data.networkMetrics.pagerank_scores) {
        const pageRankEntries = Object.entries(data.networkMetrics.pagerank_scores)
          .sort((a, b) => (b[1] as number) - (a[1] as number))
          .slice(0, 5);

        this.doc.setFontSize(10);
        this.doc.setTextColor(75, 85, 99);
        this.doc.text('Top Nodes by Importance (PageRank):', this.margin, this.yPosition);
        this.yPosition += 6;

        pageRankEntries.forEach(([nodeId, score]: [string, any]) => {
          this.doc.text(`${nodeId.substring(0, 8)}: ${(score * 100).toFixed(2)}%`, this.margin + 5, this.yPosition);
          this.yPosition += 5;
        });
      }

      this.yPosition += 10;

      if (data.networkMetrics.centrality_scores) {
        this.doc.setFontSize(10);
        this.doc.setTextColor(75, 85, 99);
        this.doc.text('Critical Path Nodes (Betweenness Centrality):', this.margin, this.yPosition);
        this.yPosition += 6;

        const centralityEntries = Object.entries(data.networkMetrics.centrality_scores)
          .sort((a, b) => (b[1] as number) - (a[1] as number))
          .slice(0, 5);

        centralityEntries.forEach(([nodeId, score]: [string, any]) => {
          this.doc.text(`${nodeId.substring(0, 8)}: ${(score * 100).toFixed(2)}%`, this.margin + 5, this.yPosition);
          this.yPosition += 5;
        });
      }
    }

    // Recommendations
    this.doc.addPage();
    this.yPosition = this.margin;

    this.doc.setFontSize(14);
    this.doc.setTextColor(55, 65, 81);
    this.doc.text('Recommended Actions', this.margin, this.yPosition);
    this.yPosition += 10;

    this.doc.setFontSize(10);
    this.doc.setTextColor(75, 85, 99);

    data.intelligence.recommended_actions.forEach((action: string, idx: number) => {
      if (this.yPosition > this.pageHeight - 60) {
        this.doc.addPage();
        this.yPosition = this.margin;
      }

      this.doc.setTextColor(107, 114, 128);
      this.doc.text(`${idx + 1}.`, this.margin, this.yPosition);

      this.doc.setTextColor(17, 24, 39);
      const lines = this.doc.splitTextToSize(action, this.pageWidth - this.margin * 2 - 15);
      this.doc.text(lines, this.margin + 12, this.yPosition);

      this.yPosition += 6 * lines.length + 3;
    });

    // Risk Assessment
    this.yPosition += 10;
    this.doc.setFontSize(12);
    this.doc.setTextColor(55, 65, 81);
    this.doc.text('Risk Assessment', this.margin, this.yPosition);
    this.yPosition += 10;

    this.doc.setFontSize(10);
    this.doc.setTextColor(75, 85, 99);
    this.doc.text(`Priority: ${data.intelligence.risk_assessment.mitigation_priority.toUpperCase()}`, this.margin, this.yPosition);
    this.yPosition += 8;

    if (data.intelligence.risk_assessment.risk_factors && data.intelligence.risk_assessment.risk_factors.length > 0) {
      this.doc.setTextColor(55, 65, 81);
      this.doc.text('Risk Factors:', this.margin, this.yPosition);
      this.yPosition += 6;

      this.doc.setTextColor(75, 85, 99);
      data.intelligence.risk_assessment.risk_factors.forEach((factor: string) => {
        this.doc.text(`• ${factor}`, this.margin + 5, this.yPosition);
        this.yPosition += 5;
      });
    }

    // Footer
    this.addFooter();

    return this.doc.output('blob');
  }

  private addCoverPage(reportType: string) {
    if (reportType === 'interconnected_intelligence') {
      // Title
      this.doc.setFontSize(24);
      this.doc.setTextColor(37, 99, 235);
      this.doc.text('Interconnected Intelligence', this.pageWidth / 2, 80, { align: 'center' });

      this.doc.setFontSize(16);
      this.doc.setTextColor(107, 114, 128);
      this.doc.text('Network Analysis Report', this.pageWidth / 2, 100, { align: 'center' });

      // Date
      this.doc.setFontSize(12);
      this.doc.setTextColor(75, 85, 99);
      const dateText = format(new Date(), 'MMMM dd, yyyy');
      this.doc.text(dateText, this.pageWidth / 2, 140, { align: 'center' });

      // Generated by
      this.doc.setFontSize(10);
      this.doc.setTextColor(156, 163, 175);
      this.doc.text('TradeNest Intelligence Platform', this.pageWidth / 2, 200, { align: 'center' });

      this.yPosition = this.margin;
      return;
    }

    // Use existing cover page for other types
    this.doc.setFontSize(32);
    this.doc.setTextColor(37, 99, 235);
    this.doc.text('Executive Intelligence Report', this.pageWidth / 2, 80, { align: 'center' });

    this.doc.setFontSize(18);
    this.doc.setTextColor(107, 114, 128);
    const typeLabels: Record<string, string> = {
      executive_summary: 'Executive Summary',
      quarterly_analysis: 'Quarterly Analysis',
      sector_specific: 'Sector-Specific Analysis',
      risk_assessment: 'Risk Assessment Report',
    };
    this.doc.text(typeLabels[reportType] || 'Intelligence Report', this.pageWidth / 2, 100, { align: 'center' });

    // Date
    this.doc.setFontSize(12);
    this.doc.setTextColor(75, 85, 99);
    const dateText = format(new Date(), 'MMMM dd, yyyy');
    this.doc.text(dateText, this.pageWidth / 2, 140, { align: 'center' });

    // Generated by
    this.doc.setFontSize(10);
    this.doc.setTextColor(156, 163, 175);
    this.doc.text('Generated by TradeNest Intelligence Platform', this.pageWidth / 2, 240, { align: 'center' });
  }

  /**
   * Generate Executive Intelligence Report
   * Comprehensive report with interconnected analysis, insights, and scenarios
   */
  generateExecutiveIntelligenceReport(data: {
    reportType: 'executive_summary' | 'quarterly_analysis' | 'sector_specific' | 'risk_assessment';
    alerts: any[];
    interconnectedIntelligence?: any;
    expertInsights?: any;
    scenarioAnalysis?: any;
    riskAssessment?: any;
    dateRange: { start: string; end: string };
    sector?: string;
  }): Blob {
    // Cover Page
    this.addCoverPage(data.reportType);
    this.doc.addPage();
    this.yPosition = this.margin;

    // Executive Summary
    this.addExecutiveSummary(data);

    // Risk Assessment Overview
    if (data.riskAssessment) {
      this.doc.addPage();
      this.yPosition = this.margin;
      this.addRiskAssessmentSection(data.riskAssessment);
    }

    // Interconnected Intelligence
    if (data.interconnectedIntelligence) {
      this.doc.addPage();
      this.yPosition = this.margin;
      this.addInterconnectedAnalysis(data.interconnectedIntelligence);
    }

    // Expert Insights
    if (data.expertInsights && data.expertInsights.length > 0) {
      this.doc.addPage();
      this.yPosition = this.margin;
      this.addExpertInsightsSection(data.expertInsights);
    }

    // Scenario Analysis
    if (data.scenarioAnalysis) {
      this.doc.addPage();
      this.yPosition = this.margin;
      this.addScenarioAnalysisSection(data.scenarioAnalysis);
    }

    // Key Metrics & KPIs
    this.doc.addPage();
    this.yPosition = this.margin;
    this.addKPISection(data.alerts);

    // Recommendations
    this.doc.addPage();
    this.yPosition = this.margin;
    this.addIntelligenceRecommendations(data);

    // Footer
    this.addFooter();

    return this.doc.output('blob');
  }

  protected addExecutiveSummary(data: any) {
    this.doc.setFontSize(16);
    this.doc.setTextColor(17, 24, 39);
    this.doc.text('Executive Summary', this.margin, this.yPosition);
    this.yPosition += 15;

    this.doc.setFontSize(10);
    this.doc.setTextColor(75, 85, 99);

    const summary = this.generateExecutiveSummaryText(data);
    const lines = this.doc.splitTextToSize(summary, this.pageWidth - this.margin * 2);
    this.doc.text(lines, this.margin, this.yPosition);

    this.yPosition += 8 * lines.length + 10;
  }

  private generateExecutiveSummaryText(data: any): string {
    const alertCount = data.alerts?.length || 0;
    const reportType = data.reportType || 'executive_summary';

    let summary = `This ${reportType.replace('_', ' ')} provides comprehensive analysis of trade anomalies and intelligence. `;
    summary += `The report covers ${alertCount} alerts analyzed across the specified period. `;

    if (data.riskAssessment) {
      summary += `Overall risk assessment indicates ${data.riskAssessment.overall_risk || 'moderate'} risk levels. `;
    }

    if (data.interconnectedIntelligence?.impact_cascade) {
      summary += `Cascading impact analysis reveals ${data.interconnectedIntelligence.impact_cascade.total_factors} interconnected factors affecting supply chains. `;
    }

    summary += 'Key findings, recommendations, and strategic actions are detailed in subsequent sections.';

    return summary;
  }

  private addRiskAssessmentSection(riskAssessment: any) {
    this.doc.setFontSize(16);
    this.doc.setTextColor(17, 24, 39);
    this.doc.text('Risk Assessment', this.margin, this.yPosition);
    this.yPosition += 15;

    // Overall Risk
    this.doc.setFontSize(12);
    this.doc.setTextColor(37, 99, 235);
    this.doc.text('Overall Risk Score', this.margin, this.yPosition);

    this.doc.setFontSize(24);
    this.doc.setTextColor(220, 38, 38);
    this.doc.text(`${riskAssessment.overall_risk || 0}/100`, this.margin, this.yPosition + 10);
    this.yPosition += 20;

    // Risk Factors
    if (riskAssessment.risk_factors && riskAssessment.risk_factors.length > 0) {
      this.doc.setFontSize(12);
      this.doc.setTextColor(55, 65, 81);
      this.doc.text('Risk Factors:', this.margin, this.yPosition);
      this.yPosition += 8;

      this.doc.setFontSize(10);
      riskAssessment.risk_factors.forEach((factor: string) => {
        this.doc.setTextColor(75, 85, 99);
        this.doc.text(`• ${factor}`, this.margin + 5, this.yPosition);
        this.yPosition += 6;
      });
    }
  }

  private addInterconnectedAnalysis(intelligence: any) {
    this.doc.setFontSize(16);
    this.doc.setTextColor(17, 24, 39);
    this.doc.text('Interconnected Intelligence', this.margin, this.yPosition);
    this.yPosition += 15;

    this.doc.setFontSize(10);

    // Impact Cascade
    this.doc.setFontSize(12);
    this.doc.setTextColor(37, 99, 235);
    this.doc.text('Impact Cascade Score', this.margin, this.yPosition);
    this.yPosition += 10;

    this.doc.setFontSize(20);
    this.doc.setTextColor(220, 38, 38);
    this.doc.text(`${intelligence.impact_cascade?.cascading_impact || 0}%`, this.margin, this.yPosition);
    this.yPosition += 15;

    // Connected Factors
    if (intelligence.connected_factors?.length > 0) {
      this.doc.setFontSize(12);
      this.doc.setTextColor(55, 65, 81);
      this.doc.text('Connected Factors:', this.margin, this.yPosition);
      this.yPosition += 8;

      this.doc.setFontSize(10);
      intelligence.connected_factors.slice(0, 5).forEach((factor: any) => {
        this.doc.setTextColor(75, 85, 99);
        this.doc.text(`• ${factor.type} (${factor.severity}) - Correlation: ${((factor.correlation_score || 0) * 100).toFixed(0)}%`,
          this.margin + 5, this.yPosition);
        this.yPosition += 6;
      });
    }

    // Supply Chain Impact
    if (intelligence.impact_cascade?.affected_supply_chain) {
      this.doc.setFontSize(10);
      this.doc.setTextColor(220, 38, 38);
      this.doc.text('⚠ Supply chain affected by interconnected anomalies', this.margin, this.yPosition);
      this.yPosition += 10;
    }
  }

  private addExpertInsightsSection(insights: any[]) {
    this.doc.setFontSize(16);
    this.doc.setTextColor(17, 24, 39);
    this.doc.text('Expert Insights', this.margin, this.yPosition);
    this.yPosition += 15;

    insights.forEach((insight: any, idx: number) => {
      if (this.yPosition > this.pageHeight - 50) {
        this.doc.addPage();
        this.yPosition = this.margin;
      }

      this.doc.setFontSize(12);
      this.doc.setTextColor(37, 99, 235);
      this.doc.text(`Insight ${idx + 1}`, this.margin, this.yPosition);
      this.yPosition += 8;

      if (insight.key_findings && insight.key_findings.length > 0) {
        this.doc.setFontSize(10);
        this.doc.setTextColor(75, 85, 99);
        insight.key_findings.slice(0, 2).forEach((finding: string) => {
          this.doc.text(`• ${finding}`, this.margin + 5, this.yPosition);
          this.yPosition += 6;
        });
      }

      this.yPosition += 5;
    });
  }

  private addScenarioAnalysisSection(scenarioAnalysis: any) {
    this.doc.setFontSize(16);
    this.doc.setTextColor(17, 24, 39);
    this.doc.text('Scenario Analysis', this.margin, this.yPosition);
    this.yPosition += 15;

    this.doc.setFontSize(10);

    // Best Case
    this.doc.setTextColor(34, 197, 94);
    this.doc.text('Best Case Scenario:', this.margin, this.yPosition);
    this.yPosition += 6;

    this.doc.setTextColor(75, 85, 99);
    this.doc.text(`Cost: $${scenarioAnalysis.best_case?.total_cost_impact?.toFixed(2) || 'N/A'}`,
      this.margin + 5, this.yPosition);
    this.yPosition += 10;

    // Worst Case
    this.doc.setTextColor(220, 38, 38);
    this.doc.text('Worst Case Scenario:', this.margin, this.yPosition);
    this.yPosition += 6;

    this.doc.setTextColor(75, 85, 99);
    this.doc.text(`Cost: $${scenarioAnalysis.worst_case?.total_cost_impact?.toFixed(2) || 'N/A'}`,
      this.margin + 5, this.yPosition);
    this.yPosition += 10;

    // Recommendations
    if (scenarioAnalysis.recommendations?.length > 0) {
      this.doc.setFontSize(10);
      this.doc.setTextColor(55, 65, 81);
      this.doc.text('Key Recommendations:', this.margin, this.yPosition);
      this.yPosition += 6;

      this.doc.setFontSize(9);
      scenarioAnalysis.recommendations.slice(0, 3).forEach((rec: string) => {
        this.doc.text(`• ${rec}`, this.margin + 5, this.yPosition);
        this.yPosition += 5;
      });
    }
  }

  private addKPISection(alerts: any[]) {
    this.doc.setFontSize(16);
    this.doc.setTextColor(17, 24, 39);
    this.doc.text('Key Performance Indicators', this.margin, this.yPosition);
    this.yPosition += 15;

    // Total Alerts
    this.doc.setFontSize(12);
    this.doc.setTextColor(37, 99, 235);
    this.doc.text('Total Alerts', this.margin, this.yPosition);

    this.doc.setFontSize(20);
    this.doc.setTextColor(17, 24, 39);
    this.doc.text(`${alerts.length}`, this.margin, this.yPosition + 10);
    this.yPosition += 25;

    // By Severity
    const severityCounts: any = {};
    alerts.forEach((alert: any) => {
      const severity = alert.anomalies?.[0]?.severity || 'unknown';
      severityCounts[severity] = (severityCounts[severity] || 0) + 1;
    });

    this.doc.setFontSize(10);
    this.doc.setTextColor(75, 85, 99);
    Object.entries(severityCounts).forEach(([severity, count]: [string, any]) => {
      this.doc.text(`${severity.toUpperCase()}: ${count}`, this.margin, this.yPosition);
      this.yPosition += 6;
    });
  }

  private addIntelligenceRecommendations(data: any) {
    this.doc.setFontSize(16);
    this.doc.setTextColor(17, 24, 39);
    this.doc.text('Strategic Recommendations', this.margin, this.yPosition);
    this.yPosition += 15;

    const recommendations: string[] = [];

    if (data.interconnectedIntelligence?.recommended_actions) {
      recommendations.push(...data.interconnectedIntelligence.recommended_actions);
    }

    if (data.expertInsights) {
      data.expertInsights.forEach((insight: any) => {
        if (insight.recommended_actions) {
          insight.recommended_actions.forEach((action: any) => {
            recommendations.push(action.action);
          });
        }
      });
    }

    if (data.scenarioAnalysis?.recommendations) {
      recommendations.push(...data.scenarioAnalysis.recommendations);
    }

    // Deduplicate and limit
    const uniqueRecs = Array.from(new Set(recommendations)).slice(0, 10);

    this.doc.setFontSize(10);
    this.doc.setTextColor(75, 85, 99);

    uniqueRecs.forEach((rec, idx) => {
      if (this.yPosition > this.pageHeight - 50) {
        this.doc.addPage();
        this.yPosition = this.margin;
      }

      this.doc.setTextColor(107, 114, 128);
      this.doc.text(`${idx + 1}.`, this.margin, this.yPosition);

      this.doc.setTextColor(17, 24, 39);
      const lines = this.doc.splitTextToSize(rec, this.pageWidth - this.margin * 2 - 20);
      this.doc.text(lines, this.margin + 15, this.yPosition);

      this.yPosition += 6 * lines.length + 3;
    });
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

/**
 * Generate and download Trade Remedy Report
 */
export function generateAndDownloadTradeRemedyReport(
  data: {
    caseName: string;
    petitionerName?: string;
    subjectProduct?: string;
    hsCode?: string;
    countryOfOrigin?: string;
    exportPrice: number;
    normalValue: number;
    dumpingMargin: number;
    priceDepression: number;
    volumeImpact?: number;
    estimatedRevenueLoss?: number;
    causation: string;
    recommendedMeasures: {
      measures: string[];
      duration: string;
      justification: string;
    };
    severity: {
      level: string;
      description: string;
    };
    currency?: string;
  },
  filename?: string
) {
  const generator = new EvidenceGenerator();
  const blob = generator.generateTradeRemedyReport(data);

  // Create download link
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `trade-remedy-${data.caseName.replace(/\s+/g, '-')}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function generateAndDownloadExecutiveReport(
  data: {
    reportType: 'executive_summary' | 'quarterly_analysis' | 'sector_specific' | 'risk_assessment';
    alerts: any[];
    interconnectedIntelligence?: any;
    expertInsights?: any;
    scenarioAnalysis?: any;
    riskAssessment?: any;
    dateRange: { start: string; end: string };
    sector?: string;
  },
  filename?: string
) {
  const generator = new EvidenceGenerator();
  const blob = generator.generateExecutiveIntelligenceReport(data);

  // Create download link
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `executive-report-${data.reportType}-${Date.now()}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generate and download Interconnected Intelligence Report
 */
export function generateAndDownloadIntelligenceReport(
  data: {
    alertId: string;
    intelligence: {
      primary_alert: any;
      connected_factors: any[];
      impact_cascade: any;
      correlation_matrix: any;
      recommended_actions: string[];
      risk_assessment: any;
    };
    networkMetrics?: any;
    tierLimit?: boolean;
  },
  filename?: string
) {
  const generator = new EvidenceGenerator();
  const blob = generator.generateInterconnectedIntelligenceReport(data);

  // Create download link
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `intelligence-report-${data.alertId}-${Date.now()}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}