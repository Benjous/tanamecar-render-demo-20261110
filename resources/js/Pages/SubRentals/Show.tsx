import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Save } from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import { Field, PageHeader } from '@/components/ui';
import { dateTime, money } from '@/lib/utils';

export default function Show({ row, calculated, canUpdate }: { row: any; calculated: Record<string, number | null>; canUpdate: boolean }) {
    const { data, setData, put, processing, errors } = useForm({
        days_current: row.days_current ?? row.days_recorded ?? '',
        rate_current: row.rate_current ?? row.rate_recorded ?? '',
        total_current: row.total_current ?? row.total_recorded ?? '',
        price_current: row.price_current ?? row.price_recorded ?? '',
        profit_current: row.profit_current ?? row.profit_recorded ?? '',
        advance_current: row.advance_current ?? row.advance_recorded ?? '',
        credit_current: row.credit_current ?? row.credit_recorded ?? '',
    });
    const submit = (event: React.FormEvent) => { event.preventDefault(); put(`/sub-rentals/${row.id}`); };
    const fields = [
        ['days', 'Jours'], ['rate', 'Prix / jour'], ['total', 'Total'], ['price', 'Prix'],
        ['profit', 'Bénéfice'], ['advance', 'Avance'], ['credit', 'Crédit'],
    ] as const;
    return (
        <AppLayout>
            <Head title="Fiche sous-location" />
            <PageHeader title="Fiche sous-location"  actions={<Link href="/sub-rentals" className="tc-btn-secondary"><ArrowLeft className="h-4 w-4" /> Retour</Link>} />
            <div className="mb-4 grid gap-4 sm:grid-cols-3">
                <div className="tc-card p-4"><div className="text-xs text-slate-500">Client enregistré</div><div className="mt-1 font-semibold">{row.client_name ?? 'Non renseigné'}</div></div>
                <div className="tc-card p-4"><div className="text-xs text-slate-500">Total</div><div className="mt-1 font-semibold">{calculated.total === null ? 'Non calculable' : money(calculated.total)}</div></div>
                <div className="tc-card p-4"><div className="text-xs text-slate-500">Bénéfice</div><div className="mt-1 font-semibold">{calculated.profit === null ? 'Non calculable' : money(calculated.profit)}</div></div>
            </div>
            <form onSubmit={submit} className="tc-card p-5">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2"><h2 className="font-semibold">Détails</h2><span className="text-xs text-slate-500">{row.modified_by?.name && row.modified_at ? `Modifié par ${row.modified_by.name} le ${dateTime(row.modified_at)}` : ''}</span></div>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {fields.map(([key, label]) => <Field key={key} label={label} error={(errors as any)[`${key}_current`]} ><input type="number" step="0.00000001" className="tc-input" value={data[`${key}_current`]} onChange={(event) => setData(`${key}_current`, event.target.value)} disabled={!canUpdate} /></Field>)}
                </div>
                {canUpdate && <div className="mt-5 flex justify-end"><button className="tc-btn-primary" disabled={processing}><Save className="h-4 w-4" /> Enregistrer</button></div>}
            </form>
        </AppLayout>
    );
}

