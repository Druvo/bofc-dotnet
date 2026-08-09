using BofcBackend.Api.Common.Security;
using BofcBackend.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace BofcBackend.Api.Data;

/// <summary>
/// Maps onto the existing `bofc_football` MySQL schema (owned by Flyway — 56 migrations
/// already applied on the Java side). This context does NOT manage schema: no
/// Database.Migrate()/EnsureCreated() calls anywhere. DbSets are added domain-by-domain
/// as each phase of the migration lands — Phase 2 (core/shared) adds Player/Role here;
/// Team/Venue/ClubRule and the storage-backed entities follow once their FK dependencies
/// (MatchDay, in Phase 3) exist.
/// </summary>
public class BofcDbContext(DbContextOptions<BofcDbContext> options, ICurrentUserService currentUserService)
    : DbContext(options)
{
    public DbSet<Player> Players => Set<Player>();
    public DbSet<Role> Roles => Set<Role>();
    public DbSet<Venue> Venues => Set<Venue>();
    public DbSet<ClubRule> ClubRules => Set<ClubRule>();
    public DbSet<MatchDay> MatchDays => Set<MatchDay>();
    public DbSet<Team> Teams => Set<Team>();
    public DbSet<TeamPlayer> TeamPlayers => Set<TeamPlayer>();
    public DbSet<TeamLineup> TeamLineups => Set<TeamLineup>();
    public DbSet<TeamLineupPlayer> TeamLineupPlayers => Set<TeamLineupPlayer>();

    // Phase 3 — match day/bracket engine
    public DbSet<MatchDayRound> MatchDayRounds => Set<MatchDayRound>();
    public DbSet<RoundGroup> RoundGroups => Set<RoundGroup>();
    public DbSet<RoundTeam> RoundTeams => Set<RoundTeam>();
    public DbSet<RoundGroupTeam> RoundGroupTeams => Set<RoundGroupTeam>();
    public DbSet<GroupStanding> GroupStandings => Set<GroupStanding>();
    public DbSet<AdvancementRule> AdvancementRules => Set<AdvancementRule>();
    public DbSet<LogicNode> LogicNodes => Set<LogicNode>();
    public DbSet<Match> Matches => Set<Match>();
    public DbSet<MatchEvent> MatchEvents => Set<MatchEvent>();
    public DbSet<MatchStatistics> MatchStatistics => Set<MatchStatistics>();
    public DbSet<MatchDayPrize> MatchDayPrizes => Set<MatchDayPrize>();
    public DbSet<PlayerGoalkeepingHistory> PlayerGoalkeepingHistories => Set<PlayerGoalkeepingHistory>();
    public DbSet<MatchDayParticipant> MatchDayParticipants => Set<MatchDayParticipant>();
    public DbSet<MatchDayParticipantPlayer> MatchDayParticipantPlayers => Set<MatchDayParticipantPlayer>();

    // Phase 4 — accounting/ledger domain
    public DbSet<CostType> CostTypes => Set<CostType>();
    public DbSet<MonthlyCost> MonthlyCosts => Set<MonthlyCost>();
    public DbSet<AcChart> AcCharts => Set<AcChart>();
    public DbSet<AcNature> AcNatures => Set<AcNature>();
    public DbSet<AcVoucherType> AcVoucherTypes => Set<AcVoucherType>();
    public DbSet<AcVoucher> AcVouchers => Set<AcVoucher>();
    public DbSet<AcVoucherDetail> AcVoucherDetails => Set<AcVoucherDetail>();
    public DbSet<AcBillPayment> AcBillPayments => Set<AcBillPayment>();
    public DbSet<AcCollection> AcCollections => Set<AcCollection>();
    public DbSet<PaymentAccount> PaymentAccounts => Set<PaymentAccount>();

    // Phase 5 — auction domain
    public DbSet<AuctionSession> AuctionSessions => Set<AuctionSession>();
    public DbSet<AuctionPlayer> AuctionPlayers => Set<AuctionPlayer>();
    public DbSet<AuctionBid> AuctionBids => Set<AuctionBid>();
    public DbSet<AuctionPlayerRegistration> AuctionPlayerRegistrations => Set<AuctionPlayerRegistration>();
    public DbSet<AuctionSettings> AuctionSettingsSet => Set<AuctionSettings>();
    public DbSet<TeamBudget> TeamBudgets => Set<TeamBudget>();

    // Phase 6 — notifications
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<NotificationRecipient> NotificationRecipients => Set<NotificationRecipient>();
    public DbSet<PushSubscription> PushSubscriptions => Set<PushSubscription>();

    // Phase 7 — global admin settings (SMTP + email notification toggles)
    public DbSet<SystemSettings> SystemSettings => Set<SystemSettings>();
    public DbSet<WeeklyMatchDaySlot> WeeklyMatchDaySlots => Set<WeeklyMatchDaySlot>();
    public DbSet<JerseyColor> JerseyColors => Set<JerseyColor>();
    public DbSet<PlayerStatAdjustment> PlayerStatAdjustments => Set<PlayerStatAdjustment>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(BofcDbContext).Assembly);
    }

    public override int SaveChanges()
    {
        ApplyAuditInfo();
        return base.SaveChanges();
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        ApplyAuditInfo();
        return base.SaveChangesAsync(cancellationToken);
    }

    /// <summary>
    /// Port of entity/audit/ApplicationAuditAware.java — falls back to SYSTEM_USER_ID (0)
    /// when there's no authenticated caller (matches the Java behavior exactly, including
    /// the fallback for background jobs / unauthenticated writes).
    /// </summary>
    private void ApplyAuditInfo()
    {
        var userId = currentUserService.TryGetPlayerId() ?? 0L;
        var now = DateTime.UtcNow;

        foreach (var entry in ChangeTracker.Entries<AuditableEntity>())
        {
            switch (entry.State)
            {
                case EntityState.Added:
                    entry.Entity.CreatedBy = userId;
                    entry.Entity.CreatedDate = now;
                    break;
                case EntityState.Modified:
                    entry.Entity.LastModifiedBy = userId;
                    entry.Entity.UpdatedDate = now;
                    break;
            }
        }
    }
}
