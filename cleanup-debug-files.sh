#!/bin/bash

# Profile Completeness Feature Cleanup Script
# Run this to remove debug/test files after the feature is complete

echo "🧹 Cleaning up Profile Completeness debug files..."

# Remove debug pages
echo "Removing debug pages..."
rm -rf src/app/profile-debug/
rm -rf src/app/profile-save-debug/
rm -rf src/app/real-profile-test/

# Remove test pages (optional - uncomment if you want to remove test-env too)
# rm -rf src/app/test-env/

# Remove profile fixer (optional - uncomment if you don't want users to auto-complete)
# rm -rf src/app/profile-fixer/

# Remove debug scripts
echo "Removing debug scripts..."
rm -f debug-profile.js

echo "✅ Cleanup complete!"
echo ""
echo "📦 Kept core feature files:"
echo "  - ProfileCompletenessChip.tsx (main UI component)"
echo "  - ToastManager.tsx (celebration system)"
echo "  - profileScore.ts (scoring logic)"
echo "  - useUserProfile.ts (fixed database loading)"
echo "  - database.ts (fixed save/load functions)"
echo ""
echo "🤔 Optional files (you can remove manually if not needed):"
echo "  - src/app/test-env/ (development testing)"
echo "  - src/app/profile-fixer/ (user auto-completion tool)"
