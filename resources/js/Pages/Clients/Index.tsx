import { Head, Link } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import { FilterBar } from '@/components/FilterForm';
import { VirtualDataList, type VirtualColumn } from '@/components/VirtualDataList';
import { Badge, EmptyState, PageHeader } from '@/components/ui';
import { exportUrl, statusTone } from '@/lib/utils';

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
        { key: 'name', label: 'Nom complet', width: 'minmax(180px, 1.5fr)', sortValue: (client) => client.display_name, render: (client) => <span className="font-bold text-brand-800">{client.display_name}</span> },
        { key: 'type', label: 'Type', width: '100px', sortValue: (client) => client.client_type, render: (client) => <span className="capitalize">{client.client_type}</span> },
        { key: 'status', label: 'Statut', width: '90px', sortValue: (client) => client.status, render: (client) => <Badge tone={statusTone(client.status)}>{client.status}</Badge> },
        { key: 'phone', label: 'Téléphone', width: '132px', sortValue: (client) => client.phone, render: (client) => client.phone ?? 'Non renseigné' },
        { key: 'address', label: 'Adresse de résidence', width: 'minmax(200px, 1.4fr)', sortValue: (client) => client.address, render: (client) => client.address ?? 'Non renseigné' },
        { key: 'email', label: 'Email', width: 'minmax(180px, 1.3fr)', sortValue: (client) => client.email, render: (client) => client.email ?? 'Non renseigné' },
        { key: 'contracts', label: 'Locations', width: '100px', sortValue: (client) => client.contracts_count, render: (client) => client.contracts_count },
    ];

    return (
        <AppLayout>
            <Head title="Clients" />
            <PageHeader
                title="Clients"
                
                actions={<><a href={exportUrl('clients', filters)} className="tc-btn-secondary">Exporter CSV</a><Link href="/clients/matching" className="tc-btn-secondary">Rapprochement clients</Link><Link href="/clients/create" className="tc-btn-primary"><Plus className="h-4 w-4" /> Nouveau client</Link></>}
            />

            <FilterBar action="/clients" filters={filters} searchPlaceholder="Nom, téléphone, email, adresse, identité" resultCount={clients.length}>
                <select name="status" aria-label="Statut" defaultValue={filters.status ?? ''} className="tc-input">
                    <option value="">Tous les statuts</option>
                    <option value="actif">Actif</option><option value="inactif">Inactif</option><option value="blackliste">Blacklisté</option><option value="debiteur">Débiteur</option>
                </select>
                <select name="type" aria-label="Type" defaultValue={filters.type ?? ''} className="tc-input">
                    <option value="">Tous types</option><option value="particulier">Particulier</option><option value="entreprise">Entreprise</option>
                </select>
            </FilterBar>

            <VirtualDataList
                rows={clients}
                columns={columns}
                rowKey={(client) => client.id}
                href={(client) => `/clients/${client.id}`}
                totalLabel={`${clients.length} clients`}
                actionsWidth="90px"
                defaultHidden={['email']}
                actions={(client) => <Link href={`/clients/${client.id}`} className="text-xs font-semibold text-brand-700">Voir</Link>}
                empty={<EmptyState title="Aucun client" description="Ajustez les filtres ou créez une fiche client." />}
            />
        </AppLayout>
    );
}
