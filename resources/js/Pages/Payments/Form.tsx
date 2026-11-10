import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Save } from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import { Field, PageHeader } from '@/components/ui';

type ContractOption = { id: number; reference: string; total_amount: string; client?: { display_name: string } };

export default function PaymentForm({ contracts, methods, statuses }: { contracts: ContractOption[]; methods: string[]; statuses: string[] }) {
    const { data, setData, post, processing, errors } = useForm({
        contract_id: '',
        amount: '',
        payment_method: 'espece',
        payment_status: 'paye',
        remaining_amount: '',
    });

    return (
        <AppLayout>
            <Head title="Nouveau paiement" />
            <PageHeader title="Nouveau paiement"  actions={<Link href="/payments" className="tc-btn-secondary"><ArrowLeft className="h-4 w-4" /> Retour</Link>} />
            <form onSubmit={(e) => { e.preventDefault(); post('/payments'); }} className="tc-card max-w-3xl p-5">
                <div className="grid gap-4 md:grid-cols-2">
                    <Field label="Contrat *" error={errors.contract_id}>
                        <select className="tc-input" value={data.contract_id} onChange={(e) => setData('contract_id', e.target.value)}>
                            <option value="">Sélectionner…</option>
                            {contracts.map((c) => <option key={c.id} value={c.id}>{c.reference} - {c.client?.display_name}</option>)}
                        </select>
                    </Field>
                    <Field label="Montant *" error={errors.amount}><input type="number" className="tc-input" value={data.amount} onChange={(e) => setData('amount', e.target.value)} /></Field>
                    <Field label="Mode *" error={errors.payment_method}><select className="tc-input" value={data.payment_method} onChange={(e) => setData('payment_method', e.target.value)}>{methods.map((m) => <option key={m} value={m}>{m}</option>)}</select></Field>
                    <Field label="Statut *" error={errors.payment_status}><select className="tc-input" value={data.payment_status} onChange={(e) => setData('payment_status', e.target.value)}>{statuses.map((s) => <option key={s} value={s}>{s}</option>)}</select></Field>
                    <Field label="Reste"><input type="number" className="tc-input" value={data.remaining_amount} onChange={(e) => setData('remaining_amount', e.target.value)} /></Field>
                </div>
                <div className="mt-6 flex justify-end gap-2"><Link href="/payments" className="tc-btn-secondary">Annuler</Link><button className="tc-btn-primary" disabled={processing}><Save className="h-4 w-4" /> Enregistrer</button></div>
            </form>
        </AppLayout>
    );
}
