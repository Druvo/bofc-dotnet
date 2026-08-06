using BofcBackend.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BofcBackend.Api.Data.Configurations;

public class AuctionPlayerRegistrationConfiguration : IEntityTypeConfiguration<AuctionPlayerRegistration>
{
    public void Configure(EntityTypeBuilder<AuctionPlayerRegistration> builder)
    {
        builder.ToTable("auction_player_registrations");
        builder.HasKey(r => r.Id);
        builder.Property(r => r.Id).HasColumnName("id").ValueGeneratedOnAdd();
        builder.Property(r => r.MatchDayId).HasColumnName("match_day_id").IsRequired();
        builder.Property(r => r.Name).HasColumnName("name").IsRequired();
        builder.Property(r => r.Email).HasColumnName("email").IsRequired();
        builder.Property(r => r.EmployeeId).HasColumnName("employee_id").IsRequired();
        builder.Property(r => r.TeamsId).HasColumnName("teams_id");
        builder.Property(r => r.MobileNo).HasColumnName("mobile_no");
        builder.Property(r => r.PlayingPosition).HasColumnName("playing_position").HasConversion<string>().IsRequired();
        builder.Property(r => r.BattingStyle).HasColumnName("batting_style");
        builder.Property(r => r.BowlingStyle).HasColumnName("bowling_style");
        builder.Property(r => r.PreviousExperience).HasColumnName("previous_experience").HasColumnType("NVARCHAR(MAX)");
        builder.Property(r => r.AvailabilityStatus).HasColumnName("availability_status").HasConversion<string>().IsRequired();
        builder.Property(r => r.ProfilePhoto).HasColumnName("profile_photo");
        builder.Property(r => r.EmergencyContact).HasColumnName("emergency_contact");
        builder.Property(r => r.PreferredBasePrice).HasColumnName("preferred_base_price");
        builder.Property(r => r.ApprovalStatus).HasColumnName("approval_status").HasConversion<string>().IsRequired();
        builder.Property(r => r.ApprovedById).HasColumnName("approved_by");
        builder.Property(r => r.ApprovedAt).HasColumnName("approved_at");
        builder.Property(r => r.RejectionReason).HasColumnName("rejection_reason");
        builder.Property(r => r.CreatedPlayerId).HasColumnName("created_player_id");

        builder.Property(r => r.CreatedBy).HasColumnName("created_by").IsRequired();
        builder.Property(r => r.CreatedDate).HasColumnName("created_date").IsRequired();
        builder.Property(r => r.LastModifiedBy).HasColumnName("last_modified_by");
        builder.Property(r => r.UpdatedDate).HasColumnName("updated_date");

        builder.HasOne(r => r.MatchDay).WithMany().HasForeignKey(r => r.MatchDayId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(r => r.ApprovedBy).WithMany().HasForeignKey(r => r.ApprovedById).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(r => r.CreatedPlayer).WithMany().HasForeignKey(r => r.CreatedPlayerId).OnDelete(DeleteBehavior.Restrict);
    }
}
