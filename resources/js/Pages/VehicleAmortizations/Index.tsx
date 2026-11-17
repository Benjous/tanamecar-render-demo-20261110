import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { FilterBar } from '@/components/FilterForm';
import { VirtualDataList, type VirtualColumn } from '@/components/VirtualDataList';
import { amount } from '@/lib/utils';

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
    row_number?: number;
};

const value = (row: Row, key: keyof Row) => Number(row[key] ?? 0);

export default function Index({ amortizations, filters }: { amortizations: Array<Row & { row_number?: number }>; filters: Record<string, string>; totals: Record<string, number>; counts: Record<string, number> }) {
    const rows = amortizations.map((row, index) => ({ ...row, row_number: index + 1 }));
    const columns: VirtualColumn<Row & { row_number?: number }>[] = [
        { key: 'row_number', label: 'N°', width: '50px', sortValue: (row) => row.row_number ?? 0, render: (row) => row.row_number },
        { key: 'vehicle', label: 'VEHICULE', width: '200px', sortValue: (row) => row.vehicle?.display_name ?? row.source_vehicle_name, render: (row) => row.vehicle?.display_name ?? row.source_vehicle_name },
        { key: 'plate', label: 'IMMATRICULE', width: '220px', sortValue: (row) => row.vehicle?.plate_number ?? row.source_plate ?? '', render: (row) => row.vehicle?.plate_number ?? row.source_plate ?? '' },
        { key: 'revenue', label: 'REVENU', width: '90px', sortValue: (row) => value(row, 'revenue_current') || value(row, 'revenue_recorded'), render: (row) => amount(row.revenue_current ?? row.revenue_recorded) },
        { key: 'credit', label: 'CREDIT', width: '90px', sortValue: (row) => value(row, 'credit_current') || value(row, 'credit_recorded'), render: (row) => amount(row.credit_current ?? row.credit_recorded) },
        { key: 'balance', label: 'SOLDE', width: '90px', sortValue: (row) => value(row, 'balance_current') || value(row, 'balance_recorded'), render: (row) => amount(row.balance_current ?? row.balance_recorded) },
        { key: 'objective', label: 'OBJECTIF', width: '85px', sortValue: (row) => value(row, 'objective_recorded'), render: (row) => row.objective_recorded ?? '' },
        { key: 'price_per_km', label: 'PRIX / KM', width: '85px', sortValue: (row) => value(row, 'price_per_km_recorded'), render: (row) => row.price_per_km_recorded ?? '' },
        { key: 'price', label: 'PRIX', width: '90px', sortValue: (row) => value(row, 'price_recorded'), render: (row) => amount(row.price_recorded) },
        { key: 'real_cost', label: 'FRAIS RÉEL', width: '90px', sortValue: (row) => value(row, 'real_cost_recorded'), render: (row) => amount(row.real_cost_recorded) },
        { key: 'remaining', label: 'RESTE', width: '90px', sortValue: (row) => value(row, 'remaining_recorded'), render: (row) => amount(row.remaining_recorded) },
        { key: 'net_remaining', label: 'RESTE NET', width: '90px', sortValue: (row) => value(row, 'net_remaining_recorded'), render: (row) => amount(row.net_remaining_recorded) },
    ];

    return (
        <AppLayout>
            <Head title="Tableau d'amortissement" />
            <FilterBar
                action="/vehicle-amortizations"
                filters={filters}
                fields={[
                    { name: 'q', label: 'Voiture' },
                    { name: 'match', label: 'Rapprochement', options: [
                        { value: '', label: 'Tous' },
                        { value: 'matched', label: 'Rapprochées' },
                        { value: 'unmatched', label: 'Non rapprochées' },
                    ] },
                ]}
            />
            <VirtualDataList
                rows={rows}
                columns={columns}
                rowKey={(row) => row.id}
                href={(row) => `/vehicle-amortizations/${row.id}`}
                totalLabel={`${rows.length} fiches d'amortissement`}
                actions={(row) => <Link href={`/vehicle-amortizations/${row.id}`} className="al-link-modifier">Modifier</Link>}
                empty="Aucun résultat"
            />
        </AppLayout>
    );
}
