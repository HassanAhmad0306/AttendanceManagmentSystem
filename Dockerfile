# Use the official ASP.NET Core runtime as a parent image (Alpine for strict user control)
FROM mcr.microsoft.com/dotnet/aspnet:8.0-alpine AS base
WORKDIR /app
ENV ASPNETCORE_HTTP_PORTS=8080
EXPOSE 8080

# Use the SDK image for building the application
FROM mcr.microsoft.com/dotnet/sdk:8.0-alpine AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src
COPY ["AttendanceManagementSystem.csproj", "."]
RUN dotnet restore "./AttendanceManagementSystem.csproj"
COPY . .
WORKDIR "/src/."
RUN dotnet build "./AttendanceManagementSystem.csproj" -c $BUILD_CONFIGURATION -o /app/build

FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "./AttendanceManagementSystem.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .

# Create non-root user if it doesn't exist (Alpine base image may already have it)
RUN addgroup -S app 2>/dev/null || true && \
    adduser -S app -G app 2>/dev/null || true
RUN chown -R app:app /app
USER app

# Ensure binding to all interfaces
ENV ASPNETCORE_URLS=http://0.0.0.0:8080

ENTRYPOINT ["dotnet", "AttendanceManagementSystem.dll"]
