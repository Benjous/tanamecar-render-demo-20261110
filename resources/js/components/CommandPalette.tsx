import { router } from '@inertiajs/react';
import { Search, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

type Result = { label: string; hint?: string | null; href: string; category: string };

const actions: Result[] = [
    { label: 'Tableau de bord', href: '/', category: 'Navigation' },
    { label: 'Nouvelle location', href: '/contracts/create', category: 'Actions' },
    { label: 'Nouveau client', href: '/clients/create', category: 'Actions' },
    { label: 'Nouvelle voiture', href: '/vehicles/create', category: 'Actions' },
    { label: 'Nouvelle facture', href: '/invoices/create', category: 'Actions' },
    { label: 'Traites', href: '/vehicle-installments', category: 'Navigation' },
    { label: 'Amortissement', href: '/vehicle-amortizations', category: 'Navigation' },
    { label: 'Sous-location', href: '/sub-rentals', category: 'Navigation' },
    { label: 'Rapport', href: '/reports', category: 'Navigation' },
    { label: 'Contrôle des volumes', href: '/settings/client-volume', category: 'Navigation' },
];

export default function CommandPalette() {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [remote, setRemote] = useState<Result[]>([]);
    const [active, setActive] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const key = (event: KeyboardEvent) => {
            if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
                event.preventDefault();
                setOpen((value) => !value);
            }
            if (event.key === 'Escape') setOpen(false);
        };
        const custom = () => setOpen(true);
        window.addEventListener('keydown', key);
        window.addEventListener('taname-command-open', custom);
        return () => { window.removeEventListener('keydown', key); window.removeEventListener('taname-command-open', custom); };
    }, []);

    useEffect(() => {
        if (!open) return;
        const timer = window.setTimeout(async () => {
            if (query.trim().length < 2) { setRemote([]); return; }
            try {
                const response = await fetch(`/command-search?q=${encodeURIComponent(query)}`, { headers: { Accept: 'application/json' }, credentials: 'same-origin' });
                const payload = await response.json();
                setRemote(payload.results ?? []);
            } catch { setRemote([]); }
        }, 220);
        return () => window.clearTimeout(timer);
    }, [open, query]);

    useEffect(() => { if (open) window.setTimeout(() => inputRef.current?.focus(), 20); }, [open]);

    const results = useMemo(() => {
        const local = actions.filter((item) => item.label.toLowerCase().includes(query.toLowerCase()) || item.category.toLowerCase().includes(query.toLowerCase()));
        return [...local, ...remote].slice(0, 20);
    }, [query, remote]);

    useEffect(() => { setActive(0); }, [query]);

    if (!open) return null;

    const go = (item?: Result) => {
        if (!item) return;
        setOpen(false);
        setQuery('');
        router.visit(item.href);
    };

    return (
        <div className="fixed inset-0 z-[90] flex items-start justify-center bg-slate-950/50 p-4 pt-[12vh]" onMouseDown={() => setOpen(false)}>
            <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-brand-100 bg-white shadow-2xl" onMouseDown={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-label="Palette de commandes">
                <div className="flex items-center gap-3 border-b border-brand-100 px-4 py-3">
                    <Search className="h-5 w-5 text-brand-600" />
                    <input ref={inputRef} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => {
                        if (event.key === 'ArrowDown') { event.preventDefault(); setActive((value) => Math.min(results.length - 1, value + 1)); }
                        if (event.key === 'ArrowUp') { event.preventDefault(); setActive((value) => Math.max(0, value - 1)); }
                        if (event.key === 'Enter') { event.preventDefault(); go(results[active]); }
                    }} placeholder="Rechercher" className="w-full bg-transparent text-base text-slate-900 outline-none placeholder:text-slate-400" />
                    <button onClick={() => setOpen(false)} aria-label="Fermer la palette"><X className="h-5 w-5 text-slate-400" /></button>
                </div>
                <div className="max-h-[55vh] overflow-y-auto p-2">
                    {results.map((item, index) => <button key={`${item.category}-${item.href}-${item.label}`} onClick={() => go(item)} onMouseEnter={() => setActive(index)} className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm ${index === active ? 'bg-brand-50 text-brand-900' : 'text-slate-700 hover:bg-brand-50'}`}>
                        <span><span className="font-semibold">{item.label}</span>{item.hint && <span className="ml-2 text-xs text-slate-500">{item.hint}</span>}</span>
                        <span className="text-[11px] uppercase tracking-wide text-slate-400">{item.category}</span>
                    </button>)}
                    {!results.length && <div className="px-4 py-8 text-center text-sm text-slate-500">Aucun résultat.</div>}
                </div>
                
            </div>
        </div>
    );
}
