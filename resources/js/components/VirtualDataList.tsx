import { router } from '@inertiajs/react';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
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

function fullCellValue<T>(column: VirtualColumn<T>, row: T): string | undefined {
    const value = column.sortValue ? column.sortValue(row) : (row as any)[column.key];
    if (value === null || value === undefined || value === '') return undefined;
    return String(value);
}

const LABEL_FIXES: Record<string, string> = {
    'NOM & PRENOM': 'NOM & PRÉNOM',
    TELEPHONE: 'TÉLÉPHONE',
    CATEGORIE: 'CATÉGORIE',
    MATRECULE: 'MATRICULE',
    BENEFICE: 'BÉNÉFICE',
    CREDIT: 'CRÉDIT',
    ECHEANCE: 'ÉCHÉANCE',
    ETAT: 'ÉTAT',
    REALISATION: 'RÉALISATION',
    VEHICULE: 'VÉHICULE',
    IMMATRICULE: 'IMMATRICULATION',
    SOCIETE: 'SOCIÉTÉ',
    'NOMBRE DE JOUR': 'NOMBRE DE JOURS',
    'FRAIS RÉEL': 'FRAIS RÉELS',
    'EXTRAITE DE': 'EXTRAIT DE',
    'TRAITE PAYÉS': 'TRAITES PAYÉES',
    'TRAITE RESTÉS': 'TRAITES RESTÉES',
};

function displayLabel(label: string): string {
    return LABEL_FIXES[label.toUpperCase()] ?? label;
}

/**
 * Tableau de liste au format reference :
 * bordure grise, en-tete bleu clair, lignes de 24 px, alternance blanc/gris.
 */
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
    defaultHidden = [],
    pageSize = 5000,
    selectable = true,
    onDeleteSelected,
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
    selectable?: boolean;
    onDeleteSelected?: (ids: Array<string | number>) => void;
    bulkActions?: (selected: Array<string | number>, clear: () => void) => ReactNode;
}) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [sort, setSort] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
    const [selected, setSelected] = useState<Set<string | number>>(new Set());
    const visibleColumns = columns.filter((column) => !defaultHidden.includes(column.key));
    const scrollKey = `taname-list-scroll:${window.location.pathname}`;

    useEffect(() => {
        const element = scrollRef.current;
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

    useEffect(() => {
        const handler = () => {
            if (!selected.size) {
                window.alert('vous devez choisir au moins un element!');
                return;
            }
            if (onDeleteSelected) {
                onDeleteSelected([...selected]);
                setSelected(new Set());
                return;
            }
            window.alert('La suppression est disponible depuis la fiche de cette ligne.');
        };
        window.addEventListener('taname:workspace-delete', handler);
        return () => window.removeEventListener('taname:workspace-delete', handler);
    }, [selected, onDeleteSelected]);

    useEffect(() => {
        setSelected((current) => {
            const valid = new Set([...current].filter((id) => rows.some((row) => rowKey(row) === id)));
            return valid.size === current.size ? current : valid;
        });
    }, [rows, rowKey]);

    const sortedRows = useMemo(() => {
        if (!sort) return rows;
        const column = visibleColumns.find((item) => item.key === sort.key);
        if (!column) return rows;
        return [...rows].sort((left, right) => {
            const a = column.sortValue ? column.sortValue(left) : (left as any)[column.key];
            const b = column.sortValue ? column.sortValue(right) : (right as any)[column.key];
            const comparison = String(a ?? '').localeCompare(String(b ?? ''), 'fr', { numeric: true, sensitivity: 'base' });
            return sort.direction === 'asc' ? comparison : -comparison;
        });
    }, [rows, visibleColumns, sort]);

    const pagedRows = sortedRows.slice(0, pageSize);

    function toggleRow(id: string | number) {
        setSelected((current) => {
            const next = new Set(current);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    }

    function toggleAll() {
        setSelected((current) => current.size === pagedRows.length ? new Set() : new Set(pagedRows.map(rowKey)));
    }

    function openRow(event: React.MouseEvent | React.KeyboardEvent, row: T) {
        const target = event.target as HTMLElement;
        if (target.closest('input,button,a,select,textarea,label')) return;
        router.visit(href(row));
    }

    return (
        <div data-testid="virtual-data-list">
            <div ref={scrollRef} className="al-table-scroll">
                <table className={cn('al-data-table', 'al-data-table-labeled', visibleColumns.length >= 6 && 'al-data-table-wide')}>
                    <thead>
                        <tr>
                            {selectable && (
                                <td className="al-check-cell">
                                    <input
                                        type="checkbox"
                                        aria-label="Sélectionner toute la page"
                                        checked={pagedRows.length > 0 && selected.size === pagedRows.length}
                                        onChange={toggleAll}
                                    />
                                </td>
                            )}
                            {visibleColumns.map((column) => (
                                <td
                                    key={column.key}
                                    style={column.width && /^\d+px$/.test(column.width) ? { width: column.width } : undefined}
                                    onClick={() => setSort((current) => current?.key === column.key ? { key: column.key, direction: current.direction === 'asc' ? 'desc' : 'asc' } : { key: column.key, direction: 'asc' })}
                                    title={column.label}
                                    className={cn('al-sortable-head', column.className)}
                                >
                                    {displayLabel(column.label)}
                                </td>
                            ))}
                            {actions && <td className="al-action-cell" />}
                        </tr>
                    </thead>
                    <tbody>
                        {pagedRows.map((row, index) => {
                            const id = rowKey(row);
                            const isSelected = selected.has(id);
                            return (
                                <tr
                                    key={id}
                                    className={cn('txt_Standard2', isSelected && 'al-row-selected', rowClassName?.(row))}
                                    onClick={(event) => openRow(event, row)}
                                    onKeyDown={(event) => {
                                        if (event.key === 'Enter') openRow(event, row);
                                    }}
                                    tabIndex={0}
                                    data-testid={`${rowTestId}-container`}
                                >
                                    {selectable && (
                                        <td className="al-check-cell">
                                            <input
                                                type="checkbox"
                                                name="selectLine"
                                                aria-label={`Sélectionner ${id}`}
                                                checked={isSelected}
                                                onChange={() => toggleRow(id)}
                                                onClick={(event) => event.stopPropagation()}
                                            />
                                        </td>
                                    )}
                                    {visibleColumns.map((column) => {
                                        const isMoney = /amount|montant|total|prix|paid|paye|remaining|reste|avance|credit|solde|benefice|profit|frais|tva|revenue|revenu/i.test(`${column.key} ${column.label}`);
                                        return (
                                            <td
                                                key={column.key}
                                                title={fullCellValue(column, row)}
                                                data-label={displayLabel(column.label)}
                                                className={cn(
                                                    isMoney && 'al-money-cell',
                                                    column.className,
                                                    !isMoney && 'al-wrap-cell',
                                                )}
                                            >
                                                {column.render(row)}
                                            </td>
                                        );
                                    })}
                                    {actions && (
                                        <td className="al-action-cell" onClick={(event) => event.stopPropagation()}>
                                            {actions(row)}
                                        </td>
                                    )}
                                </tr>
                            );
                        })}
                        {!pagedRows.length && (
                            <tr className="al-empty-row">
                                <td colSpan={visibleColumns.length + (selectable ? 1 : 0) + (actions ? 1 : 0)}>
                                    {empty ?? 'Aucun résultat'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            <span className="sr-only" data-testid="list-total">{totalLabel ?? `${rows.length} enregistrements`}</span>
        </div>
    );
}
