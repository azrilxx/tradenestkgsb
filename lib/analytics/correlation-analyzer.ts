import { supabase } from '@/lib/supabase/client';

export interface CorrelationData {
  product_id: string;
  hs_code: string;
  category: string;
  price_data: number[];
  volume_data: number[];
  time_period: string;
}

export interface CorrelationResult {
  product_a: {
    id: string;
    hs_code: string;
    category: string;
  };
  product_b: {
    id: string;
    hs_code: string;
    category: string;
  };
  correlation_coefficient: number;
  correlation_type: 'positive' | 'negative' | 'neutral';
  strength: 'weak' | 'moderate' | 'strong';
  interpretation: string;
}

export interface SectorCorrelation {
  sector: string;
  correlated_products: Array<{
    product_id: string;
    hs_code: string;
    correlation: number;
  }>;
  trend_direction: 'up' | 'down' | 'stable';
  significance: 'high' | 'medium' | 'low';
}

export interface CorrelationMatrix {
  products: Array<{
    id: string;
    hs_code: string;
    category: string;
  }>;
  matrix: number[][];
  insights: string[];
}

/**
 * Analyze correlations between different products/sectors
 */
export async function analyzeCorrelations(
  category?: string,
  timeWindow: number = 90
): Promise<CorrelationResult[]> {
  try {
    // Get date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - timeWindow);

    // Fetch shipment data for correlation analysis
    let query = supabase
      .from('shipments')
      .select(`
        product_id,
        price,
        quantity,
        products (
          id,
          hs_code,
          category
        )
      `)
      .gte('shipment_date', startDate.toISOString())
      .lte('shipment_date', endDate.toISOString());

    if (category) {
      query = query.eq('products.category', category);
    }

    const { data: shipments, error } = await query;

    if (error || !shipments) {
      console.error('Error fetching shipments:', error);
      return [];
    }

    // Group by product
    const productData = new Map<string, CorrelationData>();
    shipments.forEach((shipment: any) => {
      const product = shipment.products;
      if (!product) return;

      const prodId = product.id;
      if (!productData.has(prodId)) {
        productData.set(prodId, {
          product_id: prodId,
          hs_code: product.hs_code,
          category: product.category,
          price_data: [],
          volume_data: [],
          time_period: `${startDate.toISOString()}_${endDate.toISOString()}`,
        });
      }

      const data = productData.get(prodId)!;
      data.price_data.push(shipment.price);
      data.volume_data.push(shipment.quantity);
    });

    // Calculate correlations between all product pairs
    const products = Array.from(productData.values());
    const correlations: CorrelationResult[] = [];

    for (let i = 0; i < products.length; i++) {
      for (let j = i + 1; j < products.length; j++) {
        const productA = products[i];
        const productB = products[j];

        // Calculate correlation on price data
        const corr = calculateCorrelation(productA.price_data, productB.price_data);

        if (Math.abs(corr) > 0.3) {
          // Only include meaningful correlations
          const strength = Math.abs(corr) < 0.5 ? 'weak' : Math.abs(corr) < 0.7 ? 'moderate' : 'strong';
          const type = corr > 0.3 ? 'positive' : corr < -0.3 ? 'negative' : 'neutral';

          const interpretation = getCorrelationInterpretation(corr, strength, productA.category, productB.category);

          correlations.push({
            product_a: {
              id: productA.product_id,
              hs_code: productA.hs_code,
              category: productA.category,
            },
            product_b: {
              id: productB.product_id,
              hs_code: productB.hs_code,
              category: productB.category,
            },
            correlation_coefficient: corr,
            correlation_type: type,
            strength,
            interpretation,
          });
        }
      }
    }

    // Sort by correlation strength
    correlations.sort((a, b) => Math.abs(b.correlation_coefficient) - Math.abs(a.correlation_coefficient));

    return correlations;
  } catch (error) {
    console.error('Error analyzing correlations:', error);
    return [];
  }
}

