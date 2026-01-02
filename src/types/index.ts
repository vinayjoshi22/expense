export type TransactionType = 'credit' | 'debit';

export type Category =
    | 'Food'
    | 'Transport'
    | 'Shopping'
    | 'Entertainment'
    | 'Health'
    | 'Utilities'
    | 'Travel'
    | 'Transfer'
    | 'Income'
    | 'Other';

export interface Transaction {
    id: string;
    date: string; // ISO Date string
    description: string;
    amount: number;
    type: TransactionType;
    category: string;
    originalText?: string;
    source?: string;
}

export interface MonthlyStats {
    month: string; // YYYY-MM
    income: number;
    expense: number;
    savings: number;
    transactions: Transaction[];
}

export interface AppError {
    title: string;
    message: string;
    details?: string;
}

export interface AnalysisResult {
    currency: string;
    transactions: Transaction[];
    loans?: Loan[];
    balances?: {
        opening: number;
        closing: number;
    };
    statement_period?: {
        month: string; // MM
        year: string; // YYYY
    };
}

export interface StatementBalance {
    id: string;
    source: string;
    month: string; // MM
    year: string; // YYYY
    openingBalance: number;
    closingBalance: number;
}

export interface Investment {
    id: string;
    name: string;
    type: string;
    amount: number;
    date: string; // ISO Date string
    currency: string;
}

export interface Loan {
    id: string;
    description: string;
    totalAmount: number;
    remainingAmount: number;
    installmentAmount: number; // EMI
    remainingInstallments: number; // e.g. "5 of 12" -> 7 remaining
    source: string; // The statement it came from
}

export interface AppState {
    apiKey: string | null;
    transactions: Transaction[];
    investments: Investment[];
    loans: Loan[];
    currency: string;
    isProcessing: boolean;
    error: AppError | null;
}

export interface AppData {
    transactions: Transaction[];
    creditCardTransactions?: Transaction[];
    investments: Investment[];
    loans?: Loan[]; // New
    currency: string;
    sources: string[];
    balances?: StatementBalance[];
    version: number;
}


