using System.Net;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using BofcBackend.Api.Common;
using BofcBackend.Api.Common.Constants;
using BofcBackend.Api.Common.Json;
using BofcBackend.Api.Common.Middleware;
using BofcBackend.Api.Common.Email;
using BofcBackend.Api.Common.RealTime;
using BofcBackend.Api.Common.Scheduling;
using BofcBackend.Api.Common.Security;
using BofcBackend.Api.Common.Storage;
using BofcBackend.Api.Data;
using BofcBackend.Api.Domain.Constants;
using BofcBackend.Api.Features.Accounting;
using BofcBackend.Api.Features.Auth;
using BofcBackend.Api.Features.ClubRules;
using BofcBackend.Api.Features.EmailTemplates;
using BofcBackend.Api.Features.Fixtures;
using BofcBackend.Api.Features.LogicNodes;
using BofcBackend.Api.Features.Matches;
using BofcBackend.Api.Features.Notifications;
using BofcBackend.Api.Features.PaymentAccounts;
using BofcBackend.Api.Features.Players;
using BofcBackend.Api.Features.Prizes;
using BofcBackend.Api.Features.Rounds;
using BofcBackend.Api.Features.Settings;
using BofcBackend.Api.Features.Statistics;
using BofcBackend.Api.Features.SquadLineups;
using BofcBackend.Api.Features.Teams;
using BofcBackend.Api.Features.MatchDayParticipants;
using BofcBackend.Api.Features.MatchDays;
using BofcBackend.Api.Features.Venues;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

// --- Logging: Serilog rolling file sink, mirrors application.yml's
// logging.file.name=logs/bofc_football.log + logback rolling policy
// (10MB/file, 1GB cap, 7-day retention).
builder.Host.UseSerilog((context, services, configuration) => configuration
    .ReadFrom.Configuration(context.Configuration)
    .ReadFrom.Services(services)
    .WriteTo.Console()
    .WriteTo.File(
        path: "logs/bofc_football.log",
        rollingInterval: RollingInterval.Day,
        fileSizeLimitBytes: 10 * 1024 * 1024,
        retainedFileCountLimit: 7,
        rollOnFileSizeLimit: true));

// --- EF Core / SQL Server. Migrated off MySQL for tighter .NET/EF tooling
// compatibility (native EF Core Migrations instead of hand-applied Flyway
// SQL). No live-DB dependency at startup - the app starts even when SQL
// Server isn't reachable yet.
var connectionString = builder.Configuration.GetConnectionString("Default");
if (!string.IsNullOrWhiteSpace(connectionString))
{
    builder.Services.AddDbContext<BofcDbContext>(options =>
        options.UseSqlServer(connectionString));
}

// --- JWT: token issuance service plus bearer-token validation for incoming requests.
builder.Services.Configure<JwtOptions>(builder.Configuration.GetSection("Jwt"));
builder.Services.AddSingleton<IJwtTokenService, JwtTokenService>();

// --- Web Push: VAPID keypair for signing push messages (see VapidOptions doc comment
// re: production key handling).
builder.Services.Configure<VapidOptions>(builder.Configuration.GetSection("Vapid"));

// --- Global admin settings (SMTP + email notification toggles) + the email sender that
// reads them. SMTP password is encrypted at rest via Data Protection, not appsettings -
// this is deliberately DB-backed (not IOptions/appsettings) so an admin can change it from
// the Settings page with no app restart.
builder.Services.AddDataProtection();
builder.Services.AddScoped<ISettingsService, SettingsService>();
builder.Services.AddScoped<IEmailSender, EmailSender>();
builder.Services.AddScoped<IEmailTemplateService, EmailTemplateService>();
builder.Services.AddScoped<IMatchDayVoteTokenService, MatchDayVoteTokenService>();
builder.Services.AddScoped<IPasswordResetTokenService, PasswordResetTokenService>();
builder.Services.AddHostedService<MatchDayReminderBackgroundService>();
builder.Services.AddHostedService<PaymentDueReminderBackgroundService>();
builder.Services.AddHostedService<MatchDaySchedulerBackgroundService>();

