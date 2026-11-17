import { Head, useForm } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { FilterBar } from '@/components/FilterForm';
import { VirtualDataList, type VirtualColumn } from '@/components/VirtualDataList';
import { Field, Modal } from '@/components/ui';
import { isoDate } from '@/lib/utils';

type Status = { code: string; label: string; tone: string; detail: string };
type Deadline = {
    id: number; vehicle_id: number; vehicle: string | null; plate: string | null; title: string; type: string | null;
    due_date: string | null; due_km: string | null; completed_at: string | null; completed_by: string | null;
    completion_note: string | null; status: Status;
};
type Vehicle = { id: number; display_name: string; plate_number: string | null; km: string | null };
type Type = { id: number; name: string };
type Rule = { id: number; maintenance_type_id: number; name: string; alert_days: number; alert_km: string };

function statusClass(tone: string) {
    if (tone === 'red') return 'al-status-red';
    if (tone === 'orange') return 'al-status-orange';
    return 'al-status-green';
}

function CompleteCheck({ deadline, canUpdate }: { deadline: Deadline; canUpdate: boolean }) {
    const [open, setOpen] = useState(false);
    const form = useForm({ completed_at: new Date().toISOString().slice(0, 10), note: '', next_due_date: '', next_due_km: '' });
    const done = Boolean(deadline.completed_at);
    return (
        <>
            <input
                type="checkbox"
                checked={done}
                disabled={!canUpdate || done}
                aria-label={`Traiter ${deadline.title}`}
                title={!canUpdate ? 'Permission requise' : done ? 'Échéance traitée' : 'Confirmer la réalisation'}
                onChange={() => setOpen(true)}
            />
            <Modal open={open} onClose={() => setOpen(false)} title="Confirmer l'échéance" footer={
                <>
                    <button className="al-button" onClick={() => setOpen(false)}>Annuler</button>
                    <button className="al-button al-button-primary" disabled={form.processing} onClick={() => form.post(`/deadlines/${deadline.id}/complete`, { preserveScroll: true, onSuccess: () => setOpen(false) })}>Confirmer</button>
                </>
            }>
                <div className="al-form-table" style={{ display: 'table' }}>
                    <div style={{ padding: '3px 0', fontWeight: 'bold' }}>{deadline.title} - {deadline.vehicle}</div>
                    <Field label="Date de réalisation"><input type="date" value={form.data.completed_at} onChange={(event) => form.setData('completed_at', event.target.value)} /></Field>
                    <Field label="Note"><textarea rows={2} value={form.data.note} onChange={(event) => form.setData('note', event.target.value)} /></Field>
                    <Field label="Nouvelle date"><input type="date" value={form.data.next_due_date} onChange={(event) => form.setData('next_due_date', event.target.value)} /></Field>
                    <Field label="Nouveau kilométrage"><input type="number" value={form.data.next_due_km} onChange={(event) => form.setData('next_due_km', event.target.value)} /></Field>
                </div>
            </Modal>
        </>
    );
}

