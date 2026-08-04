using BofcBackend.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BofcBackend.Api.Data.Configurations;

/// <summary>
/// Partial mapping for Phase 2 (only what Team's FK needs). Phase 3 extends this same
/// configuration file with the round/group/advancement-rule/prize relations once those
/// entities exist — do not duplicate a second IEntityTypeConfiguration&lt;Tournament&gt;.
/// </summary>
public class TournamentConfiguration : IEntityTypeConfiguration<Tournament>
{
    public void Configure(EntityTypeBuilder<Tournament> builder)
    {
        builder.ToTable("tournament");
        builder.HasKey(t => t.Id);
        builder.Property(t => t.Id).HasColumnName("id").ValueGeneratedOnAdd();
        builder.Property(t => t.Name).HasColumnName("name");
        builder.Property(t => t.Title).HasColumnName("title");
        builder.Property(t => t.Season).HasColumnName("season");
        builder.Property(t => t.Description).HasColumnName("description").HasColumnType("NVARCHAR(MAX)");
        builder.Property(t => t.Rules).HasColumnName("rules").HasColumnType("NVARCHAR(MAX)");
        builder.Property(t => t.RoadmapImageUrl).HasColumnName("roadmap_image_url").HasMaxLength(500);
        builder.Property(t => t.TournamentDate).HasColumnName("tournament_date").IsRequired();

        builder.Property(t => t.TournamentStatus).HasColumnName("tournament_status").HasConversion<string>().IsRequired();
        builder.Property(t => t.IsActive).HasColumnName("is_active").IsRequired();
        builder.Property(t => t.DefaultTournament).HasColumnName("is_default").IsRequired();
        builder.Property(t => t.SportType).HasColumnName("sport_type").HasConversion<string>().IsRequired();
        builder.Property(t => t.TournamentType).HasColumnName("tournament_type").HasConversion<string>().IsRequired();
        builder.Property(t => t.GroupCount).HasColumnName("group_count");
        builder.Property(t => t.AuctionMode).HasColumnName("auction_mode").IsRequired();
        builder.Property(t => t.VenueId).HasColumnName("venue_id");

        builder.Property(t => t.CreatedBy).HasColumnName("created_by").IsRequired();
        builder.Property(t => t.CreatedDate).HasColumnName("created_date").IsRequired();
        builder.Property(t => t.LastModifiedBy).HasColumnName("last_modified_by");
        builder.Property(t => t.UpdatedDate).HasColumnName("updated_date");

        builder.HasOne(t => t.Venue)
            .WithMany()
            .HasForeignKey(t => t.VenueId)
            .HasConstraintName("fk_tournament_venue")
            .IsRequired();

        builder.HasMany(t => t.Teams)
            .WithOne(team => team.Tournament)
            .HasForeignKey(team => team.TournamentId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
