import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Save } from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import { Field, PageHeader } from '@/components/ui';

type Vehicle = { id: number; display_name: string; plate_number: string | null };
type Installment = { id: number; vehicle_id: number | null; amount_current: string; amount_text: string | null; due_date: string; date_recorded: string | null; description: string | null; status: 'paid' | 'unpaid'; status_recorded: string | null; origin: string };

export default function Form({ installment, vehicles }: { installment: Installment | null; vehicles: Vehicle[] }) {
    const { data, setData, post, put, processing, errors } = useForm({
        vehicle_id: installment?.vehicle_id ? String(installment.vehicle_id) : '',
        amount_current: installment?.amount_current ?? '',
        due_date: installment?.due_date?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
        description: installment?.description ?? '',
        status: installment?.status ?? 'unpaid',
    });
    const submit = (event: React.FormEvent) => {
        event.preventDefault();
        if (installment) put(`/vehicle-installments/${installment.id}`);
        else post('/vehicle-installments');
    };

    return (
        <AppLayout>
            <Head title={installment ? 'Modifier une traite' : 'Nouvelle traite'} />
            <PageHeader title={installment ? 'Modifier une traite' : 'Nouvelle traite'}  actions={<Link href={installment ? `/vehicle-installments/${installment.id}` : '/vehicle-installments'} className="tc-btn-secondary"><ArrowLeft className="h-4 w-4" /> Retour</Link>} />
            <form onSubmit={submit} className="tc-card max-w-3xl space-y-4 p-5">
                {installment && installment.origin !== 'manual' && <div className="rounded-lg border border-brand-100 bg-brand-50 p-3 text-sm text-brand-900">Montant : {installment.amount_text} MAD</div>}
                <Field label="Voiture *" error={(errors as any).vehicle_id}>
                    <select className="tc-input" value={data.vehicle_id} onChange={(e) => setData('vehicle_id', e.target.value)}>
                        <option value="">Choisir explicitement une voiture</option>
                        {vehicles.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.display_name}{vehicle.plate_number ? `, ${vehicle.plate_number}` : ''}</option>)}
                    </select>
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Montant actuel (MAD) *" error={(errors as any).amount_current}><input type="number" min="0" step="0.000001" className="tc-input" value={data.amount_current} onChange={(e) => setData('amount_current', e.target.value)} /></Field>
                    <Field label="Date *" error={(errors as any).due_date}><input type="date" className="tc-input" value={data.due_date} onChange={(e) => setData('due_date', e.target.value)} /></Field>
                </div>
                <Field label="Statut *" error={(errors as any).status}><select className="tc-input" value={data.status} onChange={(e) => setData('status', e.target.value as 'paid' | 'unpaid')}><option value="paid">Payée</option><option value="unpaid">Non payée</option></select></Field>
                <Field label="Description" error={(errors as any).description}><textarea className="tc-input min-h-24" maxLength={2000} value={data.description} onChange={(e) => setData('description', e.target.value)} /></Field>
                <div className="flex justify-end"><button className="tc-btn-primary" disabled={processing}><Save className="h-4 w-4" /> Enregistrer</button></div>
            </form>
        </AppLayout>
    );
}

