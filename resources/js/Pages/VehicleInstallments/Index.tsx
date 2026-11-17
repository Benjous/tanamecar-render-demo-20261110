import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { FilterBar } from '@/components/FilterForm';
import { VirtualDataList, type VirtualColumn } from '@/components/VirtualDataList';
import { amount, number } from '@/lib/utils';

type Vehicle = { id: number; display_name: string; plate_number: string | null; purchase_price?: string | null; credit_down_payment?: string | null };
type Summary = {
    id: number;
    vehicle_id: number | null;
    source_vehicle_name: string;
    source_plate: string | null;
    credit_house: string | null;
    monthly_amount_recorded: string | null;
    total_months_recorded: number | null;
    paid_months_recorded: number | null;
    remaining_months_recorded: number | null;
    total_amount_recorded: string | null;
    paid_amount_recorded: string | null;
    remaining_amount_recorded: string | null;
    vehicle: Vehicle | null;
};

export default function Index({ summaries, filters }: { summaries: Summary[]; filters: Record<string, string> }) {
    const summaryView = filters.view === 'summary';

    const traiteColumns: VirtualColumn<Summary>[] = [
        { key: 'vehicle', label: 'VOITURE', width: '240px', sortValue: (row) => row.vehicle?.display_name ?? row.source_vehicle_name, render: (row) => row.vehicle?.display_name ?? row.source_vehicle_name },
        { key: 'plate', label: 'MATRICULE', width: '230px', sortValue: (row) => row.vehicle?.plate_number ?? row.source_plate ?? '', render: (row) => row.vehicle?.plate_number ?? row.source_plate ?? '' },
        { key: 'price', label: 'PRIX', width: '110px', sortValue: (row) => Number(row.total_amount_recorded ?? 0), render: (row) => amount(row.total_amount_recorded) },
        { key: 'advance', label: 'AVANCE', width: '100px', sortValue: (row) => Number(row.paid_amount_recorded ?? 0), render: (row) => amount(row.paid_amount_recorded) },
        { key: 'total', label: 'TOTAL TRAITE', width: '120px', sortValue: (row) => Number(row.total_amount_recorded ?? 0), render: (row) => amount(row.total_amount_recorded) },
        { key: 'remaining', label: 'RESTE', width: '100px', sortValue: (row) => Number(row.remaining_amount_recorded ?? 0), render: (row) => amount(row.remaining_amount_recorded) },
        { key: 'net', label: 'RESTE NET', width: '100px', sortValue: (row) => Number(row.remaining_amount_recorded ?? 0), render: (row) => amount(row.remaining_amount_recorded) },
    ];

    const traite2Columns: VirtualColumn<Summary>[] = [
        { key: 'vehicle', label: 'VOITURE', width: '220px', sortValue: (row) => row.vehicle?.display_name ?? row.source_vehicle_name, render: (row) => row.vehicle?.display_name ?? row.source_vehicle_name },
        { key: 'plate', label: 'MATRICULE', width: '210px', sortValue: (row) => row.vehicle?.plate_number ?? row.source_plate ?? '', render: (row) => row.vehicle?.plate_number ?? row.source_plate ?? '' },
        { key: 'house', label: 'MAISON DE CRÉDIT', width: '120px', sortValue: (row) => row.credit_house ?? '', render: (row) => row.credit_house ?? '' },
        { key: 'monthly', label: 'TRAITE / MOIS', width: '100px', sortValue: (row) => Number(row.monthly_amount_recorded ?? 0), render: (row) => amount(row.monthly_amount_recorded) },
        { key: 'months', label: 'TOTAL MOIS', width: '80px', sortValue: (row) => Number(row.total_months_recorded ?? 0), render: (row) => number(row.total_months_recorded ?? 0) },
        { key: 'paid_months', label: 'MOIS PAYÉS', width: '80px', sortValue: (row) => Number(row.paid_months_recorded ?? 0), render: (row) => number(row.paid_months_recorded ?? 0) },
        { key: 'remaining_months', label: 'MOIS RESTÉS', width: '80px', sortValue: (row) => Number(row.remaining_months_recorded ?? 0), render: (row) => number(row.remaining_months_recorded ?? 0) },
        { key: 'total', label: 'TOTAL TRAITE', width: '110px', sortValue: (row) => Number(row.total_amount_recorded ?? 0), render: (row) => amount(row.total_amount_recorded) },
        { key: 'paid', label: 'TRAITE PAYÉS', width: '110px', sortValue: (row) => Number(row.paid_amount_recorded ?? 0), render: (row) => amount(row.paid_amount_recorded) },
        { key: 'remaining', label: 'TRAITE RESTÉS', width: '110px', sortValue: (row) => Number(row.remaining_amount_recorded ?? 0), render: (row) => amount(row.remaining_amount_recorded) },
    ];

    return (
        <AppLayout>
            <Head title={summaryView ? 'Traite 2' : 'Traite'} />

            <FilterBar
                action="/vehicle-installments"
                filters={filters}
                fields={[
                    { name: 'destine', label: 'Destiné à' },
                    { name: 'matr', label: 'Matricule' },
                    { name: 'maison', label: 'Maison de crédit' },
                ]}
            >
                {summaryView ? <input type="hidden" name="view" value="summary" /> : null}
            </FilterBar>

            <VirtualDataList
                rows={summaries}
                columns={summaryView ? traite2Columns : traiteColumns}
                rowKey={(row) => row.id}
                href={(row) => `/vehicle-installment-summaries/${row.id}`}
                totalLabel={`${summaries.length} traites`}
                actions={(row) => <Link href={`/vehicle-installment-summaries/${row.id}`} className="al-link-modifier">Modifier</Link>}
                empty="Aucun résultat"
            />
        </AppLayout>
    );
}