/**
 * Get sector-wide correlation analysis
 */
export async function getSectorCorrelations(timeWindow: number = 90): Promise<SectorCorrelation[]> {
  try {
    const { data: products, error } = await supabase
      .from('products')
      .select('id, hs_code, category');

    if (error || !products) {
      return [];
    }

    // Group by category
    const categories = new Set(products.map((p) => p.category));
    const sectorCorrelations: SectorCorrelation[] = [];

    for (const category of categories) {
      const categoryProducts = products.filter((p) => p.category === category);
      const correlations = await analyzeCorrelations(category, timeWindow);

      // Find products with strong correlations
      const correlatedProducts = correlations
        .filter((c) => c.strength === 'strong')
        .map((c) => ({
          product_id: c.product_b.id,
          hs_code: c.product_b.hs_code,
          correlation: c.correlation_coefficient,
        }));

      if (correlatedProducts.length > 0) {
        const avgCorrelation =
          correlatedProducts.reduce((sum, c) => sum + c.correlation, 0) / correlatedProducts.length;
        const trend = avgCorrelation > 0.5 ? 'up' : avgCorrelation < -0.5 ? 'down' : 'stable';
        const significance =
          correlatedProducts.length > 5 ? 'high' : correlatedProducts.length > 2 ? 'medium' : 'low';

        sectorCorrelations.push({
          sector: category,
          correlated_products: correlatedProducts.slice(0, 10), // Top 10
          trend_direction: trend,
          significance,
        });
      }
    }

    return sectorCorrelations;
  } catch (error) {
    console.error('Error getting sector correlations:', error);
    return [];
  }
}

/**
 * Generate correlation matrix for visualization
 */
export async function generateCorrelationMatrix(
  productIds: string[],
  timeWindow: number = 90
): Promise<CorrelationMatrix> {
  try {
    // Get product details
    const { data: productDetails, error: productError } = await supabase
      .from('products')
      .select('id, hs_code, category')
      .in('id', productIds);

    if (productError || !productDetails) {
      return { products: [], matrix: [], insights: [] };
    }

    // Get correlations
    const correlations = await analyzeCorrelations(undefined, timeWindow);
    const products = productDetails;

    // Build matrix
    const matrix: number[][] = products.map(() => products.map(() => 0));

    // Fill matrix
    for (let i = 0; i < products.length; i++) {
      for (let j = 0; j < products.length; j++) {
        if (i === j) {
          matrix[i][j] = 1; // Perfect correlation with itself
        } else {
          const correlation = correlations.find(
            (c) =>
              (c.product_a.id === products[i].id && c.product_b.id === products[j].id) ||
              (c.product_a.id === products[j].id && c.product_b.id === products[i].id)
          );
          matrix[i][j] = correlation?.correlation_coefficient || 0;
        }
      }
    }

    // Generate insights
    const insights = generateCorrelationInsights(correlations, products);

    return {
      products: products.map((p) => ({
        id: p.id,
        hs_code: p.hs_code,
        category: p.category,
      })),
      matrix,
      insights,
    };
  } catch (error) {
    console.error('Error generating correlation matrix:', error);
    return { products: [], matrix: [], insights: [] };
  }
}

/**
 * Calculate Pearson correlation coefficient
 */
function calculateCorrelation(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length === 0) return 0;

  const n = x.length;
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
  const sumXX = x.reduce((sum, val) => sum + val * val, 0);
  const sumYY = y.reduce((sum, val) => sum + val * val, 0);

  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));

  if (denominator === 0) return 0;
  return numerator / denominator;
}

/**
 * Get human-readable correlation interpretation
 */
