import { useVirtualizer } from '@tanstack/react-virtual';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, Columns3 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type VirtualColumn<T> = {
    key: string;
    label: string;
    width?: string;
    className?: string;
    render: (row: T) => ReactNode;
    sortValue?: (row: T) => string | number | null;
    filterable?: boolean;
};

function minColumnWidth<T>(column: VirtualColumn<T>): number {
    const identity = `${column.key} ${column.label}`.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    if (/amount|montant|total|paid|paye|remaining|reste|price|prix|rate|tarif|advance|avance|credit|benefice|profit|balance|solde|revenue|revenu|cost|frais|subtotal|tva/.test(identity)) return 110;
    if (/date|time|heure|depart|retour|echeance|created|issued/.test(identity)) return 108;
    if (/reference|ref\b/.test(identity)) return 100;
    if (/phone|telephone|email|address|adresse|plate|plaque|matricule|identity|identite/.test(identity)) return 120;
    if (/status|statut|type|mode|origin|origine|action|match|rapprochement/.test(identity)) return 84;
    if (/count|nombre|jours|days|mois|month|km|locations|lignes|\bid\b/.test(identity)) return 84;
    if (/vehicle|voiture/.test(identity)) return 150;
    return 120;
}

function columnTrack<T>(column: VirtualColumn<T>): string {
    const width = column.width ?? 'minmax(140px, 1fr)';
    const minimum = minColumnWidth(column);
    const fixed = width.match(/^(\d+(?:\.\d+)?)px$/);
    if (fixed) return `${Math.max(Number(fixed[1]), minimum)}px`;
    const minmax = width.match(/^minmax\(\s*(\d+(?:\.\d+)?|0)(?:px)?\s*,\s*(.+)\)$/);
    if (minmax) return `minmax(${Math.max(Number(minmax[1]), minimum)}px, ${minmax[2]})`;
    return width;
}

function fullCellValue<T>(column: VirtualColumn<T>, row: T): string | undefined {
    const value = column.sortValue ? column.sortValue(row) : (row as any)[column.key];
    if (value === null || value === undefined || value === '') return undefined;
    return String(value);
}

