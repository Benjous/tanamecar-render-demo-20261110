import { router } from '@inertiajs/react';
import { useRef, type FormEvent, type ReactNode } from 'react';

export type LegacyFilterField = {
    name: string;
    label: string;
    width?: string;
    options?: Array<{ value: string; label: string }>;
};

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
        timer.current = window.setTimeout(() => apply(form), 250);
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

/**
 * Barre de recherche reference : fond gris, bordure outset, libelles au-dessus
 * des champs, filtrage automatique pendant la saisie.
 */
export function FilterBar({
    action,
    filters,
    searchPlaceholder = 'Rechercher',
    fields,
    children,
    className,
}: {
    action: string;
    filters: Record<string, string | undefined>;
    searchPlaceholder?: string;
    resultCount?: number;
    fields?: LegacyFilterField[];
    children?: ReactNode;
    className?: string;
}) {
    const legacyFields = fields && fields.length > 0
        ? fields
        : [{ name: 'q', label: searchPlaceholder }];
    const exportHref = (() => {
        const path = action.split('?')[0];
        if (path === '/clients') return '/exports/clients.csv';
        if (path === '/vehicles') return '/exports/vehicles.csv';
        if (path === '/contracts') return '/exports/contracts.csv';
        if (path === '/invoices') return '/exports/invoices.csv';
        if (path === '/payments') return '/exports/payments.csv';
        if (path === '/vehicle-installments') return '/vehicle-installments/export.csv';
        const generic = path.match(/^\/data\/([^/]+)$/);
        return generic ? `/exports/${generic[1]}.csv` : null;
    })();

    return (
        <AutoFilterForm action={action} className={className}>
            <div className="al-search-box" id="SrchBox">
                <table className="al-search-table">
                    <tbody>
                        <tr>
                            {legacyFields.map((field) => (
                                <td key={`label-${field.name}`} className="al-search-label">{field.label}</td>
                            ))}
                        </tr>
                        <tr>
                            {legacyFields.map((field) => (
                                <td key={`input-${field.name}`} style={field.width ? { width: field.width } : undefined}>
                                    {field.options ? (
                                        <select name={field.name} defaultValue={filters[field.name] ?? ''} style={field.width ? { width: field.width } : undefined}>
                                            {field.options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                                        </select>
                                    ) : (
                                        <input
                                            name={field.name}
                                            type="text"
                                            defaultValue={filters[field.name] ?? ''}
                                            autoComplete="off"
                                            style={field.width ? { width: field.width } : undefined}
                                        />
                                    )}
                                </td>
                            ))}
                        </tr>
                    </tbody>
                </table>
                {children ? <div className="al-search-extra">{children}</div> : null}
            </div>
            <div className="al-icon-bar">
                <img src="/legacy/imprimer.png" alt="Imprimer" title="Imprimer" onClick={() => window.print()} />
                {exportHref ? (
                    <a href={exportHref} title="Exporter Excel" style={{ lineHeight: 0 }}>
                        <img src="/legacy/excel.jpg" alt="Exporter Excel" />
                    </a>
                ) : null}
            </div>
        </AutoFilterForm>
    );
}