// --- Current-user accessor (SecurityUtil.java port) + domain services.
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ICurrentUserService, CurrentUserService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IVenueService, VenueService>();
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddScoped<IClubRuleService, ClubRuleService>();
builder.Services.AddScoped<IMatchDayService, MatchDayService>();
builder.Services.AddScoped<IMatchDayPrizeService, MatchDayPrizeService>();
builder.Services.AddScoped<IPlayerStatisticsService, PlayerStatisticsService>();
builder.Services.Configure<PlayerOptions>(builder.Configuration.GetSection("Player"));
builder.Services.Configure<AccountingOptions>(builder.Configuration.GetSection("Accounting"));
builder.Services.Configure<AppUrlOptions>(builder.Configuration.GetSection("Public"));
builder.Services.AddScoped<IPlayerService, PlayerService>();
builder.Services.AddScoped<IMatchDayParticipantService, MatchDayParticipantService>();
builder.Services.AddScoped<IMatchDayParticipantPlayerService, MatchDayParticipantPlayerService>();

// Port of MatchDaySchedulerService.java's @Scheduled cron job (Asia/Dhaka 00:00/08:00/11:00).
builder.Services.AddHostedService<MatchDayStatusSchedulerBackgroundService>();

// --- Match domain (live updates over SSE, not the auction's WebSocket/STOMP).
builder.Services.AddSingleton<ILiveMatchUpdatePublisher, LiveMatchUpdatePublisher>();
builder.Services.AddHostedService<MatchHeartbeatBackgroundService>();
builder.Services.AddScoped<IMatchManagementService, MatchManagementService>();

builder.Services.AddScoped<IRoundGroupService, RoundGroupService>();
builder.Services.AddScoped<IMatchDayRoundService, MatchDayRoundService>();

builder.Services.AddScoped<IMatchStatisticsService, MatchStatisticsService>();

builder.Services.AddScoped<LogicNodeExecutor>();
builder.Services.AddScoped<ILogicNodeService, LogicNodeService>();

builder.Services.AddScoped<IRoleService, RoleService>();
builder.Services.AddScoped<ITeamService, TeamService>();
builder.Services.AddScoped<ISquadLineupService, SquadLineupService>();
builder.Services.AddScoped<IFixtureGenerationService, FixtureGenerationService>();
builder.Services.AddScoped<BofcBackend.Api.Common.Scheduling.GoalkeeperEligibility>();
builder.Services.AddScoped<BofcBackend.Api.Common.Scheduling.WeeklyMatchDayTeamGenerator>();

// --- Accounting/ledger domain. AcVoucherService is deliberately concrete (no interface,
// matching Java) and sits below AcBillPaymentService/AcCollectionService in the dependency
// graph - see AcVoucherService's class comment for why the circular Java wiring was flattened.
builder.Services.AddScoped<AcNatureService>();
builder.Services.AddScoped<AcChartService>();
builder.Services.AddScoped<AcVoucherTypeService>();
builder.Services.AddScoped<CostTypeService>();
builder.Services.AddScoped<AcVoucherService>();
builder.Services.AddScoped<AcBillPaymentService>();
builder.Services.AddScoped<AcCollectionService>();
builder.Services.AddScoped<AccountReportService>();
builder.Services.AddScoped<IPaymentAccountService, PaymentAccountService>();

var jwtSecret = builder.Configuration["Jwt:Secret"];
if (string.IsNullOrWhiteSpace(jwtSecret))
{
    throw new InvalidOperationException(
        "Jwt:Secret is not configured. Set it via user-secrets (dev) or the Jwt__Secret env var (prod) - " +
        "do not hardcode it in appsettings.json.");
}

builder.Services.AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
        options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    })
    .AddJwtBearer(options =>
    {
        // MapInboundClaims=false + explicit RoleClaimType/NameClaimType below keep the
        // resulting ClaimsPrincipal's claim types identical to what we put in the token
        // (JwtTokenService), instead of ASP.NET's default inbound claim-type remapping.
        options.MapInboundClaims = false;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = false,
            ValidateAudience = false,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
            RoleClaimType = "roles",
            NameClaimType = "sub",
            ClockSkew = TimeSpan.Zero,
        };
        options.Events = new JwtBearerEvents
        {
            // Mirrors JwtUnAuthorizedResponseAuthenticationEntryPoint.java (401 JSON body).
            OnChallenge = async context =>
            {
                context.HandleResponse();
                context.Response.StatusCode = (int)HttpStatusCode.Unauthorized;
                context.Response.ContentType = "application/json";
                var body = ResponseBuilder.BuildRaw(HttpStatusCode.Unauthorized, RestErrorMessageDetail.Forbidden);
                await context.Response.WriteAsync(JsonSerializer.Serialize(body, JsonDefaults.Options));
            },
            // Mirrors CustomAccessDeniedHandler.java (403 JSON body).
            OnForbidden = async context =>
            {
                context.Response.StatusCode = (int)HttpStatusCode.Forbidden;
                context.Response.ContentType = "application/json";
                var body = ResponseBuilder.BuildRaw(HttpStatusCode.Forbidden,
                    "Access denied: You do not have permission to access this resource");
                await context.Response.WriteAsync(JsonSerializer.Serialize(body, JsonDefaults.Options));
            },
        };
    });

