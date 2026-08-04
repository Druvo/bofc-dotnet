FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY BofcBackend.Api/BofcBackend.Api.csproj BofcBackend.Api/
COPY NuGet.Config .
RUN dotnet restore BofcBackend.Api/BofcBackend.Api.csproj
COPY BofcBackend.Api/. BofcBackend.Api/
RUN dotnet publish BofcBackend.Api/BofcBackend.Api.csproj -c Release -o /app --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=build /app .
EXPOSE 9191
ENTRYPOINT ["dotnet", "BofcBackend.Api.dll"]
