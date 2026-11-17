import { Head, Link } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { FilterBar } from '@/components/FilterForm';
import { VirtualDataList, type VirtualColumn } from '@/components/VirtualDataList';
import { amount, isoDate } from '@/lib/utils';

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
    client?: { display_name: string; phone?: string | null };
    vehicle?: { display_name: string; plate_number: string; brand?: string | null; model?: string | null; color?: string | null; category?: string | null } | null;
    row_number?: number;
};

function timeOf(value: string | null | undefined): string {
    if (!value) return '';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return '';
    return new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(parsed);
}

function dayKey(value: string | null | undefined): string {
    if (!value) return '';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return '';
    return parsed.toLocaleDateString('en-CA', { timeZone: 'Africa/Casablanca' });
}

function addDays(key: string, days: number): string {
    const date = new Date(`${key}T12:00:00Z`);
    date.setUTCDate(date.getUTCDate() + days);
    return date.toISOString().slice(0, 10);
}

function returnState(value: string | null | undefined, today: string, tomorrow: string, afterTomorrow: string): { label: string; tone: string; key: string } {
    const key = dayKey(value);
    if (!key) return { label: 'Date inconnue', tone: 'slate', key: 'unknown' };
    if (key < today) return { label: 'En retard', tone: 'red', key: 'late' };
    if (key === today) return { label: "Aujourd'hui", tone: 'orange', key: 'today' };
    if (key === tomorrow) return { label: 'Demain', tone: 'orange', key: 'tomorrow' };
    if (key === afterTomorrow) return { label: 'Après-demain', tone: 'orange', key: 'after' };
    return { label: 'À venir', tone: 'green', key: 'upcoming' };
}

