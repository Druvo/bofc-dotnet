interface IAccountsReport {
    accountId: number;
    accountCode: string;
    accountName: string;
    totalDebit: number;
    totalCredit: number;
    balance: number;
}

export default IAccountsReport;
