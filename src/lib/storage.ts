import type { Transaction } from '../types';

const STORAGE_KEY = 'EA_TRANSACTIONS_V1';
const CURRENCY_KEY = 'EA_CURRENCY_V1';
const INVESTMENTS_KEY = 'EA_INVESTMENTS_V1';

export const saveTransactions = (transactions: Transaction[]) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
    } catch (e) {
        console.error("Failed to save transactions to localStorage", e);
    }
};

export const loadTransactions = (): Transaction[] => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch (e) {
        console.error("Failed to load transactions", e);
        return [];
    }
};

export const saveCurrency = (currency: string) => {
    localStorage.setItem(CURRENCY_KEY, currency);
};

export const loadCurrency = (): string => {
    return localStorage.getItem(CURRENCY_KEY) || 'USD';
};

export const clearStorage = () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(CURRENCY_KEY);
    localStorage.removeItem(INVESTMENTS_KEY);
};

export const saveInvestments = (investments: any[]) => {
    try {
        localStorage.setItem(INVESTMENTS_KEY, JSON.stringify(investments));
    } catch (e) {
        console.error("Failed to save investments", e);
    }
};

export const loadInvestments = (): any[] => {
    try {
        const raw = localStorage.getItem(INVESTMENTS_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch (e) {
        console.error("Failed to load investments", e);
        return [];
    }
};

// Deduplication Logic
export const mergeTransactions = (existing: Transaction[], incoming: Transaction[]): Transaction[] => {
    const map = new Map<string, Transaction>();

    // Helper to generate a unique signature for a transaction
    const getSignature = (t: Transaction) => {
        // Sanitize description: remove extra spaces, lowercase
        const cleanDesc = t.description.trim().toLowerCase().replace(/\s+/g, ' ');
        return `${t.date}|${t.amount}|${t.type}|${cleanDesc}`;
    };

    // 1. Load existing
    existing.forEach(t => {
        map.set(getSignature(t), t);
    });

    // 2. Merge incoming (overwriting if collision, though functionally they are same events)
    let newCount = 0;
    incoming.forEach(t => {
        const signature = getSignature(t);
        if (!map.has(signature)) {
            map.set(signature, t);
            newCount++;
        }
    });

    console.log(`Merged ${incoming.length} incoming transactions. Added ${newCount} new unique records.`);

    return Array.from(map.values()).sort((a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
    );
};