builder.Services.AddAuthorization();

// --- Storage: consolidates StorageConfig/PlayerPhotoStorageConfig/TeamLogoStorageConfig.java
// (3 near-identical local-vs-R2 conditional bean setups) into 3 keyed registrations of 2 shared
// implementations. "local" is the default provider, matching the Java @ConditionalOnProperty defaults.
builder.Services.AddKeyedSingleton<IStorageProvider>("player-profile", (_, _) =>
    CreateStorageProvider(builder.Configuration.GetSection("Storage:PlayerProfile").Get<StorageOptions>() ?? new StorageOptions()));
builder.Services.AddKeyedSingleton<IMediaStorageProvider>("player-photo", (_, _) =>
    CreateMediaStorageProvider(builder.Configuration.GetSection("Storage:PlayerPhoto").Get<StorageOptions>() ?? new StorageOptions(),
        "player-photo-", "player-photos"));
builder.Services.AddKeyedSingleton<IMediaStorageProvider>("team-logo", (_, _) =>
    CreateMediaStorageProvider(builder.Configuration.GetSection("Storage:TeamLogo").Get<StorageOptions>() ?? new StorageOptions(),
        "team-logo-", "team-logos"));

// --- CORS: wide open, matching WebConfig.java exactly (allowedOrigins("*"), no credentials).
const string corsPolicyName = "BofcCors";
builder.Services.AddCors(options =>
{
    options.AddPolicy(corsPolicyName, policy => policy
        .AllowAnyOrigin()
        .WithMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
        .AllowAnyHeader());
});

// --- Controllers: camelCase JSON (matches Jackson's field-name-as-is serialization of
// the camelCase Java DTOs) and a custom invalid-model-state response so validation
// errors come back in the same ApiResponse envelope as ResponseBuilder.buildFailureResponse.
builder.Services
    .AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = JsonDefaults.Options.PropertyNamingPolicy;
        options.JsonSerializerOptions.DefaultIgnoreCondition = JsonDefaults.Options.DefaultIgnoreCondition;
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
        options.JsonSerializerOptions.Converters.Add(new FlexibleStringConverter());
    });

builder.Services.Configure<Microsoft.AspNetCore.Mvc.ApiBehaviorOptions>(options =>
{
    options.InvalidModelStateResponseFactory = context =>
        ResponseBuilder.BuildFailureResponse(context.ModelState, RestResponseMessage.ValidationError);
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo { Title = "BOFC Backend (.NET)", Version = "v1" });
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Example: \"Bearer {token}\"",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
    });
    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" },
            },
            Array.Empty<string>()
        },
    });
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Global exception handling - the .NET equivalent seam for
// exception/RestResponseEntityExceptionHandler.java's @ExceptionHandler methods.
app.UseMiddleware<ExceptionHandlingMiddleware>();

app.UseCors(corsPolicyName);

// wwwroot/email/* - stable, publicly-reachable image URLs for HTML emails (the club logo
// embedded in every email's branded header/footer). Email clients load images from an
// absolute URL outside the app entirely, so this can't be a webpack-hashed frontend asset.
app.UseStaticFiles();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();


app.Run();

static IStorageProvider CreateStorageProvider(StorageOptions options) =>
    options.Provider.Equals("r2", StringComparison.OrdinalIgnoreCase)
        ? new R2StorageProvider(options.R2Endpoint, options.R2Bucket, options.R2AccessKey, options.R2SecretKey, options.R2PresignMinutes)
        : new LocalStorageProvider(options.UploadDir, options.BaseUrl);

static IMediaStorageProvider CreateMediaStorageProvider(StorageOptions options, string keyPrefix, string routeSegment) =>
    options.Provider.Equals("r2", StringComparison.OrdinalIgnoreCase)
        ? new R2MediaStorageProvider(options.R2Endpoint, options.R2Bucket, options.R2AccessKey, options.R2SecretKey,
            options.R2PresignMinutes, keyPrefix, routeSegment)
        : new LocalMediaStorageProvider(options.UploadDir, options.BaseUrl, keyPrefix, routeSegment);
