import { Head, Link } from '@inertiajs/react';
import { Plus, CarFront, Handshake, Truck } from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import { FilterBar } from '@/components/FilterForm';
import { VirtualDataList, type VirtualColumn } from '@/components/VirtualDataList';
import { Badge, EmptyState, PageHeader, StatCard } from '@/components/ui';
import { exportUrl, money, number, statusTone } from '@/lib/utils';

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
    category?: { name: string };
};

type Option = { id: number; name: string };

export default function VehiclesIndex({ vehicles, filters, counters, brands, categories }: { vehicles: Vehicle[]; filters: Record<string, string>; counters: { sous_location: number; available: number; location: number }; brands: Option[]; categories: Option[] }) {
    const columns: VirtualColumn<Vehicle>[] = [
        { key: 'name', label: 'Voiture', width: 'minmax(160px, 1.5fr)', render: (vehicle) => <span className="font-bold text-brand-800">{vehicle.display_name}</span> },
        { key: 'plate', label: 'Plaque', width: '100px', render: (vehicle) => vehicle.plate_number ?? 'Non renseigné' },
        { key: 'brand', label: 'Marque', width: '60px', sortValue: (vehicle) => vehicle.brand?.name ?? '', render: (vehicle) => vehicle.brand?.name ?? 'Non renseigné' },
        { key: 'model', label: 'Modèle', width: '100px', sortValue: (vehicle) => vehicle.model?.name ?? '', render: (vehicle) => vehicle.model?.name ?? 'Non renseigné' },
        { key: 'status', label: 'Statut', width: '100px', render: (vehicle) => <Badge tone={statusTone(vehicle.status)}>{vehicle.status.replaceAll('_', ' ')}</Badge> },
        { key: 'mode', label: 'Mode', width: '60px', render: (vehicle) => vehicle.operating_mode.replaceAll('_', ' ') },
        { key: 'km', label: 'Km', width: '60px', render: (vehicle) => number(vehicle.km ?? 0) },
        { key: 'rate', label: 'Prix/jour', width: '60px', render: (vehicle) => money(vehicle.daily_rate ?? 0) },
    ];

    return (
        <AppLayout>
            <Head title="Voitures" />
            <PageHeader
                title="Voitures"
                
                actions={<><a href={exportUrl('vehicles', filters)} className="tc-btn-secondary">Exporter CSV</a><Link href="/vehicles/create" className="tc-btn-primary"><Plus className="h-4 w-4" /> Nouveau voiture</Link></>}
            />

            <div className="mb-4 grid gap-4 sm:grid-cols-3">
                <StatCard label="Sous-location" value={number(counters?.sous_location ?? 0)} hint="Voitures en mode sous-location" icon={<Handshake className="h-5 w-5" />} tone="brand" href="/vehicles?mode=sous_location" testId="stat-sous-location" />
                <StatCard label="Disponibles" value={number(counters?.available ?? 0)} hint="Voitures au statut disponible" icon={<CarFront className="h-5 w-5" />} tone="emerald" href="/vehicles?status=disponible" testId="stat-vehicles-available" />
                <StatCard label="Locations" value={number(counters?.location ?? 0)} hint="Voitures en mode location" icon={<Truck className="h-5 w-5" />} tone="amber" href="/vehicles?mode=location" testId="stat-vehicles-location" />
            </div>

            <FilterBar action="/vehicles" filters={filters} searchPlaceholder="Nom, plaque, châssis, marque, modèle, catégorie" resultCount={vehicles.length}>
                <select name="status" aria-label="Statut" defaultValue={filters.status ?? ''} className="tc-input"><option value="">Tous statuts</option><option value="disponible">Disponible</option><option value="en_location">En location</option><option value="en_reparation">En réparation</option><option value="hors_service">Hors service</option></select>
                <select name="mode" aria-label="Mode" defaultValue={filters.mode ?? ''} className="tc-input"><option value="">Tous modes</option><option value="location">Location</option><option value="sous_location">Sous-location</option><option value="service">Service</option></select>
                <select name="brand_id" aria-label="Marque" defaultValue={filters.brand_id ?? ''} className="tc-input"><option value="">Toutes marques</option>{brands.map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}</select>
                <select name="category_id" aria-label="Catégorie" defaultValue={filters.category_id ?? ''} className="tc-input"><option value="">Toutes catégories</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select>
            </FilterBar>

            <VirtualDataList
                rows={vehicles}
                columns={columns}
                rowKey={(vehicle) => vehicle.id}
                href={(vehicle) => `/vehicles/${vehicle.id}`}
                totalLabel={`${vehicles.length} voitures`}
                actionsWidth="90px"
                defaultHidden={['brand', 'model']}
                actions={(vehicle) => <Link href={`/vehicles/${vehicle.id}`} className="text-xs font-semibold text-brand-700">Voir</Link>}
                empty={<EmptyState title="Aucun voiture" />}
            />
        </AppLayout>
    );
}

