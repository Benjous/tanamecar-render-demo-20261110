import { Head } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { FilterBar } from '@/components/FilterForm';
import { VirtualDataList, type VirtualColumn } from '@/components/VirtualDataList';
import { PageHeader } from '@/components/ui';
import { dateTime } from '@/lib/utils';

type Row = { id: number; action: string; entity_type: string | null; entity_id: number | null; created_at: string; user_name: string | null };

const labels: Record<string, string> = {
    clients: 'Clients', contracts: 'Locations', payments: 'Paiements', invoices: 'Factures', quotes: 'Devis',
    vehicles: 'Voitures', vehicle_installments: 'Traites', vehicle_amortizations: 'Amortissement', roles: 'Rôles', users: 'Utilisateurs',
};
const actionLabels: Record<string, string> = { create: 'Création', update: 'Modification', delete: 'Suppression', return: 'Retour', login: 'Connexion' };

export default function Index({ rows, filters, actions, count }: { rows: Row[]; filters: Record<string, string>; actions: string[]; count: number }) {
    const columns: VirtualColumn<Row>[] = [
        { key: 'created_at', label: 'Date', width: '130px', sortValue: (row) => row.created_at, render: (row) => dateTime(row.created_at) },
        { key: 'user', label: 'Utilisateur', width: '140px', sortValue: (row) => row.user_name ?? '', render: (row) => row.user_name ?? 'Utilisateur inconnu' },
        { key: 'action', label: 'Action', width: '100px', sortValue: (row) => row.action, render: (row) => actionLabels[row.action] ?? row.action },
        { key: 'entity', label: 'Rubrique', width: '140px', sortValue: (row) => row.entity_type ?? '', render: (row) => labels[row.entity_type ?? ''] ?? row.entity_type ?? 'Non renseignée' },
        { key: 'entity_id', label: 'Référence', width: '90px', sortValue: (row) => row.entity_id ?? 0, render: (row) => row.entity_id ?? 'Non renseignée' },
    ];

    return (
        <AppLayout>
            <Head title="Rapport" />
            <PageHeader title="Rapport"  />
            <FilterBar action="/reports" filters={filters} searchPlaceholder="Utilisateur, rubrique, action, référence" resultCount={count}>
                <select name="action" aria-label="Action" defaultValue={filters.action ?? ''} className="tc-input"><option value="">Toutes les actions</option>{actions.map((value) => <option key={value} value={value}>{actionLabels[value] ?? value}</option>)}</select>
                <label className="text-xs text-slate-500">Du<input type="date" aria-label="Date de début" name="from" defaultValue={filters.from ?? ''} className="tc-input mt-1" /></label>
                <label className="text-xs text-slate-500">Au<input type="date" aria-label="Date de fin" name="to" defaultValue={filters.to ?? ''} className="tc-input mt-1" /></label>
            </FilterBar>
            <VirtualDataList rows={rows} columns={columns} rowKey={(row) => row.id} href={() => '/reports'} totalLabel={`${rows.length} opérations`} heightClass="max-h-[calc(100vh-340px)] min-h-[320px]" />
        </AppLayout>
    );
}
