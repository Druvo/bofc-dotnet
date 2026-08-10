using BofcBackend.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BofcBackend.Api.Data.Configurations;

public class AcCollectionConfiguration : IEntityTypeConfiguration<AcCollection>
{
    public void Configure(EntityTypeBuilder<AcCollection> builder)
    {
        builder.ToTable("ac_collections");
        builder.HasKey(c => c.Id);
        builder.Property(c => c.Id).HasColumnName("id").ValueGeneratedOnAdd();

        // Java's entity declares @Column(name = "transactionId") (camelCase), but the actual
        // Flyway-owned column (V16__create_ac_collections.sql) is transaction_id (snake_case,
        // matching every other column in this schema) - trusting the migration SQL as the
        // authoritative schema over the entity annotation, which looks like a Java-side typo.
        builder.Property(c => c.TransactionId).HasColumnName("transaction_id").HasMaxLength(30).IsRequired();
        builder.HasIndex(c => c.TransactionId).IsUnique();

        builder.Property(c => c.Amount).HasColumnName("amount").HasPrecision(18, 2).IsRequired();
        builder.Property(c => c.TotalAmount).HasColumnName("total_amount").HasPrecision(18, 2).IsRequired();
        builder.Property(c => c.MonthOfPayment).HasColumnName("month_of_payment").HasColumnType("date").IsRequired();
        builder.Property(c => c.Description).HasColumnName("description");
        builder.Property(c => c.Date).HasColumnName("date").HasColumnType("date").IsRequired();

        builder.Property(c => c.CreatedBy).HasColumnName("created_by").IsRequired();
        builder.Property(c => c.CreatedDate).HasColumnName("created_date").IsRequired();
        builder.Property(c => c.LastModifiedBy).HasColumnName("last_modified_by");
        builder.Property(c => c.UpdatedDate).HasColumnName("updated_date");

        builder.Property(c => c.PaymentAccountId).HasColumnName("payment_account_id");
        builder.HasOne(c => c.PaymentAccount).WithMany().HasForeignKey(c => c.PaymentAccountId).OnDelete(DeleteBehavior.Restrict);

        // V16__create_ac_collections.sql: collection_players(collection_id, player_id) -
        // both shadow FK columns need an explicit name, not just the "Players" nav side
        // (EF's default shadow column name for the AcCollection side would be "AcCollectionId").
        builder.HasMany(c => c.Players)
            .WithMany()
            .UsingEntity<Dictionary<string, object>>(
                "collection_players",
                right => right.HasOne<Player>().WithMany().HasForeignKey("PlayersId"),
                left => left.HasOne<AcCollection>().WithMany().HasForeignKey("AcCollectionId"),
                join =>
                {
                    join.ToTable("collection_players");
                    join.Property<long>("AcCollectionId").HasColumnName("collection_id");
                    join.Property<long>("PlayersId").HasColumnName("player_id");
                });
    }
}
