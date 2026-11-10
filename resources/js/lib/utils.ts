import { clsx, type ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]) {
    return clsx(inputs);
}

export function money(value: number | string | null | undefined): string {
    const n = Number(value ?? 0);
    return new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD', maximumFractionDigits: 2 }).format(n);
}

export function number(value: number | string | null | undefined): string {
    return new Intl.NumberFormat('fr-FR').format(Number(value ?? 0));
}

export function date(value: string | null | undefined): string {
    if (!value) return 'Non renseigné';
    return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(value));
}

export function dateTime(value: string | null | undefined): string {
    if (!value) return 'Non renseigné';
    return new Intl.DateTimeFormat('fr-FR', {
        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
    }).format(new Date(value));
}

export function normalizeText(value: string | null | undefined): string {
    return String(value ?? '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();
}

export function initials(name: string | null | undefined): string {
    return String(name ?? '?')
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join('');
}

export function statusTone(status: string | null | undefined): string {
    switch (status) {
        case 'disponible':
        case 'actif':
        case 'paye':
        case 'confirmed':
        case 'confirmee':
            return 'bg-emerald-50 text-emerald-700 border-emerald-200';
        case 'en_location':
        case 'en_cours':
        case 'sending':
            return 'bg-blue-50 text-blue-700 border-blue-200';
        case 'en_reparation':
        case 'echeancier':
        case 'pending':
            return 'bg-amber-50 text-amber-700 border-amber-200';
        case 'hors_service':
        case 'blackliste':
        case 'impaye':
        case 'annulee':
        case 'canceled':
            return 'bg-rose-50 text-rose-700 border-rose-200';
        case 'inactif':
        case 'debiteur':
            return 'bg-slate-100 text-slate-600 border-slate-200';
        default:
            return 'bg-slate-100 text-slate-600 border-slate-200';
    }
}

export function exportUrl(entity: string, filters: Record<string, string | undefined> = {}): string {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(filters)) {
        if (value) params.set(key, value);
    }
    const query = params.toString();
    return `/exports/${entity}.csv${query ? `?${query}` : ''}`;
}
