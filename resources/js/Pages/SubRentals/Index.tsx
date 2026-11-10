import { Head } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { FilterBar } from '@/components/FilterForm';
import { VirtualDataList, type VirtualColumn } from '@/components/VirtualDataList';
import { PageHeader } from '@/components/ui';
import { money } from '@/lib/utils';

type Row = Record<string, any> & { id: number; source_id: number; company: string | null; vehicle_name: string; client_name: string | null; vehicle: any; total_recorded: string | null; price_recorded: string | null; profit_recorded: string | null; advance_recorded: string | null; credit_recorded: string | null; match_status: string };

export default function Index({ rows, filters, totals, documentedGap, counts }: { rows: Row[]; filters: Record<string, string>; totals: Record<string, number>; documentedGap: number; counts: Record<string, number> }) {
    const columns: VirtualColumn<Row>[] = [
        { key: 'vehicle', label: 'Voiture', width: 'minmax(140px, 1.2fr)', sortValue: (row) => [row.vehicle?.display_name ?? row.vehicle_name, row.vehicle?.plate_number ?? row.company].filter(Boolean).join(' - '), render: (row) => <span>{[row.vehicle?.display_name ?? row.vehicle_name, row.vehicle?.plate_number ?? row.company].filter(Boolean).join(' - ')}</span> },
        { key: 'client', label: 'Client enregistré', width: 'minmax(110px, 1fr)', sortValue: (row) => row.client_name ?? '', render: (row) => row.client_name ?? 'Non renseigné' },
        { key: 'days', label: 'Jours', width: '60px', sortValue: (row) => Number(row.days_recorded ?? 0), render: (row) => row.days_recorded ?? 'Non renseigné' },
        { key: 'rate', label: 'Prix / jour', width: '75px', sortValue: (row) => Number(row.rate_recorded ?? 0), render: (row) => money(row.rate_recorded) },
        { key: 'total', label: 'Total', width: '85px', sortValue: (row) => Number(row.total_recorded ?? 0), render: (row) => money(row.total_recorded) },
        { key: 'price', label: 'Prix', width: '85px', sortValue: (row) => Number(row.price_recorded ?? 0), render: (row) => money(row.price_recorded) },
        { key: 'profit', label: 'Bénéfice', width: '85px', sortValue: (row) => Number(row.profit_recorded ?? 0), render: (row) => money(row.profit_recorded) },
        { key: 'advance', label: 'Avance', width: '85px', sortValue: (row) => Number(row.advance_recorded ?? 0), render: (row) => money(row.advance_recorded) },
        { key: 'credit', label: 'Crédit', width: '85px', sortValue: (row) => Number(row.credit_recorded ?? 0), render: (row) => money(row.credit_recorded) },
    ];
    return (
        <AppLayout>
            <Head title="Sous-location" />
            <PageHeader title="Sous-location"  />
            <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                <div className="tc-card p-3"><div className="text-xs text-slate-500">Total enregistré</div><div className="font-bold">{money(totals.total)}</div></div>
                <div className="tc-card p-3"><div className="text-xs text-slate-500">Prix</div><div className="font-bold">{money(totals.price)}</div></div>
                <div className="tc-card p-3"><div className="text-xs text-slate-500">Bénéfice</div><div className="font-bold">{money(totals.profit)}</div></div>
                <div className="tc-card p-3"><div className="text-xs text-slate-500">Avance</div><div className="font-bold">{money(totals.advance)}</div></div>
                <div className="tc-card p-3"><div className="text-xs text-slate-500">Crédit</div><div className="font-bold">{money(totals.credit)}</div></div>
            </div>
            <FilterBar action="/sub-rentals" filters={filters} searchPlaceholder="Voiture, client, société, plaque, montant" resultCount={rows.length}>
                <select name="match" aria-label="Rapprochement" defaultValue={filters.match ?? ''} className="tc-input"><option value="">Tous les rapprochements</option><option value="matched">Rapprochées</option><option value="unmatched">Non rapprochées</option></select>
            </FilterBar>
            <VirtualDataList rows={rows} columns={columns} rowKey={(row) => row.id} href={(row) => `/sub-rentals/${row.id}`} totalLabel={`${rows.length} lignes de sous-location`} heightClass="max-h-[calc(100vh-360px)] min-h-[320px]" />
        </AppLayout>
    );
}
