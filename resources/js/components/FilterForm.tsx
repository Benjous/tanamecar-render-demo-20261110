import { Link, router } from '@inertiajs/react';
import { Loader2, RotateCcw, Search } from 'lucide-react';
import { useRef, useState, type FormEvent, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function AutoFilterForm({
    action,
    className,
    children,
    onLoadingChange,
}: {
    action: string;
    className?: string;
    children: ReactNode;
    onLoadingChange?: (loading: boolean) => void;
}) {
    const timer = useRef<number | null>(null);

    function apply(form: HTMLFormElement) {
        const params = Object.fromEntries(
            [...new FormData(form).entries()].filter(([, value]) => String(value).trim() !== ''),
        );
        router.get(action, params, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
            onStart: () => onLoadingChange?.(true),
            onFinish: () => onLoadingChange?.(false),
        });
    }

    function onChange(event: FormEvent<HTMLFormElement>) {
        const form = event.currentTarget;
        if (timer.current) window.clearTimeout(timer.current);
        timer.current = window.setTimeout(() => apply(form), 200);
    }

    return (
        <form
            action={action}
            method="get"
            className={className}
            onChange={onChange}
            onSubmit={(event) => {
                event.preventDefault();
                if (timer.current) window.clearTimeout(timer.current);
                apply(event.currentTarget);
            }}
        >
            {children}
        </form>
    );
}

export function FilterBar({
    action,
    filters,
    searchPlaceholder = 'Rechercher',
    resultCount,
    children,
    className,
}: {
    action: string;
    filters: Record<string, string | undefined>;
    searchPlaceholder?: string;
    resultCount?: number;
    children?: ReactNode;
    className?: string;
}) {
    const [loading, setLoading] = useState(false);
    const active = Object.entries(filters).some(([key, value]) => !['sort', 'dir'].includes(key) && value !== undefined && String(value).trim() !== '');

    return (
        <AutoFilterForm action={action} onLoadingChange={setLoading} className={cn('tc-card mb-4 p-4', className)}>
            <div className="flex flex-col gap-3 xl:flex-row xl:items-end">
                <label className="relative min-w-0 flex-1">
                    <span className="sr-only">Recherche</span>
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                        name="q"
                        type="search"
                        defaultValue={filters.q ?? ''}
                        placeholder={searchPlaceholder}
                        autoComplete="off"
                        className="tc-input pl-9"
                    />
                </label>
                {children && <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-2 xl:flex xl:flex-wrap">{children}</div>}
                <div className="flex shrink-0 items-center gap-2">
                    <button type="submit" className="tc-btn-primary" disabled={loading}>
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                        Filtrer
                    </button>
                    {active && (
                        <Link href={action} className="tc-btn-secondary" aria-label="Réinitialiser les filtres">
                            <RotateCcw className="h-4 w-4" />
                            Réinitialiser
                        </Link>
                    )}
                </div>
            </div>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                <span aria-live="polite">
                    {loading ? 'Recherche en cours…' : resultCount !== undefined ? `${resultCount} résultat${resultCount > 1 ? 's' : ''}` : ''}
                </span>
            </div>
        </AutoFilterForm>
    );
}
