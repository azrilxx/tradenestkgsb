# Interconnected Intelligence API Guide

**Version**: 1.0  
**Last Updated**: January 2025

---

## Overview

Complete API reference for Interconnected Intelligence module.

---

## Authentication

All endpoints require authentication via Supabase session:

```typescript
const { data: { session } } = await supabase.auth.getSession();
const token = session.access_token;
```

---

## Endpoints

### 1. Analyze Alert Connections

**Endpoint**: `GET /api/analytics/connections/[alertId]`

**Description**: Analyze interconnected relationships for a specific alert

**Query Parameters**:
- `alertId` (string, required): Alert ID to analyze
- `window` (number, optional): Time window in days (default: 30)

**Request**:
```typescript
fetch(`/api/analytics/connections/${alertId}?window=90`, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
```

**Response**:
```json
{
  "primary_alert": {
    "id": "...",
    "type": "price_anomaly",
    "severity": "high",
    "timestamp": "2025-01-15T10:00:00Z"
  },
  "connected_factors": [...],
  "impact_cascade": {
    "cascading_impact": 75,
    "total_factors": 8,
    "affected_supply_chain": true
  },
  "recommended_actions": [...],
  "risk_assessment": {...}
}
```

**Tier Limits**:
- Free: 30-day window, top 5 connections only
- Professional: 90-day window, all connections
- Enterprise: 180-day window, all connections + ML

---

### 2. Export Data

**Endpoint**: `GET /api/analytics/connections/export`

**Description**: Export intelligence data in CSV or JSON format

**Query Parameters**:
- `alertId` (string, required): Alert ID
- `format` (string, required): 'csv' or 'json'
- `window` (number, optional): Time window in days

**Request**:
```typescript
fetch(`/api/analytics/connections/export?alertId=${alertId}&format=csv`, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
```

**Response**: File download (CSV or JSON)

---

### 3. Batch Analysis

**Endpoint**: `POST /api/analytics/connections/batch`

**Description**: Analyze multiple alerts simultaneously

**Request Body**:
```json
{
  "alertIds": ["id1", "id2", "id3"],
  "timeWindow": 30
}
```

**Response**:
```json
{
  "success": true,
  "total_alerts": 3,
  "successful": 2,
  "failed": 1,
  "results": [...],
  "errors": [...]
}
```

**Tier**: Professional/Enterprise only  
**Limits**: Max 50 alerts per batch

---

### 4. ML Predictions

**Endpoint**: `GET /api/analytics/predictions/[alertId]`

**Description**: Get ML-based cascade predictions

**Query Parameters**:
- `alertId` (string, required): Alert ID
- `window` (number, optional): Time window in days

**Response**:
```json
{
  "likelihood": 75,
  "predicted_impact": 82,
  "estimated_time_to_cascade": 12,
  "confidence_interval": {
    "lower": 65,
    "upper": 85
  },
  "similar_historical_cases": [...],
  "risk_factors": [...]
}
```

**Tier**: Enterprise only

---

### 5. Webhook Subscriptions

**Endpoint**: `POST /api/analytics/connections/subscribe`

**Description**: Create webhook subscription for real-time updates

**Request Body**:
```json
{
  "alertIds": ["id1", "id2"],
  "webhookUrl": "https://example.com/webhook",
  "timeWindow": 180
}
```

**Tier**: Enterprise only

---

## Graph Analysis Algorithms

### Available Algorithms

1. **PageRank**: Importance scoring
2. **Betweenness Centrality**: Critical path identification
3. **Community Detection**: Cluster identification
4. **Clustering Coefficient**: Network density
5. **Critical Path**: High-impact connections

### Usage

```typescript
import { analyzeGraph } from '@/lib/analytics/graph-analyzer';

const metrics = await analyzeGraph(anomalies);
// Returns: { pagerank, centrality, communities, criticalPaths }
```

---

## Temporal Analysis

### Features

1. **Leading Indicators**: Predictor anomalies
2. **Lagging Indicators**: Consequence anomalies
3. **Granger Causality**: Causal relationships
4. **Seasonal Patterns**: Recurring trends

### Usage

```typescript
import { analyzeTemporal } from '@/lib/analytics/temporal-analyzer';

const insights = await analyzeTemporal(data, timeWindow);
// Returns: { leading, lagging, causal, seasonal }
```

---

## Multi-Hop Analysis

### Features

1. **2-Hop Connections**: A→B→C paths
2. **3-Hop Connections**: Deep supply chain
3. **Transitive Risk**: Compound impact
4. **Path Correlation**: Connection strength

### Usage

```typescript
import { analyzeMultiHop } from '@/lib/analytics/multi-hop-analyzer';

const connections = await analyzeMultiHop(alertId, maxHops);
// Returns: { paths, hops, correlation, risk }
```

---

## Error Handling

### Standard Error Format

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {}
}
```

### Common Errors

| Code | Status | Description |
|------|--------|-------------|
| `AUTH_REQUIRED` | 401 | Authentication required |
| `TIER_LIMIT` | 403 | Tier limit reached |
| `INVALID_PARAMS` | 400 | Invalid parameters |
| `NOT_FOUND` | 404 | Resource not found |
| `RATE_LIMIT` | 429 | Rate limit exceeded |

---

## Rate Limiting

### Limits by Tier

- **Free**: 5 analyses/month
- **Professional**: Unlimited
- **Enterprise**: Unlimited + Priority

### Headers

```
X-RateLimit-Limit: 50
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1705432800
```

---

## Response Caching

### Cache Headers

```
Cache-Control: private, max-age=900
ETag: "version-hash"
Last-Modified: timestamp
```

### Cache Invalidation

- Cache duration: 15 minutes
- Invalidates on new data
- Manual invalidation via `DELETE /cache`

---

## Webhooks

### Webhook Format

```json
{
  "type": "connection_update",
  "alert_id": "...",
  "timestamp": "2025-01-15T10:00:00Z",
  "update_type": "new_connection",
  "data": {
    "connections": [...],
    "risk": 75
  }
}
```

### Event Types

- `new_connection`: New relationship detected
- `cascade_update`: Cascade risk changed
- `risk_change`: Risk score updated

---

## SDK Examples

### TypeScript

```typescript
import { TradeNestIntelligence } from '@tradenest/intelligence';

const client = new TradeNestIntelligence({
  apiKey: process.env.API_KEY,
  endpoint: 'https://api.tradenest.com'
});

// Analyze alert
const result = await client.analyzeAlert(alertId, {
  timeWindow: 90,
  includeML: true
});

// Get predictions
const prediction = await client.getPredictions(alertId);

// Export data
const csv = await client.exportCSV(alertId);
```

---

## Best Practices

### 1. Caching

✅ DO: Cache analysis results  
❌ DON'T: Cache user-specific real-time data

### 2. Error Handling

✅ DO: Handle all error cases  
❌ DON'T: Ignore error responses

### 3. Rate Limiting

✅ DO: Respect rate limits  
❌ DON'T: Make excessive requests

### 4. Webhooks

✅ DO: Verify webhook signatures  
❌ DON'T: Process without validation

---

## Support

- **Documentation**: `/docs`
- **GitHub**: https://github.com/tradenest
- **Email**: support@tradenest.com
- **Status**: https://status.tradenest.com

---

**Version**: 1.0 | **Last Updated**: January 2025

