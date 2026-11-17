import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { FilterBar } from '@/components/FilterForm';
import { VirtualDataList, type VirtualColumn } from '@/components/VirtualDataList';

type Client = {
    id: number;
    display_name: string;
    client_type: string;
    status: string;
    phone: string | null;
    email: string | null;
    address: string | null;
    contracts_count: number;
};

export default function ClientsIndex({ clients, filters }: { clients: Client[]; filters: Record<string, string> }) {
    const columns: VirtualColumn<Client>[] = [
        { key: 'name', label: 'NOM & PRENOM', width: '30%', sortValue: (client) => client.display_name, render: (client) => client.display_name },
        { key: 'phone', label: 'TELEPHONE', width: '150px', sortValue: (client) => client.phone, render: (client) => client.phone ?? '' },
        { key: 'address', label: 'ADRESSE', sortValue: (client) => client.address, render: (client) => client.address ?? '' },
    ];

    return (
        <AppLayout>
            <Head title="Conducteurs" />

            <FilterBar
                action="/clients"
                filters={filters}
                fields={[
                    { name: 'nom', label: 'Nom' },
                    { name: 'prenom', label: 'Prénom' },
                    { name: 'tel', label: 'Tél.' },
                    { name: 'adresse', label: 'Adresse' },
                    { name: 'source', label: 'Source' },
                ]}
            />

            <VirtualDataList
                rows={clients}
                columns={columns}
                rowKey={(client) => client.id}
                href={(client) => `/clients/${client.id}`}
                totalLabel={`${clients.length} conducteurs`}
                actions={(client) => <Link href={`/clients/${client.id}/edit`} className="al-link-modifier">Modifier</Link>}
                empty="Aucun résultat"
            />
        </AppLayout>
    );
}
