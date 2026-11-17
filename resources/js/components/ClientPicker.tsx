import { Loader2, Search, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

export type ClientOption = {
    id: number;
    display_name?: string;
    first_name?: string | null;
    last_name?: string | null;
    phone?: string | null;
    address?: string | null;
    email?: string | null;
    identity_number?: string | null;
    identity_document_type?: string | null;
    license_number?: string | null;
    country_id?: number | null;
    country_name?: string | null;
    country?: { name: string } | null;
    last_rental?: string | null;
};

export default function ClientPicker({
    value,
    onChange,
    onSelect,
    initialOptions = [],
    placeholder = 'Rechercher un client',
}: {
    value: string | number | null | undefined;
    onChange: (value: string) => void;
    onSelect?: (option: ClientOption) => void;
    initialOptions?: ClientOption[];
    placeholder?: string;
}) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<ClientOption[]>([]);
    const [activeIndex, setActiveIndex] = useState(-1);

    const selected = useMemo(
        () => initialOptions.find((option) => String(option.id) === String(value ?? '')),
        [initialOptions, value],
    );

    useEffect(() => {
        if (!open) {
            return;
        }

        const controller = new AbortController();
        const timer = window.setTimeout(async () => {
            if (query.trim().length < 1) {
                setResults([]);
                return;
            }
            setLoading(true);
            try {
                const response = await fetch(`/clients/search?q=${encodeURIComponent(query)}`, {
                    headers: { Accept: 'application/json' },
                    credentials: 'same-origin',
                    signal: controller.signal,
                });
                const payload = await response.json();
                setResults(payload.results ?? []);
                setActiveIndex(0);
            } catch (error) {
                if ((error as Error).name !== 'AbortError') {
                    setResults([]);
                }
            } finally {
                setLoading(false);
            }
        }, 250);

        return () => {
            window.clearTimeout(timer);
            controller.abort();
        };
    }, [open, query]);

    function select(option: ClientOption) {
        onChange(String(option.id));
        onSelect?.(option);
        setOpen(false);
        setQuery('');
        setResults([]);
        setActiveIndex(-1);
    }

    function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
        if (event.key === 'ArrowDown') {
            event.preventDefault();
            setActiveIndex((current) => Math.min(results.length - 1, current + 1));
        } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            setActiveIndex((current) => Math.max(0, current - 1));
        } else if (event.key === 'Enter' && activeIndex >= 0 && results[activeIndex]) {
            event.preventDefault();
            select(results[activeIndex]);
        } else if (event.key === 'Escape') {
            setOpen(false);
        }
    }

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => setOpen((current) => !current)}
                className="tc-input flex min-h-[42px] items-center justify-between gap-2 text-left"
            >
                <span className={selected ? 'text-slate-900' : 'text-slate-400'}>
                    {selected ? (selected.display_name ?? `Client #${selected.id}`) : placeholder}
                </span>
                {selected ? (
                    <span
                        role="button"
                        tabIndex={0}
                        onClick={(event) => {
                            event.stopPropagation();
                            onChange('');
                        }}
                        onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault();
                                onChange('');
                            }
                        }}
                        className="rounded p-0.5 text-slate-400 hover:text-rose-600"
                    >
                        <X className="h-4 w-4" />
                    </span>
                ) : (
                    <Search className="h-4 w-4 text-slate-400" />
                )}
            </button>

            {open && (
                <div className="absolute z-30 mt-1 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
                    <div className="border-b border-slate-100 p-2">
                        <input
                            autoFocus
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            onKeyDown={onKeyDown}
                            placeholder="Nom, prénom, téléphone, identité…"
                            className="tc-input"
                            aria-activedescendant={activeIndex >= 0 && results[activeIndex] ? `client-option-${results[activeIndex].id}` : undefined}
                        />
                    </div>
                    <div className="max-h-64 overflow-y-auto" role="listbox">
                        {loading && (
                            <div className="flex items-center gap-2 px-3 py-4 text-sm text-slate-500">
                                <Loader2 className="h-4 w-4 animate-spin" /> Recherche…
                            </div>
                        )}
                        {!loading && query.trim().length < 1 && (
                            <div className="px-3 py-4 text-sm text-slate-400">Saisissez au moins un caractère.</div>
                        )}
                        {!loading && query.trim().length >= 1 && results.length === 0 && (
                            <div className="px-3 py-4 text-sm text-slate-400">Aucun client trouvé.</div>
                        )}
                        {!loading &&
                            results.map((option, index) => (
                                <button
                                    key={option.id}
                                    id={`client-option-${option.id}`}
                                    role="option"
                                    type="button"
                                    onMouseEnter={() => setActiveIndex(index)}
                                    onClick={() => select(option)}
                                    className={`flex w-full items-start justify-between gap-3 border-b border-slate-50 px-3 py-2 text-left text-sm hover:bg-slate-50 ${index === activeIndex ? 'bg-slate-50' : ''}`}
                                >
                                    <span className="min-w-0">
                                        <span className="block font-medium text-slate-800">{option.display_name ?? `Client #${option.id}`}</span>
                                        <span className="block text-xs text-slate-500">{option.address ?? 'Adresse non renseignée'}</span>
                                        {option.last_rental && <span className="block text-[11px] text-slate-400">Dernière location : {option.last_rental}</span>}
                                    </span>
                                    <span className="shrink-0 text-xs text-slate-400">{option.phone ?? ''}</span>
                                </button>
                            ))}
                    </div>
                </div>
            )}
        </div>
    );
}
