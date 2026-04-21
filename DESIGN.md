# SD Card Tracker — Design System Documentation

> This document covers every design decision in the SD Card Tracker application.  
> Hand this to any developer or designer to replicate or extend the UI consistently.

---

## Table of Contents

1. [Design Philosophy](#1-design-philosophy)
2. [Typography](#2-typography)
3. [Color System](#3-color-system)
4. [Spacing & Sizing](#4-spacing--sizing)
5. [Component Library](#5-component-library)
6. [Chart Design](#6-chart-design)
7. [Layout & Grid](#7-layout--grid)
8. [Iconography](#8-iconography)
9. [Animation](#9-animation)
10. [File Structure](#10-file-structure)
11. [Tech Stack](#11-tech-stack)

---

## 1. Design Philosophy

The UI is modeled after the **Build AI internal dashboard** (ingestion project). The core principles are:

| Principle | Description |
|-----------|-------------|
| **Sharp** | Zero border radius on all elements — no rounded corners anywhere |
| **Dense** | Small text, compact padding, maximum information density |
| **Monochrome-first** | Black/white/gray base; color used only for semantic meaning |
| **Data-forward** | Numbers are always the visual hero — large, tabular, prominent |
| **No noise** | No shadows, no gradients, no decorative icons unless they carry meaning |

---

## 2. Typography

### Font Families

| Role | Font | Variable | Fallback |
|------|------|----------|----------|
| **UI / Body** | Inter | `--font-ui` | Segoe UI, Helvetica Neue, Arial, sans-serif |
| **Monospace / Numbers** | JetBrains Mono | `--font-code` | ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas |

Both fonts are loaded via **Next.js Google Fonts** (`next/font/google`) with `display: swap`.

```ts
// app/layout.tsx
import { Inter, JetBrains_Mono } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-ui',
  weight: ['400', '500', '600', '700'],
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-code',
  weight: ['400', '500', '600'],
})
```

### Type Scale

| Name | Size | Weight | Usage |
|------|------|--------|-------|
| **Display / KPI** | `text-2xl` (24px) | 600 semibold | Dashboard KPI numbers |
| **Heading** | `text-xs` (12px) | 600 semibold | Card titles, section headers |
| **Body** | `text-xs` (12px) | 400 regular | General content, table rows |
| **Label** | 10px (`text-[10px]`) | 500 medium | Column headers, stat labels |
| **Caption** | 10px (`text-[10px]`) | 400 regular | Secondary metadata |
| **Mono / Tabular** | `font-mono` | 600 semibold | Dates, quantities, metrics |

### Special Classes

```css
/* Label — used for all uppercase section/column labels */
.text-label {
  font-size: 0.625rem;       /* 10px */
  font-weight: 500;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--muted-foreground);
}
```

### Rules

- Numbers and dates always use `font-mono` + `tabular-nums` for alignment
- Headings use `letter-spacing: -0.02em` (tighter than default)
- Labels are **always uppercase** with wide letter-spacing (`tracking-wider`)
- No text larger than `text-2xl` in regular UI — KPI numbers are the exception

---

## 3. Color System

Colors are defined using **CSS custom properties** with `oklch()` color space for perceptual uniformity. All tokens are set in `app/globals.css`.

### Base Palette (Light Mode)

| Token | Value (oklch) | Approx Hex | Usage |
|-------|--------------|------------|-------|
| `--background` | `oklch(0.99 0 0)` | `#FDFDFB` | Page background |
| `--foreground` | `oklch(0.15 0 0)` | `#1A1A1A` | Primary text |
| `--card` | `oklch(1 0 0)` | `#FFFFFF` | Card background |
| `--card-foreground` | `oklch(0.15 0 0)` | `#1A1A1A` | Card text |
| `--muted` | `oklch(0.95 0 0)` | `#F2F2F2` | Subtle backgrounds, hover states |
| `--muted-foreground` | `oklch(0.45 0 0)` | `#6B6B6B` | Secondary text, labels |
| `--border` | `oklch(0.90 0 0)` | `#E5E5E5` | Card rings, dividers, table rows |
| `--input` | `oklch(0.90 0 0)` | `#E5E5E5` | Input borders |
| `--primary` | `oklch(0.15 0 0)` | `#1A1A1A` | Primary buttons, active tabs |
| `--primary-foreground` | `oklch(0.98 0 0)` | `#FAFAFA` | Text on primary buttons |
| `--secondary` | `oklch(0.92 0.01 210)` | `#E8EDF2` | Secondary buttons, hover chips |
| `--ring` | `oklch(0.15 0 0)` | `#1A1A1A` | Focus rings |

### Chart Colors

| Token | Value | Role |
|-------|-------|------|
| `--chart-1` | `oklch(0.30 0 0)` | Dark gray — Sent / primary data series |
| `--chart-2` | `oklch(0.65 0.15 145)` | Green — Returned / success |
| `--chart-3` | `oklch(0.70 0.15 75)` | Yellow — Warning |
| `--chart-4` | `oklch(0.62 0.18 25)` | Orange — Outstanding / error |
| `--chart-5` | `oklch(0.58 0.15 270)` | Purple — Accent (reserved) |

### Semantic Status Colors

| Semantic | Background token | Text token | Usage |
|----------|-----------------|------------|-------|
| **Success** | `--success-muted` | `--success-foreground` | Returned, cleared teams |
| **Warning** | `--warning-muted` | `--warning-foreground` | Partially returned |
| **Error** | `--error-muted` | `--error-foreground` | Outstanding, overdue |

```css
/* Full definitions */
--success: oklch(0.60 0.18 145);
--success-foreground: oklch(0.25 0.05 145);
--success-muted: oklch(0.96 0.03 145);

--warning: oklch(0.70 0.15 75);
--warning-foreground: oklch(0.35 0.08 75);
--warning-muted: oklch(0.96 0.03 75);

--error: oklch(0.62 0.18 25);
--error-foreground: oklch(0.30 0.08 25);
--error-muted: oklch(0.96 0.03 25);
```

### Color Usage Rules

- **Never** use raw hex or rgb values in components — always use CSS tokens
- Blue is **not used** for interactive elements; black (`--primary`) is used instead
- Green = returned/positive. Orange = outstanding/negative. Gray = neutral
- Backgrounds should be `--background` or `--card` only — no custom background colors on containers

---

## 4. Spacing & Sizing

### Border Radius

**Zero everywhere.** No rounded corners on any element.

```css
--radius: 0px;
```

This applies to cards, buttons, inputs, badges, tabs, and chart tooltips.

### Component Heights

| Element | Height |
|---------|--------|
| Topbar / Header | `h-11` (44px) |
| Button (default) | `h-8` (32px) |
| Button (sm) | `h-7` (28px) |
| Button (xs) | `h-6` (24px) |
| Input | `h-8` (32px) |

### Padding Scale

| Context | Padding |
|---------|---------|
| Card content | `px-4` (16px horizontal) |
| Card vertical | `py-4` (16px) or `py-3` (12px) for compact |
| Table cells | `py-2 pr-4` |
| Topbar | `px-4` |
| Page main | `px-4 py-6` |
| Button (default) | `px-3` |
| Input | `px-2.5 py-1.5` |

### Gap / Spacing

- Grid gaps between cards: `gap-3` (12px)
- Section spacing: `gap-6` (24px)
- Form field gaps: `gap-3` (12px)
- Inline icon-to-text: `gap-1` or `gap-1.5`

---

## 5. Component Library

All components live in `components/ui/`. They are custom-built (not shadcn/ui) but follow the same API patterns.

### Card

```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
```

| Prop | Type | Default |
|------|------|---------|
| `className` | `string` | — |

**Visual spec:**
- Background: `bg-card`
- Border: `ring-1 ring-border` (1px solid border via box-shadow ring — not a traditional border)
- Radius: none (`rounded-none` implied by global `--radius: 0`)
- Padding: `py-4` vertical, content uses `px-4`
- Internal gap: `gap-4` between header/content/footer sections

```tsx
<Card>
  <CardHeader>
    <CardTitle>Title here</CardTitle>
    <CardDescription>UPPERCASE LABEL</CardDescription>
  </CardHeader>
  <CardContent>
    {/* content */}
  </CardContent>
</Card>
```

---

### Button

```tsx
import { Button } from '@/components/ui/button'
```

| Variant | Visual |
|---------|--------|
| `default` | Black background, white text |
| `outline` | White background, `--border` border, hover turns muted |
| `ghost` | Transparent, hover turns `--muted` |
| `destructive` | Light red background, red text |

| Size | Height | Padding |
|------|--------|---------|
| `default` | 32px | `px-3` |
| `sm` | 28px | `px-2.5` |
| `xs` | 24px | `px-2`, `text-[10px]` |

**No rounded corners** on any variant.

---

### Badge

```tsx
import { Badge } from '@/components/ui/badge'
```

| Variant | Usage |
|---------|-------|
| `default` | Neutral gray — secondary/sent |
| `success` | Green — fully returned |
| `warning` | Yellow — partially returned |
| `error` | Orange/red — outstanding |
| `outline` | Border only — counts, metadata |

All badges are `text-[10px] uppercase tracking-wider` — matching the label style.

---

### Input

```tsx
import { Input } from '@/components/ui/input'
```

- Height: `h-8` (32px)
- Border: `border border-input` (1px, `--input` color)
- Text: `text-xs`
- Focus: `ring-1 ring-ring` (black ring, no offset)
- No rounded corners

---

## 6. Chart Design

Charts use **Recharts** (`recharts@2.x`). All chart styling follows these rules:

### General Rules

| Property | Value |
|----------|-------|
| Grid lines | Horizontal only (`vertical={false}`), `strokeDasharray="3 3"`, `strokeOpacity={0.5}` |
| Grid color | `var(--border)` |
| Axis tick font size | `10px` |
| Axis tick color | `var(--muted-foreground)` |
| Axis lines | Hidden (`axisLine={false}`, `tickLine={false}`) |
| Animation duration | `400ms` |
| Bar radius | `[1, 1, 0, 0]` — 1px top corners only |

### Tooltip Style

All chart tooltips are custom-rendered and must match this spec:

```tsx
<div style={{
  background: 'var(--card)',
  border: '1px solid var(--border)',
  padding: '8px 12px',
  fontSize: 11,
  // NO border-radius
}}>
  <div style={{ fontWeight: 600, marginBottom: 4 }}>Label</div>
  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
    <span style={{ color: 'var(--muted-foreground)', textTransform: 'uppercase', fontSize: 10 }}>Key</span>
    <span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>Value</span>
  </div>
</div>
```

### Chart Inventory

| Component | Type | Data | File |
|-----------|------|------|------|
| `SentReturnedByTeam` | Grouped Bar | Sent & Returned per team | `components/charts/SentReturnedByTeam.tsx` |
| `CirculationTimeline` | Line | Cumulative Sent / Returned / Outstanding over dates | `components/charts/CirculationTimeline.tsx` |
| `OutstandingChart` | Bar (colored) | Outstanding cards per team | `components/charts/OutstandingChart.tsx` |

### Chart Colors

| Series | Token |
|--------|-------|
| Sent | `var(--chart-1)` — dark gray, `fillOpacity: 0.75` |
| Returned | `var(--chart-2)` — green, `fillOpacity: 0.75` |
| Outstanding | `var(--chart-4)` — orange, `fillOpacity: 0.8` |
| Cleared (0 outstanding) | `var(--chart-2)` — green |

---

## 7. Layout & Grid

### Page Structure

```
┌──────────────────────────────────────────────────┐
│  Topbar (sticky, h-11, border-b)                 │
├──────────────────────────────────────────────────┤
│  Main (max-w-7xl, px-4, py-6, gap-6)             │
│  ┌────────────────────────────────────────────┐  │
│  │  KPI Row  (6 columns, gap-3)               │  │
│  ├────────────────────────────────────────────┤  │
│  │  Charts Row  (3 columns, gap-3)            │  │
│  ├────────────────────────────────────────────┤  │
│  │  Team Cards  (4 columns, gap-3)            │  │
│  ├────────────────────────────────────────────┤  │
│  │  Form (2 col) + Log (3 col)  (5 col grid)  │  │
│  └────────────────────────────────────────────┘  │
├──────────────────────────────────────────────────┤
│  Footer (border-t, text-center, text-[10px])     │
└──────────────────────────────────────────────────┘
```

### Responsive Breakpoints

| Section | Mobile | sm (640px) | lg (1024px) | xl (1280px) |
|---------|--------|------------|-------------|-------------|
| KPI cards | 2 col | 3 col | 6 col | 6 col |
| Charts | 1 col | 1 col | 3 col | 3 col |
| Team cards | 1 col | 2 col | 3 col | 4 col |
| Form + Log | 1 col | 1 col | 5 col (2+3) | 5 col (2+3) |

### Max Width

All content is constrained to `max-w-7xl` (1280px) centered with `mx-auto`.

---

## 8. Iconography

Icons come from **Lucide React** (`lucide-react`).

| Icon | Component | Usage |
|------|-----------|-------|
| Trending Up | `<TrendingUp size={14} />` | KPI rising (bad — outstanding going up) |
| Trending Down | `<TrendingDown size={14} />` | KPI falling (good — teams cleared) |
| Minus | `<Minus size={14} />` | KPI neutral |

### Rules

- Icon size in topbar/labels: `size={11}` or `size={12}`
- Icon size in KPI trend indicators: `size={14}`
- Icons are always paired with text — never used alone as the only affordance
- Do not use emojis in the UI (they were removed in this version)

---

## 9. Animation

### Classes

| Class | Keyframe | Usage |
|-------|----------|-------|
| `animate-fade-in` | Opacity 0 → 1, 350ms ease-out | KPI cards on page load |
| `animate-slide-up` | Opacity 0 + Y+6px → opacity 1 + Y0, 350ms ease-out | Team cards on load |
| `animate-pulse` (Tailwind built-in) | Opacity pulse | Loading skeleton placeholders |

### Skeleton Loading

While records are fetching, charts show animated bar skeletons:

```tsx
<div className="h-full flex items-end gap-1 px-2">
  {[40, 70, 55, 90, 65, 80, 45].map((h, i) => (
    <div key={i} className="flex-1 bg-muted animate-pulse" style={{ height: `${h}%` }} />
  ))}
</div>
```

Team card skeletons are plain `bg-muted animate-pulse h-40` blocks.

---

## 10. File Structure

```
sd-tracker/
├── app/
│   ├── globals.css          ← Design tokens (CSS variables, typography utilities)
│   ├── layout.tsx           ← Font loading (Inter + JetBrains Mono), metadata
│   ├── page.tsx             ← Dashboard (KPIs, charts, forms, log)
│   └── api/
│       ├── records/route.ts ← GET — reads from Google Sheets
│       ├── send/route.ts    ← POST — appends Sent row
│       └── return/route.ts  ← POST — appends Returned row
│
├── components/
│   ├── ui/
│   │   ├── card.tsx         ← Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter
│   │   ├── button.tsx       ← Button (variant + size)
│   │   ├── badge.tsx        ← Badge (variant)
│   │   └── input.tsx        ← Input
│   ├── charts/
│   │   ├── SentReturnedByTeam.tsx   ← Grouped bar chart
│   │   ├── CirculationTimeline.tsx  ← Line chart + buildTimeline() helper
│   │   └── OutstandingChart.tsx     ← Colored bar chart
│   ├── TeamCard.tsx         ← Per-team summary card with progress bar
│   ├── SendForm.tsx         ← Form to record a send
│   ├── ReturnForm.tsx       ← Form to record a return
│   └── RecordsTable.tsx     ← Full transaction log table
│
├── lib/
│   ├── sheets.ts            ← Google Sheets read/write (googleapis)
│   ├── excel.ts             ← Legacy Excel read/write (xlsx) — not used in production
│   └── utils.ts             ← cn() helper (clsx + tailwind-merge)
│
├── data/
│   └── sdcards.xlsx         ← Local fallback file (not used when Google Sheets is configured)
│
├── public/                  ← Static assets (SVGs from Next.js scaffold)
├── vercel.json              ← Vercel deployment config
├── .env.local               ← Local secrets (not committed to git)
└── DESIGN.md                ← This file
```

---

## 11. Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 16.x |
| Language | TypeScript | 5.x |
| Styling | Tailwind CSS v4 | 4.x |
| Charts | Recharts | 2.x |
| Icons | Lucide React | 0.56x |
| Class utilities | clsx + tailwind-merge | latest |
| Google Sheets | googleapis | 144.x |
| Excel (fallback) | xlsx (SheetJS) | 0.18.x |
| Fonts | next/font/google (Inter, JetBrains Mono) | — |
| Deployment | Vercel | — |
| Data source | Google Sheets (primary) | — |

### Environment Variables (required in production)

| Variable | Description |
|----------|-------------|
| `GOOGLE_CLIENT_EMAIL` | Service account email from GCP |
| `GOOGLE_PRIVATE_KEY` | Private key from GCP service account JSON |
| `GOOGLE_SPREADSHEET_ID` | ID from the Google Sheet URL |

### Google Sheet Schema

The app reads/writes to a single sheet (`Sheet1`) with exactly these 4 columns:

| Column | Type | Example |
|--------|------|---------|
| `Team` | String | `Alpha` |
| `Date` | String (YYYY-MM-DD) | `2025-04-10` |
| `Sent` | Number | `20` |
| `Returned` | Number | `0` |

- A **send** event: `Sent = N`, `Returned = 0`
- A **return** event: `Sent = 0`, `Returned = N`
- Dashboard aggregates by Team — summing all Sent and Returned rows per team

---

*Last updated: April 2026*