export default function DeadlinesIndex({ rows, filters, vehicles, types, rules, canUpdate, canCreate, canManageRules }: {
    rows: Deadline[]; counts: Record<string, number>; filters: Record<string, string>; vehicles: Vehicle[]; types: Type[]; rules: Rule[];
    canUpdate: boolean; canCreate: boolean; canManageRules: boolean;
}) {
    const create = useForm({ vehicle_id: '', maintenance_type_id: '', title: '', due_date: '', due_km: '' });
    const rulesForm = useForm({ rules: rules.map((rule) => ({ maintenance_type_id: rule.maintenance_type_id, alert_days: rule.alert_days, alert_km: rule.alert_km })) });

    const columns: VirtualColumn<Deadline>[] = [
        { key: 'id', label: 'N°', width: '55px', sortValue: (row) => row.id, render: (row) => row.id },
        { key: 'vehicle', label: 'VOITURE', width: '230px', sortValue: (row) => row.vehicle ?? '', render: (row) => row.vehicle ?? '' },
        { key: 'type', label: 'TYPE', width: '150px', sortValue: (row) => row.type ?? row.title, render: (row) => row.type ?? row.title },
        { key: 'due', label: 'ECHEANCE', width: '150px', sortValue: (row) => row.due_date ?? row.due_km ?? '', render: (row) => row.due_date ? isoDate(row.due_date) : row.due_km ? `${Number(row.due_km).toLocaleString('fr-FR')} km` : '-' },
        { key: 'status', label: 'ETAT', width: '170px', render: (row) => <span className={statusClass(row.status.tone)}>{row.status.label}{row.status.detail && row.status.detail !== row.status.label ? ` ${row.status.detail}` : ''}</span> },
        { key: 'completed', label: 'REALISATION', width: '150px', render: (row) => row.completed_at ? isoDate(row.completed_at) : '-' },
    ];

    return (
        <AppLayout>
            <Head title="Paramétrage" />

            <FilterBar
                action="/deadlines"
                filters={filters}
                fields={[
                    { name: 'q', label: 'Voiture' },
                    { name: 'type_id', label: 'Type', options: [{ value: '', label: 'Tous' }, ...types.map((type) => ({ value: String(type.id), label: type.name }))] },
                    { name: 'status', label: 'Etat', options: [
                        { value: '', label: 'Tous' },
                        { value: 'overdue', label: 'Dépassées' },
                        { value: 'soon', label: 'Proches' },
                        { value: 'up_to_date', label: 'À jour' },
                        { value: 'done', label: 'Traitées' },
                    ] },
                ]}
            />

            {canCreate && (
                <form onSubmit={(event) => { event.preventDefault(); create.post('/deadlines', { preserveScroll: true, onSuccess: () => create.reset() }); }}>
                    <table className="al-form-table" style={{ marginTop: 4 }}>
                        <tbody>
                            <tr>
                                <td className="al-form-label"><span className="al-triangle">&#9654;</span>Voiture</td>
                                <td>
                                    <select value={create.data.vehicle_id} onChange={(event) => create.setData('vehicle_id', event.target.value)}>
                                        <option value="">-</option>
                                        {vehicles.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.display_name}{vehicle.plate_number ? ` - ${vehicle.plate_number}` : ''}</option>)}
                                    </select>
                                </td>
                                <td className="al-form-label" style={{ width: 60 }}>Type</td>
                                <td>
                                    <select value={create.data.maintenance_type_id} onChange={(event) => create.setData('maintenance_type_id', event.target.value)}>
                                        <option value="">-</option>
                                        {types.map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}
                                    </select>
                                </td>
                            </tr>
                            <tr>
                                <td className="al-form-label"><span className="al-triangle">&#9654;</span>Libellé</td>
                                <td><input value={create.data.title} onChange={(event) => create.setData('title', event.target.value)} /></td>
                                <td className="al-form-label">Date</td>
                                <td><input type="date" value={create.data.due_date} onChange={(event) => create.setData('due_date', event.target.value)} /></td>
                            </tr>
                            <tr>
                                <td className="al-form-label"><span className="al-triangle">&#9654;</span>Kilométrage</td>
                                <td><input type="number" value={create.data.due_km} onChange={(event) => create.setData('due_km', event.target.value)} /></td>
                                <td />
                                <td className="al-form-actions"><button type="submit" className="al-button al-button-primary" disabled={create.processing}>{create.processing ? 'Enregistrement...' : 'Valider'}</button></td>
                            </tr>
                        </tbody>
                    </table>
                </form>
            )}

            <VirtualDataList
                rows={rows}
                columns={columns}
                rowKey={(row) => row.id}
                href={(row) => `/vehicles/${row.vehicle_id}`}
                totalLabel={`${rows.length} échéances`}
                actions={(row) => <CompleteCheck deadline={row} canUpdate={canUpdate} />}
                empty="Aucun résultat"
            />

            {canManageRules && (
                <details style={{ marginTop: 8 }}>
                    <summary style={{ cursor: 'pointer', font: '12px Tahoma' }}>Seuils d'alerte</summary>
                    <form onSubmit={(event) => { event.preventDefault(); rulesForm.put('/settings/deadlines/rules', { preserveScroll: true }); }}>
                        <table className="al-form-table">
                            <tbody>
                                {rules.map((rule, index) => (
                                    <tr key={rule.maintenance_type_id}>
                                        <td className="al-form-label">{rule.name}</td>
                                        <td>Jours <input type="number" style={{ width: 80 }} value={rulesForm.data.rules[index]?.alert_days ?? 30} onChange={(event) => rulesForm.setData('rules', rulesForm.data.rules.map((item, i) => i === index ? { ...item, alert_days: Number(event.target.value) } : item))} /></td>
                                        <td>Km <input type="number" style={{ width: 90 }} value={rulesForm.data.rules[index]?.alert_km ?? 500} onChange={(event) => rulesForm.setData('rules', rulesForm.data.rules.map((item, i) => i === index ? { ...item, alert_km: event.target.value } : item))} /></td>
                                    </tr>
                                ))}
                                <tr><td /><td colSpan={2}><button className="al-button" disabled={rulesForm.processing}>Enregistrer</button></td></tr>
                            </tbody>
                        </table>
                    </form>
                </details>
            )}
        </AppLayout>
    );
}
