@echo off
echo ============================================
echo Attendance Management System - Setup
echo ============================================
echo.
echo This script will:
echo 1. Restore NuGet packages
echo 2. Build the project
echo 3. Create database migrations (optional)
echo.
pause

echo.
echo [1/3] Restoring NuGet packages...
dotnet restore
if %errorlevel% neq 0 (
    echo ERROR: Failed to restore packages
    pause
    exit /b 1
)
echo ✓ Packages restored successfully
echo.

echo [2/3] Building project...
dotnet build
if %errorlevel% neq 0 (
    echo ERROR: Build failed
    pause
    exit /b 1
)
echo ✓ Project built successfully
echo.

echo [3/3] Database setup...
echo.
echo NOTE: The database will be created automatically when you run the application.
echo However, if you want to use migrations, you can run these commands manually:
echo.
echo   dotnet ef migrations add InitialCreate
echo   dotnet ef database update
echo.
echo Or the database will be auto-created on first run.
echo.

echo ============================================
echo Setup Complete!
echo ============================================
echo.
echo Next steps:
echo 1. Open AttendanceManagementSystem.sln in Visual Studio
echo 2. Press F5 to run
echo 3. Use Swagger UI to test the API
echo 4. Default admin: username=admin, password=admin123
echo.
pause
