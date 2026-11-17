import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { FilterBar, type LegacyFilterField } from '@/components/FilterForm';
import { VirtualDataList, type VirtualColumn } from '@/components/VirtualDataList';
import { date, dateTime, isoDate, amount, number } from '@/lib/utils';
import type { EntityConfig, EntityField } from '@/types';

type Extra = { phone?: string | null; address?: string | null };

function formatCell(field: EntityField, value: any, labels?: Record<string, string>) {
    if (value === null || value === undefined || value === '') return '';
    if (field.input === 'relation') return labels?.[value] ?? `#${value}`;
    if (field.input === 'checkbox') return value ? 'Oui' : 'Non';
    if (field.input === 'date') return date(value);
    if (field.input === 'datetime') return dateTime(value);
    if (field.input === 'number') return field.type.startsWith('numeric(12') ? amount(value) : number(value);
    if (field.input === 'select') return field.options.find((option) => option.value === value)?.label ?? value;
    return String(value);
}

function timeOf(value: string | null | undefined): string {
    if (!value) return '';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return '';
    return new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(parsed);
}

function legacyColumns(
    entity: EntityConfig,
    rows: any[],
    relationLabels: Record<string, Record<string, string>>,
    relationDetails: Record<string, Record<string, Extra>>,
): VirtualColumn<any>[] | null {
    const labels = (key: string, row: any) => relationLabels[key]?.[row[key]] ?? '';
    const extra = (key: string, row: any) => relationDetails[key]?.[row[key]] ?? {};

    switch (entity.key) {
        case 'slv_reservations':
            return [
                { key: 'departure_at', label: 'DATE', width: '130px', render: (row) => isoDate(row.departure_at) },
                { key: 'heure', label: 'HEURE', width: '70px', render: (row) => timeOf(row.departure_at) },
                { key: 'client_id', label: 'NOM & PRENOM', render: (row) => labels('client_id', row) },
                { key: 'tel', label: 'Tél.', width: '130px', render: (row) => extra('client_id', row).phone ?? '' },
                { key: 'description', label: 'LIEU LIVRAISON', render: (row) => row.description ?? '' },
                { key: 'total_amount', label: 'MONTANT', width: '110px', render: (row) => amount(row.total_amount) },
                { key: 'days', label: 'NOMBRE JOUR', width: '100px', render: (row) => number(row.days ?? 0) },
            ];
        case 'agenda':
            return [
                { key: 'event_date', label: 'DATE', width: '140px', render: (row) => isoDate(row.event_date) },
                { key: 'start_time', label: 'HEURE', width: '90px', render: (row) => row.start_time ?? '' },
                { key: 'subject', label: 'OBJET', render: (row) => row.subject ?? '' },
            ];
        case 'charges':
            return [
                { key: 'amount', label: 'MONTANT', width: '110px', render: (row) => amount(row.amount) },
                { key: 'vat', label: 'TVA', width: '90px', render: (row) => amount(row.vat) },
                { key: 'charge_date', label: 'DATE', width: '120px', render: (row) => isoDate(row.charge_date) },
                { key: 'description', label: 'DESCRIPTION', render: (row) => row.description ?? '' },
                { key: 'destination', label: 'DESTINÉ À', width: '170px', render: (row) => row.destination ?? '' },
            ];
        case 'client_credits':
            return [
                { key: 'client_id', label: 'NOM & PRENOM', render: (row) => labels('client_id', row) },
                { key: 'phone', label: 'TELEPHONE', width: '140px', render: (row) => extra('client_id', row).phone ?? '' },
                { key: 'address', label: 'ADRESSE', render: (row) => extra('client_id', row).address ?? '' },
                { key: 'advance', label: 'AVANCE', width: '100px', render: (row) => amount(row.advance) },
                { key: 'remaining', label: 'RESTE', width: '100px', render: (row) => amount(row.remaining) },
            ];
        case 'profit_entries':
            return [
                { key: 'description', label: 'DESCRIPTION', render: (row) => row.description ?? '' },
                { key: 'source', label: 'EXTRAITE DE', width: '220px', render: (row) => row.source ?? '' },
                { key: 'amount', label: 'MONTANT', width: '120px', render: (row) => amount(row.amount) },
            ];
        case 'incidents':
            return [
                { key: 'vehicle_id', label: 'VOITURE', width: '220px', render: (row) => labels('vehicle_id', row) },
                { key: 'client_id', label: 'SINISTRE PAR', render: (row) => labels('client_id', row) },
                { key: 'incident_date', label: 'DATE DE SINISTRE', width: '140px', render: (row) => isoDate(row.incident_date) },
            ];
        case 'slv_type_maintenance':
            return [
                { key: 'name', label: 'OPTION', render: (row) => row.name ?? '' },
                { key: 'type', label: 'TYPE', width: '120px', render: (row) => (row.km_interval ? 'km' : 'date') },
            ];
        case 'slv_categories':
            return [{ key: 'name', label: 'CATEGORIE', render: (row) => row.name ?? '' }];
        case 'slv_sources':
            return [{ key: 'name', label: 'SOURCE', render: (row) => row.name ?? '' }];
        default:
            return null;
    }
}

