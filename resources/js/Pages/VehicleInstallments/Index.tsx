import { Head, Link, router } from '@inertiajs/react';
import { Download, Plus } from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import { FilterBar } from '@/components/FilterForm';
import { PageHeader } from '@/components/ui';
import { VirtualDataList, type VirtualColumn } from '@/components/VirtualDataList';
import { date, money } from '@/lib/utils';

type Vehicle = { id: number; display_name: string; plate_number: string | null };
type Summary = {
    id: number; source_vehicle_id: number; vehicle_id: number | null; match_status: string;
    source_vehicle_name: string; source_plate: string | null; credit_house: string | null;
    monthly_amount_recorded: string | null; total_months_recorded: number | null;
    paid_months_recorded: number | null; remaining_months_recorded: number | null;
    total_amount_recorded: string | null; paid_amount_recorded: string | null; remaining_amount_recorded: string | null;
    raw_record: { summary_cells?: string[] } | null; vehicle: Vehicle | null;
};
type Installment = {
    id: number; vehicle_id: number | null; source_key: string | null; source_row_number: number | null;
    origin: string; amount_recorded: string | null; amount_current: string;
    amount_text: string | null; date_recorded: string | null; due_date: string;
    description_recorded: string | null; description: string | null; status_recorded: string | null; status: 'paid' | 'unpaid';
    summary: Summary | null; vehicle: Vehicle | null; modified_by: { name: string } | null;
};
type Props = {
    installments: Installment[]; summaries: Summary[];
    filters: { q?: string; status?: string; vehicle_id?: string; from?: string; to?: string; due?: string };
    stats: { count: number; recorded_sum: string; paid_count: number; unpaid_count: number; summary_count: number; unmatched_summary_count: number };
    dueSoonDays: number; today: string; canCreate: boolean;
};

function dueTone(row: Installment, dueSoonDays: number, today: string) {
    if (row.status !== 'unpaid') return '';
    const due = Date.parse(`${row.due_date.slice(0, 10)}T00:00:00Z`);
    const todayMs = Date.parse(`${today}T00:00:00Z`);
    const days = Math.floor((due - todayMs) / 86400000);
    if (days < 0) return 'bg-rose-50 text-rose-900';
    if (days <= dueSoonDays) return 'bg-orange-50 text-orange-900';
    return '';
}