export function VirtualDataList<T>({
    rows,
    columns,
    rowKey,
    href,
    actions,
    rowClassName,
    rowTestId = 'row-link',
    empty,
    totalLabel,
    heightClass = 'max-h-[calc(100vh-260px)] min-h-[320px]',
    actionsWidth = '128px',
    defaultHidden = [],
    pageSize = 100,
}: {
    rows: T[];
    columns: VirtualColumn<T>[];
    rowKey: (row: T) => string | number;
    href: (row: T) => string;
    actions?: (row: T) => ReactNode;
    rowClassName?: (row: T) => string;
    rowTestId?: string;
    empty?: ReactNode;
    totalLabel?: string;
    heightClass?: string;
    actionsWidth?: string;
    defaultHidden?: string[];
    pageSize?: number;
}) {
    const parentRef = useRef<HTMLDivElement>(null);
    const [sort, setSort] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
    const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
    const [density, setDensity] = useState<'compact' | 'comfortable'>('comfortable');
    const [hiddenColumns, setHiddenColumns] = useState<string[]>(defaultHidden);
    const [page, setPage] = useState(1);
    const visibleColumns = columns.filter((column) => !hiddenColumns.includes(column.key));
    const scrollKey = `taname-list-scroll:${window.location.pathname}`;
    const filterKey = `taname-column-filters:${window.location.pathname}`;
    const columnsKey = `taname-list-columns:${window.location.pathname}`;

    useEffect(() => {
        try {
            const savedFilters = window.localStorage.getItem(filterKey);
            if (savedFilters) setColumnFilters(JSON.parse(savedFilters));
            const savedDensity = window.localStorage.getItem('taname-list-density');
            if (savedDensity === 'compact' || savedDensity === 'comfortable') setDensity(savedDensity);
            const savedColumns = window.localStorage.getItem(columnsKey);
            if (savedColumns) setHiddenColumns(JSON.parse(savedColumns));
        } catch {}
    }, [filterKey, columnsKey]);

    useEffect(() => {
        try { window.localStorage.setItem(filterKey, JSON.stringify(columnFilters)); } catch {}
    }, [columnFilters, filterKey]);

    useEffect(() => {
        try { window.localStorage.setItem(columnsKey, JSON.stringify(hiddenColumns)); } catch {}
    }, [hiddenColumns, columnsKey]);

    useEffect(() => {
        const element = parentRef.current;
        if (!element) return;
        const saved = Number(window.sessionStorage.getItem(scrollKey) ?? 0);
        if (saved > 0) element.scrollTop = saved;
        const save = () => window.sessionStorage.setItem(scrollKey, String(element.scrollTop));
        element.addEventListener('scroll', save, { passive: true });
        return () => {
            save();
            element.removeEventListener('scroll', save);
        };
    }, [scrollKey]);

    const filteredRows = useMemo(() => {
        const active = Object.entries(columnFilters).filter(([, value]) => value.trim() !== '');
        if (!active.length) return rows;
        return rows.filter((row) => active.every(([key, value]) => {
            const column = visibleColumns.find((item) => item.key === key);
            const raw = column?.sortValue ? column.sortValue(row) : (row as any)[key];
            return String(raw ?? '').toLocaleLowerCase('fr').includes(value.trim().toLocaleLowerCase('fr'));
        }));
    }, [rows, visibleColumns, columnFilters]);
    const sortedRows = useMemo(() => {
        if (!sort) return filteredRows;
        const column = visibleColumns.find((item) => item.key === sort.key);
        if (!column) return filteredRows;
        return [...filteredRows].sort((left, right) => {
            const a = column.sortValue ? column.sortValue(left) : (left as any)[column.key];
            const b = column.sortValue ? column.sortValue(right) : (right as any)[column.key];
            const comparison = String(a ?? '').localeCompare(String(b ?? ''), 'fr', { numeric: true, sensitivity: 'base' });
            return sort.direction === 'asc' ? comparison : -comparison;
        });
    }, [filteredRows, visibleColumns, sort]);
    const pageCount = Math.max(1, Math.ceil(sortedRows.length / Math.max(1, pageSize)));
    const pagedRows = useMemo(
        () => sortedRows.slice((page - 1) * pageSize, page * pageSize),
        [sortedRows, page, pageSize],
    );

    useEffect(() => {
        setPage(1);
    }, [rows]);

    useEffect(() => {
        setPage(1);
    }, [columnFilters]);

    useEffect(() => {
        if (page > pageCount) setPage(pageCount);
    }, [page, pageCount]);

    const virtualizer = useVirtualizer({
        count: pagedRows.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => density === 'compact' ? 34 : 40,
        overscan: 14,
    });

    function goToPage(next: number) {
        setPage(Math.min(pageCount, Math.max(1, next)));
        parentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }

    const desktopTemplate = [
        ...visibleColumns.map((column) => columnTrack(column)),
        ...(actions ? [`${Math.max(Number.parseInt(actionsWidth, 10) || 128, 128)}px`] : []),
    ].join(' ');

    if (!rows.length) {
        return (
            <div className="tc-card p-6" data-testid="virtual-data-list">
                <div className="mb-4 text-xs font-semibold text-brand-800" data-testid="list-total">
                    {totalLabel ?? '0 enregistrement'}
                </div>
                {empty}
            </div>
        );
    }

    return (
        <div className="tc-card overflow-hidden" data-testid="virtual-data-list">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-brand-100 bg-brand-50/80 px-3 py-2">
                <div className="text-xs font-semibold text-brand-800" data-testid="list-total">
                    {totalLabel ?? `${rows.length} enregistrement${rows.length > 1 ? 's' : ''}`}
                    {Object.values(columnFilters).some((value) => value.trim() !== '') && `, ${filteredRows.length} affiché${filteredRows.length > 1 ? 's' : ''}`}
                </div>
                <div className="flex items-center gap-3"><details className="relative" data-testid="columns-menu"><summary className="flex cursor-pointer list-none items-center gap-1 whitespace-nowrap text-[11px] font-semibold text-brand-700 hover:underline"><Columns3 className="h-3.5 w-3.5" /> Colonnes</summary><div className="absolute right-0 z-30 mt-2 max-h-72 w-56 overflow-auto rounded-xl border border-brand-100 bg-white p-2 shadow-xl">{columns.map((column) => <label key={column.key} className="flex items-center gap-2 rounded-md px-2 py-1 text-[12px] text-slate-700 hover:bg-brand-50"><input type="checkbox" checked={!hiddenColumns.includes(column.key)} onChange={(event) => setHiddenColumns((current) => event.target.checked ? current.filter((key) => key !== column.key) : [...current, column.key])} />{column.label}</label>)}</div></details><button type="button" onClick={() => { const next = density === 'compact' ? 'comfortable' : 'compact'; setDensity(next); window.localStorage.setItem('taname-list-density', next); }} className="whitespace-nowrap text-[11px] font-semibold text-brand-700 hover:underline" data-testid="density-toggle">{density === 'compact' ? 'Densité confortable' : 'Densité compacte'}</button></div>
            </div>

            <div className="overflow-x-auto" data-testid="list-horizontal-scroll">
                <div>
                    <div className="hidden border-b border-brand-100 bg-brand-50/60 px-3 py-2 md:grid" style={{ gridTemplateColumns: desktopTemplate }}>
                        {visibleColumns.map((column, index) => (
                            <div key={column.key} className={cn('min-w-0 overflow-hidden pr-2', index === 0 && 'sticky left-0 z-20 bg-brand-50')}>
                                <button
                                    type="button"
                                    onClick={() => setSort((current) => current?.key === column.key ? { key: column.key, direction: current.direction === 'asc' ? 'desc' : 'asc' } : { key: column.key, direction: 'asc' })}
                                    title={column.label}
                                    className={cn('flex h-4 w-full items-center gap-1 overflow-hidden whitespace-nowrap text-left text-[11px] font-bold uppercase tracking-wide text-brand-800 hover:text-brand-600', column.className)}
                                >
                                    <span className="min-w-0 overflow-hidden text-ellipsis">{column.label}</span>
                                    {sort?.key === column.key ? (sort.direction === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-40" />}
                                </button>
                                {column.filterable !== false && (
                                    <input
                                        aria-label={`Filtrer ${column.label}`}
                                        placeholder="Filtrer"
                                        value={columnFilters[column.key] ?? ''}
                                        onChange={(event) => setColumnFilters((current) => ({ ...current, [column.key]: event.target.value }))}
                                        className="mt-1 h-7 w-full min-w-0 rounded-md border border-brand-100 bg-white px-1.5 text-[11px] font-normal normal-case tracking-normal text-slate-700 outline-none focus:border-brand-400"
                                    />
                                )}
                            </div>
                        ))}
                        {actions && <div className="whitespace-nowrap text-right text-[11px] font-bold uppercase tracking-wider text-brand-800">Actions</div>}
                    </div>

                    <div ref={parentRef} className={cn('overflow-y-auto', heightClass)}>
                        <div style={{ height: `${virtualizer.getTotalSize()}px`, position: 'relative', width: '100%' }}>
                            {virtualizer.getVirtualItems().map((virtualRow) => {
                                const row = pagedRows[virtualRow.index];
                                return (
                                    <div
                                        key={rowKey(row)}
                                        ref={virtualizer.measureElement}
                                        data-index={virtualRow.index}
                                        className="absolute left-0 top-0 w-full"
                                        style={{ transform: `translateY(${virtualRow.start}px)` }}
                                    >
                                        <div className={cn('group relative border-b border-brand-100/70 transition-colors hover:bg-brand-50/70', rowClassName?.(row))} data-testid={`${rowTestId}-container`}>
                                            <a
                                                href={href(row)}
                                                data-testid={rowTestId}
                                                aria-label={`Ouvrir ${rowKey(row)}`}
                                                className="absolute inset-0 z-0 rounded-none focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-500"
                                            />
                                            <div className={cn('pointer-events-none relative z-10 hidden px-3 md:grid md:items-center', density === 'compact' ? 'py-1' : 'py-2')} style={{ gridTemplateColumns: desktopTemplate }}>
                                                {visibleColumns.map((column, index) => (
                                                    <div key={column.key} title={fullCellValue(column, row)} className={cn('min-w-0 overflow-hidden text-ellipsis whitespace-nowrap pr-3 text-[13px] leading-5 text-slate-700', index === 0 && 'sticky left-0 z-10 bg-white group-hover:bg-brand-50', column.className)}>
                                                        {column.render(row)}
                                                    </div>
                                                ))}
                                                {actions && (
                                                    <div className="pointer-events-auto flex flex-nowrap items-center justify-end gap-1 whitespace-nowrap [&_a]:px-1.5 [&_a]:py-1 [&_a]:text-[11px] [&_button]:px-1.5 [&_button]:py-1 [&_button]:text-[11px]" onClick={(event) => event.stopPropagation()}>
                                                        {actions(row)}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="pointer-events-none relative z-10 px-4 py-2.5 md:hidden">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="min-w-0">
                                                        <div className="whitespace-normal break-words text-sm font-bold text-brand-800">{visibleColumns[0]?.render(row)}</div>
                                                        <div className="mt-1 whitespace-normal break-words text-sm leading-5 text-slate-600">{visibleColumns[1]?.render(row)}</div>
                                                        {visibleColumns[2] && <div className="mt-1 text-sm text-slate-600">{visibleColumns[2].render(row)}</div>}
                                                        {visibleColumns.length > 3 && (
                                                            <div className="mt-2 space-y-1 border-t border-brand-100/70 pt-2">
                                                                {visibleColumns.slice(3).map((column) => (
                                                                    <div key={column.key} className="flex items-start justify-between gap-3 text-sm">
                                                                        <span className="shrink-0 text-slate-400">{column.label}</span>
                                                                        <span title={fullCellValue(column, row)} className="min-w-0 break-words text-right text-slate-700">{column.render(row)}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                    {actions && (
                                                        <div className="pointer-events-auto flex shrink-0 flex-nowrap items-center justify-end gap-1 [&_a]:px-1.5 [&_a]:py-1 [&_a]:text-[11px] [&_button]:px-1.5 [&_button]:py-1 [&_button]:text-[11px]" onClick={(event) => event.stopPropagation()}>
                                                            {actions(row)}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            {!sortedRows.length && (
                                <div className="absolute inset-x-0 top-0 px-4 py-8 text-center text-sm text-slate-500">Aucun résultat</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            <div className="sticky bottom-0 flex flex-wrap items-center justify-between gap-2 border-t border-brand-100 bg-white/95 px-3 py-1.5 text-xs font-semibold text-brand-900 backdrop-blur" data-testid="list-sticky-total">
                <span>{totalLabel ?? `${rows.length} enregistrement${rows.length > 1 ? 's' : ''}`}</span>
                <div className="flex flex-wrap items-center gap-2">
                    <span>{sortedRows.length} ligne{sortedRows.length > 1 ? 's' : ''}</span>
                    {pageCount > 1 && (
                        <div className="flex items-center gap-1" data-testid="list-pagination">
                            <button type="button" onClick={() => goToPage(page - 1)} disabled={page <= 1} aria-label="Page précédente" className="rounded border border-brand-100 px-1.5 py-0.5 disabled:cursor-not-allowed disabled:opacity-40">
                                <ChevronLeft className="h-3.5 w-3.5" />
                            </button>
                            <span className="min-w-16 text-center">Page {page} / {pageCount}</span>
                            <button type="button" onClick={() => goToPage(page + 1)} disabled={page >= pageCount} aria-label="Page suivante" className="rounded border border-brand-100 px-1.5 py-0.5 disabled:cursor-not-allowed disabled:opacity-40">
                                <ChevronRight className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}







