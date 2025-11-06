# LogiFlex.kz - Logistics Marketplace Platform

## Overview
LogiFlex.kz is a comprehensive logistics marketplace platform for Kazakhstan that connects shippers with reliable carriers. The platform features quality-assured freight services with smart matching algorithms and government integration capabilities.

## Current Status
**Phase 1 - MVP Implementation in Progress**

### Completed Features
- ✅ High-fidelity UI prototype with professional design
- ✅ Replit Auth integration with role-based access control (shipper, carrier, admin)
- ✅ PostgreSQL database schema with complete data model
- ✅ Full CRUD API for cargo listings, bids, and transactions
- ✅ RWS (Reputation Weight Score) calculation engine
- ✅ Dashboard analytics endpoints
- ✅ User profile page with БИН/ИИН validation and ЭЦП certificate support
- ✅ Two-way chat system between Shipper and Carrier with auto-refresh (5s polling)

### Role-Based System
Users can have one of three roles:
1. **Shipper** - Can create cargo listings and accept bids
2. **Carrier** - Can browse cargo and submit bids
3. **Admin** - Full platform access

## Tech Stack

### Frontend
- React with TypeScript
- Wouter for routing
- TanStack Query for data fetching
- Tailwind CSS + Shadcn UI components
- Material Design principles

### Backend
- Express.js with TypeScript
- PostgreSQL database with Drizzle ORM
- Replit Auth (OpenID Connect)
- Session management with connect-pg-simple

## Project Structure

```
├── client/
│   ├── src/
│   │   ├── components/          # Reusable UI components
│   │   │   ├── HeroSection.tsx
│   │   │   ├── CargoCard.tsx
│   │   │   ├── BidCard.tsx
│   │   │   ├── RWSScore.tsx
│   │   │   ├── TransactionTimeline.tsx
│   │   │   ├── TransactionChat.tsx
│   │   │   └── ...
│   │   ├── pages/               # Page components
│   │   │   ├── landing.tsx      # Public landing page
│   │   │   ├── home.tsx         # Authenticated home
│   │   │   ├── dashboard.tsx    # User dashboard
│   │   │   ├── profile.tsx      # User profile with БИН/ИИН
│   │   │   └── transaction-detail.tsx # Transaction tracking + chat
│   │   ├── hooks/               # Custom React hooks
│   │   │   └── useAuth.ts
│   │   └── lib/                 # Utilities
│   └── index.css                # Design system colors
├── server/
│   ├── routes.ts                # API endpoints
│   ├── storage.ts               # Database operations
│   ├── replitAuth.ts            # Authentication setup
│   └── db.ts                    # Database connection
└── shared/
    └── schema.ts                # Shared TypeScript types & DB schema

```

## Database Schema

### Tables
- `users` - User accounts with role, RWS score, БИН/ИИН, and ЭЦП certificate info
- `cargo` - Cargo listings from shippers
- `bids` - Carrier bids on cargo
- `transactions` - Deal lifecycle tracking
- `messages` - Two-way chat messages between shipper and carrier
- `rws_metrics` - Quality metrics for reputation scoring
- `sessions` - Authentication sessions

## API Endpoints

### Authentication & Profile
- `GET /api/login` - Initiate login flow
- `GET /api/logout` - Logout
- `GET /api/auth/user` - Get current user
- `PATCH /api/auth/user/role` - Update user role
- `PATCH /api/auth/user/profile` - Update user profile (БИН/ИИН, company, etc.)

### Cargo Management
- `POST /api/cargo` - Create cargo listing (shipper only)
- `GET /api/cargo` - List all cargo (with filters)
- `GET /api/cargo/:id` - Get cargo details
- `PATCH /api/cargo/:id` - Update cargo
- `DELETE /api/cargo/:id` - Delete cargo

### Bidding System
- `POST /api/bids` - Place bid (carrier only)
- `GET /api/cargo/:cargoId/bids` - Get bids for cargo
- `GET /api/bids/my-bids` - Get carrier's bids
- `PATCH /api/bids/:id/status` - Accept/reject bid

