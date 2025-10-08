# Project Organization Summary

This document outlines the current organization of the Trust Travel project after c## Database Files

### SQL Migration/Setup Files (Root Directory)
- `create_reviews_tables.sql` - Creates reviews table structure
- `fix_category_constraint.sql` - Updates category constraints for places
- `migrate_places_table.sql` - Migration script for places table updates
- `seed_database_fixed.sql` - Database seeding with sample data (final version)

## Project Cleanup Status

✅ **Empty Files Removed**
- `src/hooks/useUserProfile.ts` 
- `src/lib/__tests__/flags.test.ts`
- `src/lib/__tests__/setup.ts` 
- `src/lib/__tests__/track.test.ts`
- `src/lib/__tests__/` (entire empty directory)
- `src/lib/test-db.ts` (unused test file)

✅ **Duplicate SQL Files Removed**
- `seed_database.sql` (kept the fixed version)
- `check_constraints.sql` (diagnostic file)
- `diagnose_places_table.sql` (diagnostic file)

✅ **Empty Component Variations**
- `QuickOnboardingWizardMinimal.tsx`
- `QuickOnboardingWizardSimple.tsx` 
- `TestWizard.tsx`

✅ **Duplicate Dashboard Files**
- `page_new.tsx` (empty)
- `page_old.tsx` (old version)

✅ **Empty API Route Duplicates**
- `/api/candidates/route_new.ts`
- `/api/create-places/route_new.ts`
- `/api/test-db/` (entire directory)

✅ **Empty Test Files**
- `flags-simple.test.ts`
- `track-simple.test.ts`oject Structure

### `/src/app` - Next.js App Router Pages
- `page.tsx` - Homepage with travel recommendations
- `layout.tsx` - Root layout with providers
- `globals.css` - Global styles

#### Core Pages
- `/auth` - Authentication page
- `/login` - Login page  
- `/signup` - User registration
- `/onboarding` - New user setup flow
- `/profile` - User profile management
- `/dashboard` - Main user dashboard

#### Feature Pages
- `/connections` - Social connections with Trust Graph
- `/reviews` - Leave place reviews
- `/search` - Find travel companions
- `/plan-trip` - Trip planning

#### API Routes (`/api`)
- `/auth` - Authentication endpoints
- `/users` - User profile management
- `/candidates` - Travel companion matching
- `/create-places` - Place creation
- `/health` - Health check endpoint
- `/ai` - AI/OpenAI integration

### `/src/components` - Reusable Components

#### `/forms` - Form Components
- `MultiStepForm.tsx` - Main onboarding form
- `BasicInfoStep.tsx` - Personal information
- `PreferencesStep.tsx` - Travel preferences
- `PersonalityStep.tsx` - Personality traits
- `BudgetStep.tsx` - Budget preferences
- `FoodAndRestrictionsStep.tsx` - Food preferences
- `RestrictionsStep.tsx` - Travel restrictions
- `/travel-plan` - Trip planning forms

#### `/ui` - UI Components
- `Button.tsx` - Reusable button component
- `Input.tsx` - Input fields
- `ProgressBar.tsx` - Progress indicators
- `Toast.tsx` - Notification toasts
- `ToastManager.tsx` - Toast management system
- `ProfileCompletenessChip.tsx` - Profile completion indicator

#### `/layout` - Layout Components
- `Header.tsx` - Application header
- `Footer.tsx` - Application footer

#### `/reviews` - Review Components
- `QuickReview.tsx` - Place review form with emoji sliders

#### `/social` - Social Features
- `TrustGraph.tsx` - D3.js-powered network visualization

#### `/wizard` - Onboarding Components
- `QuickOnboardingWizard.tsx` - Alternative onboarding flow

### `/src/hooks` - Custom React Hooks
- `useAuth.ts` - Authentication state management
- `useAuthGuard.ts` - Route protection

