# LogiFlex.kz Design Guidelines

## Design Approach

**Selected System**: Material Design with enterprise B2B adaptations
**Rationale**: Information-dense logistics platform requiring clear data hierarchy, professional trust signals, and efficient workflows for carriers, shippers, and administrators.

**Core Principles**:
- Clarity over decoration - prioritize data legibility and task completion
- Trust through consistency - government integration requires formal, reliable appearance
- Efficiency-first interactions - minimize clicks for common workflows
- Role-based visual hierarchy - clear distinction between carrier, shipper, admin interfaces

---

## Typography System

**Primary Font**: Roboto (Material Design standard)
- **Hero/Display**: 2.5rem (40px), font-weight: 700, line-height: 1.2
- **Page Headers**: 2rem (32px), font-weight: 600, line-height: 1.3
- **Section Headers**: 1.5rem (24px), font-weight: 600, line-height: 1.4
- **Body Large**: 1.125rem (18px), font-weight: 400, line-height: 1.6
- **Body**: 1rem (16px), font-weight: 400, line-height: 1.5
- **Small/Meta**: 0.875rem (14px), font-weight: 400, line-height: 1.4
- **Captions**: 0.75rem (12px), font-weight: 500, line-height: 1.3

**Data Display Font**: Roboto Mono for numbers, IDs, timestamps
- Sizes: 0.875rem - 1rem, font-weight: 400-500

---

## Layout System

**Spacing Units**: Tailwind scale focused on 4, 6, 8, 12, 16 units
- Component padding: p-4, p-6, p-8
- Section spacing: py-12, py-16, py-20
- Element gaps: gap-4, gap-6, gap-8
- Card spacing: p-6 (mobile), p-8 (desktop)

**Container Strategy**:
- Main content: max-w-7xl mx-auto
- Dashboard cards: max-w-full with inner grid
- Forms: max-w-2xl for optimal input width
- Data tables: max-w-full with horizontal scroll on mobile

**Grid Systems**:
- Dashboard widgets: grid-cols-1 md:grid-cols-2 lg:grid-cols-3
- Cargo listings: grid-cols-1 lg:grid-cols-2 for card view
- Statistics: grid-cols-2 md:grid-cols-4 for metric cards

---

## Component Library

### Navigation
**Header**: Fixed top navigation with logo, main navigation, user menu
- Height: 64px (h-16)
- Sticky positioning for dashboard context
- Role indicator badge (Carrier/Shipper/Admin)

**Sidebar** (Admin/Dashboard areas): 
- Width: 256px (w-64) desktop, collapsible on tablet
- Hierarchical navigation with icons and labels
- Active state with visual indicator

### Data Display
**Tables**: Material Design elevated cards with striped rows
- Sticky headers for long tables
- Row actions on hover
- Sortable columns with clear indicators
- Mobile: Card-based layout replacing table

**Cards**: Elevated (shadow-md) with structured content hierarchy
- Header: Title + metadata
- Body: Key information in defined grid
- Footer: Actions or status indicators

**Status Badges**: Pill-shaped with semantic meaning
- Dimensions: px-3 py-1, rounded-full
- Font: 0.75rem, font-weight: 600

### Forms
**Input Fields**: Material Design outlined style
- Labels: Floating or top-aligned, 0.875rem
- Input height: h-12 (48px) for touch-friendly interaction
- Helper text: 0.75rem below field
- Error states: Text indication below field

**Buttons**:
- Primary: h-12, px-6, rounded-lg, font-weight: 600
- Secondary: Same dimensions, different visual treatment
- Text buttons: No background, py-2, px-4
- Icon buttons: w-10 h-10, rounded-full for FABs

### Specialized Components
**Bid Card**: 
- Compact view for listing page
- Expanded modal/drawer for details and actions
- Clear pricing, carrier info, RWS score display

**Quality Score (RWS) Display**:
- Large circular indicator with score
- Breakdown bars for sub-metrics
- Tooltip explanations for score components

**Transaction Timeline**:
- Vertical stepper showing deal progress
- Status icons with connecting lines
- Timestamps and responsible party indicators

---

## Images

**Hero Section**: 
Large format imagery (h-[500px] to h-[600px]) showing modern logistics operations - trucks on highways, cargo containers, warehouse operations. Image should convey scale, professionalism, and Kazakhstan context (if possible). Overlay with semi-transparent gradient for text legibility.

**Dashboard/Feature Illustrations**:
- Government integration blocks: Icons representing official documents, digital signatures
- Quality assurance section: Visual metaphors for reliability (shields, checkmarks)
- No decorative images in data-heavy areas (tables, forms)

**Trust Indicators**:
- Government partner logos in footer
- Security/certification badges near sensitive operations

---

## Accessibility & Polish

**Consistent Implementation**:
- All form inputs maintain unified height (h-12)
- Consistent border radius across components (rounded-lg for cards, rounded-md for inputs)
- Touch targets minimum 44x44px for mobile
- Clear focus states with visible outlines
- ARIA labels for icon-only buttons

**Loading States**:
- Skeleton screens for data tables
- Spinner for form submissions
- Progress indicators for multi-step processes

**Empty States**:
- Illustrative icon + clear message + primary action
- Center-aligned in container

**Animations**: 
Minimal and functional only:
- Page transitions: None or simple fade
- Dropdown menus: Subtle slide-down
- Toast notifications: Slide in from top-right
- No decorative animations

---

## Role-Based Differentiation

**Visual Distinction**:
- Carriers: Emphasis on available cargo, bidding interface
- Shippers: Cargo creation and bid review prioritized
- Admins: Dense data tables, analytics dashboards

**Dashboard Layouts**:
- Carrier: Featured cargo listings + active bids summary
- Shipper: Posted cargo status + incoming bids
- Admin: System metrics + user management + government integration status