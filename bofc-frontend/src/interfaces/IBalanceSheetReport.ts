interface IBalanceSheetReport {
    natureType: string;   // Represents the nature type (e.g., ASSET, LIABILITY, INCOME, EXPENSE)
    totalDebit: number;   // Total debit for the nature type
    totalCredit: number;  // Total credit for the nature type
    balance: number;      // Net balance (totalDebit - totalCredit) for the nature type
  }
  
  export default IBalanceSheetReport;
  