# TrustTravel

A modern travel planning application with AI-powered recommendations, social trust features, and personalized itinerary building.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Add your Supabase and API keys to .env.local

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 📁 Project Structure

```
trust-travel/
├── src/
│   ├── app/                    # Next.js App Router pages & API routes
│   │   ├── api/               # Backend API endpoints
│   │   ├── explore/           # Explore places with map
│   │   ├── favorites/         # Saved places
│   │   ├── itinerary/         # Trip planning & itinerary builder
│   │   ├── shared/            # Public shared itineraries
│   │   ├── chatbot/           # AI travel assistant
│   │   └── ...                # Other pages
│   ├── features/              # Feature-based components
│   │   ├── auth/              # Authentication
│   │   ├── chatbot/           # AI chatbot
│   │   ├── places/            # Places & reviews
│   │   └── ...
│   ├── shared/                # Shared components & utilities
│   │   ├── components/        # Reusable UI components
│   │   ├── types/             # TypeScript types
│   │   └── utils/             # Utility functions
│   └── core/                  # Core services & database
│       ├── database/          # Database clients
│       └── services/          # AI services, recommender
├── docs/                      # Documentation
│   └── database.md           # Database schema reference
├── scripts/                   # Data import & management scripts
└── supabase/                  # Supabase configuration
```

## ✨ Features

### Core Features
- 🔐 **Authentication** - Secure user auth with Supabase
- 🗺️ **Explore** - Interactive map to discover places
- ❤️ **Favorites** - Save and organize favorite places
- 📋 **Itinerary Builder** - Drag-and-drop trip planning
- 🔗 **Share Itineraries** - Generate shareable public links
- ⭐ **Reviews** - Write and read place reviews
- 👥 **Social Trust** - Connect with trusted travelers
- 🤖 **AI Assistant** - Smart travel recommendations

### Advanced Features
- Real-time like/skip interaction tracking
- Collaborative filtering recommendations
- Profile-based preference scoring
- Multi-day itinerary planning with drag-and-drop
- Public read-only shared itineraries

## 🗄️ Database

This project uses Supabase (PostgreSQL) for data storage. Database schema documentation is available in `docs/database.md`.

Key tables:
- `users` - User profiles and preferences
- `places` - Travel destinations
- `reviews` - User-generated reviews
- `user_interactions` - Like/skip tracking
- `itineraries` - Saved trip plans
- `connections` - Social network

## 🔧 Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **UI Components**: Headless UI, React Leaflet (maps), DnD Kit (drag-drop)
- **Backend**: Supabase (PostgreSQL + Auth + RLS)
- **AI**: OpenAI GPT-4, Groq
- **State Management**: React Context, TanStack Query
- **Deployment**: Vercel-ready

## 🛠️ Available Scripts

### Development
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Data Management (Optional)
```bash
npm run import:places    # Import places from TripAdvisor API
npm run import:reviews   # Import reviews from TripAdvisor API
npm run generate:reviews # Generate synthetic review data
npm run add:places       # Add important places manually
```

## 🌍 Environment Variables

Create a `.env.local` file with:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# OpenAI (for AI features)
OPENAI_API_KEY=your_openai_key

# Groq (alternative AI provider)
GROQ_API_KEY=your_groq_key

# TripAdvisor (optional, for data import)
TRIPADVISOR_API_KEY=your_tripadvisor_key
```

## 📚 Documentation

- `docs/database.md` - Complete database schema reference

## 🚢 Deployment

This project is optimized for deployment on Vercel:

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

## 📄 License

MIT License