export default function Index({ installments, summaries, filters, stats, dueSoonDays, today, canCreate }: Props) {
    const columns: VirtualColumn<Installment>[] = [
        { key: 'vehicle', label: 'Voiture', width: 'minmax(150px, 1.4fr)', sortValue: (row) => [row.vehicle?.display_name ?? row.summary?.source_vehicle_name ?? '', row.vehicle?.plate_number ?? row.summary?.source_plate].filter(Boolean).join(' - '), render: (row) => <span className="font-medium">{[row.vehicle?.display_name ?? row.summary?.source_vehicle_name ?? 'Voiture non rapprochée', row.vehicle?.plate_number ?? row.summary?.source_plate].filter(Boolean).join(' - ')}</span> },
        { key: 'due_date', label: 'Date', width: '95px', sortValue: (row) => row.due_date, render: (row) => date(row.due_date) },
        { key: 'amount_current', label: 'Montant actuel', width: '105px', sortValue: (row) => Number(row.amount_current), render: (row) => `${row.amount_current} MAD` },
        { key: 'amount_recorded', label: 'Montant', width: '120px', sortValue: (row) => Number(row.amount_recorded ?? 0), render: (row) => row.amount_text ? `${row.amount_text} MAD` : 'Saisie manuelle' },
        { key: 'status', label: 'Statut', width: '90px', sortValue: (row) => row.status, render: (row) => <span className={`rounded-full border px-2 py-1 text-xs ${row.status === 'paid' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-800'}`}>{row.status === 'paid' ? 'Payée' : 'Non payée'}</span> },
        { key: 'description', label: 'Description', width: 'minmax(120px, 1fr)', sortValue: (row) => row.description ?? row.description_recorded ?? '', render: (row) => row.description ?? row.description_recorded ?? 'Non renseignée' },
        { key: 'origin', label: 'Origine', width: '100px', sortValue: (row) => row.origin, render: (row) => row.origin !== 'manual' ? 'historique' : 'Saisie TANAME CAR' },
    ];

    return (
        <AppLayout>
            <Head title="Traites" />
            <PageHeader title="Traites"  actions={(
                <div className="flex flex-wrap gap-2">
                    <a className="tc-btn-secondary" href={`/vehicle-installments/export.csv${window.location.search}`}><Download className="h-4 w-4" /> Export CSV</a>
                    {canCreate && <Link className="tc-btn-primary" href="/vehicle-installments/create"><Plus className="h-4 w-4" /> Nouvelle traite</Link>}
                </div>
            )} />

            <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                <div className="tc-card p-4"><div className="text-xs text-slate-500">Lignes visibles</div><div data-testid="installment-count" className="mt-1 text-xl font-bold">{stats.count}</div></div>
                <div className="tc-card p-4"><div className="text-xs text-slate-500">Montant enregistré visible</div><div className="mt-1 text-xl font-bold">{money(stats.recorded_sum)}</div></div>
                <div className="tc-card p-4"><div className="text-xs text-slate-500">Payées / non payées</div><div className="mt-1 text-xl font-bold">{stats.paid_count} / {stats.unpaid_count}</div></div>
                <div className="tc-card p-4"><div className="text-xs text-slate-500">Synthèses historique</div><div className="mt-1 text-xl font-bold">{stats.summary_count}</div></div>
                <div className="tc-card p-4"><div className="text-xs text-slate-500">Voitures non rapprochées</div><div className="mt-1 text-xl font-bold">{stats.unmatched_summary_count}</div></div>
            </div>

            <FilterBar action="/vehicle-installments" filters={filters} searchPlaceholder="Voiture, plaque, description, montant" resultCount={installments.length}>
                <select name="status" aria-label="Statut" defaultValue={filters.status ?? ''} className="tc-input"><option value="">Tous les statuts</option><option value="paid">Payées</option><option value="unpaid">Non payées</option></select>
                <select name="due" aria-label="Échéance" defaultValue={filters.due ?? ''} className="tc-input"><option value="">Toutes les échéances</option><option value="overdue">Dépassées</option><option value="soon">Proches, 30 jours</option></select>
                <label className="text-xs text-slate-500">Du<input aria-label="Du" type="date" name="from" defaultValue={filters.from ?? ''} className="tc-input mt-1" /></label>
                <label className="text-xs text-slate-500">Au<input aria-label="Au" type="date" name="to" defaultValue={filters.to ?? ''} className="tc-input mt-1" /></label>
            </FilterBar>

            <VirtualDataList
                rows={installments}
                columns={columns}
                rowKey={(row) => row.id}
                href={(row) => `/vehicle-installments/${row.id}`}
                rowClassName={(row) => dueTone(row, dueSoonDays, today)}
                rowTestId="installment-row"
                totalLabel={`Échéancier, ${installments.length} lignes`}
                heightClass="max-h-[calc(100vh-360px)] min-h-[320px]"
            />

            <section className="tc-card mt-5 overflow-hidden">
                <div className="border-b border-slate-100 px-4 py-3"><h2 className="font-semibold">Synthèses, {summaries.length}</h2></div>
                <div className="overflow-x-auto"><table className="min-w-full divide-y divide-slate-100 text-sm">
                    <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">Voiture / matricule historique</th><th className="px-4 py-3">Maison</th><th className="px-4 py-3">Mensualité enregistrée</th><th className="px-4 py-3">Mois payés / restants enregistrés</th><th className="px-4 py-3">Total enregistré</th><th className="px-4 py-3">Rapprochement</th></tr></thead>
                    <tbody className="divide-y divide-slate-100">{summaries.map((summary) => <tr key={summary.id} data-testid="traite-summary-row" role="link" tabIndex={0} className="cursor-pointer hover:bg-brand-50" onClick={() => router.visit(`/vehicle-installment-summaries/${summary.id}`)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') router.visit(`/vehicle-installment-summaries/${summary.id}`); }}>
                        <td className="px-4 py-3 font-medium">{summary.vehicle?.display_name ?? summary.source_vehicle_name}<div className="text-xs text-slate-500">{summary.vehicle?.plate_number ?? summary.source_plate}</div></td>
                        <td className="px-4 py-3">{summary.credit_house ?? 'Non renseignée'}</td>
                        <td className="px-4 py-3">{summary.raw_record?.summary_cells?.[4] ?? summary.monthly_amount_recorded ?? '0'} MAD</td>
                        <td className="px-4 py-3">{summary.paid_months_recorded ?? 0} / {summary.remaining_months_recorded ?? 0}</td>
                        <td className="px-4 py-3">{summary.raw_record?.summary_cells?.[8] ?? summary.total_amount_recorded ?? '0'} MAD</td>
                        <td className="px-4 py-3"><span className={`rounded-full px-2 py-1 text-xs ${summary.match_status === 'matched' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>{summary.match_status === 'matched' ? 'Rapprochée' : 'Non rapprochée'}</span></td>
                    </tr>)}</tbody>
                </table></div>
            </section>
        </AppLayout>
    );
}

