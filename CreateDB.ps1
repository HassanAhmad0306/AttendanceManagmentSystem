# Database Setup Script
Write-Host "Creating Database..." -ForegroundColor Cyan
Set-Location "c:\Users\user\Downloads\EAD_Project"
dotnet restore
dotnet build
dotnet tool update --global dotnet-ef
dotnet ef migrations add InitialCreate
dotnet ef database update
Write-Host "Database created successfully!" -ForegroundColor Green
Write-Host "Open AttendanceManagementSystem.sln in Visual Studio and press F5" -ForegroundColor Yellow
pause
