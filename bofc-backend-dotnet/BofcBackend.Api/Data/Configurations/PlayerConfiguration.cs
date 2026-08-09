using BofcBackend.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BofcBackend.Api.Data.Configurations;

public class PlayerConfiguration : IEntityTypeConfiguration<Player>
{
    public void Configure(EntityTypeBuilder<Player> builder)
    {
        builder.ToTable("players");
        builder.HasKey(p => p.Id);
        builder.Property(p => p.Id).HasColumnName("id").ValueGeneratedOnAdd();
        builder.Property(p => p.Name).HasColumnName("name").IsRequired();
        builder.Property(p => p.Email).HasColumnName("email").IsRequired();
        builder.Property(p => p.EmployeeId).HasColumnName("employee_id").IsRequired();
        builder.Property(p => p.TeamsId).HasColumnName("teams_id").IsRequired();
        builder.Property(p => p.MobileNo).HasColumnName("mobile_no");
        builder.Property(p => p.IsActive).HasColumnName("is_active").IsRequired();
        builder.Property(p => p.JerseyNumber).HasColumnName("jersey_number");
        builder.Property(p => p.Position)
            .HasColumnName("playing_position")
            .HasConversion<string>()
            .IsRequired();
        builder.Property(p => p.Password).HasColumnName("password");
        builder.Property(p => p.LastPasswordChangeDate).HasColumnName("last_password_change_date");
        builder.Property(p => p.ProfilePhoto).HasColumnName("profile_photo").HasMaxLength(500);
        builder.Property(p => p.PhotoKey).HasColumnName("photo_key");
        builder.Property(p => p.ThemePreference).HasColumnName("theme_preference").HasMaxLength(10);
        // "rank" is a reserved word in SQL Server — use a non-reserved column name to be safe.
        builder.Property(p => p.Rank).HasColumnName("player_rank");

        builder.Property(p => p.CreatedBy).HasColumnName("created_by").IsRequired();
        builder.Property(p => p.CreatedDate).HasColumnName("created_date").IsRequired();
        builder.Property(p => p.LastModifiedBy).HasColumnName("last_modified_by");
        builder.Property(p => p.UpdatedDate).HasColumnName("updated_date");

        // Matches @Table(uniqueConstraints = {@UniqueConstraint(columnNames = {"email", "employee_id"})})
        // plus the individual column-level unique=true on email/employee_id/teams_id.
        builder.HasIndex(p => p.Email).IsUnique();
        builder.HasIndex(p => p.EmployeeId).IsUnique();
        builder.HasIndex(p => p.TeamsId).IsUnique();
        builder.HasIndex(p => new { p.Email, p.EmployeeId }).IsUnique();

        builder.HasMany(p => p.Roles)
            .WithMany(r => r.Players)
            .UsingEntity<Dictionary<string, object>>(
                "players_roles",
                j => j.HasOne<Role>().WithMany().HasForeignKey("role_id"),
                j => j.HasOne<Player>().WithMany().HasForeignKey("player_id"));
    }
}
