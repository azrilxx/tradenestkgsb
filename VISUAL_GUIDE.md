# Trade Intelligence Dashboard - Visual Guide

## 🎨 What You'll See (Screenshots Guide)

---

## Page Layout (Top to Bottom)

### 1. **Header Section**
```
┌─────────────────────────────────────────────────────────┐
│  Trade Intelligence                                      │
│  Drill down into shipment data and analyze trade        │
│  patterns across Malaysian companies                    │
└─────────────────────────────────────────────────────────┘
```

---

### 2. **Search & Filters** (Existing - No Changes)
```
┌─────────────────────────────────────────────────────────┐
│  Search & Filters                                        │
├─────────────────────────────────────────────────────────┤
│  [HS Code]  [Company]  [Country]  [Port]  [Dates]      │
│  [Search Button]  [Clear Filters Button]                │
└─────────────────────────────────────────────────────────┘
```

---

### 3. **Stats Cards** (Existing - No Changes)
```
┌──────────┬──────────┬──────────┬──────────┐
│    150   │ RM 45.2M │ RM 2.85  │    23    │
│ Shipments│   Value  │ Avg $/kg │Companies │
└──────────┴──────────┴──────────┴──────────┘
```

---

### 4. **NEW: Trend Charts** (3 Charts Added)

#### Chart 1: Shipment Volume Over Time
```
┌─────────────────────────────────────────────────────────┐
│  📈 Shipment Volume Over Time                           │
├─────────────────────────────────────────────────────────┤
│     ^                                                    │
│  150│           ╱──╲                                     │
│  120│      ╱───╯    ╲                                    │
│   90│  ───╯           ╲──╲                               │
│   60│                      ╲                             │
│   30│                       ╲──                          │
│     └──────────────────────────────────────> Months     │
│      Aug  Sep  Oct  Nov  Dec  Jan                       │
│                                                          │
│  Shows: Number of shipments per month                   │
│  Color: Blue line                                        │
│  Use Case: Detect import surges                         │
└─────────────────────────────────────────────────────────┘
```

#### Chart 2: Average Price Trend
```
┌─────────────────────────────────────────────────────────┐
│  📉 Average Price Trend                                 │
├─────────────────────────────────────────────────────────┤
│     ^                                                    │
│ 3.00│  ───╲                                              │
│ 2.80│       ╲                                            │
│ 2.60│        ╲──                                         │
│ 2.40│           ╲                                        │
│ 2.20│            ╲──╲                                    │
│ 2.00│                ╲───                                │
│     └──────────────────────────────────────> Months     │
│      Aug  Sep  Oct  Nov  Dec  Jan                       │
│                                                          │
│  Shows: Average RM/kg price over time                   │
│  Color: Green line                                       │
│  Use Case: Detect price dumping trends                  │
└─────────────────────────────────────────────────────────┘
```

#### Chart 3: Top Countries by Import Value
```
┌─────────────────────────────────────────────────────────┐
│  Top Countries by Import Value                          │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  China       ████████████████████████  RM 28.5M         │
│  Singapore   ███████████  RM 8.2M                       │
│  Japan       ████████  RM 5.1M                          │
│  S. Korea    ██████  RM 2.8M                            │
│  Germany     ████  RM 1.9M                              │
│                                                          │
│  Shows: Market share by country                         │
│  Color: Purple bars                                     │
│  Use Case: Identify dominant suppliers                  │
└─────────────────────────────────────────────────────────┘
```

---

### 5. **Top Companies & Countries** (Existing - No Changes)
```
┌──────────────────────────┬──────────────────────────┐
│ Top Companies by Value   │ Top Countries by Volume  │
├──────────────────────────┼──────────────────────────┤
│ #1 MegaSteel  RM 8.5M    │ #1 China      142        │
│ #2 SteelCorp  RM 5.2M    │ #2 Singapore   45        │
│ ...                      │ ...                      │
└──────────────────────────┴──────────────────────────┘
```

