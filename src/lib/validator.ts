import type { Transaction, Investment, Loan } from '../types';

export interface AppData {
    transactions?: Transaction[];
    creditCardTransactions?: Transaction[];
    investments?: Investment[];
    loans?: Loan[];
    currency?: string;
    sources?: string[];
    balances?: any[];
    version?: number;
}

export function validateAppData(data: any): data is AppData {
    if (!data || typeof data !== 'object') {
        throw new Error('Invalid JSON format: Root must be an object.');
    }

    // Check if at least one known key exists
    const knownKeys = ['transactions', 'creditCardTransactions', 'investments', 'loans', 'currency', 'sources', 'balances'];
    const hasKnownKey = knownKeys.some(key => key in data);

    if (!hasKnownKey) {
        throw new Error('Invalid JSON: Must contain at least one of transactions, investments, loans, etc.');
    }

    // Validate Transactions (if present)
    if (data.transactions) {
        if (!Array.isArray(data.transactions)) throw new Error('Invalid JSON: "transactions" must be an array.');
        // Basic check for first few items? or simple structure check.
        // Let's assume if it is an array it's likely intended to be transactions.
    }

    // Validate CC Transactions
    if (data.creditCardTransactions && !Array.isArray(data.creditCardTransactions)) {
        throw new Error('Invalid JSON: "creditCardTransactions" must be an array.');
    }

    // Validate Investments
    if (data.investments && !Array.isArray(data.investments)) {
        throw new Error('Invalid JSON: "investments" must be an array.');
    }

    // Validate Loans
    if (data.loans && !Array.isArray(data.loans)) {
        throw new Error('Invalid JSON: "loans" must be an array.');
    }

    return true;
}
