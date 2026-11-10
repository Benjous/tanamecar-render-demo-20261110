import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Save } from 'lucide-react';
import { useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import ClientPicker, { type ClientOption } from '@/components/ClientPicker';
import { Field, PageHeader } from '@/components/ui';
import { money } from '@/lib/utils';

type Option = { id: number; display_name?: string; name?: string; plate_number?: string; phone?: string };

type Contract = {
    id: number; reference: string; client_id: number; vehicle_id: number | null;
    first_driver_id: number | null; second_driver_id: number | null; employee_id: number | null;
    client_is_main_driver: boolean; departure_at: string; departure_place: string | null; departure_km: string | null;
    return_at: string; return_place: string | null; return_km: string | null;
    daily_rate: string; days: string; total_amount: string; deposit: string | null; deductible: string | null; caution_type: string | null; note: string | null;
};

function toLocal(value: string | null | undefined) {
    if (!value) return '';
    const d = new Date(value);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function ContractForm({ contract, clients, vehicles, employees, methods }: { contract: Contract | null; clients: Option[]; vehicles: Option[]; employees: Option[]; methods: string[] }) {
    const [selectedClient, setSelectedClient] = useState<ClientOption | null>(null);
    const { data, setData, post, put, processing, errors } = useForm({
        client_id: contract?.client_id ?? '',
        vehicle_id: contract?.vehicle_id ?? '',
        first_driver_id: contract?.first_driver_id ?? '',
        second_driver_id: contract?.second_driver_id ?? '',
        employee_id: contract?.employee_id ?? '',
        client_is_main_driver: contract?.client_is_main_driver ?? false,
        departure_at: toLocal(contract?.departure_at) || toLocal(new Date().toISOString()),
        departure_place: contract?.departure_place ?? '',
        departure_km: contract?.departure_km ?? '',
        return_at: toLocal(contract?.return_at) || toLocal(new Date(Date.now() + 86400000).toISOString()),
        return_place: contract?.return_place ?? '',
        return_km: contract?.return_km ?? '',
        daily_rate: contract?.daily_rate ?? '',
        days: contract?.days ?? 1,
        total_amount: contract?.total_amount ?? '',
        deposit: contract?.deposit ?? '',
        deductible: contract?.deductible ?? '',
        caution_type: contract?.caution_type ?? '',
        note: contract?.note ?? '',
        first_payment_amount: '',
        first_payment_method: 'espece',
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        if (contract) put(`/contracts/${contract.id}`);
        else post('/contracts');
    }

    function recompute(daily: string | number, days: string | number) {
        const total = Number(daily || 0) * Number(days || 0);
        setData((current) => ({ ...current, total_amount: total ? String(total) : '' }));
    }

    return (
        <AppLayout>
            <Head title={contract ? `Modifier ${contract.reference}` : 'Nouvelle location'} />
            <PageHeader
                title={contract ? `Modifier la location ${contract.reference}` : 'Nouvelle location'}
                
                actions={<Link href="/contracts" className="tc-btn-secondary"><ArrowLeft className="h-4 w-4" /> Retour</Link>}
            />

            <form onSubmit={submit} className="space-y-6">
                <section className="tc-card p-5">
                    <h2 className="mb-4 text-sm font-bold text-slate-900">Basique</h2>
                    <div className="grid gap-4 md:grid-cols-3">
                        <Field label="Client *" error={errors.client_id}>
                            <ClientPicker
                                value={data.client_id}
                                onChange={(value) => setData('client_id', value)}
                                onSelect={setSelectedClient}
                                initialOptions={clients}
                            />
                        </Field>
                        <Field label="Voiture" error={errors.vehicle_id} hint="Peut rester vide pour un contrat incomplet.">
                            <select className="tc-input" value={data.vehicle_id ?? ''} onChange={(e) => setData('vehicle_id', e.target.value)}>
                                <option value="">Non renseigné</option>
                                {vehicles.map((v) => <option key={v.id} value={v.id}>{v.display_name} - {v.plate_number}</option>)}
                            </select>
                        </Field>
                        <Field label="Agent" error={errors.employee_id}>
                            <select className="tc-input" value={data.employee_id ?? ''} onChange={(e) => setData('employee_id', e.target.value)}>
                                <option value="">Non renseigné</option>
                                {employees.map((e) => <option key={e.id} value={e.id}>{e.display_name}</option>)}
                            </select>
                        </Field>
                        <Field label="1er conducteur" error={errors.first_driver_id}>
                            <ClientPicker
                                value={data.first_driver_id}
                                onChange={(value) => setData('first_driver_id', value)}
                                initialOptions={clients}
                                placeholder="Rechercher un conducteur…"
                            />
                        </Field>
                        <Field label="2ème conducteur" error={errors.second_driver_id}>
                            <ClientPicker
                                value={data.second_driver_id}
                                onChange={(value) => setData('second_driver_id', value)}
                                initialOptions={clients}
                                placeholder="Rechercher un conducteur…"
                            />
                        </Field>
                        <label className="flex items-center gap-2 self-end rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700">
                            <input type="checkbox" checked={data.client_is_main_driver} onChange={(e) => setData('client_is_main_driver', e.target.checked)} />
                            Le client est le conducteur principal
                        </label>
                    </div>
                    {selectedClient && (
                        <div className="mt-4 rounded-xl border border-brand-100 bg-brand-50/60 p-3 text-sm" data-testid="selected-client-details">
                            <div className="font-semibold text-brand-900">Coordonnées du client sélectionné</div>
                            <div className="mt-2 grid gap-2 sm:grid-cols-2">
                                <div><span className="text-slate-500">Téléphone : </span>{selectedClient.phone ?? 'Non renseigné'}</div>
                                <div><span className="text-slate-500">Adresse : </span>{selectedClient.address ?? 'Non renseignée'}</div>
                            </div>
                            <div className="mt-1 text-xs text-slate-500"></div>
                        </div>
                    )}
                </section>

                <div className="grid gap-6 lg:grid-cols-2">
                    <section className="tc-card p-5">
                        <h2 className="mb-4 text-sm font-bold text-slate-900">Départ</h2>
                        <div className="grid gap-4">
                            <Field label="Date de départ *" error={errors.departure_at}>
                                <input type="datetime-local" className="tc-input" value={data.departure_at} onChange={(e) => setData('departure_at', e.target.value)} />
                            </Field>
                            <Field label="Lieu de départ"><input className="tc-input" value={data.departure_place} onChange={(e) => setData('departure_place', e.target.value)} /></Field>
                            <Field label="Km au départ"><input type="number" className="tc-input" value={data.departure_km} onChange={(e) => setData('departure_km', e.target.value)} /></Field>
                        </div>
                    </section>

                    <section className="tc-card p-5">
                        <h2 className="mb-4 text-sm font-bold text-slate-900">Retour</h2>
                        <div className="grid gap-4">
                            <Field label="Date de retour *" error={errors.return_at}>
                                <input type="datetime-local" className="tc-input" value={data.return_at} onChange={(e) => setData('return_at', e.target.value)} />
                            </Field>
                            <Field label="Lieu de retour"><input className="tc-input" value={data.return_place} onChange={(e) => setData('return_place', e.target.value)} /></Field>
                            <Field label="Km au retour"><input type="number" className="tc-input" value={data.return_km} onChange={(e) => setData('return_km', e.target.value)} /></Field>
                        </div>
                    </section>
                </div>

                <section className="tc-card p-5">
                    <h2 className="mb-4 text-sm font-bold text-slate-900">Réglement</h2>
                    <div className="grid gap-4 md:grid-cols-4">
                        <Field label="Prix par jour *" error={errors.daily_rate}>
                            <input type="number" className="tc-input" value={data.daily_rate} onChange={(e) => { setData('daily_rate', e.target.value); recompute(e.target.value, data.days); }} />
                        </Field>
                        <Field label="Nombre de jours *" error={errors.days}>
                            <input type="number" className="tc-input" value={data.days} onChange={(e) => { setData('days', e.target.value); recompute(data.daily_rate, e.target.value); }} />
                        </Field>
                        <Field label="Prix total *" error={errors.total_amount}>
                            <input type="number" className="tc-input" value={data.total_amount} onChange={(e) => setData('total_amount', e.target.value)} />
                        </Field>
                        <Field label="Caution"><select className="tc-input" value={data.caution_type} onChange={(e) => setData('caution_type', e.target.value)}><option value="">Non renseigné</option><option value="cheque">Ch.</option><option value="visa">Visa</option><option value="passeport">Passeport</option></select></Field>
                        <Field label="Montant caution"><input type="number" className="tc-input" value={data.deposit} onChange={(e) => setData('deposit', e.target.value)} /></Field>
                        <Field label="Franchise"><input type="number" className="tc-input" value={data.deductible} onChange={(e) => setData('deductible', e.target.value)} /></Field>
                        <Field label="Première tranche" hint="Crée un paiement si > 0.">
                            <input type="number" className="tc-input" value={data.first_payment_amount} onChange={(e) => setData('first_payment_amount', e.target.value)} />
                        </Field>
                        <Field label="Mode de paiement">
                            <select className="tc-input" value={data.first_payment_method} onChange={(e) => setData('first_payment_method', e.target.value)}>
                                {methods.map((m) => <option key={m} value={m}>{m}</option>)}
                            </select>
                        </Field>
                        <Field label="Note"><textarea className="tc-input" rows={2} value={data.note} onChange={(e) => setData('note', e.target.value)} /></Field>
                    </div>
                    <div className="mt-3 text-xs text-slate-500">Total : <span className="font-semibold text-slate-800">{money(data.total_amount || 0)}</span></div>
                </section>

                <div className="flex justify-end gap-2">
                    <Link href="/contracts" className="tc-btn-secondary">Annuler</Link>
                    <button className="tc-btn-primary" disabled={processing}><Save className="h-4 w-4" /> {processing ? 'Enregistrement…' : 'Enregistrer'}</button>
                </div>
            </form>
        </AppLayout>
    );
}
