import type { Transaction } from '../types';

const STORAGE_KEY = 'EA_TRANSACTIONS_V1';
const CURRENCY_KEY = 'EA_CURRENCY_V1';
const INVESTMENTS_KEY = 'EA_INVESTMENTS_V1';
const SOURCES_KEY = 'EA_SOURCES_V1';

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

export const saveSources = (sources: string[]) => {
    try {
        localStorage.setItem(SOURCES_KEY, JSON.stringify(sources));
    } catch (e) {
        console.error("Failed to save sources", e);
    }
};

export const loadSources = (): string[] => {
    try {
        const raw = localStorage.getItem(SOURCES_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch (e) {
        console.error("Failed to load sources", e);
        return [];
    }
};

export const clearStorage = () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(CURRENCY_KEY);
    localStorage.removeItem(INVESTMENTS_KEY);
    localStorage.removeItem(SOURCES_KEY);
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

export const mergeInvestments = (existing: any[], incoming: any[]): any[] => {
    const map = new Map<string, any>();

    // 1. Load existing
    existing.forEach(i => {
        if (i.id) map.set(i.id, i);
    });

    // 2. Merge incoming (avoid duplicates by ID)
    let newCount = 0;
    incoming.forEach(i => {
        if (i.id && !map.has(i.id)) {
            map.set(i.id, i);
            newCount++;
        }
    });

    console.log(`Merged ${incoming.length} incoming investments. Added ${newCount} new unique records.`);
    return Array.from(map.values());
};
