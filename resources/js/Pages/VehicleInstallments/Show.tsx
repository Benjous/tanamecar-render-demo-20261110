import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Pencil } from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import { PageHeader } from '@/components/ui';
import { date, dateTime } from '@/lib/utils';

type Props = {
    installment: any;
    canUpdate: boolean;
    dueSoonDays: number;
    today: string;
};

function dueStatus(installment: any, dueSoonDays: number, today: string) {
    if (installment.status !== 'unpaid') return { label: 'Payée', tone: 'bg-emerald-50 text-emerald-700' };
    const due = Date.parse(`${String(installment.due_date).slice(0, 10)}T00:00:00Z`);
    const todayMs = Date.parse(`${today}T00:00:00Z`);
    const days = Math.floor((due - todayMs) / 86400000);
    if (days < 0) return { label: 'Dépassée', tone: 'bg-rose-100 text-rose-800' };
    if (days <= dueSoonDays) return { label: 'Proche', tone: 'bg-orange-100 text-orange-800' };
    return { label: 'À venir', tone: 'bg-slate-100 text-slate-700' };
}

export default function Show({ installment, canUpdate, dueSoonDays, today }: Props) {
    const due = dueStatus(installment, dueSoonDays, today);
    const modified = installment.modified_by?.name && installment.modified_at
        ? `Modifié par ${installment.modified_by.name} le ${dateTime(installment.modified_at)}`
        : installment.origin !== 'manual'
            ? 'Valeur enregistrée importée depuis historique, non modifiée dans TANAME CAR'
            : installment.created_by?.name
                ? `Créé par ${installment.created_by.name} le ${dateTime(installment.created_at)}`
                : 'Saisie manuelle';

    return (
        <AppLayout>
            <Head title="Fiche traite" />
            <PageHeader title="Fiche traite"  actions={(
                <div className="flex gap-2">
                    <Link href="/vehicle-installments" className="tc-btn-secondary"><ArrowLeft className="h-4 w-4" /> Retour</Link>
                    {canUpdate && <Link href={`/vehicle-installments/${installment.id}/edit`} className="tc-btn-primary"><Pencil className="h-4 w-4" /> Modifier</Link>}
                </div>
            )} />
            <div className="grid gap-4 lg:grid-cols-2">
                <section className="tc-card p-5">
                    <h2 className="mb-4 font-semibold">Échéance</h2>
                    <dl className="grid gap-4 sm:grid-cols-2">
                        <div><dt className="text-xs text-slate-500">Voiture</dt><dd className="mt-1 font-medium">{installment.vehicle?.display_name ?? installment.summary?.source_vehicle_name ?? 'Non rapprochée'}</dd></div>
                        <div><dt className="text-xs text-slate-500">Matricule</dt><dd className="mt-1">{installment.vehicle?.plate_number ?? installment.summary?.source_plate ?? 'Non renseigné'}</dd></div>
                        <div><dt className="text-xs text-slate-500">Date actuelle</dt><dd className="mt-1">{date(installment.due_date)}</dd></div>
                        <div><dt className="text-xs text-slate-500">Statut actuel</dt><dd className={`mt-1 inline-flex rounded-full px-2 py-1 text-xs ${due.tone}`}>{due.label}</dd></div>
                        <div><dt className="text-xs text-slate-500">Montant actuel</dt><dd className="mt-1 font-semibold">{installment.amount_current} MAD</dd></div>
                        <div><dt className="text-xs text-slate-500">Description actuelle</dt><dd className="mt-1">{installment.description || 'Non renseignée'}</dd></div>
                    </dl>
                </section>
                <section className="tc-card p-5">
                    <h2 className="mb-4 font-semibold">Valeurs enregistrées</h2>
                    {installment.origin !== 'manual' ? <dl className="grid gap-4 sm:grid-cols-2">
                        <div><dt className="text-xs text-slate-500">Montant enregistré</dt><dd className="mt-1">{installment.amount_text} MAD</dd></div>
                        <div><dt className="text-xs text-slate-500">Date enregistrée</dt><dd className="mt-1">{date(installment.date_recorded)}</dd></div>
                        <div><dt className="text-xs text-slate-500">Statut enregistré</dt><dd className="mt-1">{installment.status_recorded === 'paid' ? 'Payée' : 'Non payée'}</dd></div>
                        <div><dt className="text-xs text-slate-500">Description enregistrée</dt><dd className="mt-1">{installment.description_recorded || 'Non renseignée'}</dd></div>
                        <div className="sm:col-span-2"><dt className="text-xs text-slate-500">Identifiant historique</dt><dd className="mt-1 break-all">{installment.source_key}</dd></div>
                    </dl> : <p className="text-sm text-slate-600">Saisie TANAME CAR.</p>}
                    <p className="mt-5 border-t border-slate-100 pt-3 text-sm text-slate-600">{modified}</p>
                    {installment.summary && <Link className="mt-3 inline-block text-sm font-semibold text-brand-700" href={`/vehicle-installment-summaries/${installment.summary.id}`}>Voir la synthèse</Link>}
                </section>
            </div>
        </AppLayout>
    );
}