### Transactions & Communication
- `GET /api/transactions` - List user transactions
- `GET /api/transactions/:id` - Get transaction details
- `PATCH /api/transactions/:id/status` - Update transaction status
- `POST /api/messages` - Send message in transaction chat (participants only)
- `GET /api/messages/:transactionId` - Get transaction message history (participants only)

### Quality (RWS)
- `POST /api/rws` - Submit quality rating
- `GET /api/rws/:userId` - Get user RWS metrics

### Analytics
- `GET /api/analytics/dashboard` - Get dashboard statistics

## Design System

### Colors
- **Primary**: Blue (#2B7FD8) - Trust and reliability
- **Accent**: Green (#6BB96B) - Success and growth
- **Background**: Light gray (#FAFAFA)
- **Card**: Slightly elevated (#F5F5F5)

### Typography
- **Font Family**: Roboto (sans-serif)
- **Monospace**: Roboto Mono (for data/numbers)

### Components
All components follow Material Design principles with:
- Consistent spacing (p-4, p-6, p-8)
- Hover interactions (hover-elevate utility)
- Professional logistics theme
- Responsive mobile-first design

## Development Workflow

### Running the Application
```bash
npm run dev  # Starts both frontend and backend
```

### Database Management
```bash
npm run db:push        # Sync schema to database
npm run db:push --force # Force sync (use with caution)
npm run db:studio      # Open Drizzle Studio
```

## Next Implementation Steps

### Phase 1 Remaining Tasks
1. ✅ Authentication and role-based access
2. ✅ Database schema and storage layer
3. ⏳ Connect frontend to real APIs (remove mock data)
4. ⏳ Implement cargo creation flow
5. ⏳ Build bidding workflow
6. ⏳ Transaction lifecycle management
7. ⏳ RWS rating system UI
8. ⏳ Analytics dashboard with real data
9. ⏳ Mock government integration interfaces (EDS, e-invoicing)

### Future Enhancements (Phase 2+)
- Real Kazakhstan government API integrations
- Advanced smart matching algorithms
- Real-time notifications via WebSockets
- Payment processing integration
- Document upload and verification
- Dispute resolution system
- Mobile app development

## Environment Variables
```
DATABASE_URL=<postgres-connection-string>
SESSION_SECRET=<auto-generated>
REPL_ID=<replit-project-id>
ISSUER_URL=https://replit.com/oidc
```

## User Preferences
- Professional, enterprise-focused design
- Russian language interface (Kazakh coming later)
- Blue and green color scheme
- Material Design aesthetics
- Data-dense, efficient layouts

## Recent Changes
- **2025-11-05**: Completed migration to Replit environment (496 packages installed)
- **2025-11-05**: Fixed React warnings in Footer component (nested anchor tags)
- **2025-11-05**: Application successfully running on port 5000
- **2025-11-07**: Completed authentication system with Replit Auth
- **2025-11-07**: Implemented complete database schema
- **2025-11-07**: Built all backend API endpoints
- **2025-11-07**: Created landing page for unauthenticated users
- **2025-11-07**: Initial MVP prototype with high-fidelity UI components
- **2025-11-07**: Added user profile page with БИН/ИИН validation (optional 12-digit fields)
- **2025-11-07**: Implemented ЭЦП certificate support in user profile
- **2025-11-07**: Created two-way chat system for transaction participants with 5s auto-refresh
- **2025-11-07**: Integrated chat component into transaction detail page with proper authorization
- **2025-11-07**: Implemented multi-tenancy system with companyId field in all tables
- **2025-11-07**: Added companyId validation in cargo creation (users must have a company ID)
- **2025-11-07**: Implemented responsive design for mobile devices (mobile menu, adaptive grids)
- **2025-11-07**: Added dark theme support with ThemeProvider and theme toggle in Header
- **2025-11-07**: Replaced loading spinners with skeleton loaders (StatsCardSkeleton, CargoCardSkeleton)

---

## SaaS & Modular Architecture Strategy

### I. SaaS Platform Requirements

LogiFlex.kz is being built as a multi-tenant SaaS platform with the following core requirements:

| Requirement | Description | Justification |
|------------|-------------|---------------|
| **Multi-Tenancy** | Single application instance serves multiple clients (Shippers and Carriers) | Cost efficiency: Reduces maintenance and deployment costs |
| **Scalability** | Architecture must scale to handle growing transactions, especially during auction peaks | Reliability: Ensures high availability |
| **Zero-Downtime Updates** | Updates and new modules deployed without service interruption | Flexibility: Rapid deployment of improvements and features |
| **Data Security** | Strict data separation between clients, compliance with Kazakhstan data protection standards | Trust: Critical for legally significant documents (EDS/ECP) |

### II. Modular Architecture

The platform is divided into independent functional modules. Users access modules based on their subscription tier:

| Module | Functionality | Implementation Phase | Access Level |
|--------|--------------|---------------------|--------------|
| **Core** | Registration, Auction 1.0/2.0 (RWS), Basic Rating | MVP & Phase 1 | Basic (Freemium) |
| **GovDocs** | E-TTN, EDS/ECP, Electronic Acts | Phase 1 | Standard (for Shippers) |
| **Tracking & Compliance** | GPS Tracking, Geo-timer, Downtime Calculation | Phase 1 | Standard (for Carriers) |
| **TMS Lite** | Fleet management, expense tracking (fuel/maintenance), driver management | Phase 2 | Professional (for Carriers) |
| **FinTech** | Built-in Factoring, Accelerated payments | Phase 2 | Professional (by request) |
| **Analytics & AI** | Predictive price analytics, Bid advisor | Phase 2 | Premium |

### III. Phase 1 Module Details

#### 🇰🇿 GovDocs Module (Government Integration)
- **ID F1.1.1-4**: Integration with E-TTN, EDS/ECP, Electronic Acts
  - Core module function accessible only to users with Standard+ subscription
  - Enables legally compliant document workflow
  
- **ID F1.4.1-2**: Document Storage and Expiration Notifications
  - Basic document management included in Core for verification
  - Extended management with reminders part of Tracking & Compliance module

#### 📊 Core Upgrade (RWS System)
- **ID F1.2.1-3**: RWS Calculation and Auction 2.0
  - Integrated into Core module
  - RWS is key to auction mechanism and available to all Core users to ensure platform quality

#### 🛰️ Tracking & Compliance Module
- **ID F1.3.1-3**: GPS Tracking, Geo-timer, Downtime Invoicing
  - Core module functionality
  - GPS tracking and automated calculations are premium services
  - Included in Standard subscription or sold as add-on package

### IV. Monetization Model (SaaS Approach)

Combines transaction fees with subscription tiers:

| Tier | Target Audience | Cost/Commission | Available Modules |
|------|----------------|-----------------|-------------------|
| **Freemium (Basic)** | New/Small players | 1.5% commission (revenue from transactions only) | Core (Auction 1.0/2.0, Basic rating) |
| **Standard** | Active Shippers/Carriers | 3.5% commission + Fixed fee for E-TTN | Core + GovDocs + Tracking & Compliance (all Phase 1 features) |
| **Professional** | Large Carriers/3PL operators | Monthly subscription 10,000+ KZT + Reduced commission | Standard + TMS Lite + Advanced reports |

### V. Implementation Strategy

**Phase 1 Focus**: GovDocs and Tracking & Compliance modules form the foundation for future subscription levels. The Standard subscription unlocks legally compliant E-TTN document workflow, which is the key value proposition.

**Immediate Monetization**: Launch Phase 1 with Standard subscription as the gateway to legally compliant freight documentation (E-TTN/EDS integration).

**Future Expansion**: Phase 2+ will add TMS Lite, FinTech, and Analytics modules for Professional and Premium tiers.