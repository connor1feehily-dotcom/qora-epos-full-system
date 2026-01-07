# Qora EPOS Design Guidelines

## Design Approach
**Selected System:** Hybrid approach combining Linear's clarity + Stripe's professional restraint + modern SaaS dashboard patterns. Focus on data legibility, quick scanning, and touch-optimized interactions for retail/hospitality environments.

## Typography System
**Font Family:** Inter (Google Fonts)
- Headings: Inter 600-700 (Semi-bold to Bold)
- Body/UI: Inter 400-500 (Regular to Medium)
- Data/Numbers: Inter 500-600 (tabular numerals enabled)

**Scale:**
- Hero/Page Titles: 48px (desktop), 32px (mobile)
- Section Headers: 32px (desktop), 24px (mobile)
- Card Titles: 20px
- Body Text: 16px
- UI Labels/Metadata: 14px
- Micro-copy: 12px

## Layout System
**Spacing Primitives:** Use Tailwind units: 2, 4, 6, 8, 12, 16, 20, 24
- Touch targets: Minimum 44px (h-11 or p-3)
- Card padding: p-6 to p-8
- Section spacing: py-16 to py-24
- Component gaps: gap-4 to gap-6

**Grid Strategy:**
- Dashboard: 12-column grid with generous gutters (gap-6)
- Marketing: Max-width containers (max-w-7xl) with responsive columns
- Data tables: Full-width with internal padding

## Core Components

### Navigation
**Marketing Header:**
- Sticky top bar with logo left, navigation center, CTA buttons right
- Height: h-16, backdrop blur on scroll
- Demo Mode Badge: Pill shape, positioned top-right with "Demo Mode" text

**Application Sidebar:**
- Fixed left sidebar (w-64), collapsible to icon-only (w-16)
- Navigation items with icons (Heroicons), grouped by function
- Active state: subtle background fill + border accent
- Demo Mode indicator at top with pulsing dot animation

### Data Display
**Dashboard Cards:**
- Rounded corners (rounded-lg)
- Elevated with subtle shadow
- Header with title + action menu
- Generous internal padding (p-6)
- Data visualization or key metrics inside

**Tables:**
- Alternating row backgrounds for scannability
- Sticky headers
- Row height: h-14 minimum for touch
- Action buttons at row end (icon-only with tooltips)
- Sort indicators in column headers

**Charts/Graphs:**
- Use Chart.js or similar
- Consistent axis labeling
- Interactive tooltips on hover/tap
- Legend placement: top or right depending on space

### Forms & Input
**Input Fields:**
- Height: h-12 (touch-optimized)
- Clear visual states: default, focused, error, disabled
- Labels above inputs (floating labels for compact views)
- Helper text below in smaller size
- Validation feedback inline

**Buttons:**
- Primary: Solid fill, h-11 minimum
- Secondary: Outline style
- Ghost: Text only with hover state
- Icon buttons: Square (w-11 h-11) for consistency
- Loading states with spinner

### Modals & Overlays
**Educational Tooltips (Demo Mode):**
- Small arrow pointers
- Max-width: 280px
- Positioned contextually near relevant UI
- Contains: Title, brief description, "Got it" dismissal
- Z-index hierarchy for proper layering

**Modal Dialogs:**
- Centered, max-w-2xl
- Backdrop overlay with blur
- Close button top-right
- Action buttons bottom-right (Cancel, Confirm pattern)

### Transaction Interface (POS-Specific)
**Product Grid:**
- 3-4 columns on desktop, 2 on tablet, 1 on mobile
- Large tap targets (min h-24)
- Product image + name + price
- Quick add to cart interaction

**Cart Summary:**
- Fixed right panel or bottom sheet (mobile)
- Line items with qty adjusters
- Running total prominently displayed
- Checkout button anchored at bottom

**Payment Flow:**
- Large number pad for cash input
- Payment method selection (icons + labels)
- Transaction confirmation screen with print option

## Animations
**Minimal & Purposeful:**
- Page transitions: 200ms ease-in-out
- Hover states: 150ms
- Modal/drawer entrance: 300ms slide + fade
- Demo tooltips: Gentle pulse on first appearance
- Loading states: Smooth spinner, no skeleton screens

## Images

### Marketing Site
**Hero Section:**
- Full-width hero image (1920x800px)
- Shows POS system in retail/restaurant context
- Professional photography: Modern tablet/device at checkout counter with blurred customer/staff in background
- Overlay: Dark gradient (bottom to top) for text readability
- CTA buttons on image with backdrop-blur-sm backgrounds

**Feature Sections:**
- 3-column feature grid with icons (not images)
- Optional: Single feature screenshot (1200x800px) showing dashboard interface in use
- Testimonial section: Headshots (80x80px, circular) of business owners

**No hero image for:** Application dashboard (data-first interface)

## Demo Mode Indicators
**Badge Design:**
- Pill shape with icon + "Demo Mode" text
- Positioned top-right of viewport (fixed)
- Subtle animation: Slow pulse every 3 seconds
- Click to reveal demo instructions overlay

**Educational Tooltips:**
- Appear on first interaction with key features
- Numbered sequence (1 of 5, etc.)
- Dismissible individually or all at once
- "Show me around" option to replay tutorial

## Responsive Breakpoints
- Mobile: < 768px (single column, bottom navigation)
- Tablet: 768px-1024px (condensed sidebar, 2-column grids)
- Desktop: > 1024px (full interface, multi-column layouts)