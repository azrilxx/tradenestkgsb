/**
 * Lazy Import Utilities
 * Optimize bundle size with dynamic imports
 */

import { lazy, ComponentType } from 'react';

/**
 * Lazy load components for code splitting
 */

// Network visualization components (heavy)
export const LazyNetworkGraph = lazy(() =>
  import('@/components/intelligence/network-graph').then(module => ({
    default: module.NetworkGraph
  }))
);

// Cascade flow visualization (heavy)
export const LazyCascadeFlow = lazy(() =>
  import('@/components/intelligence/cascade-flow').then(module => ({
    default: module.CascadeFlow
  }))
);

// Comparison panel (heavy modal)
export const LazyComparisonPanel = lazy(() =>
  import('@/components/intelligence/comparison-panel').then(module => ({
    default: module.ComparisonPanel
  }))
);

// Subscription banner (not always visible)
export const LazySubscriptionBanner = lazy(() =>
  import('@/components/subscription/subscription-banner').then(module => ({
    default: module.SubscriptionBanner
  }))
);

// Advanced filters (can be collapsed)
export const LazyAdvancedFilters = lazy(() =>
  import('@/components/intelligence/advanced-filters').then(module => ({
    default: module.AdvancedFilters
  }))
);

// Loading skeleton
export const LazyLoadingSkeleton = lazy(() =>
  import('@/components/intelligence/loading-skeleton').then(module => ({
    default: module.LoadingSkeleton
  }))
);

/**
 * Lazy load utilities dynamically
 */
export async function loadAnalysisUtils() {
  return import('@/lib/analytics/connection-analyzer');
}

export async function loadMLPredictor() {
  return import('@/lib/ml/cascade-predictor');
}

export async function loadGraphAnalyzer() {
  return import('@/lib/analytics/graph-analyzer');
}

export async function loadTemporalAnalyzer() {
  return import('@/lib/analytics/temporal-analyzer');
}

export async function loadMultiHopAnalyzer() {
  return import('@/lib/analytics/multi-hop-analyzer');
}

/**
 * Preload heavy components in background
 */
export function preloadComponents() {
  // Preload critical components after initial render
  setTimeout(() => {
    import('@/components/intelligence/network-graph');
    import('@/components/intelligence/cascade-flow');
  }, 3000);
}

/**
 * Load route components lazily
 */
export const LazyDashboardPages = {
  alerts: lazy(() => import('@/app/dashboard/alerts/page')),
  analytics: lazy(() => import('@/app/dashboard/analytics/page')),
  benchmarks: lazy(() => import('@/app/dashboard/benchmarks/page')),
  correlation: lazy(() => import('@/app/dashboard/correlation/page')),
  intelligence: lazy(() => import('@/app/dashboard/intelligence/page')),
  products: lazy(() => import('@/app/dashboard/products/page')),
  reports: lazy(() => import('@/app/dashboard/reports/page')),
  rules: lazy(() => import('@/app/dashboard/rules/page')),
  scenarios: lazy(() => import('@/app/dashboard/scenarios/page')),
  'trade-intelligence': lazy(() => import('@/app/dashboard/trade-intelligence/page')),
  'trade-remedy': lazy(() => import('@/app/dashboard/trade-remedy/page')),
};

/**
 * Component preloader for better UX
 */
export function useComponentPreloader() {
  if (typeof window !== 'undefined') {
    // Preload on idle
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        preloadComponents();
      });
    } else {
      // Fallback for browsers without requestIdleCallback
      setTimeout(preloadComponents, 2000);
    }
  }
}

export default {
  LazyNetworkGraph,
  LazyCascadeFlow,
  LazyComparisonPanel,
  LazySubscriptionBanner,
  LazyAdvancedFilters,
  LazyLoadingSkeleton,
  loadAnalysisUtils,
  loadMLPredictor,
  loadGraphAnalyzer,
  loadTemporalAnalyzer,
  loadMultiHopAnalyzer,
  preloadComponents,
  useComponentPreloader,
};

