/**
 * Chart Generator for TradeNest PDF Reports
 * 
 * Generates chart visualizations that can be embedded in PDF reports
 * Uses Canvas API for server-side chart generation
 */

export interface ChartData {
  labels: string[];
  values: number[];
  datasetLabel?: string;
  color?: string;
}

export interface ChartOptions {
  width?: number;
  height?: number;
  backgroundColor?: string;
  textColor?: string;
  gridColor?: string;
  title?: string;
  subtitle?: string;
  color?: string;
}

/**
 * Generate a simple line chart SVG for historical FX rate data
 */
export function generateLineChartSVG(
  data: ChartData,
  options: ChartOptions = {}
): string {
  const width = options.width || 400;
  const height = options.height || 200;
  const padding = 40;
  const chartWidth = width - (padding * 2);
  const chartHeight = height - (padding * 2) - 40; // Space for title

  // Scale data to fit chart
  const maxValue = Math.max(...data.values);
  const minValue = Math.min(...data.values);
  const range = maxValue - minValue || 1; // Avoid division by zero

  const scaledValues = data.values.map(val =>
    chartHeight - ((val - minValue) / range) * chartHeight
  );

  // Generate SVG
  let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`;

  // Background
  svg += `<rect width="${width}" height="${height}" fill="${options.backgroundColor || '#ffffff'}" />`;

  // Title
  if (options.title) {
    svg += `<text x="${width / 2}" y="20" text-anchor="middle" 
              font-family="Arial" font-size="14" font-weight="bold" 
              fill="${options.textColor || '#333'}">${options.title}</text>`;
  }

  // Grid lines
  const numGridLines = 5;
  const gridColor = options.gridColor || '#e5e7eb';

  for (let i = 0; i <= numGridLines; i++) {
    const y = padding + (i / numGridLines) * chartHeight;
    const value = maxValue - (i / numGridLines) * range;

    // Horizontal grid line
    svg += `<line x1="${padding}" y1="${y}" x2="${width - padding}" y2="${y}" 
              stroke="${gridColor}" stroke-width="1" />`;

    // Y-axis label
    svg += `<text x="${padding - 5}" y="${y + 4}" text-anchor="end" 
              font-family="Arial" font-size="10" fill="${options.textColor || '#666'}">
              ${value.toFixed(4)}
            </text>`;
  }

  // Generate path for line
  let pathData = `M ${padding},${scaledValues[0] + padding + 40}`;
  const stepWidth = chartWidth / (data.values.length - 1 || 1);

  for (let i = 0; i < scaledValues.length; i++) {
    const x = padding + (i * stepWidth);
    const y = scaledValues[i] + padding + 40;
    pathData += i === 0 ? '' : ` L ${x},${y}`;
  }

  // Draw line
  svg += `<path d="${pathData}" fill="none" stroke="${options.color || '#3b82f6'}" 
         stroke-width="2" stroke-linecap="round" />`;

  // Draw points
  const pointColor = options.color || '#3b82f6';
  for (let i = 0; i < scaledValues.length; i++) {
    const x = padding + (i * stepWidth);
    const y = scaledValues[i] + padding + 40;
    svg += `<circle cx="${x}" cy="${y}" r="3" fill="${pointColor}" />`;
  }

  // X-axis labels (show first, middle, last)
  const labelIndices = [0, Math.floor(data.values.length / 2), data.values.length - 1];
  labelIndices.forEach((idx, i) => {
    const x = padding + (idx * stepWidth);
    const label = data.labels[idx] || '';
    const shortLabel = label.length > 8 ? label.substring(0, 6) + '...' : label;
    svg += `<text x="${x}" y="${height - 10}" text-anchor="middle" 
              font-family="Arial" font-size="9" fill="${options.textColor || '#666'}">
              ${shortLabel}
            </text>`;
  });

  svg += `</svg>`;

  return svg;
}

/**
 * Generate a bar chart SVG for comparing values
 */
export function generateBarChartSVG(
  data: ChartData,
  options: ChartOptions = {}
): string {
  const width = options.width || 400;
  const height = options.height || 200;
  const padding = 40;
  const chartWidth = width - (padding * 2);
  const chartHeight = height - (padding * 2) - 40;

  const maxValue = Math.max(...data.values);
  const barWidth = chartWidth / data.values.length - 10;
  const color = options.color || '#3b82f6';

  let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`;

  // Background
  svg += `<rect width="${width}" height="${height}" fill="${options.backgroundColor || '#ffffff'}" />`;

  // Title
  if (options.title) {
    svg += `<text x="${width / 2}" y="20" text-anchor="middle" 
              font-family="Arial" font-size="14" font-weight="bold">${options.title}</text>`;
  }

  // Draw bars
  data.values.forEach((value, i) => {
    const barHeight = (value / maxValue) * chartHeight;
    const x = padding + (i * (barWidth + 10));
    const y = height - padding - 40 - barHeight;

    svg += `<rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" 
            fill="${color}" stroke="#1e40af" stroke-width="1" />`;

    // Value label on bar
    if (maxValue < 100) {
      svg += `<text x="${x + barWidth / 2}" y="${y - 3}" text-anchor="middle" 
                font-family="Arial" font-size="9" fill="${options.textColor || '#333'}">
                ${value.toFixed(2)}
              </text>`;
    }

    // X-axis label
    const label = data.labels[i] || '';
    const shortLabel = label.length > 8 ? label.substring(0, 6) + '...' : label;
    svg += `<text x="${x + barWidth / 2}" y="${height - 10}" text-anchor="middle" 
              font-family="Arial" font-size="9" fill="${options.textColor || '#666'}">
              ${shortLabel}
            </text>`;
  });

  svg += `</svg>`;

  return svg;
}