function getCorrelationInterpretation(
  corr: number,
  strength: string,
  categoryA: string,
  categoryB: string
): string {
  const absCorr = Math.abs(corr);

  if (categoryA === categoryB) {
    if (strength === 'strong') {
      return `Strong ${corr > 0 ? 'positive' : 'negative'} correlation within ${categoryA} sector - products move together in price`;
    }
    return `${strength} correlation within ${categoryA} sector`;
  }

  // Cross-sector correlations
  if (corr > 0.5) {
    return `Products from ${categoryA} and ${categoryB} tend to move together - likely shared supply chain or market factors`;
  } else if (corr < -0.5) {
    return `Products from ${categoryA} and ${categoryB} move inversely - potential substitution effect`;
  }

  return `Weak correlation between ${categoryA} and ${categoryB}`;
}

/**
 * Generate insights from correlation data
 */
function generateCorrelationInsights(correlations: CorrelationResult[], products: any[]): string[] {
  const insights: string[] = [];

  // Find strongest correlations
  const strongCorr = correlations.filter((c) => c.strength === 'strong');
  if (strongCorr.length > 0) {
    insights.push(
      `Found ${strongCorr.length} strong product correlations - these items tend to move together in price`
    );
  }

  // Find negative correlations
  const negativeCorr = correlations.filter((c) => c.correlation_type === 'negative' && c.strength === 'strong');
  if (negativeCorr.length > 0) {
    insights.push(
      `${negativeCorr.length} strong negative correlations detected - potential substitution effects or inverse price relationships`
    );
  }

  // Category-specific insights
  const categories = new Set(products.map((p) => p.category));
  categories.forEach((category) => {
    const categoryProducts = products.filter((p) => p.category === category);
    const categoryCorr = strongCorr.filter(
      (c) => categoryProducts.some((p) => p.id === c.product_a.id || p.id === c.product_b.id)
    );

    if (categoryCorr.length > 2) {
      insights.push(`${category} sector shows ${categoryCorr.length} strong internal correlations - high sector cohesion`);
    }
  });

  return insights;
}

/**
 * Detect anomalies across correlated products
 */
export async function detectCrossSectorAnomalies(): Promise<Array<{
  product_id: string;
  anomaly_type: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}>> {
  try {
    const correlations = await analyzeCorrelations(undefined, 90);
    const strongCorr = correlations.filter((c) => c.strength === 'strong');

    const anomalies: Array<{
      product_id: string;
      anomaly_type: string;
      description: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
    }> = [];

    // Check for diverging correlations (products that should move together but don't)
    const { data: recentShipments } = await supabase
      .from('shipments')
      .select('product_id, price')
      .gte('shipment_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .order('shipment_date', { ascending: false });

    if (recentShipments) {
      for (const correlation of strongCorr) {
        const productA_Data = recentShipments.filter((s: any) => s.product_id === correlation.product_a.id);
        const productB_Data = recentShipments.filter((s: any) => s.product_id === correlation.product_b.id);

        if (productA_Data.length > 0 && productB_Data.length > 0) {
          const avgPriceA =
            productA_Data.reduce((sum: number, s: any) => sum + s.price, 0) / productA_Data.length;
          const avgPriceB =
            productB_Data.reduce((sum: number, s: any) => sum + s.price, 0) / productB_Data.length;

          // Calculate recent correlation
          const pricesA = productA_Data.map((s: any) => s.price);
          const pricesB = productB_Data.map((s: any) => s.price);
          const recentCorr = calculateCorrelation(pricesA, pricesB);

          // If correlation broke down significantly
          if (Math.abs(recentCorr - correlation.correlation_coefficient) > 0.5) {
            anomalies.push({
              product_id: correlation.product_a.id,
              anomaly_type: 'correlation_breakdown',
              description: `Strong correlation with ${correlation.product_b.hs_code} (${correlation.correlation_coefficient.toFixed(2)
                }) has broken down (recent: ${recentCorr.toFixed(2)}) - potential market disruption`,
              severity: 'high',
            });
          }
        }
      }
    }

    return anomalies;
  } catch (error) {
    console.error('Error detecting cross-sector anomalies:', error);
    return [];
  }
}

