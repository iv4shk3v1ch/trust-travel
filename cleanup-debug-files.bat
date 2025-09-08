@echo off
REM Profile Completeness Feature Cleanup Script (Windows)
REM Run this to remove debug/test files after the feature is complete

echo 🧹 Cleaning up Profile Completeness debug files...

REM Remove debug pages
echo Removing debug pages...
if exist "src\app\profile-debug" rmdir /s /q "src\app\profile-debug"
if exist "src\app\profile-save-debug" rmdir /s /q "src\app\profile-save-debug"
if exist "src\app\real-profile-test" rmdir /s /q "src\app\real-profile-test"

REM Remove test pages (optional - uncomment if you want to remove test-env too)
REM if exist "src\app\test-env" rmdir /s /q "src\app\test-env"

REM Remove profile fixer (optional - uncomment if you don't want users to auto-complete)
REM if exist "src\app\profile-fixer" rmdir /s /q "src\app\profile-fixer"

REM Remove debug scripts
echo Removing debug scripts...
if exist "debug-profile.js" del "debug-profile.js"

echo ✅ Cleanup complete!
echo.
echo 📦 Kept core feature files:
echo   - ProfileCompletenessChip.tsx (main UI component)
echo   - ToastManager.tsx (celebration system)
echo   - profileScore.ts (scoring logic)
echo   - useUserProfile.ts (fixed database loading)
echo   - database.ts (fixed save/load functions)
echo.
echo 🤔 Optional files (you can remove manually if not needed):
echo   - src\app\test-env\ (development testing)
echo   - src\app\profile-fixer\ (user auto-completion tool)

pause