export default function ContractsIndex({ contracts, filters }: { contracts: Contract[]; filters: Record<string, string> }) {
    const status = filters.status ?? '';
    const returnsView = filters.view === 'returns';
    const rentalView = filters.view === 'rental';
    const overdueView = returnsView && status === 'overdue';
    const [returnFilter, setReturnFilter] = useState<'all' | 'late' | 'today' | 'tomorrow' | 'after' | 'upcoming'>('all');
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Casablanca' });
    const tomorrow = addDays(today, 1);
    const afterTomorrow = addDays(today, 2);
    const returnGroups = useMemo(() => {
        const groups = { all: 0, late: 0, today: 0, tomorrow: 0, after: 0, upcoming: 0, unknown: 0 };
        for (const contract of contracts) {
            const key = returnState(contract.return_at, today, tomorrow, afterTomorrow).key as keyof typeof groups;
            groups.all += 1;
            if (key in groups) groups[key] += 1;
        }
        return groups;
    }, [contracts, today, tomorrow, afterTomorrow]);
    const returnRows = useMemo(() => returnsView && !overdueView && returnFilter !== 'all'
        ? contracts.filter((contract) => returnState(contract.return_at, today, tomorrow, afterTomorrow).key === returnFilter)
        : contracts, [contracts, returnsView, overdueView, returnFilter, today, tomorrow, afterTomorrow]);

    const contractColumns: VirtualColumn<Contract>[] = [
        { key: 'id', label: 'N°', width: '55px', sortValue: (contract) => contract.id, render: (contract) => contract.id },
        { key: 'client', label: 'LOCATAIRE', width: '30%', sortValue: (contract) => contract.client?.display_name ?? '', render: (contract) => contract.client?.display_name ?? '' },
        { key: 'departure', label: 'DATE DE CONTRAT', width: '160px', sortValue: (contract) => contract.departure_at, render: (contract) => isoDate(contract.departure_at) },
        { key: 'vehicle', label: 'VOITURE', sortValue: (contract) => contract.vehicle?.display_name ?? '', render: (contract) => contract.vehicle?.display_name ?? '' },
    ];

    const returnsColumns: VirtualColumn<Contract>[] = [
        { key: 'date', label: 'DATE', width: '130px', sortValue: (contract) => contract.return_at, render: (contract) => isoDate(contract.return_at) },
        { key: 'heure', label: 'HEURE', width: '80px', render: (contract) => timeOf(contract.return_at) },
        { key: 'vehicle', label: 'VOITURE', width: '300px', sortValue: (contract) => contract.vehicle?.display_name ?? '', render: (contract) => contract.vehicle?.display_name ?? '' },
        { key: 'client', label: 'NOM & PRENOM', sortValue: (contract) => contract.client?.display_name ?? '', render: (contract) => contract.client?.display_name ?? '' },
        { key: 'phone', label: 'TELEPHONE', width: '140px', render: (contract) => contract.client?.phone ?? '' },
        { key: 'remaining', label: 'RESTE', width: '110px', render: (contract) => amount(contract.remaining_calculated) },
        {
            key: 'return_state',
            label: 'ETAT',
            width: '120px',
            render: (contract) => {
                const state = returnState(contract.return_at, today, tomorrow, afterTomorrow);
                return <span className={`al-return-state al-return-state-${state.tone}`}>{state.label}</span>;
            },
        },
    ];

    const rentalColumns: VirtualColumn<Contract>[] = [
        { key: 'row_number', label: 'N°', width: '60px', sortValue: (contract) => contract.row_number ?? 0, render: (contract) => contract.row_number },
        { key: 'brand', label: 'MARQUE', width: '100px', sortValue: (contract) => contract.vehicle?.brand ?? '', render: (contract) => contract.vehicle?.brand ?? '' },
        { key: 'model', label: 'TYPE', sortValue: (contract) => contract.vehicle?.model ?? '', render: (contract) => contract.vehicle?.model ?? contract.vehicle?.display_name ?? '' },
        { key: 'color', label: 'COULEUR', width: '100px', sortValue: (contract) => contract.vehicle?.color ?? '', render: (contract) => contract.vehicle?.color ?? '' },
        { key: 'category', label: 'CATEGORIE', width: '110px', sortValue: (contract) => contract.vehicle?.category ?? '', render: (contract) => contract.vehicle?.category ?? '' },
        { key: 'plate', label: 'N° IMMATRICULATION', width: '220px', sortValue: (contract) => contract.vehicle?.plate_number ?? '', render: (contract) => contract.vehicle?.plate_number ?? '' },
        { key: 'client', label: 'NOM & PRENOM', sortValue: (contract) => contract.client?.display_name ?? '', render: (contract) => contract.client?.display_name ?? '' },
        { key: 'phone', label: 'TELEPHONE', width: '140px', render: (contract) => contract.client?.phone ?? '' },
    ];

    const fields = returnsView
        ? [
            { name: 'date', label: 'Date (aaaa-mm-jj)' },
            { name: 'heure', label: 'Heure' },
            { name: 'voiture', label: 'Voiture' },
            { name: 'nom', label: 'Nom' },
            { name: 'prenom', label: 'Prénom' },
            { name: 'tel', label: 'Tél.' },
        ]
        : rentalView
            ? [
                { name: 'numero', label: 'N°', width: '50px' },
                { name: 'marque', label: 'Marque' },
                { name: 'type', label: 'Type' },
                { name: 'couleur', label: 'Couleur' },
                { name: 'num_immatr', label: 'Matricule' },
            ]
            : [
                { name: 'date', label: 'Date (aaaa-mm-jj)' },
                { name: 'heure', label: 'Heure' },
                { name: 'nom', label: 'Nom' },
                { name: 'prenom', label: 'Prénom' },
                { name: 'voiture', label: 'Voiture' },
            ];

    const columns = returnsView ? returnsColumns : rentalView ? rentalColumns : contractColumns;
    const rows = rentalView ? contracts.map((contract, index) => ({ ...contract, row_number: index + 1 })) : contracts;

    return (
        <AppLayout>
            <Head title={overdueView ? 'En retard' : returnsView ? 'En retour' : rentalView ? 'En location' : 'Contrat'} />

            <FilterBar action="/contracts" filters={filters} fields={fields}>
                {status ? <input type="hidden" name="status" value={status} /> : null}
                {filters.view ? <input type="hidden" name="view" value={filters.view} /> : null}
            </FilterBar>

            {returnsView && (
                <>
                    <div className="al-return-heading">
                        <strong>{overdueView ? 'Retours en retard' : <>Retours du {new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric', timeZone: 'Africa/Casablanca' }).format(new Date())}</>}</strong>
                        <span>
                            {overdueView
                                ? `${returnGroups.late} contrats en retard`
                                : `${returnGroups.today} aujourd'hui, ${returnGroups.tomorrow} demain, ${returnGroups.after} après-demain`}
                        </span>
                    </div>
                    {!overdueView && (
                        <div className="al-list-tabs al-return-tabs">
                            {([
                                ['all', 'Tous', returnGroups.all],
                                ['today', "Aujourd'hui", returnGroups.today],
                                ['tomorrow', 'Demain', returnGroups.tomorrow],
                                ['after', 'Après-demain', returnGroups.after],
                                ['upcoming', 'À venir', returnGroups.upcoming],
                            ] as const).map(([key, label, count]) => (
                                <button key={key} type="button" className={returnFilter === key ? 'active' : ''} onClick={() => setReturnFilter(key)}>
                                    {label} <span className="al-return-count">{count}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </>
            )}

            {!returnsView && !rentalView && (
                <div className="al-list-tabs">
                    <Link href="/contracts" className={status === '' ? 'active' : ''}>Tous</Link>
                    <span>|</span>
                    <Link href="/contracts?status=open" className={status === 'open' ? 'active' : ''}>Contrat en cours</Link>
                    <span>|</span>
                    <Link href="/contracts?status=overdue" className={status === 'overdue' ? 'active' : ''}>Contrat depassé</Link>
                </div>
            )}

            <VirtualDataList
                rows={returnsView ? returnRows : rows}
                columns={columns}
                rowKey={(contract) => contract.id}
                href={(contract) => `/contracts/${contract.id}`}
                totalLabel={`${contracts.length} ${overdueView ? 'retards' : 'contrats'}`}
                actions={returnsView ? undefined : (contract) => <Link href={`/contracts/${contract.id}/edit`} className="al-link-modifier">Modifier</Link>}
                empty="Aucun résultat"
            />
        </AppLayout>
    );
}
