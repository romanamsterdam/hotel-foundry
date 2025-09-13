# Hotel Foundry - Premium Hotel Underwriting SaaS

A sophisticated marketing website for Hotel Foundry, a SaaS platform that simplifies hotel underwriting for boutique property investments in European leisure markets.

## 🏨 Overview

Hotel Foundry provides professional underwriting tools specifically designed for aspiring hotel owners or existing owners looking at more acquisitions of boutique properties. The platform offers USALI-compliant P&L modeling, sensitivity analysis, benchmark data, and institutional-grade reporting.

## 🚀 Features

### Core Platform Features
- **USALI-ready P&L modeling** - Departmental/Undistributed/Fixed with FF&E reserves
- **End-to-end underwriting** - From topline projections to IRR and DSCR calculations
- **Sensitivity analysis** - ADR × Occupancy grids, RevPAR scenarios, financing sensitivity
- **Benchmark library** - Comprehensive leisure market data coming soon 
- **Export capabilities** - Board-ready PDFs and Excel models
- **Opening roadmap** - Pre-opening project management tools (Pro plan)

### Website Features
- **Property gallery** - Curated 15-40 room hotel investment opportunities
- **Advanced filtering** - By country, rooms, price range, property type
- **Hero carousel** - Featured properties with key metrics (ADR, occupancy)
- **Tiered pricing** - Beta (€99 lifetime), Starter (€99/month), Pro (€299/month)
- **Responsive design** - Optimized for desktop and mobile
- **Professional testimonials** - From hotel investment professionals

## 📁 Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── ui/              # shadcn/ui primitives
│   ├── Navbar.tsx       # Main navigation
│   ├── Footer.tsx       # Site footer
│   ├── HeroCarousel.tsx # Property hero carousel
│   ├── FeatureCards.tsx # Platform features grid
│   ├── PricingSection.tsx # Pricing plans component
│   ├── PropertyCard.tsx # Individual property card
│   ├── PropertyCarousel.tsx # Property slider
│   └── FiltersBar.tsx   # Property filtering interface
├── routes/              # Page components
│   ├── LandingPage.tsx  # Homepage with hero, features, pricing
│   ├── PropertiesPage.tsx # Property gallery with filters
│   ├── MembershipPage.tsx # Detailed pricing and FAQ
│   ├── LegalPrivacyPage.tsx # Privacy policy
│   └── LegalTermsPage.tsx # Terms of service
├── data/                # Mock data (ready for Supabase migration)
│   ├── plans.ts         # Pricing plan definitions
│   ├── properties.ts    # Property listings
│   └── testimonials.ts  # Customer testimonials
├── types/               # TypeScript type definitions
│   ├── plan.ts          # Plan interface
│   ├── property.ts      # Property interface
│   └── testimonial.ts   # Testimonial interface
└── lib/                 # Utilities and configurations
    └── utils.ts         # Helper functions (formatting, etc.)
```

## 🗄️ Data Structure & Supabase Migration

The project includes well-structured TypeScript types and mock data that map directly to future Supabase tables:

### Type to Table Mapping

| TypeScript Type | Future Supabase Table | Description |
|-----------------|------------------------|-------------|
| `Plan` | `plans` | Pricing plan definitions with features |
| `Property` | `properties` | Hotel property listings with facilities |
| `Testimonial` | `testimonials` | Customer testimonials and reviews |

### Future Supabase Schema

```sql
-- Users table (auth.users extended)
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  name text,
  created_at timestamptz DEFAULT now()
);

-- Subscription management
CREATE TABLE subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  plan_id text NOT NULL,
  status text NOT NULL,
  current_period_end timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Property listings
CREATE TABLE properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  country text NOT NULL,
  region text,
  address text,
  rooms_total integer NOT NULL,
  gfa_sqm integer,
  guide_price_eur integer NOT NULL,
  stars integer CHECK (stars >= 1 AND stars <= 5),
  facilities jsonb NOT NULL DEFAULT '{}',
  images text[] DEFAULT '{}',
  adr_sample integer,
  occupancy_sample integer,
  property_type text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

-- User underwriting models
CREATE TABLE deals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  property_id uuid REFERENCES properties(id),
  assumptions jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Consultancy credit tracking
CREATE TABLE consultancy_credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  month date NOT NULL,
  credits_awarded integer DEFAULT 0,
  credits_used integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
```

## 🛠️ Development Setup

### Prerequisites
- Node.js 18+ and npm
- Modern browser with ES2020+ support

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open http://localhost:5173 in your browser

### Build for Production
```bash
npm run build
npm run preview  # Preview production build locally
```

## 🔧 Technology Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS with custom design system
- **UI Components**: shadcn/ui primitives
- **Routing**: React Router DOM
- **Carousel**: Embla Carousel React
- **Icons**: Lucide React
- **SEO**: React Helmet Async

## 🗄️ Data Configuration

### Running without Supabase (Default)
Set `VITE_DATA_SOURCE=mock` and leave Supabase vars empty. The app will use local storage and mock data.

### Switching to Supabase
Set `VITE_DATA_SOURCE=supabase` and provide both `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in your environment variables.

## 🎨 Design System

### Colors
- **Primary**: Slate tones (50-900) for professional appeal
- **Accent**: White with subtle gradients
- **Text**: Slate-900 (headings), Slate-600/700 (body)

### Typography
- **Headings**: Inter font family, bold weights
- **Body**: Inter regular, optimized line-height (150% body, 120% headings)
- **Spacing**: Consistent 8px grid system

### Components
- **Cards**: Rounded corners (rounded-2xl), subtle shadows
- **Buttons**: Modern with hover states and micro-interactions
- **Layout**: Max-width containers (max-w-7xl) with responsive padding

## 🚀 Deployment

The project is optimized for deployment on:
- **Vercel** (recommended for React apps)
- **Netlify**
- **Any static hosting service**

Build command: `npm run build`
Output directory: `dist`

## 🔮 Roadmap

### Phase 2: Authentication & Dashboard
- Supabase authentication integration
- User dashboard with saved analyses
- Underwriting model builder interface

### Phase 3: Platform Features
- Interactive USALI P&L builder
- Sensitivity analysis tools
- PDF report generation
- Consultancy booking system

### Phase 4: Advanced Features
- Market benchmark integration
- Multi-property portfolio analysis
- Advanced filtering and search
- Real-time collaboration tools

## 📄 License

Proprietary - All rights reserved to Hotel Foundry.

---

**Built with ❤️ for boutique hotel investors**