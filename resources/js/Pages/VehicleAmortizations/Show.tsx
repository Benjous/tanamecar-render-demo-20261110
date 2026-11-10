import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Save } from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import { Field, PageHeader } from '@/components/ui';
import { dateTime, money } from '@/lib/utils';

type Row = Record<string, any> & {
    id: number;
    source_credit_id: number;
    source_vehicle_name: string;
    source_plate: string | null;
    vehicle: { display_name: string; plate_number: string | null } | null;
    modified_by: { name: string } | null;
    modified_at: string | null;
};

export default function Show({ amortization, calculated, difference, canUpdate }: { amortization: Row; calculated: { balance: number | null }; difference: number | null; canUpdate: boolean }) {
    const fields = [
        ['revenue', 'Revenu'], ['credit', 'Crédit'], ['balance', 'Solde'], ['objective', 'Objectif'],
        ['price_per_km', 'Prix / km'], ['price', 'Prix'], ['real_cost', 'Frais réel'],
        ['remaining', 'Reste'], ['net_remaining', 'Reste net'],
    ] as const;
    const initial = Object.fromEntries(fields.map(([key]) => [`${key}_current`, amortization[`${key}_current`] ?? amortization[`${key}_recorded`] ?? '']));
    const { data, setData, put, processing, errors } = useForm(initial);
    const submit = (event: React.FormEvent) => { event.preventDefault(); put(`/vehicle-amortizations/${amortization.id}`); };
    const modified = amortization.modified_by?.name && amortization.modified_at
        ? `Modifié par ${amortization.modified_by.name} le ${dateTime(amortization.modified_at)}`
        : 'Non modifié';

    return (
        <AppLayout>
            <Head title="Fiche amortissement" />
            <PageHeader title="Fiche amortissement"  actions={<Link href="/vehicle-amortizations" className="tc-btn-secondary"><ArrowLeft className="h-4 w-4" /> Retour</Link>} />
            <div className="mb-4 grid gap-4 lg:grid-cols-3">
                <div className="tc-card p-4"><div className="text-xs text-slate-500">Voiture rapprochée</div><div className="mt-1 font-semibold">{amortization.vehicle?.display_name ?? 'Non rapprochée'}</div><div className="text-xs text-slate-500">{amortization.vehicle?.plate_number ?? amortization.source_plate ?? 'Sans matricule'}</div></div>
                <div className="tc-card p-4"><div className="text-xs text-slate-500">Solde</div><div className="mt-1 font-semibold">{calculated.balance === null ? 'Non calculable' : money(calculated.balance)}</div></div>
                <div className="tc-card p-4"><div className="text-xs text-slate-500">Traçabilité</div><div className="mt-1 text-sm">{modified}</div></div>
            </div>
            <form onSubmit={submit} className="tc-card p-5">
                <h2 className="mb-4 font-semibold">Détails</h2>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {fields.map(([key, label]) => <Field key={key} label={label} error={(errors as any)[`${key}_current`]} ><input type="number" step="0.00000001" className="tc-input" value={data[`${key}_current`]} onChange={(event) => setData(`${key}_current`, event.target.value)} disabled={!canUpdate} /></Field>)}
                </div>
                {canUpdate && <div className="mt-5 flex justify-end"><button className="tc-btn-primary" disabled={processing}><Save className="h-4 w-4" /> Enregistrer</button></div>}
            </form>
        </AppLayout>
    );
}