---

### 6. **NEW: Enhanced Shipment Table with Anomaly Highlighting**

#### Normal Shipment Row (White Background)
```
┌────────────────────────────────────────────────────────────────┐
│ 2025-01-15 │ SteelCorp │ China→MY │ 15 tons │ RM 42K │ 7208 │ ✓ │
│ Arr: 01-28 │ China     │          │         │RM2.80  │      │   │
└────────────────────────────────────────────────────────────────┘
```

#### Medium Risk Shipment (Yellow Background + Yellow Border)
```
║ ┌────────────────────────────────────────────────────────────────┐
║ │ 2025-01-14 │ ImportCo │ Japan→MY │ 12 tons │ RM 38K │ 7214 │ ⚠ │
║ │ Arr: 01-25 │ Japan    │          │         │RM3.15  │      │ Medium │
║ │            │          │          │         │        │      │ -12.5% vs avg │
║ └────────────────────────────────────────────────────────────────┘
Yellow border on left
```

#### High Risk Shipment (Orange Background + Orange Border)
```
║ ┌────────────────────────────────────────────────────────────────┐
║ │ 2025-01-13 │ ChinaSteel│ China→MY │ 20 tons │ RM 50K │ 7208 │ 🔶 │
║ │ Arr: 02-01 │ China     │          │         │RM2.50  │      │ High Risk │
║ │            │          │          │         │        │      │ ⚠ 25% below avg │
║ │            │          │          │         │        │      │ -25.0% vs avg │
║ └────────────────────────────────────────────────────────────────┘
Orange border on left
```

#### Critical Risk Shipment (Red Background + Red Border) - DUMPING SUSPECTED
```
║ ┌────────────────────────────────────────────────────────────────┐
║ │ 2025-01-12 │ MegaSteel │ China→MY │ 25 tons │ RM 42K │ 7214 │ 🔴 │
║ │ Arr: 02-05 │ China     │          │         │RM1.68  │      │ Critical │
║ │            │          │          │         │        │      │ ⚠ 42% below │
║ │            │          │          │         │        │      │ market - │
║ │            │          │          │         │        │      │ Dumping │
║ │            │          │          │         │        │      │ suspected │
║ │            │          │          │         │        │      │ -42.3% vs avg │
║ └────────────────────────────────────────────────────────────────┘
Red border on left - IMMEDIATE ATTENTION REQUIRED
```

---

## Risk Level Indicators

### Visual Hierarchy
```
🔴 Critical  → Red background + Red left border (4px thick)
               "XX% below market - Dumping suspected"
               Price: >30% below average

🔶 High Risk → Orange background + Orange left border
               "XX% below average - High risk"
               Price: 20-30% below average

⚠  Medium   → Yellow background + Yellow left border
               "XX% above/below average"
               Price: 10-20% deviation

✓  Normal   → No highlight, white background
               Within acceptable range
```

### Risk Column Content
```
┌─────────────────────────────┐
│  🔴 Critical                │  ← Badge
│  ⚠ 42% below market -       │  ← Warning icon + message
│     Dumping suspected       │
│  -42.3% vs avg              │  ← Exact deviation
└─────────────────────────────┘
```

---

## Color Coding System

