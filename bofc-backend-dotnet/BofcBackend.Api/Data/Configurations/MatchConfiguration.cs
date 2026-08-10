using BofcBackend.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BofcBackend.Api.Data.Configurations;

public class MatchConfiguration : IEntityTypeConfiguration<Match>
{
    public void Configure(EntityTypeBuilder<Match> builder)
    {
        // Java escapes this table name with backticks (`match`) since MATCH is a MySQL
        // reserved word for full-text search syntax - same table name here, Pomelo
        // backtick-quotes identifiers automatically.
        builder.ToTable("match");
        builder.HasKey(m => m.Id);
        builder.Property(m => m.Id).HasColumnName("id").ValueGeneratedOnAdd();
        builder.Property(m => m.MatchDayId).HasColumnName("match_day_id").IsRequired();
        builder.Property(m => m.RoundId).HasColumnName("round_id");
        builder.Property(m => m.GroupId).HasColumnName("group_id");
        builder.Property(m => m.HomeTeamId).HasColumnName("home_team_id").IsRequired();
        builder.Property(m => m.AwayTeamId).HasColumnName("away_team_id").IsRequired();
        builder.Property(m => m.VenueId).HasColumnName("venue_id");
        builder.Property(m => m.MatchDate).HasColumnName("match_date").IsRequired();
        builder.Property(m => m.MatchStatus).HasColumnName("match_status").HasConversion<string>().IsRequired();
        builder.Property(m => m.MatchOrder).HasColumnName("match_order");
        builder.Property(m => m.LegacyRound).HasColumnName("round");
        builder.Property(m => m.GroupName).HasColumnName("group_name");
        builder.Property(m => m.IsPlaceholderMatch).HasColumnName("is_placeholder_match").IsRequired();
        builder.Property(m => m.MatchType).HasColumnName("match_type").HasConversion<string>().HasMaxLength(50);
        builder.Property(m => m.SeriesNumber).HasColumnName("series_number");
        builder.Property(m => m.BracketPosition).HasColumnName("bracket_position").HasMaxLength(50);
        builder.Property(m => m.HomeTeamScore).HasColumnName("home_team_score").IsRequired();
        builder.Property(m => m.AwayTeamScore).HasColumnName("away_team_score").IsRequired();
        builder.Property(m => m.HomeJerseyColor).HasColumnName("home_jersey_color").HasMaxLength(30);
        builder.Property(m => m.AwayJerseyColor).HasColumnName("away_jersey_color").HasMaxLength(30);
        builder.Property(m => m.MatchDurationMinutes).HasColumnName("match_duration_minutes");
        builder.Property(m => m.ElapsedTimeSeconds).HasColumnName("elapsed_time_seconds").IsRequired();
        builder.Property(m => m.StartedAt).HasColumnName("started_at");
        builder.Property(m => m.CompletedAt).HasColumnName("completed_at");

        builder.Property(m => m.CreatedBy).HasColumnName("created_by").IsRequired();
        builder.Property(m => m.CreatedDate).HasColumnName("created_date").IsRequired();
        builder.Property(m => m.LastModifiedBy).HasColumnName("last_modified_by");
        builder.Property(m => m.UpdatedDate).HasColumnName("updated_date");

        builder.HasOne(m => m.MatchDay).WithMany().HasForeignKey(m => m.MatchDayId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(m => m.HomeTeam).WithMany().HasForeignKey(m => m.HomeTeamId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(m => m.AwayTeam).WithMany().HasForeignKey(m => m.AwayTeamId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(m => m.Venue).WithMany().HasForeignKey(m => m.VenueId).OnDelete(DeleteBehavior.Restrict);

        // MatchEvents/MatchStatistics ARE Match's own cascade=ALL,orphanRemoval children in
        // Java (no competing FK path into them), so this one is safe to cascade for real.
        builder.HasMany(m => m.MatchEvents).WithOne(e => e.Match).HasForeignKey(e => e.MatchId).OnDelete(DeleteBehavior.Cascade);
        builder.HasMany(m => m.MatchStatistics).WithOne(s => s.Match).HasForeignKey(s => s.MatchId).OnDelete(DeleteBehavior.Cascade);
    }
}
