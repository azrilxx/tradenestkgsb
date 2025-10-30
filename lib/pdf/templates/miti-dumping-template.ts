import jsPDF from 'jspdf';
import { format } from 'date-fns';

interface MITIDumpingData {
  petitioner: {
    name: string;
    company: string;
    address: string;
    email: string;
    phone: string;
    registration: string;
  };
  product: {
    description: string;
    hs_code: string;
    category: string;
  };
  subjectCountry: string;
  affectedPeriod: {
    start: string;
    end: string;
  };
  evidence: {
    suspectedShipments: Array<{
      company_name: string;
      shipment_date: string;
      unit_price: number;
      total_value: number;
      price_deviation: number;
    }>;
    marketAverage: number;
    yourAverage: number;
    dumpingMargin: number;
  };
  industryInfo: {
    totalCapacity: string;
    employment: number;
    annualRevenue: string;
  };
}

export function generateMITIDumpingPetition(data: MITIDumpingData): Blob {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let yPosition = margin;

  // Header - MITI Logo Area
  doc.setFontSize(16);
  doc.setTextColor(37, 99, 235);
  doc.text('Ministry of International Trade and Industry (MITI)', margin, yPosition);
  yPosition += 8;

  doc.setFontSize(12);
  doc.setTextColor(55, 65, 81);
  doc.text('Anti-Dumping Petition for Investigation', margin, yPosition);
  yPosition += 15;

  // Section 1: Petitioner Information
  addSection(doc, margin, yPosition, '1. PETITIONER INFORMATION');
  yPosition += 10;

  const petitionerInfo = [
    { label: 'Petitioner Name', value: data.petitioner.name },
    { label: 'Company Name', value: data.petitioner.company },
    { label: 'Registration Number', value: data.petitioner.registration },
    { label: 'Address', value: data.petitioner.address },
    { label: 'Email', value: data.petitioner.email },
    { label: 'Phone', value: data.petitioner.phone },
  ];

  petitionerInfo.forEach(item => {
    doc.setFontSize(10);
    doc.setTextColor(75, 85, 99);
    doc.text(`${item.label}:`, margin + 5, yPosition);

    doc.setTextColor(17, 24, 39);
    const lines = doc.splitTextToSize(item.value, pageWidth - margin * 2 - 60);
    doc.text(lines, margin + 40, yPosition);
    yPosition += 6 * lines.length;
  });

  yPosition += 10;

  // Section 2: Subject Product
  addSection(doc, margin, yPosition, '2. SUBJECT PRODUCT');
  yPosition += 10;

  doc.setFontSize(10);
  doc.setTextColor(75, 85, 99);
  doc.text('Product Description:', margin + 5, yPosition);
  doc.setTextColor(17, 24, 39);
  doc.text(data.product.description, margin + 40, yPosition);
  yPosition += 8;

  doc.setTextColor(75, 85, 99);
  doc.text('HS Code:', margin + 5, yPosition);
  doc.setTextColor(17, 24, 39);
  doc.text(data.product.hs_code, margin + 40, yPosition);
  yPosition += 8;

  doc.setTextColor(75, 85, 99);
  doc.text('Category:', margin + 5, yPosition);
  doc.setTextColor(17, 24, 39);
  doc.text(data.product.category, margin + 40, yPosition);
  yPosition += 15;

  // Section 3: Subject Country
  addSection(doc, margin, yPosition, '3. SUBJECT COUNTRY');
  yPosition += 10;

  doc.setFontSize(10);
  doc.setTextColor(17, 24, 39);
  doc.text(`The petition concerns imports from: ${data.subjectCountry}`, margin + 5, yPosition);
  yPosition += 15;

  // Section 4: Dumping Evidence
  addSection(doc, margin, yPosition, '4. EVIDENCE OF DUMPING');
  yPosition += 10;

  doc.setFontSize(10);
  doc.setTextColor(17, 24, 39);
  doc.text('Price Comparison Analysis:', margin + 5, yPosition);
  yPosition += 8;

  const priceComparison = [
    `Market Average Price: RM ${data.evidence.marketAverage.toFixed(2)}/unit`,
    `Your Average Price: RM ${data.evidence.yourAverage.toFixed(2)}/unit`,
    `Dumping Margin: ${data.evidence.dumpingMargin.toFixed(1)}%`,
  ];

  priceComparison.forEach(line => {
    doc.setTextColor(75, 85, 99);
    doc.text(line, margin + 10, yPosition);
    yPosition += 7;
  });

  yPosition += 8;

  // Suspected shipments table
  doc.setFontSize(9);
  doc.setTextColor(55, 65, 81);
  doc.text('Examples of Suspected Dumping Shipments:', margin + 5, yPosition);
  yPosition += 7;

  // Table header
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.setFillColor(220, 38, 38); // Red for dumping
  doc.roundedRect(margin, yPosition, pageWidth - margin * 2, 7, 2, 2, 'F');

  doc.text('Date', margin + 3, yPosition + 5);
  doc.text('Company', margin + 35, yPosition + 5);
  doc.text('Price', margin + 110, yPosition + 5);
  doc.text('Deviation', margin + 145, yPosition + 5);
  yPosition += 8;

  // Table rows
  data.evidence.suspectedShipments.slice(0, 5).forEach((shipment, idx) => {
    if (yPosition > doc.internal.pageSize.getHeight() - 30) {
      doc.addPage();
      yPosition = margin;
    }

    if (idx % 2 === 0) {
      doc.setFillColor(254, 242, 242); // Red-50
      doc.roundedRect(margin, yPosition, pageWidth - margin * 2, 7, 2, 2, 'F');
    }

    doc.setFontSize(7);
    doc.setTextColor(17, 24, 39);
    doc.text(shipment.shipment_date?.substring(0, 10) || 'N/A', margin + 3, yPosition + 5);

    const companyShort = shipment.company_name?.substring(0, 25) || 'N/A';
    doc.text(companyShort, margin + 35, yPosition + 5);

    doc.text(`RM ${shipment.unit_price.toFixed(2)}`, margin + 110, yPosition + 5);

    doc.setTextColor(220, 38, 38);
    doc.text(`${shipment.price_deviation.toFixed(1)}%`, margin + 145, yPosition + 5);

    yPosition += 8;
  });

  yPosition += 10;

  // Section 5: Industry Impact
  addSection(doc, margin, yPosition, '5. INJURY TO DOMESTIC INDUSTRY');
  yPosition += 10;

  doc.setFontSize(10);
  doc.setTextColor(75, 85, 99);
  doc.text('Impact on Domestic Industry:', margin + 5, yPosition);
  yPosition += 8;

  const impactInfo = [
    { label: 'Total Industry Capacity', value: data.industryInfo.totalCapacity },
    { label: 'Employment', value: `${data.industryInfo.employment.toLocaleString()} workers` },
    { label: 'Annual Revenue', value: data.industryInfo.annualRevenue },
  ];

  impactInfo.forEach(item => {
    doc.setTextColor(75, 85, 99);
    doc.text(`${item.label}:`, margin + 10, yPosition);
    doc.setTextColor(17, 24, 39);
    doc.text(item.value, margin + 55, yPosition);
    yPosition += 7;
  });

  yPosition += 10;

  // Section 6: Legal Basis
  addSection(doc, margin, yPosition, '6. LEGAL BASIS');
  yPosition += 10;

  doc.setFontSize(10);
  doc.setTextColor(17, 24, 39);
  const legalText = `
This petition is filed pursuant to:
- Countervailing and Anti-Dumping Duties Act 1993 (Act 504)
- Malaysia WTO commitments on anti-dumping measures
- MITI's Guidelines on Investigation of Anti-Dumping
  `.trim();

  const legalLines = doc.splitTextToSize(legalText, pageWidth - margin * 2 - 10);
  doc.text(legalLines, margin + 5, yPosition);
  yPosition += 6 * legalLines.length + 10;

  // Section 7: Requested Measures
  addSection(doc, margin, yPosition, '7. REQUESTED MEASURES');
  yPosition += 10;

  doc.setFontSize(10);
  doc.setTextColor(17, 24, 39);
  const measuresText = `
We respectfully request MITI to:
1. Initiate an anti-dumping investigation against imports of ${data.product.description} from ${data.subjectCountry}
2. Determine the existence of dumping and injury to the domestic industry
3. Impose appropriate anti-dumping duties to offset the unfair trade practice
  `.trim();

  const measuresLines = doc.splitTextToSize(measuresText, pageWidth - margin * 2 - 10);
  doc.text(measuresLines, margin + 5, yPosition);
  yPosition += 6 * measuresLines.length + 15;

  // Signature section
  doc.setDrawColor(107, 114, 128);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 15;

  doc.setFontSize(10);
  doc.setTextColor(17, 24, 39);
  doc.text('_________________________', margin, yPosition);
  yPosition += 8;
  doc.setTextColor(75, 85, 99);
  doc.text(data.petitioner.name, margin, yPosition);
  yPosition += 6;
  doc.text(data.petitioner.company, margin, yPosition);
  yPosition += 6;
  doc.setFontSize(8);
  doc.text(`Date: ${format(new Date(), 'PP')}`, margin, yPosition);

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(107, 114, 128);
  doc.text('This document was prepared using Trade Nest Intelligence Platform', margin, doc.internal.pageSize.getHeight() - 10);

  return doc.output('blob');
}

