import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { FilterBar } from '@/components/FilterForm';
import { VirtualDataList, type VirtualColumn } from '@/components/VirtualDataList';

type Vehicle = {
    id: number;
    display_name: string;
    plate_number: string | null;
    status: string;
    operating_mode: string;
    km: string | null;
    daily_rate: string | null;
    brand?: { name: string };
    model?: { name: string };
    color?: { name: string };
    category?: { name: string };
};

export default function VehiclesIndex({ vehicles, filters }: { vehicles: Array<Vehicle & { row_number?: number }>; filters: Record<string, string> }) {
    const rows = vehicles.map((vehicle, index) => ({ ...vehicle, row_number: index + 1 }));
    const columns: VirtualColumn<Vehicle & { row_number?: number }>[] = [
        { key: 'row_number', label: 'N°', width: '58px', sortValue: (vehicle) => vehicle.row_number ?? 0, render: (vehicle) => vehicle.row_number },
        { key: 'brand', label: 'VOITURE', width: '160px', sortValue: (vehicle) => vehicle.brand?.name ?? '', render: (vehicle) => vehicle.brand?.name ?? '' },
        { key: 'model', label: 'MARQUE', sortValue: (vehicle) => vehicle.model?.name ?? '', render: (vehicle) => vehicle.model?.name ?? vehicle.display_name },
        { key: 'color', label: 'COULEUR', sortValue: (vehicle) => vehicle.color?.name ?? '', render: (vehicle) => vehicle.color?.name ?? '' },
        { key: 'category', label: 'CATEGORIE', sortValue: (vehicle) => vehicle.category?.name ?? '', render: (vehicle) => vehicle.category?.name ?? '' },
        { key: 'plate', label: 'MATRECULE', width: '240px', sortValue: (vehicle) => vehicle.plate_number ?? '', render: (vehicle) => vehicle.plate_number ?? '' },
    ];

    return (
        <AppLayout>
            <Head title="Voiture" />

            <FilterBar
                action="/vehicles"
                filters={filters}
                fields={[
                    { name: 'numero', label: 'N°', width: '50px' },
                    { name: 'marque', label: 'Marque' },
                    { name: 'type', label: 'Type' },
                    { name: 'couleur', label: 'Couleur' },
                    { name: 'num_immatr', label: 'Matricule' },
                ]}
            />

            <VirtualDataList
                rows={rows}
                columns={columns}
                rowKey={(vehicle) => vehicle.id}
                href={(vehicle) => `/vehicles/${vehicle.id}`}
                totalLabel={`${vehicles.length} voitures`}
                actions={(vehicle) => <Link href={`/vehicles/${vehicle.id}/edit`} className="al-link-modifier">Modifier</Link>}
                empty="Aucun résultat"
            />
        </AppLayout>
    );
}
