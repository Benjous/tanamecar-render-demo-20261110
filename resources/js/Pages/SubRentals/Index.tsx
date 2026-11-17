import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { FilterBar } from '@/components/FilterForm';
import { VirtualDataList, type VirtualColumn } from '@/components/VirtualDataList';
import { amount, isoDate } from '@/lib/utils';

type Row = {
    id: number;
    vehicle_name: string;
    plate_number: string;
    company: string | null;
    status: string;
    operating_mode: string;
    daily_rate: string | number | null;
    km: string | number | null;
    brand: string | null;
    model: string | null;
    category: string | null;
    contract_reference: string | null;
    client_name: string | null;
    return_at: string | null;
};

const statusLabels: Record<string, string> = {
    disponible: 'Disponible',
    en_location: 'En location',
    en_reparation: 'Entretien',
    hors_service: 'Hors service',
};

export default function Index({ rows, filters }: { rows: Row[]; filters: Record<string, string>; counts: { total: number; in_contract: number } }) {
    const columns: VirtualColumn<Row>[] = [
        { key: 'id', label: 'N°', width: '50px', sortValue: (row) => row.id, render: (row) => row.id },
        { key: 'vehicle', label: 'VOITURE', width: '220px', sortValue: (row) => `${row.vehicle_name} ${row.plate_number}`, render: (row) => `${row.vehicle_name} · ${row.plate_number}` },
        { key: 'company', label: 'SOCIÉTÉ', width: '120px', sortValue: (row) => row.company ?? '', render: (row) => row.company ?? 'Non renseigné' },
        { key: 'category', label: 'CATÉGORIE', width: '100px', sortValue: (row) => row.category ?? '', render: (row) => row.category ?? '-' },
        { key: 'status', label: 'STATUT', width: '100px', sortValue: (row) => row.operating_mode === 'sous_location' ? 'sous_location' : row.status, render: (row) => (row.operating_mode === 'sous_location' ? 'Sous-location' : (statusLabels[row.status] ?? row.status)) },
        { key: 'rate', label: 'PRIX / JOUR', width: '95px', sortValue: (row) => Number(row.daily_rate ?? 0), render: (row) => amount(row.daily_rate) },
        { key: 'km', label: 'KM', width: '80px', sortValue: (row) => Number(row.km ?? 0), render: (row) => row.km ?? '-' },
        { key: 'contract', label: 'CONTRAT', width: '105px', sortValue: (row) => row.contract_reference ?? '', render: (row) => row.contract_reference ?? '-' },
        { key: 'client', label: 'CLIENT', sortValue: (row) => row.client_name ?? '', render: (row) => row.client_name ?? '-' },
        { key: 'return', label: 'RETOUR PRÉVU', width: '105px', sortValue: (row) => row.return_at ?? '', render: (row) => (row.return_at ? isoDate(row.return_at) : '-') },
    ];

    return (
        <AppLayout>
            <Head title="Sous-location" />
            <div className="al-return-heading">
                <strong>Véhicules en sous-location</strong>
                <span>{rows.length} véhicules</span>
            </div>
            <FilterBar
                action="/sub-rentals"
                filters={filters}
                fields={[
                    { name: 'numero', label: 'N°', width: '50px' },
                    { name: 'voiture', label: 'Voiture' },
                    { name: 'societe', label: 'Société' },
                    {
                        name: 'statut',
                        label: 'Statut',
                        options: [
                            { value: '', label: 'Tous' },
                            { value: 'disponible', label: 'Disponible' },
                            { value: 'en_location', label: 'En location' },
                            { value: 'en_reparation', label: 'Entretien' },
                            { value: 'hors_service', label: 'Hors service' },
                        ],
                    },
                ]}
            />
            <div className="mb-2 text-[11px] text-slate-500">
                <span>Mode dans la fiche véhicule.</span> <Link href="/vehicles?mode=sous_location" className="text-brand-700 underline">Gérer les véhicules</Link>
            </div>
            <VirtualDataList
                rows={rows}
                columns={columns}
                rowKey={(row) => row.id}
                href={(row) => `/vehicles/${row.id}/edit`}
                totalLabel={`${rows.length} véhicules en sous-location`}
                actions={(row) => <Link href={`/vehicles/${row.id}/edit`} className="al-link-modifier">Modifier</Link>}
                empty="Aucun véhicule en sous-location"
            />
        </AppLayout>
    );
}