function addSection(doc: jsPDF, margin: number, yPosition: number, title: string) {
  doc.setFontSize(12);
  doc.setTextColor(37, 99, 235);
  doc.text(title, margin, yPosition);

  // Underline
  doc.setDrawColor(37, 99, 235);
  doc.setLineWidth(0.5);
  doc.line(margin, yPosition + 1, margin + doc.getTextWidth(title), yPosition + 1);
}

/**
 * Generate MITI petition from shipment evidence
 */
export function generateMITIPetitionFromShipments(
  shipments: any[],
  petitionerInfo: MITIDumpingData['petitioner']
): Blob {
  const firstShipment = shipments[0];

  const data: MITIDumpingData = {
    petitioner: petitionerInfo,
    product: {
      description: firstShipment.product_description || 'Product',
      hs_code: firstShipment.hs_code || 'N/A',
      category: firstShipment.product_category || 'N/A',
    },
    subjectCountry: firstShipment.origin_country || 'Unknown',
    affectedPeriod: {
      start: shipments[shipments.length - 1]?.shipment_date || new Date().toISOString(),
      end: shipments[0]?.shipment_date || new Date().toISOString(),
    },
    evidence: {
      suspectedShipments: shipments.slice(0, 5).map(s => ({
        company_name: s.company_name,
        shipment_date: s.shipment_date,
        unit_price: s.unit_price || 0,
        total_value: s.total_value || 0,
        price_deviation: s.price_deviation || 0,
      })),
      marketAverage: 0, // Would be calculated from market data
      yourAverage: shipments.reduce((sum, s) => sum + (s.unit_price || 0), 0) / shipments.length,
      dumpingMargin: 35, // Example
    },
    industryInfo: {
      totalCapacity: '500,000 tons/year',
      employment: 500,
      annualRevenue: 'RM 500 million',
    },
  };

  return generateMITIDumpingPetition(data);
}
