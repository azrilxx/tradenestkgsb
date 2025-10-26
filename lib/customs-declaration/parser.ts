/**
 * Customs Declaration Parser
 * Parses Excel/CSV customs forms and extracts declaration data
 */

export interface CustomsDeclaration {
  hs_code: string;
  description: string;
  value: number;
  currency: string;
  quantity: number;
  unit: string;
  country_of_origin: string;
  port_of_entry: string;
  importer_name: string;
  exporter_name: string;
  invoice_number?: string;
  date: string;
}

export interface ParsedDeclaration {
  declarations: CustomsDeclaration[];
  total_declarations: number;
  total_value: number;
  unique_hs_codes: string[];
  countries: string[];
}

/**
 * Parse customs declaration from CSV data
 */
export function parseCSV(csvData: string): CustomsDeclaration[] {
  const lines = csvData.split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  const declarations: CustomsDeclaration[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = line.split(',').map(v => v.trim());

    try {
      const declaration: CustomsDeclaration = {
        hs_code: values[0] || '',
        description: values[1] || '',
        value: parseFloat(values[2] || '0'),
        currency: values[3] || 'MYR',
        quantity: parseFloat(values[4] || '0'),
        unit: values[5] || 'pcs',
        country_of_origin: values[6] || '',
        port_of_entry: values[7] || '',
        importer_name: values[8] || '',
        exporter_name: values[9] || '',
        invoice_number: values[10] || '',
        date: values[11] || new Date().toISOString(),
      };

      declarations.push(declaration);
    } catch (error) {
      console.error(`Error parsing line ${i}:`, error);
    }
  }

  return declarations;
}

/**
 * Parse customs declaration from JSON data
 */
export function parseJSON(jsonData: any): CustomsDeclaration[] {
  const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;

  if (!Array.isArray(data)) {
    throw new Error('JSON data must be an array');
  }

  return data.map(item => ({
    hs_code: item.hs_code || item.hsCode || '',
    description: item.description || '',
    value: parseFloat(item.value || '0'),
    currency: item.currency || 'MYR',
    quantity: parseFloat(item.quantity || '0'),
    unit: item.unit || 'pcs',
    country_of_origin: item.country_of_origin || item.countryOfOrigin || '',
    port_of_entry: item.port_of_entry || item.portOfEntry || '',
    importer_name: item.importer_name || item.importerName || '',
    exporter_name: item.exporter_name || item.exporterName || '',
    invoice_number: item.invoice_number || item.invoiceNumber || '',
    date: item.date || new Date().toISOString(),
  }));
}

/**
 * Analyze parsed declarations
 */
export function analyzeDeclarations(declarations: CustomsDeclaration[]): ParsedDeclaration {
  const total_value = declarations.reduce((sum, d) => sum + d.value, 0);
  const unique_hs_codes = [...new Set(declarations.map(d => d.hs_code))];
  const countries = [...new Set(declarations.map(d => d.country_of_origin))];

  return {
    declarations,
    total_declarations: declarations.length,
    total_value,
    unique_hs_codes,
    countries,
  };
}

/**
 * Validate customs declaration
 */
export function validateDeclaration(declaration: CustomsDeclaration): string[] {
  const errors: string[] = [];

  if (!declaration.hs_code) {
    errors.push('HS Code is required');
  } else if (!/^\d{4,10}$/.test(declaration.hs_code.replace(/[^0-9]/g, ''))) {
    errors.push('HS Code must be 4-10 digits');
  }

  if (!declaration.description) {
    errors.push('Description is required');
  }

  if (!declaration.value || declaration.value <= 0) {
    errors.push('Value must be greater than 0');
  }

  if (!declaration.quantity || declaration.quantity <= 0) {
    errors.push('Quantity must be greater than 0');
  }

  if (!declaration.country_of_origin) {
    errors.push('Country of origin is required');
  }

  if (!declaration.importer_name) {
    errors.push('Importer name is required');
  }

  return errors;
}

