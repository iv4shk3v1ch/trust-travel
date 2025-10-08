# Database Scripts

This directory contains all database-related files for the TrustTravel application.

## 📁 Structure

```
database/
├── migrations/                    # Database migration scripts
│   ├── create_reviews_tables.sql  # Creates reviews table structure
│   ├── migrate_places_table.sql   # Updates places table schema
│   └── fix_category_constraint.sql # Fixes category constraints
└── seed_database_fixed.sql       # Sample data for development
```

## 🚀 Usage

### Running Migrations

Execute migration scripts in your Supabase SQL Editor in this order:

1. `migrations/migrate_places_table.sql` - Set up places table
2. `migrations/create_reviews_tables.sql` - Create reviews tables
3. `migrations/fix_category_constraint.sql` - Fix constraints

### Seeding Data

After running migrations, seed the database with sample data:

```sql
-- Run in Supabase SQL Editor
\i seed_database_fixed.sql
```

## 📋 Migration Details

- **create_reviews_tables.sql**: Creates the reviews table with proper relationships
- **migrate_places_table.sql**: Updates the places table with new columns
- **fix_category_constraint.sql**: Adds proper category constraints for places
- **seed_database_fixed.sql**: Inserts sample places and reviews for testing

## ⚠️ Important Notes

- Always backup your database before running migrations
- Run migrations in the specified order
- The seed data includes test users - update user IDs as needed