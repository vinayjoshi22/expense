import type { Transaction, Investment } from '../types';

export interface AppData {
    transactions: Transaction[];
    investments: Investment[];
    currency: string;
    version: number;
}

export function validateAppData(data: any): data is AppData {
    if (!data || typeof data !== 'object') {
        throw new Error('Invalid JSON format: Root must be an object.');
    }

    // Validate Transactions
    if (!Array.isArray(data.transactions)) {
        throw new Error('Invalid JSON format: "transactions" must be an array.');
    }

    for (const [index, t] of data.transactions.entries()) {
        if (!t.id || typeof t.id !== 'string') throw new Error(`Transaction at index ${index} missing 'id'`);
        if (!t.date || typeof t.date !== 'string') throw new Error(`Transaction at index ${index} missing 'date'`);
        if (!t.description || typeof t.description !== 'string') throw new Error(`Transaction at index ${index} missing 'description'`);
        if (typeof t.amount !== 'number') throw new Error(`Transaction at index ${index} missing 'amount'`);
        if (!t.type || (t.type !== 'credit' && t.type !== 'debit')) throw new Error(`Transaction at index ${index} has invalid 'type'`);
        if (!t.category || typeof t.category !== 'string') throw new Error(`Transaction at index ${index} missing 'category'`);
    }

    // Validate Investments
    if (data.investments && !Array.isArray(data.investments)) {
        throw new Error('Invalid JSON format: "investments" must be an array.');
    }

    if (data.investments) {
        for (const [index, inv] of data.investments.entries()) {
            if (!inv.id || typeof inv.id !== 'string') throw new Error(`Investment at index ${index} missing 'id'`);
            if (!inv.name || typeof inv.name !== 'string') throw new Error(`Investment at index ${index} missing 'name'`);
            if (typeof inv.amount !== 'number') throw new Error(`Investment at index ${index} missing 'amount'`);
            // Allow optional fields if strictly required by types, but check basic types
        }
    }

    // Validate Currency
    if (data.currency && typeof data.currency !== 'string') {
        throw new Error('Invalid JSON format: "currency" must be a string.');
    }

    return true;
}
