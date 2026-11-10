import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Plus } from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import { PageHeader } from '@/components/ui';
import { date } from '@/lib/utils';

type Props = { summary: any; installments: any[]; calculated: Record<string, number | null>; differences: Record<string, number | null>; canCreate: boolean; canUpdate: boolean; dueSoonDays: number; today: string };

function recorded(summary: any, index: number, field: string) {
    return summary.raw_record?.summary_cells?.[index] ?? summary[field] ?? 'Non renseigné';
}

function diffText(value: number | null, kind: 'money' | 'number') {
    if (value === null || Math.abs(value) < 0.000001) return 'Aucun écart';
    return `Écart : ${kind === 'money' ? `${exactAmount(value)} MAD` : value}`;
}

function exactAmount(value: number | string | null | undefined) {
    return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 6 }).format(Number(value ?? 0));
}

export default function Summary({ summary, installments, calculated, differences, canCreate, canUpdate, dueSoonDays, today }: Props) {
    const fields = [
        { label: 'Total traité', raw: recorded(summary, 8, 'total_amount_recorded'), calculated: calculated.total_amount, diff: differences.total_amount, kind: 'money' as const },
        { label: 'Mois payés', raw: recorded(summary, 6, 'paid_months_recorded'), calculated: calculated.paid_months, diff: differences.paid_months, kind: 'number' as const },
        { label: 'Mois restants', raw: recorded(summary, 7, 'remaining_months_recorded'), calculated: calculated.remaining_months, diff: differences.remaining_months, kind: 'number' as const },
        { label: 'Traites payées', raw: recorded(summary, 9, 'paid_amount_recorded'), calculated: calculated.paid_amount, diff: differences.paid_amount, kind: 'money' as const },
    ];
    const vehicleLabel = summary.vehicle?.display_name ?? summary.source_vehicle_name;

    return (
        <AppLayout>
            <Head title={`Traites ${vehicleLabel}`} />
            <PageHeader title={`Traites, ${vehicleLabel}`}  actions={(
                <div className="flex gap-2"><Link href="/vehicle-installments" className="tc-btn-secondary"><ArrowLeft className="h-4 w-4" /> Retour</Link>{canCreate && <Link href="/vehicle-installments/create" className="tc-btn-primary"><Plus className="h-4 w-4" /> Nouvelle traite</Link>}</div>
            )} />

            <section className="tc-card mb-4 p-5">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                    <h2 className="font-semibold">Échéancier enregistré</h2>
                    <span className={`rounded-full px-2 py-1 text-xs ${summary.match_status === 'matched' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>{summary.match_status === 'matched' ? 'Voiture rapprochée' : 'Voiture non rapprochée'}</span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-lg bg-slate-50 p-3"><div className="text-xs text-slate-500">Mensualité enregistrée</div><div className="mt-1 font-semibold">{recorded(summary, 4, 'monthly_amount_recorded')} MAD</div></div>
                    <div className="rounded-lg bg-slate-50 p-3"><div className="text-xs text-slate-500">Total de mois enregistré</div><div className="mt-1 font-semibold">{recorded(summary, 5, 'total_months_recorded')}</div></div>
                    <div className="rounded-lg bg-slate-50 p-3"><div className="text-xs text-slate-500">Total restant enregistré</div><div className="mt-1 font-semibold">{recorded(summary, 10, 'remaining_amount_recorded')} MAD</div></div>
                    <div className="rounded-lg bg-slate-50 p-3"><div className="text-xs text-slate-500">Clé historique</div><div className="mt-1 font-semibold">{summary.source_vehicle_id}</div></div>
                </div>
            </section>

            <section className="tc-card mb-4 overflow-hidden">
                <div className="border-b border-slate-100 px-4 py-3"><h2 className="font-semibold">Montants</h2></div>
                <div className="overflow-x-auto"><table className="min-w-full divide-y divide-slate-100 text-sm">
                    <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">Rubrique</th><th className="px-4 py-3">Montant</th><th className="px-4 py-3">Calcul</th><th className="px-4 py-3">Écart</th></tr></thead>
                    <tbody className="divide-y divide-slate-100">{fields.map((field) => <tr key={field.label} className={field.diff !== null && Math.abs(field.diff) > 0.000001 ? 'bg-orange-50' : ''}>
                        <th className="px-4 py-3 text-left font-medium">{field.label}</th>
                        <td className="px-4 py-3">{field.raw}{field.kind === 'money' ? ' MAD' : ''}</td>
                        <td className="px-4 py-3">{field.calculated === null ? 'Non calculable' : field.kind === 'money' ? `${exactAmount(field.calculated)} MAD` : field.calculated}</td>
                        <td className="px-4 py-3">{diffText(field.diff, field.kind)}</td>
                    </tr>)}</tbody>
                </table></div>
            </section>

            <section className="tc-card overflow-hidden">
                <div className="border-b border-slate-100 px-4 py-3"><h2 className="font-semibold">Lignes, {installments.length}</h2></div>
                <div className="overflow-x-auto"><table className="min-w-full divide-y divide-slate-100 text-sm">
                    <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">Date</th><th className="px-4 py-3">Montant actuel</th><th className="px-4 py-3">Montant</th><th className="px-4 py-3">Statut</th><th className="px-4 py-3">Description</th><th className="px-4 py-3">Action</th></tr></thead>
                    <tbody className="divide-y divide-slate-100">{installments.map((row) => {
                        const due = Date.parse(`${String(row.due_date).slice(0, 10)}T00:00:00Z`);
                        const todayMs = Date.parse(`${today}T00:00:00Z`);
                        const days = Math.floor((due - todayMs) / 86400000);
                        const rowTone = row.status === 'unpaid' && days < 0 ? 'bg-rose-50' : row.status === 'unpaid' && days <= dueSoonDays ? 'bg-orange-50' : '';
                        return <tr key={row.id} data-testid="installment-row" className={`${rowTone} cursor-pointer hover:bg-brand-50`} onClick={() => router.visit(`/vehicle-installments/${row.id}`)}>
                            <td className="whitespace-nowrap px-4 py-3">{date(row.due_date)}</td><td className="whitespace-nowrap px-4 py-3">{row.amount_current} MAD</td><td className="whitespace-nowrap px-4 py-3">{row.amount_text ?? 'Saisie manuelle'}{row.amount_text ? ' MAD' : ''}</td><td className="px-4 py-3">{row.status === 'paid' ? 'Payée' : 'Non payée'}</td><td className="px-4 py-3">{row.description ?? row.description_recorded ?? 'Non renseignée'}</td><td className="px-4 py-3">{canUpdate && <Link className="font-semibold text-brand-700" href={`/vehicle-installments/${row.id}/edit`} onClick={(event) => event.stopPropagation()}>Modifier</Link>}</td>
                        </tr>;
                    })}
                    {installments.length === 0 && <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-500">Aucune traite individuelle enregistrée.</td></tr>}</tbody>
                </table></div>
            </section>
        </AppLayout>
    );
}

