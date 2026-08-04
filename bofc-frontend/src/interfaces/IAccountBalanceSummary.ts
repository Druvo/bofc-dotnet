interface IAccountBalanceSummary {
    accountType: string;
    totalDebit: number;
    totalCredit: number;
    netBalance: number;
}

export default IAccountBalanceSummary;
