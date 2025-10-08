# TrustTravel

A modern travel planning application with social trust features and AI recommendations.

## 🚀 Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 📁 Project Structure

```
trust-travel/
├── src/
│   ├── app/                    # Next.js App Router
│   ├── features/              # Feature-based components
│   ├── shared/                # Shared components & utilities
│   └── core/                  # Core services & database
├── docs/                      # Documentation
├── database/                  # Database scripts & migrations
└── supabase/                  # Supabase configuration
```

## 🛠️ Features

- **Authentication** - Secure auth with Supabase
- **Places** - Add and discover travel destinations
- **Reviews** - Share travel experiences
- **Social Trust** - Connect with trusted travelers
- **AI Recommendations** - Smart travel suggestions

## 📚 Documentation

- [Project Organization](./docs/PROJECT_ORGANIZATION.md)
- [Project Structure](./docs/NEW_STRUCTURE_SUMMARY.md)
- [Security Resolution](./docs/SECURITY_ISSUE_RESOLUTION.md)

## 🗄️ Database

Database setup scripts are located in the `database/` directory:
- `migrations/` - Database migration scripts
- `seed_database_fixed.sql` - Sample data for development

## 🔧 Tech Stack

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth)
- **AI**: OpenAI integration
- **Deployment**: Vercel-ready

## 📄 License

MIT License