/**
 * Generate a comparison chart (line with min/max range)
 */
export function generateRangeChartSVG(
  data: {
    dates: string[];
    current: number[];
    min: number[];
    max: number[];
    average: number[];
  },
  options: ChartOptions = {}
): string {
  const width = options.width || 400;
  const height = options.height || 250;
  const padding = 50;
  const chartWidth = width - (padding * 2);
  const chartHeight = height - (padding * 2);

  const allValues = [...data.current, ...data.min, ...data.max, ...data.average];
  const maxValue = Math.max(...allValues);
  const minValue = Math.min(...allValues);
  const range = maxValue - minValue || 1;

  let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`;

  // Background
  svg += `<rect width="${width}" height="${height}" fill="${options.backgroundColor || '#ffffff'}" />`;

  // Title
  if (options.title) {
    svg += `<text x="${width / 2}" y="20" text-anchor="middle" 
              font-family="Arial" font-size="14" font-weight="bold">${options.title}</text>`;
  }

  // Draw range area (min to max)
  let rangePath = '';
  const stepWidth = chartWidth / (data.dates.length - 1 || 1);

  for (let i = 0; i < data.current.length; i++) {
    const x = padding + (i * stepWidth);
    const yMin = height - padding - ((data.min[i] - minValue) / range) * chartHeight;
    const yMax = height - padding - ((data.max[i] - minValue) / range) * chartHeight;

    if (i === 0) {
      rangePath = `M ${x},${yMin} L ${x},${yMax}`;
    } else {
      rangePath += ` L ${x},${yMax} L ${x},${yMin}`;
    }
  }

  // Close the range shape
  rangePath += ` L ${padding + (data.current.length - 1) * stepWidth},${height - padding - ((data.min[data.min.length - 1] - minValue) / range) * chartHeight}`;
  rangePath += ` Z`;

  svg += `<path d="${rangePath}" fill="rgba(59, 130, 246, 0.2)" stroke="none" />`;

  // Draw average line
  let avgPath = '';
  for (let i = 0; i < data.average.length; i++) {
    const x = padding + (i * stepWidth);
    const y = height - padding - ((data.average[i] - minValue) / range) * chartHeight;

    avgPath += i === 0 ? `M ${x},${y}` : ` L ${x},${y}`;
  }

  svg += `<path d="${avgPath}" fill="none" stroke="#94a3b8" stroke-width="2" stroke-dasharray="5,5" />`;

  // Draw current line
  let currentPath = '';
  for (let i = 0; i < data.current.length; i++) {
    const x = padding + (i * stepWidth);
    const y = height - padding - ((data.current[i] - minValue) / range) * chartHeight;

    currentPath += i === 0 ? `M ${x},${y}` : ` L ${x},${y}`;
  }

  svg += `<path d="${currentPath}" fill="none" stroke="#dc2626" stroke-width="3" stroke-linecap="round" />`;

  // Legend
  svg += `<g transform="translate(${width - 150}, ${height - padding - 50})">`;
  svg += `<text x="5" y="10" font-family="Arial" font-size="10" fill="#dc2626">Current Rate</text>`;
  svg += `<text x="5" y="22" font-family="Arial" font-size="10" fill="#94a3b8">Average</text>`;
  svg += `<text x="5" y="34" font-family="Arial" font-size="10" fill="#60a5fa">Range</text>`;
  svg += `</g>`;

  svg += `</svg>`;

  return svg;
}

/**
 * Convert SVG to base64 data URL for jsPDF
 */
export function svgToDataURL(svg: string): string {
  // For jsPDF, we'll use the SVG directly or convert to image
  // This is a simple implementation - in production, you'd use a proper SVG renderer
  const base64 = Buffer.from(svg).toString('base64');
  return `data:image/svg+xml;base64,${base64}`;
}

/**
 * Generate a summary statistics box for reports
 */
export function generateStatsBox(stats: {
  label: string;
  value: string | number;
  trend?: 'up' | 'down' | 'stable';
  color?: string;
}[]): string {
  let svg = '<svg width="400" height="100" xmlns="http://www.w3.org/2000/svg">';

  const boxWidth = 120;
  const boxHeight = 80;
  const spacing = 20;

  stats.forEach((stat, i) => {
    const x = i * (boxWidth + spacing);
    const y = 10;

    // Box
    svg += `<rect x="${x}" y="${y}" width="${boxWidth}" height="${boxHeight}" 
            fill="${stat.color || '#f3f4f6'}" stroke="#e5e7eb" stroke-width="1" rx="4" />`;

    // Label
    svg += `<text x="${x + boxWidth / 2}" y="${y + 20}" text-anchor="middle" 
              font-family="Arial" font-size="10" fill="#666">${stat.label}</text>`;

    // Value
    svg += `<text x="${x + boxWidth / 2}" y="${y + 45}" text-anchor="middle" 
              font-family="Arial" font-size="18" font-weight="bold" fill="#111">
              ${stat.value}
            </text>`;

    // Trend indicator
    if (stat.trend === 'up') {
      svg += `<text x="${x + boxWidth / 2}" y="${y + 70}" text-anchor="middle" 
                font-size="14" fill="#10b981">↗</text>`;
    } else if (stat.trend === 'down') {
      svg += `<text x="${x + boxWidth / 2}" y="${y + 70}" text-anchor="middle" 
                font-size="14" fill="#ef4444">↘</text>`;
    } else if (stat.trend === 'stable') {
      svg += `<text x="${x + boxWidth / 2}" y="${y + 70}" text-anchor="middle" 
                font-size="14" fill="#6b7280">→</text>`;
    }
  });

  svg += '</svg>';
  return svg;
}

/**
 * Generate simplified chart description for text-based PDFs
 */
export function generateChartDescription(
  data: ChartData,
  chartType: 'line' | 'bar' | 'range'
): string {
  if (chartType === 'line') {
    const trend = data.values[data.values.length - 1] > data.values[0] ? 'increasing' :
      data.values[data.values.length - 1] < data.values[0] ? 'decreasing' : 'stable';

    return `Trend: ${trend}. Starting value: ${data.values[0].toFixed(4)}, 
            Ending value: ${data.values[data.values.length - 1].toFixed(4)}. 
            Peak: ${Math.max(...data.values).toFixed(4)}, 
            Lowest: ${Math.min(...data.values).toFixed(4)}.`;
  }

  return `Chart with ${data.values.length} data points.`;
}

