import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import ClientPicker, { type ClientOption } from '@/components/ClientPicker';
import { amount } from '@/lib/utils';

type Option = { id: number; display_name?: string; name?: string; plate_number?: string; phone?: string; status?: string };

type Contract = {
    id: number; reference: string; client_id: number; vehicle_id: number | null;
    first_driver_id: number | null; second_driver_id: number | null; employee_id: number | null;
    client_is_main_driver: boolean; departure_at: string; departure_place: string | null; departure_km: string | null;
    return_at: string; return_place: string | null; return_km: string | null;
    daily_rate: string; days: string; discount_per_day?: string | null; discount_amount?: string | null; vat_applicable?: boolean; total_amount: string; deposit: string | null; deductible: string | null; caution_type: string | null; note: string | null;
    paid_amount_recorded?: string | null;
    client?: ClientOption;
    first_driver?: ClientOption;
    second_driver?: ClientOption;
    firstDriver?: ClientOption;
    secondDriver?: ClientOption;
};

function toLocal(value: string | null | undefined) {
    if (!value) return '';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '';
    const parts = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Africa/Casablanca',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
    }).formatToParts(d);
    const get = (type: string) => parts.find((part) => part.type === type)?.value ?? '';
    return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}`;
}

function splitDateTime(value: string): { date: string; time: string } {
    const [date = '', time = ''] = (value || '').split('T');
    return { date, time: time.slice(0, 5) };
}

function joinDateTime(date: string, time: string): string {
    return `${date}T${time || '00:00'}`;
}

function personName(person: ClientOption | null): { last: string; first: string } {
    if (!person) return { last: '', first: '' };
    return {
        last: person.last_name || person.display_name || '',
        first: person.first_name || '',
    };
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <label className="al-contract-field">
            <span>{label}</span>
            {children}
        </label>
    );
}

function PersonFields({ person }: { person: ClientOption | null }) {
    const name = personName(person);
    const identityType = (person?.identity_document_type ?? '').toLowerCase();
    const isPassport = identityType === 'passport' || identityType === 'passeport';
    const isCin = !isPassport;

    return (
        <div className="al-contract-person-grid">
            <Field label="Nom"><input value={name.last} readOnly /></Field>
            <Field label="Prénom"><input value={name.first} readOnly /></Field>
            <Field label="Adresse"><input value={person?.address ?? ''} readOnly /></Field>
            <Field label="TEL"><input value={person?.phone ?? ''} readOnly /></Field>
            <Field label="Nationalité"><input value={person?.country_name ?? person?.country?.name ?? ''} readOnly /></Field>
            <Field label="CIN"><input value={isCin ? (person?.identity_number ?? '') : ''} readOnly /></Field>
            <Field label="Passeport"><input value={isPassport ? (person?.identity_number ?? '') : ''} readOnly /></Field>
            <Field label="Permis"><input value={person?.license_number ?? ''} readOnly /></Field>
        </div>
    );
}

export default function ContractForm({ contract, clients, vehicles, employees, methods }: { contract: Contract | null; clients: Option[]; vehicles: Option[]; employees: Option[]; methods: string[] }) {
    const initialClient = contract?.client ?? null;
    const [selectedClient, setSelectedClient] = useState<ClientOption | null>(initialClient);
    const [driver1, setDriver1] = useState<ClientOption | null>(contract?.first_driver ?? contract?.firstDriver ?? (contract?.client_is_main_driver ? initialClient : null));
    const [driver2, setDriver2] = useState<ClientOption | null>(contract?.second_driver ?? contract?.secondDriver ?? null);
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
        discount_per_day: contract?.discount_per_day ?? '',
        discount_amount: contract?.discount_amount ?? '',
        vat_applicable: contract?.vat_applicable ?? false,
        total_amount: contract?.total_amount ?? '',
        deposit: contract?.deposit ?? '',
        deductible: contract?.deductible ?? '',
        caution_type: contract?.caution_type ?? '',
        note: contract?.note ?? '',
        first_payment_amount: '',
        first_payment_method: 'espece',
    });

    const departure = splitDateTime(data.departure_at);
    const returnDate = splitDateTime(data.return_at);
    const pickerOptions = [selectedClient, driver1, driver2, ...clients]
        .filter((person): person is ClientOption => Boolean(person))
        .filter((person, index, all) => all.findIndex((entry) => entry.id === person.id) === index);
    const advance = contract ? Number(contract.paid_amount_recorded || 0) : Number(data.first_payment_amount || 0);
    const remaining = Math.max(0, Number(data.total_amount || 0) - advance);
    const gross = Number(data.daily_rate || 0) * Number(data.days || 0);
    const discountTotal = Number(data.discount_per_day || 0) * Number(data.days || 0) + Number(data.discount_amount || 0);
    const subtotal = Math.max(0, gross - discountTotal);

    function submit(e: React.FormEvent) {
        e.preventDefault();
        if (contract) put(`/contracts/${contract.id}`);
        else post('/contracts');
    }

    function recompute(overrides: Partial<{ daily_rate: string; days: string; discount_per_day: string; discount_amount: string; vat_applicable: boolean }>) {
        const next = { ...data, ...overrides };
        const grossAmount = Number(next.daily_rate || 0) * Number(next.days || 0);
        const discountAmount = Number(next.discount_per_day || 0) * Number(next.days || 0) + Number(next.discount_amount || 0);
        const net = Math.max(0, grossAmount - discountAmount);
        const total = net * (next.vat_applicable ? 1.2 : 1);
        setData((current) => ({ ...current, ...overrides, total_amount: total ? String(Number(total.toFixed(2))) : '' }));
    }

    function chooseClient(client: ClientOption | null) {
        setSelectedClient(client);
        if (!client) {
            setData('client_id', '');
            if (driver1?.id === selectedClient?.id) {
                setDriver1(null);
                setData('first_driver_id', '');
                setData('client_is_main_driver', false);
            }
            return;
        }
        setData('client_id', String(client.id));
        if (!driver1) {
            setDriver1(client);
            setData('first_driver_id', String(client.id));
            setData('client_is_main_driver', true);
        }
    }

    function sameAsClient() {
        if (!selectedClient) return;
        setDriver1(selectedClient);
        setData('first_driver_id', String(selectedClient.id));
        setData('client_is_main_driver', true);
    }

    function chooseDriver(value: string, slot: 1 | 2) {
        if (slot === 1) {
            setData('first_driver_id', value);
            if (!value) setDriver1(null);
            if (value && String(value) !== String(data.client_id)) setData('client_is_main_driver', false);
        } else {
            setData('second_driver_id', value);
            if (!value) setDriver2(null);
        }
    }

    return (
        <AppLayout>
            <Head title={contract ? `Modifier ${contract.reference}` : 'Nouvelle location'} />
            <form onSubmit={submit} className="al-contract-sheet">
                <div className="al-contract-top">
                    <div><strong>Numéro contrat :</strong> {contract?.reference ?? 'Nouveau'}</div>
                    <div>
                        {contract ? <Link href={`/contracts/${contract.id}`}>Modifier Contrat</Link> : <span>Nouveau contrat</span>}
                    </div>
                </div>

                <div className="al-contract-toolbar">
                    <Field label="Immatricule">
                        <select value={data.vehicle_id ?? ''} onChange={(e) => setData('vehicle_id', e.target.value)}>
                            <option value="">Non renseigné</option>
                            {vehicles.map((v) => <option key={v.id} value={v.id}>{v.display_name} - {v.plate_number}</option>)}
                        </select>
                    </Field>
                    <Field label="Agent">
                        <select value={data.employee_id ?? ''} onChange={(e) => setData('employee_id', e.target.value)}>
                            <option value="">Non renseigné</option>
                            {employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.display_name}</option>)}
                        </select>
                    </Field>
                    {errors.client_id && <div className="al-contract-error">{errors.client_id}</div>}
                    {errors.vehicle_id && <div className="al-contract-error">{errors.vehicle_id}</div>}
                </div>

                <div className="al-contract-main">
                    <div className="al-contract-left">
                        <div className="al-contract-section">LIVRAISON</div>
                        <div className="al-contract-fields">
                            <Field label="Lieu"><input value={data.departure_place} onChange={(e) => setData('departure_place', e.target.value)} /></Field>
                            <Field label="Date"><input type="date" value={departure.date} onChange={(e) => setData('departure_at', joinDateTime(e.target.value, departure.time))} /></Field>
                            <Field label="Heure"><input type="time" value={departure.time} onChange={(e) => setData('departure_at', joinDateTime(departure.date, e.target.value))} /></Field>
                            <Field label="Km Dép."><input type="number" value={data.departure_km} onChange={(e) => setData('departure_km', e.target.value)} /></Field>
                        </div>

                        <div className="al-contract-section">REPRISE</div>
                        <div className="al-contract-fields">
                            <Field label="Lieu"><input value={data.return_place} onChange={(e) => setData('return_place', e.target.value)} /></Field>
                            <Field label="Date"><input type="date" value={returnDate.date} onChange={(e) => setData('return_at', joinDateTime(e.target.value, returnDate.time))} /></Field>
                            <Field label="Heure"><input type="time" value={returnDate.time} onChange={(e) => setData('return_at', joinDateTime(returnDate.date, e.target.value))} /></Field>
                            <Field label="Km Retour"><input type="number" value={data.return_km} onChange={(e) => setData('return_km', e.target.value)} /></Field>
                        </div>
                    </div>

                    <div className="al-contract-right">
                        <div className="al-contract-section">RÈGLEMENT</div>
                        <div className="al-contract-payment">
                            <div className="al-contract-radio"><label><input type="radio" checked readOnly /> Par jour</label><label className="al-contract-disabled"><input type="radio" disabled /> Par mois</label></div>
                            <div className="al-contract-fields al-contract-fields-2">
                                <Field label="Nombre"><input type="number" value={data.days} onChange={(e) => recompute({ days: e.target.value })} /></Field>
                                <Field label="Tarif d'unité"><input type="number" value={data.daily_rate} onChange={(e) => recompute({ daily_rate: e.target.value })} /></Field>
                                <Field label="Remise / jour"><input type="number" value={data.discount_per_day} onChange={(e) => recompute({ discount_per_day: e.target.value })} /></Field>
                                <Field label="Remise montant"><input type="number" value={data.discount_amount} onChange={(e) => recompute({ discount_amount: e.target.value })} /></Field>
                                <Field label="Total H.T."><input value={subtotal.toFixed(2)} readOnly /></Field>
                                <Field label="TVA 20%"><input type="checkbox" className="al-contract-checkbox" checked={Boolean(data.vat_applicable)} onChange={(e) => recompute({ vat_applicable: e.target.checked })} /></Field>
                                <Field label="Total TTC"><input value={data.total_amount} readOnly /></Field>
                                <Field label="Franchise"><input type="number" value={data.deductible} onChange={(e) => setData('deductible', e.target.value)} /></Field>
                            </div>
                            <div className="al-contract-caution">
                                <span>Caution :</span>
                                {[['cheque', 'Ch.'], ['visa', 'Visa'], ['passeport', 'Passeport']].map(([value, label]) => (
                                    <label key={value}><input type="radio" name="caution_type" checked={data.caution_type === value} onChange={() => setData('caution_type', value)} /> {label}</label>
                                ))}
                            </div>
                            <div className="al-contract-fields al-contract-fields-2">
                                <Field label={contract ? 'Payé enregistré' : 'Avance'}>
                                    <input
                                        type="number"
                                        value={contract ? (contract.paid_amount_recorded ?? '') : data.first_payment_amount}
                                        readOnly={Boolean(contract)}
                                        onChange={(e) => setData('first_payment_amount', e.target.value)}
                                    />
                                </Field>
                                <Field label="Reste"><input value={remaining.toFixed(2)} readOnly /></Field>
                                <Field label="Mode"><select value={data.first_payment_method} onChange={(e) => setData('first_payment_method', e.target.value)}>{methods.map((method) => <option key={method} value={method}>{method}</option>)}</select></Field>
                                <Field label="Caution"><input type="number" value={data.deposit} onChange={(e) => setData('deposit', e.target.value)} /></Field>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="al-contract-section">LOCATAIRE</div>
                <div className="al-contract-person">
                    <div className="al-contract-picker"><ClientPicker value={data.client_id} onChange={(value) => { if (!value) chooseClient(null); }} onSelect={chooseClient} initialOptions={pickerOptions} placeholder="Rechercher un client..." /></div>
                    <PersonFields person={selectedClient} />
                </div>

                <div className="al-contract-section al-contract-section-with-action">
                    <span>CONDUCTEUR 1</span>
                    <button type="button" onClick={sameAsClient} disabled={!selectedClient}>Même locataire</button>
                </div>
                <div className="al-contract-person">
                    <div className="al-contract-picker"><ClientPicker value={data.first_driver_id} onChange={(value) => chooseDriver(value, 1)} onSelect={(person) => { setDriver1(person); setData('client_is_main_driver', String(person.id) === String(data.client_id)); }} initialOptions={pickerOptions} placeholder="Rechercher un conducteur..." /></div>
                    <PersonFields person={driver1} />
                </div>

                <div className="al-contract-section">CONDUCTEUR 2</div>
                <div className="al-contract-person">
                    <div className="al-contract-picker"><ClientPicker value={data.second_driver_id} onChange={(value) => chooseDriver(value, 2)} onSelect={setDriver2} initialOptions={pickerOptions} placeholder="Rechercher un conducteur..." /></div>
                    <PersonFields person={driver2} />
                </div>

                <div className="al-contract-note">
                    <Field label="Note"><textarea rows={2} value={data.note} onChange={(e) => setData('note', e.target.value)} /></Field>
                </div>

                <div className="al-contract-actions">
                    <div className="al-contract-total">Total : <strong>{amount(data.total_amount || 0)} MAD</strong></div>
                    <div>
                        <Link href="/contracts" className="al-button">Annuler</Link>
                        <button type="submit" className="al-button al-button-primary" disabled={processing}>{processing ? 'Enregistrement...' : 'Valider'}</button>
                    </div>
                </div>
            </form>
        </AppLayout>
    );
}
