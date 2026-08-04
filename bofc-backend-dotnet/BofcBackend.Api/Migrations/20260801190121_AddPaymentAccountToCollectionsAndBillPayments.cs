using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BofcBackend.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddPaymentAccountToCollectionsAndBillPayments : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<long>(
                name: "payment_account_id",
                table: "ac_collections",
                type: "bigint",
                nullable: true);

            migrationBuilder.AddColumn<long>(
                name: "payment_account_id",
                table: "ac_bill_payments",
                type: "bigint",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_ac_collections_payment_account_id",
                table: "ac_collections",
                column: "payment_account_id");

            migrationBuilder.CreateIndex(
                name: "IX_ac_bill_payments_payment_account_id",
                table: "ac_bill_payments",
                column: "payment_account_id");

            migrationBuilder.AddForeignKey(
                name: "FK_ac_bill_payments_payment_accounts_payment_account_id",
                table: "ac_bill_payments",
                column: "payment_account_id",
                principalTable: "payment_accounts",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_ac_collections_payment_accounts_payment_account_id",
                table: "ac_collections",
                column: "payment_account_id",
                principalTable: "payment_accounts",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ac_bill_payments_payment_accounts_payment_account_id",
                table: "ac_bill_payments");

            migrationBuilder.DropForeignKey(
                name: "FK_ac_collections_payment_accounts_payment_account_id",
                table: "ac_collections");

            migrationBuilder.DropIndex(
                name: "IX_ac_collections_payment_account_id",
                table: "ac_collections");

            migrationBuilder.DropIndex(
                name: "IX_ac_bill_payments_payment_account_id",
                table: "ac_bill_payments");

            migrationBuilder.DropColumn(
                name: "payment_account_id",
                table: "ac_collections");

            migrationBuilder.DropColumn(
                name: "payment_account_id",
                table: "ac_bill_payments");
        }
    }
}
