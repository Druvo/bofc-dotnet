using BofcBackend.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BofcBackend.Api.Data.Configurations;

public class TournamentRoundConfiguration : IEntityTypeConfiguration<TournamentRound>
{
    public void Configure(EntityTypeBuilder<TournamentRound> builder)
    {
        builder.ToTable("tournament_round");
        builder.HasKey(r => r.Id);
        builder.Property(r => r.Id).HasColumnName("id").ValueGeneratedOnAdd();
        builder.Property(r => r.TournamentId).HasColumnName("tournament_id").IsRequired();
        builder.Property(r => r.RoundNumber).HasColumnName("round_number").IsRequired();
        builder.Property(r => r.RoundName).HasColumnName("round_name").HasMaxLength(100).IsRequired();
        builder.Property(r => r.RoundType).HasColumnName("round_type").HasConversion<string>().HasMaxLength(50).IsRequired();
        builder.Property(r => r.AdvancementRuleText).HasColumnName("advancement_rule").HasColumnType("NVARCHAR(MAX)");
        builder.Property(r => r.Status).HasColumnName("status").HasConversion<string>().HasMaxLength(20).IsRequired();
        builder.Property(r => r.SequenceOrder).HasColumnName("sequence_order").IsRequired();
        builder.Property(r => r.StartDate).HasColumnName("start_date");
        builder.Property(r => r.EndDate).HasColumnName("end_date");

        builder.Property(r => r.CreatedBy).HasColumnName("created_by").IsRequired();
        builder.Property(r => r.CreatedDate).HasColumnName("created_date").IsRequired();
        builder.Property(r => r.LastModifiedBy).HasColumnName("last_modified_by");
        builder.Property(r => r.UpdatedDate).HasColumnName("updated_date");

        // Note: cascade-delete is intentionally NOT wired at the EF Core level for the
        // round/group/match graph — several entities (AdvancementRule, LogicNode) have
        // two FKs into TournamentRound (source + target), and EF Core rejects the
        // resulting multiple-cascade-paths model outright. Cross-cutting deletes for this
        // subtree need explicit application code in the Phase 3 service layer, not
        // DB-level ON DELETE CASCADE — see the same note repeated on the affected configs.
        builder.HasOne(r => r.Tournament).WithMany().HasForeignKey(r => r.TournamentId).OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(r => r.Groups).WithOne(g => g.Round).HasForeignKey(g => g.RoundId).OnDelete(DeleteBehavior.Restrict);
        builder.HasMany(r => r.Teams).WithOne(t => t.Round).HasForeignKey(t => t.RoundId).OnDelete(DeleteBehavior.Restrict);
        builder.HasMany(r => r.Matches).WithOne(m => m.Round).HasForeignKey(m => m.RoundId).OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(r => r.SourceAdvancementRules)
            .WithOne(ar => ar.SourceRound)
            .HasForeignKey(ar => ar.SourceRoundId)
            .OnDelete(DeleteBehavior.Restrict);
        builder.HasMany(r => r.TargetAdvancementRules)
            .WithOne(ar => ar.TargetRound)
            .HasForeignKey(ar => ar.TargetRoundId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(r => r.SourceLogicNodes)
            .WithOne(ln => ln.SourceRound)
            .HasForeignKey(ln => ln.SourceRoundId)
            .OnDelete(DeleteBehavior.Restrict);
        builder.HasMany(r => r.TargetLogicNodes)
            .WithOne(ln => ln.TargetRound)
            .HasForeignKey(ln => ln.TargetRoundId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