### Chart Colors (Professional Palette)
- **Volume Chart:** Blue (#3b82f6) - Trust, stability
- **Price Chart:** Green (#10b981) - Money, growth
- **Country Chart:** Purple (#8b5cf6) - Premium, analytics

### Risk Colors (Traffic Light System)
- **Critical:** Red (#dc2626) - STOP, investigate immediately
- **High:** Orange (#ea580c) - CAUTION, review soon
- **Medium:** Yellow (#ca8a04) - AWARE, monitor
- **Normal:** White (#ffffff) - OK, no action needed

---

## Interactive Features

### Hover Effects
```
Before Hover:
┌─────────────────────┐
│ 2025-01-15 │ Steel │
└─────────────────────┘

On Hover:
┌─────────────────────┐  ← Light gray background
│ 2025-01-15 │ Steel │  ← Slightly darker
└─────────────────────┘

Chart Tooltip (on hover):
┌───────────────────┐
│ Aug 2024          │
│ Shipments: 142    │
│ Volume: 2.8k tons │
└───────────────────┘
```

### Responsive Behavior
```
Desktop (>1024px):
[Chart 1]  [Chart 2]     ← Side by side
[Chart 3 - Full Width]   ← Spans both columns

Mobile (<768px):
[Chart 1]                ← Stacked
[Chart 2]
[Chart 3]
```

---

## Real-World Usage Scenario

### Manufacturer Workflow:

**Step 1: Initial View**
```
Opens page → Sees 800 shipments
Notices 3 red rows immediately (critical alerts)
Checks price trend chart → Sees 18% price drop over 3 months
```

**Step 2: Filter for Investigation**
```
Enters HS Code: 7214 (Steel bars)
Enters Country: China
Clicks Search
```

**Step 3: Analyze Results**
```
Now sees 45 shipments from China
12 are red-highlighted (dumping suspected)
Price chart shows consistent undercutting
```

**Step 4: Evidence Collection**
```
Screenshots:
1. Price trend chart showing collapse
2. Red-highlighted shipment rows
3. Country comparison chart (China 70% market share)

Uses in anti-dumping petition to MITI
```

---

## Key Visual Differences

### Before (What You Had):
```
Plain table, all rows white
No charts
No risk indicators
Just data
```

### After (What You Have Now):
```
┌─ RED ROWS immediately catch eye
│  "Something is wrong here!"
│
├─ CHARTS show patterns visually
│  "Price is collapsing month-over-month"
│
├─ BADGES categorize severity
│  "42% below market - Dumping suspected"
│
└─ TRENDS inform decisions
   "China imports up 35%, price down 18%"
```

---

## Testing Checklist

Visit: http://localhost:3008/dashboard/trade-intelligence

### ✅ Visual Verification:
- [ ] 3 charts displayed above table
- [ ] At least 1 red row visible (critical risk)
- [ ] Yellow/orange rows present (medium/high risk)
- [ ] Charts have proper axis labels
- [ ] Tooltips appear on chart hover
- [ ] Table rows have colored left borders

### ✅ Functionality:
- [ ] Filter by HS code → Charts update
- [ ] Filter by country → Shows filtered trends
- [ ] Hover over chart → Tooltip shows data
- [ ] Red rows have "Dumping suspected" message
- [ ] Risk badges display correctly

### ✅ Data Accuracy:
- [ ] Price trend matches table data
- [ ] Volume counts match shipment totals
- [ ] Anomaly % matches price deviation

---

## Quick Reference: Anomaly Thresholds

```
Price Deviation        Risk Level    Visual
─────────────────────────────────────────────
< -30%                Critical      🔴 Red
-30% to -20%          High          🔶 Orange
-20% to -10%          Medium        ⚠  Yellow
-10% to +10%          Normal        ✓  White
+10% to +20%          Medium        ⚠  Yellow
> +20%                Medium        ⚠  Yellow
```

**Z-Score Threshold:** |z| > 2.5 = Unusual pattern

---

## Pro Tips for Beta Users

### 1. Spot Dumping Quickly
- Look for **red rows** first
- Check if multiple red rows from **same country**
- Compare **price trend chart** (should show drop)
- **Evidence:** Screenshot red rows + trend chart

### 2. Market Share Analysis
- Check **Country bar chart**
- If one country >50% = **concentration risk**
- Compare with **volume trend** (is it growing?)

### 3. Price Monitoring
- Monthly check: **Price trend chart**
- If downward slope for 3+ months = **dumping pattern**
- Compare against **your internal costs**

---

*Visual guide generated for TradeNest v1.0*
*Last updated: 2025-10-26*
