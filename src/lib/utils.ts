import { clsx, type ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]) {
    return clsx(inputs);
}

export function formatCurrency(amount: number, currency: string = 'USD') {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
    }).format(amount);
}

export function formatDate(date: string | Date) {
    return new Intl.DateTimeFormat('en-US', {
        dateStyle: 'medium',
    }).format(new Date(date));
}

export function formatCompactNumber(number: number): string {
    const abs = Math.abs(number);
    if (abs >= 10000000) {
        return (number / 10000000).toFixed(1).replace(/\.0$/, '') + 'Cr';
    } else if (abs >= 100000) {
        return (number / 100000).toFixed(1).replace(/\.0$/, '') + 'L';
    } else if (abs >= 1000) {
        return (number / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    }
    return number.toString();
}
