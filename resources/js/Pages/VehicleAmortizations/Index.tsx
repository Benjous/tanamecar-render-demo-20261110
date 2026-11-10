import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { FilterBar } from '@/components/FilterForm';
import { VirtualDataList, type VirtualColumn } from '@/components/VirtualDataList';
import { PageHeader } from '@/components/ui';
import { money } from '@/lib/utils';

type Row = {
    id: number;
    source_credit_id: number;
    source_vehicle_name: string;
    source_plate: string | null;
    vehicle: { display_name: string; plate_number: string | null } | null;
    match_status: string;
    revenue_recorded: string | null;
    credit_recorded: string | null;
    balance_recorded: string | null;
    objective_recorded: string | null;
    price_per_km_recorded: string | null;
    price_recorded: string | null;
    real_cost_recorded: string | null;
    remaining_recorded: string | null;
    net_remaining_recorded: string | null;
    revenue_current: string | null;
    credit_current: string | null;
    balance_current: string | null;
};

const value = (row: Row, key: keyof Row) => Number(row[key] ?? 0);

export default function Index({ amortizations, filters, totals, counts }: { amortizations: Row[]; filters: Record<string, string>; totals: Record<string, number>; counts: Record<string, number> }) {
    const columns: VirtualColumn<Row>[] = [
        { key: 'vehicle', label: 'Voiture', width: 'minmax(100px, 1fr)', sortValue: (row) => [row.vehicle?.display_name ?? row.source_vehicle_name, row.vehicle?.plate_number ?? row.source_plate].filter(Boolean).join(' - '), render: (row) => <span className="font-semibold text-brand-800">{[row.vehicle?.display_name ?? row.source_vehicle_name, row.vehicle?.plate_number ?? row.source_plate].filter(Boolean).join(' - ')}</span> },
        { key: 'revenue', label: 'Revenu', width: '65px', sortValue: (row) => value(row, 'revenue_current') || value(row, 'revenue_recorded'), render: (row) => money(row.revenue_current ?? row.revenue_recorded) },
        { key: 'credit', label: 'Crédit', width: '65px', sortValue: (row) => value(row, 'credit_current') || value(row, 'credit_recorded'), render: (row) => money(row.credit_current ?? row.credit_recorded) },
        { key: 'balance', label: 'Solde', width: '65px', sortValue: (row) => value(row, 'balance_current') || value(row, 'balance_recorded'), render: (row) => money(row.balance_current ?? row.balance_recorded) },
        { key: 'objective', label: 'Objectif', width: '65px', sortValue: (row) => value(row, 'objective_recorded'), render: (row) => row.objective_recorded ?? 'Non renseigné' },
        { key: 'price_per_km', label: 'Prix / km', width: '65px', sortValue: (row) => value(row, 'price_per_km_recorded'), render: (row) => row.price_per_km_recorded ?? 'Non renseigné' },
        { key: 'price', label: 'Prix', width: '65px', sortValue: (row) => value(row, 'price_recorded'), render: (row) => money(row.price_recorded) },
        { key: 'real_cost', label: 'Frais réel', width: '65px', sortValue: (row) => value(row, 'real_cost_recorded'), render: (row) => money(row.real_cost_recorded) },
        { key: 'remaining', label: 'Reste', width: '65px', sortValue: (row) => value(row, 'remaining_recorded'), render: (row) => money(row.remaining_recorded) },
        { key: 'net_remaining', label: 'Reste net', width: '65px', sortValue: (row) => value(row, 'net_remaining_recorded'), render: (row) => money(row.net_remaining_recorded) },
        { key: 'match', label: 'Rapprochement', width: '90px', sortValue: (row) => row.match_status, render: (row) => <span className={`rounded-full px-2 py-1 text-xs ${row.match_status === 'matched' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>{row.match_status === 'matched' ? 'Rapprochée' : 'Non rapprochée'}</span> },
    ];

    return (
        <AppLayout>
            <Head title="Tableau d’amortissement" />
            <PageHeader title="Tableau d’amortissement"  actions={<Link href="/vehicle-installments" className="tc-btn-secondary">Voir les traites</Link>} />
            <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
                <div className="tc-card p-3"><div className="text-xs text-slate-500">Fiches</div><div className="text-lg font-bold">{counts.total}</div></div>
                <div className="tc-card p-3"><div className="text-xs text-slate-500">Rapprochées</div><div className="text-lg font-bold">{counts.matched}</div></div>
                <div className="tc-card p-3"><div className="text-xs text-slate-500">Non rapprochées</div><div className="text-lg font-bold">{counts.unmatched}</div></div>
                <div className="tc-card p-3"><div className="text-xs text-slate-500">Revenu total</div><div className="text-sm font-bold">{money(totals.revenue)}</div></div>
                <div className="tc-card p-3"><div className="text-xs text-slate-500">Crédit total</div><div className="text-sm font-bold">{money(totals.credit)}</div></div>
                <div className="tc-card p-3"><div className="text-xs text-slate-500">Prix total</div><div className="text-sm font-bold">{money(totals.price)}</div></div>
            </div>
            <FilterBar action="/vehicle-amortizations" filters={filters} searchPlaceholder="Voiture, matricule, montant" resultCount={amortizations.length}>
                <select name="match" aria-label="Rapprochement" defaultValue={filters.match ?? ''} className="tc-input"><option value="">Tous les rapprochements</option><option value="matched">Rapprochées</option><option value="unmatched">Non rapprochées</option></select>
            </FilterBar>
            <VirtualDataList rows={amortizations} columns={columns} defaultHidden={['price_per_km', 'real_cost', 'net_remaining']} rowKey={(row) => row.id} href={(row) => `/vehicle-amortizations/${row.id}`} totalLabel={`${amortizations.length} fiches d’amortissement`} heightClass="max-h-[calc(100vh-340px)] min-h-[320px]" />
        </AppLayout>
    );
}




