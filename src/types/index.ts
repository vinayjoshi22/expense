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
}

export interface Investment {
    id: string;
    name: string;
    type: string;
    amount: number;
    date: string; // ISO Date string
    currency: string;
}

export interface AppState {
    apiKey: string | null;
    transactions: Transaction[];
    investments: Investment[];
    currency: string;
    isProcessing: boolean;
    error: AppError | null;
}
