import { Head, Link } from '@inertiajs/react';
import { AlertTriangle, CalendarClock, CarFront, Plus } from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import { FilterBar } from '@/components/FilterForm';
import { VirtualDataList, type VirtualColumn } from '@/components/VirtualDataList';
import { Badge, EmptyState, PageHeader, StatCard } from '@/components/ui';
import { date, exportUrl, money, number, statusTone } from '@/lib/utils';

type Contract = {
    id: number;
    reference: string;
    departure_at: string;
    return_at: string;
    total_amount: string;
    paid_amount_calculated: string | null;
    remaining_calculated: string | null;
    has_mismatch: boolean;
    returned: boolean;
    data_quality_status: string;
    client?: { display_name: string };
    vehicle?: { display_name: string; plate_number: string } | null;
};

export default function ContractsIndex({ contracts, filters, counters }: { contracts: Contract[]; filters: Record<string, string>; counters: any }) {
    const columns: VirtualColumn<Contract>[] = [
        {
            key: 'reference',
            label: 'Référence',
            width: '100px',
            render: (contract) => (
                <div>
                    <div className="font-bold text-brand-800">{contract.reference}</div>
                </div>
            ),
        },
        { key: 'client', label: 'Client', width: 'minmax(110px, 1fr)', sortValue: (contract) => contract.client?.display_name ?? '', render: (contract) => contract.client?.display_name ?? 'Non renseigné' },
        {
            key: 'vehicle',
            label: 'Voiture',
            width: '150px',
            sortValue: (contract) => contract.vehicle?.display_name ?? '',
            render: (contract) => contract.vehicle?.display_name ?? <span className="text-amber-800">Incomplet</span>,
        },
        { key: 'departure', label: 'Départ', width: '95px', sortValue: (contract) => contract.departure_at, render: (contract) => date(contract.departure_at) },
        { key: 'return', label: 'Retour', width: '95px', sortValue: (contract) => contract.return_at, render: (contract) => date(contract.return_at) },
        { key: 'total', label: 'Total', width: '110px', sortValue: (contract) => Number(contract.total_amount), render: (contract) => <span className="whitespace-nowrap text-[13px] font-semibold">{money(contract.total_amount)}</span> },
        { key: 'paid', label: 'Payé', width: '124px', sortValue: (contract) => Number(contract.paid_amount_calculated ?? 0), render: (contract) => <span className="whitespace-nowrap text-[13px]">{money(contract.paid_amount_calculated ?? 0)}</span> },
        { key: 'remaining', label: 'Reste', width: '124px', sortValue: (contract) => Number(contract.remaining_calculated ?? 0), render: (contract) => <span className="whitespace-nowrap text-[13px]">{money(contract.remaining_calculated ?? 0)}</span> },
        {
            key: 'status',
            label: 'Statut',
            width: '80px',
            sortValue: (contract) => contract.returned ? 'Réceptionné' : 'En cours',
            render: (contract) => <Badge tone={statusTone(contract.returned ? 'returned' : 'en_location')}>{contract.returned ? 'Réceptionné' : 'En cours'}</Badge>,
        },
    ];

    return (
        <AppLayout>
            <Head title="Locations" />
            <PageHeader
                title="Locations"
                
                actions={<><a href={exportUrl('contracts', filters)} className="tc-btn-secondary">Exporter CSV</a><Link href="/contracts/create" className="tc-btn-primary"><Plus className="h-4 w-4" /> Nouvelle location</Link></>}
            />

            <div className="mb-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <StatCard label="Retour dépassé" value={number(counters?.overdue ?? 0)} icon={<AlertTriangle className="h-5 w-5" />} tone="rose" href="/contracts?status=overdue" testId="stat-overdue" />
                <StatCard label="Retours du mois" value={number(counters?.due_month ?? 0)} icon={<CalendarClock className="h-5 w-5" />} tone="amber" href="/contracts?due=month" testId="stat-due-month" />
                <StatCard label="En location" value={number(counters?.in_rental ?? 0)} icon={<CarFront className="h-5 w-5" />} tone="emerald" href="/contracts?status=open" testId="stat-in-rental" />
            </div>

            <FilterBar action="/contracts" filters={filters} searchPlaceholder="Référence, client, téléphone, plaque, montant" resultCount={contracts.length}>
                <select name="status" aria-label="Statut" defaultValue={filters.status ?? ''} className="tc-input">
                    <option value="">Tous les statuts</option>
                    <option value="open">En cours</option>
                    <option value="returned">Réceptionnés</option>
                    <option value="overdue">Retour dépassé</option>
                </select>
                <select name="due" aria-label="Échéance" defaultValue={filters.due ?? ''} className="tc-input">
                    <option value="">Tous les retours</option>
                    <option value="today">Aujourd’hui</option>
                    <option value="tomorrow">Demain</option>
                    <option value="after_tomorrow">Après-demain</option>
                    <option value="month">Retours du mois</option>
                </select>
                <label className="text-xs text-slate-500">Départ du<input type="date" aria-label="Date de début" name="date_from" defaultValue={filters.date_from ?? ''} className="tc-input mt-1" /></label>
                <label className="text-xs text-slate-500">Départ au<input type="date" aria-label="Date de fin" name="date_to" defaultValue={filters.date_to ?? ''} className="tc-input mt-1" /></label>
            </FilterBar>

            <VirtualDataList
                rows={contracts}
                columns={columns}
                rowKey={(contract) => contract.id}
                href={(contract) => `/contracts/${contract.id}`}
                totalLabel={`${contracts.length} locations`}
                actionsWidth="100px"
                defaultHidden={['paid']}
                actions={(contract) => (
                    <>
                        <Link href={`/contracts/${contract.id}`} className="text-xs font-semibold text-brand-700">Voir</Link>
                        <a href={`/contracts/${contract.id}/pdf`} className="text-xs font-semibold text-slate-500">PDF</a>
                    </>
                )}
                empty={<EmptyState title="Aucune location" description="Ajustez les filtres ou créez une nouvelle location." />}
            />
        </AppLayout>
    );
}




