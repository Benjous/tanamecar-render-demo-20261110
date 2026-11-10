import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { Plus } from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import { FilterBar } from '@/components/FilterForm';
import { VirtualDataList, type VirtualColumn } from '@/components/VirtualDataList';
import { ConfirmButton, EmptyState, PageHeader } from '@/components/ui';
import { date, dateTime, money, number } from '@/lib/utils';
import type { EntityConfig, EntityField } from '@/types';

function formatCell(field: EntityField, value: any, labels?: Record<string, string>) {
    if (value === null || value === undefined || value === '') return 'Non renseigné';
    if (field.input === 'relation') return labels?.[value] ?? `#${value}`;
    if (field.input === 'checkbox') return value ? 'Oui' : 'Non';
    if (field.input === 'date') return date(value);
    if (field.input === 'datetime') return dateTime(value);
    if (field.input === 'number') return field.type.startsWith('numeric(12') ? money(value) : number(value);
    if (field.input === 'select') return field.options.find((option) => option.value === value)?.label ?? value;
    return String(value);
}

export default function GenericIndex({ entity, rows, filters, relationLabels, summary = [] }: { entity: EntityConfig; rows: any[]; filters: Record<string, string>; relationLabels: Record<string, Record<string, string>>; summary?: Array<{ label: string; value: number; format: string }> }) {
    const [selected, setSelected] = useState<number[]>([]);
    const hidden = new Set(['created_at', 'created_by', 'updated_at', 'data_quality_status', 'import_batch_id', 'legacy_uid', 'legacy_payload']);
    const toggle = (id: number) => setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
    const fields = entity.fields.filter((field) => entity.list.includes(field.name) && !hidden.has(field.name));
    const selectFilters = entity.fields.filter((field) => field.input === 'select' && field.options.length > 0 && !hidden.has(field.name));

    const columns: VirtualColumn<any>[] = fields.map((field) => ({
        key: field.name,
        label: field.label,
        width: field.input === 'relation' ? 'minmax(0, 1.2fr)' : 'minmax(0, 1fr)',
        render: (row) => formatCell(field, row[field.name], relationLabels[field.name]),
    }));

    return (
        <AppLayout>
            <Head title={entity.label} />
            <PageHeader
                title={entity.label}
                
                actions={<Link href={`/data/${entity.key}/create`} className="tc-btn-primary"><Plus className="h-4 w-4" /> Ajouter</Link>}
            />

            {summary.length > 0 && (
                <div className="mb-4 grid gap-3 sm:grid-cols-3">
                    {summary.map((metric) => (
                        <div key={metric.label} className="tc-card p-4">
                            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{metric.label}</div>
                            <div className="mt-1 text-2xl font-black text-brand-900">{metric.format === 'money' ? money(metric.value) : number(metric.value)}</div>
                        </div>
                    ))}
                </div>
            )}

            {selected.length > 0 && <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-brand-100 bg-brand-50 px-4 py-3 text-sm" data-testid="bulk-toolbar"><span className="font-semibold">{selected.length} sélectionné(s)</span><button className="tc-btn-secondary" onClick={() => router.post(`/data/${entity.key}/bulk-duplicate`, { ids: selected }, { onSuccess: () => setSelected([]) })}>Dupliquer</button><button className="tc-btn-secondary" onClick={() => window.print()}>Imprimer</button><button className="text-slate-500" onClick={() => setSelected([])}>Annuler</button></div>}

            <FilterBar action={`/data/${entity.key}`} filters={filters} searchPlaceholder={`Rechercher dans ${entity.label.toLowerCase()}`} resultCount={rows.length}>
                {selectFilters.map((field) => (
                    <select key={field.name} name={field.name} aria-label={field.label} defaultValue={filters[field.name] ?? ''} className="tc-input">
                        <option value="">{field.label} : tous</option>
                        {field.options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                ))}
            </FilterBar>

            <VirtualDataList
                rows={rows}
                columns={columns}
                rowKey={(row) => row.id}
                href={(row) => `/data/${entity.key}/${row.id}`}
                totalLabel={`${rows.length} enregistrements`}
                actionsWidth="190px"
                actions={(row) => (
                    <>
                        <input type="checkbox" aria-label="Sélectionner" checked={selected.includes(row.id)} onChange={() => toggle(row.id)} />
                        <Link href={`/data/${entity.key}/${row.id}`} className="text-xs font-semibold text-brand-700">Voir</Link>
                        <Link href={`/data/${entity.key}/${row.id}/edit`} className="text-xs font-semibold text-slate-500">Modifier</Link>
                        <ConfirmButton label="Supprimer" variant="secondary" onConfirm={() => router.delete(`/data/${entity.key}/${row.id}`)} />
                    </>
                )}
                empty={<EmptyState title="Aucun résultat" action={<Link href={`/data/${entity.key}/create`} className="tc-btn-primary"><Plus className="h-4 w-4" /> Ajouter</Link>} />}
            />
        </AppLayout>
    );
}