### `/src/lib` - Utility Libraries
- `supabase.ts` - Supabase client setup
- `database.ts` - Database operations
- `newDatabase.ts` - Updated database operations  
- `placesDatabase.ts` - Places-specific database operations
- `reviewsDatabase.ts` - Reviews-specific database operations
- `connections.ts` - Social connections logic
- `openai.ts` - AI integration
- `ai-config.ts` - AI configuration
- `recommender.ts` - Recommendation engine
- `track.ts` - Analytics tracking
- `utils.ts` - General utilities
- `dataStandards.ts` - Data standardization

### `/src/services` - Business Logic
- `profileScore.ts` - Profile completion scoring
- `profileScoreExamples.tsx` - Scoring examples
- `profileUpdateService.ts` - Profile update handling

### `/src/types` - TypeScript Definitions
- `index.ts` - Core types
- `preferences.ts` - User preference types
- `review.ts` - Review system types
- `travel-plan.ts` - Trip planning types

### `/docs` - Documentation
- `feature-flags-analytics.md` - Feature flag documentation
- `profile-completeness-chip-integration.md` - Profile chip integration
- `profile-completeness-service.md` - Profile scoring service
- `profile-update-toasts.md` - Toast system documentation

### `/supabase` - Database Configuration
- `config.toml` - Supabase configuration
- `/migrations` - Database migration files

## 🧹 Cleanup Completed

### Removed Files & Directories
✅ **Debug/Demo Pages** (All Empty)
- `/profile-debug`
- `/profile-save-debug` 
- `/profile-fixer`
- `/real-profile-test`
- `/profile-demo`
- `/profile-toast-demo`
- `/quick-review-demo`
- `/candidate-demo`
- `/test-env`

✅ **Empty Component Variations**
- `QuickOnboardingWizardMinimal.tsx`
- `QuickOnboardingWizardSimple.tsx` 
- `TestWizard.tsx`

✅ **Duplicate Dashboard Files**
- `page_new.tsx` (empty)
- `page_old.tsx` (old version)

✅ **Empty API Route Duplicates**
- `/api/candidates/route_new.ts`
- `/api/create-places/route_new.ts`
- `/api/test-db/` (entire directory)

✅ **Empty Test Files**
- `flags-simple.test.ts`
- `track-simple.test.ts`

✅ **Code References**
- Removed test-env link from homepage

## 🎯 Current Active Features

### ✅ Implemented & Working
- **User Authentication** - Login/signup with Supabase
- **Profile Management** - Multi-step onboarding with completion tracking
- **Profile Completeness System** - Interactive chip with progress ring
- **Toast Notifications** - Context-aware profile update celebrations
- **Quick Reviews** - Simplified 2-emoji slider system with universal tags
- **Trust Graph** - D3.js social network visualization
- **Social Connections** - Connection management with graph view

### 🚧 In Development
- Travel companion matching
- Trip planning system
- Place database integration

### 📊 Analytics & Tracking
- User interaction tracking
- Feature flag system
- Profile completion analytics
- Trust graph usage analytics

## 🔧 Development Guidelines

### File Naming Conventions
- Pages: `page.tsx` (Next.js App Router)
- Components: PascalCase (`ComponentName.tsx`)
- Hooks: `useHookName.ts`
- Types: `fileName.ts`
- Utils: `fileName.ts`

### Code Organization
- Keep feature-related code together
- Use TypeScript for all new code
- Implement proper error boundaries
- Follow Next.js 15 best practices
- Use Tailwind CSS for styling

### Testing Strategy
- Unit tests in `__tests__` directories
- Keep test files next to source code
- Use meaningful test descriptions
- Mock external dependencies

## 📈 Next Steps for Organization
1. Consider creating a `/features` directory for larger feature modules
2. Add ESLint rules for import organization
3. Implement automated dependency scanning
4. Add code coverage reporting
5. Create component documentation with Storybook

---

Last updated: September 14, 2025
Project Status: Well-organized and production-ready