export default function GenericIndex({ entity, rows, filters, relationLabels = {}, relationDetails = {} }: { entity: EntityConfig; rows: any[]; filters: Record<string, string>; relationLabels?: Record<string, Record<string, string>>; relationDetails?: Record<string, Record<string, Extra>> }) {
    const hidden = new Set(['created_at', 'created_by', 'updated_at', 'data_quality_status', 'import_batch_id', 'legacy_uid', 'legacy_payload']);
    const fallbackFields = entity.fields.filter((field) => (entity.list.includes(field.name) || entity.list.length === 0) && !hidden.has(field.name));
    const fallbackColumns: VirtualColumn<any>[] = fallbackFields.map((field) => ({
        key: field.name,
        label: field.label.toUpperCase(),
        render: (row) => formatCell(field, row[field.name], relationLabels[field.name]),
    }));
    const columns = legacyColumns(entity, rows, relationLabels, relationDetails) ?? fallbackColumns;

    const searchFields: Record<string, LegacyFilterField[]> = {
        slv_reservations: [
            { name: 'date', label: 'Date (aaaa-mm-jj)' },
            { name: 'heure', label: 'Heure' },
            { name: 'nom', label: 'Nom' },
            { name: 'prenom', label: 'Prénom' },
            { name: 'ordre', label: 'Ordre', options: [
                { value: '', label: 'Tous' },
                { value: '1', label: 'Dépassé' },
                { value: '2', label: "Aujourd'hui" },
                { value: '3', label: "Aujourd'hui et après" },
            ] },
        ],
        agenda: [
            { name: 'date', label: 'Date (aaaa-mm-jj)' },
            { name: 'heure', label: 'Heure' },
            { name: 'objet', label: 'Objet' },
            { name: 'ordre', label: 'Ordre', options: [
                { value: '', label: 'Tous' },
                { value: '1', label: 'Dépassé' },
                { value: '2', label: "Aujourd'hui" },
                { value: '3', label: "Après aujourd'hui" },
            ] },
        ],
        charges: [
            { name: 'destine', label: 'Destiné à' },
            { name: 'description', label: 'Description' },
        ],
        client_credits: [
            { name: 'nom', label: 'Nom' },
            { name: 'prenom', label: 'Prénom' },
            { name: 'tel', label: 'Tél.' },
            { name: 'adresse', label: 'Adresse' },
        ],
        slv_type_maintenance: [
            { name: 'option', label: 'Option' },
            { name: 'type', label: 'Type' },
        ],
        incidents: [
            { name: 'locat', label: 'Sinistre par' },
            { name: 'date', label: 'Date (aaaa-mm-jj)' },
        ],
    };

    return (
        <AppLayout>
            <Head title={entity.label} />

            <FilterBar
                action={`/data/${entity.key}`}
                filters={filters}
                fields={searchFields[entity.key] ?? [{ name: 'q', label: 'Rechercher' }]}
            />

            <VirtualDataList
                rows={rows}
                columns={columns}
                rowKey={(row) => row.id}
                href={(row) => `/data/${entity.key}/${row.id}`}
                totalLabel={`${rows.length} enregistrements`}
                onDeleteSelected={(ids) => {
                    if (!window.confirm('Voulez vous vraiment supprimer?')) return;
                    ids.forEach((id) => router.delete(`/data/${entity.key}/${id}`, { preserveScroll: true }));
                }}
                actions={(row) => <Link href={`/data/${entity.key}/${row.id}/edit`} className="al-link-modifier">Modifier</Link>}
                empty="Aucun résultat"
            />
        </AppLayout>
    );
}
