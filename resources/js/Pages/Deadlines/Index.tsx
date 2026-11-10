import { Head, useForm } from '@inertiajs/react';
import { CheckCircle2, Plus, Save } from 'lucide-react';
import { useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { FilterBar } from '@/components/FilterForm';
import { VirtualDataList, type VirtualColumn } from '@/components/VirtualDataList';
import { Badge, Field, Modal, PageHeader } from '@/components/ui';
import { date } from '@/lib/utils';

type Status = { code: string; label: string; tone: string; detail: string };
type Deadline = {
    id: number; vehicle_id: number; vehicle: string | null; plate: string | null; title: string; type: string | null;
    due_date: string | null; due_km: string | null; completed_at: string | null; completed_by: string | null;
    completion_note: string | null; status: Status;
};
type Vehicle = { id: number; display_name: string; plate_number: string | null; km: string | null };
type Type = { id: number; name: string };
type Rule = { id: number; maintenance_type_id: number; name: string; alert_days: number; alert_km: string };

function toneClass(tone: string) {
    if (tone === 'red') return 'bg-rose-50 text-rose-700 border-rose-200';
    if (tone === 'orange') return 'bg-amber-50 text-amber-800 border-amber-200';
    return 'bg-emerald-50 text-emerald-700 border-emerald-200';
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
                className="h-4 w-4 rounded border-slate-300 text-brand-700 focus:ring-brand-300 disabled:opacity-60"
            />
            <Modal open={open} onClose={() => setOpen(false)} title="Confirmer l’échéance" footer={
                <>
                    <button className="tc-btn-secondary" onClick={() => setOpen(false)}>Annuler</button>
                    <button className="tc-btn-primary" disabled={form.processing} onClick={() => form.post(`/deadlines/${deadline.id}/complete`, { preserveScroll: true, onSuccess: () => setOpen(false) })}><CheckCircle2 className="h-4 w-4" /> Confirmer</button>
                </>
            }>
                <div className="space-y-3">
                    <div className="rounded-xl bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-800">{deadline.title} - {deadline.vehicle}</div>
                    <Field label="Date de réalisation"><input type="date" className="tc-input" value={form.data.completed_at} onChange={(event) => form.setData('completed_at', event.target.value)} /></Field>
                    <Field label="Note"><textarea className="tc-input" rows={2} value={form.data.note} onChange={(event) => form.setData('note', event.target.value)} /></Field>
                    <div className="grid gap-3 sm:grid-cols-2">
                        <Field label="Nouvelle date"><input type="date" className="tc-input" value={form.data.next_due_date} onChange={(event) => form.setData('next_due_date', event.target.value)} /></Field>
                        <Field label="Nouveau kilométrage"><input type="number" className="tc-input" value={form.data.next_due_km} onChange={(event) => form.setData('next_due_km', event.target.value)} /></Field>
                    </div>
                </div>
            </Modal>
        </>
    );
}

export default function DeadlinesIndex({ rows, counts, filters, vehicles, types, rules, canUpdate, canCreate, canManageRules }: {
    rows: Deadline[]; counts: Record<string, number>; filters: Record<string, string>; vehicles: Vehicle[]; types: Type[]; rules: Rule[];
    canUpdate: boolean; canCreate: boolean; canManageRules: boolean;
}) {
    const create = useForm({ vehicle_id: '', maintenance_type_id: '', title: '', due_date: '', due_km: '' });
    const rulesForm = useForm({ rules: rules.map((rule) => ({ maintenance_type_id: rule.maintenance_type_id, alert_days: rule.alert_days, alert_km: rule.alert_km })) });

    const columns: VirtualColumn<Deadline>[] = [
        { key: 'vehicle', label: 'Véhicule', width: '220px', sortValue: (row) => row.vehicle ?? '', render: (row) => <span className="font-semibold text-brand-800">{row.vehicle}</span> },
        { key: 'title', label: 'Échéance', width: '180px', render: (row) => row.title },
        { key: 'due', label: 'Date / Km', width: '150px', sortValue: (row) => row.due_date ?? row.due_km ?? '', render: (row) => row.due_date ? date(row.due_date) : row.due_km ? `${Number(row.due_km).toLocaleString('fr-FR')} km` : '-' },
        { key: 'status', label: 'État', width: '190px', sortValue: (row) => row.status.code, render: (row) => <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${toneClass(row.status.tone)}`} title={row.status.detail}>{row.status.label}{row.status.detail && row.status.detail !== row.status.label ? <span className="font-normal"> {row.status.detail}</span> : null}</span> },
        { key: 'completed', label: 'Réalisation', width: '170px', render: (row) => row.completed_at ? `${date(row.completed_at)}${row.completed_by ? ` - ${row.completed_by}` : ''}` : '-' },
    ];

    return (
        <AppLayout>
            <Head title="Échéances" />
            <PageHeader title="Échéances" />
            <div className="mb-4 grid gap-3 sm:grid-cols-4">
                <div className="tc-card p-3"><div className="text-xs font-semibold uppercase text-rose-700">Dépassées</div><div className="text-2xl font-black text-rose-700">{counts.overdue}</div></div>
                <div className="tc-card p-3"><div className="text-xs font-semibold uppercase text-amber-700">Proches</div><div className="text-2xl font-black text-amber-700">{counts.soon}</div></div>
                <div className="tc-card p-3"><div className="text-xs font-semibold uppercase text-emerald-700">À jour</div><div className="text-2xl font-black text-emerald-700">{counts.up_to_date}</div></div>
                <div className="tc-card p-3"><div className="text-xs font-semibold uppercase text-slate-500">Traitées</div><div className="text-2xl font-black text-slate-700">{counts.done}</div></div>
            </div>

            <FilterBar action="/deadlines" filters={filters} searchPlaceholder="Véhicule, immatriculation, libellé, catégorie" resultCount={rows.length}>
                <select name="status" aria-label="Statut" defaultValue={filters.status ?? ''} className="tc-input"><option value="">Tous les statuts</option><option value="overdue">Dépassées</option><option value="soon">Proches</option><option value="up_to_date">À jour</option><option value="done">Traitées</option></select>
                <select name="vehicle_id" aria-label="Véhicule" defaultValue={filters.vehicle_id ?? ''} className="tc-input"><option value="">Tous les véhicules</option>{vehicles.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.display_name}{vehicle.plate_number ? ` - ${vehicle.plate_number}` : ''}</option>)}</select>
                <select name="type_id" aria-label="Catégorie" defaultValue={filters.type_id ?? ''} className="tc-input"><option value="">Toutes catégories</option>{types.map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}</select>
            </FilterBar>

            {canCreate && <details className="tc-card mb-4 p-4">
                <summary className="cursor-pointer text-sm font-semibold text-brand-800">Nouvelle échéance</summary>
                <form onSubmit={(event) => { event.preventDefault(); create.post('/deadlines', { preserveScroll: true, onSuccess: () => create.reset() }); }} className="mt-4 grid gap-3 md:grid-cols-3">
                    <Field label="Véhicule"><select name="vehicle_id" className="tc-input" value={create.data.vehicle_id} onChange={(event) => create.setData('vehicle_id', event.target.value)}><option value="">-</option>{vehicles.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.display_name}{vehicle.plate_number ? ` - ${vehicle.plate_number}` : ''}</option>)}</select></Field>
                    <Field label="Type"><select name="maintenance_type_id" className="tc-input" value={create.data.maintenance_type_id} onChange={(event) => create.setData('maintenance_type_id', event.target.value)}><option value="">-</option>{types.map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}</select></Field>
                    <Field label="Libellé"><input name="title" className="tc-input" value={create.data.title} onChange={(event) => create.setData('title', event.target.value)} /></Field>
                    <Field label="Date"><input name="due_date" type="date" className="tc-input" value={create.data.due_date} onChange={(event) => create.setData('due_date', event.target.value)} /></Field>
                    <Field label="Kilométrage"><input name="due_km" type="number" className="tc-input" value={create.data.due_km} onChange={(event) => create.setData('due_km', event.target.value)} /></Field>
                    <div className="flex items-end"><button className="tc-btn-primary" disabled={create.processing}><Plus className="h-4 w-4" /> Ajouter</button></div>
                </form>
            </details>}

            <VirtualDataList rows={rows} columns={columns} rowKey={(row) => row.id} href={(row) => `/vehicles/${row.vehicle_id}`} totalLabel={`${rows.length} échéances`} actionsWidth="90px" actions={(row) => <CompleteCheck deadline={row} canUpdate={canUpdate} />} empty={<div className="px-4 py-6 text-sm text-slate-500">Aucun résultat</div>} />

            {canManageRules && <details className="tc-card mt-4 p-4">
                <summary className="cursor-pointer text-sm font-semibold text-brand-800">Seuils d’alerte</summary>
                <form onSubmit={(event) => { event.preventDefault(); rulesForm.put('/settings/deadlines/rules', { preserveScroll: true }); }} className="mt-4 space-y-2">
                    {rules.map((rule, index) => <div key={rule.maintenance_type_id} className="grid items-end gap-2 sm:grid-cols-4">
                        <div className="text-sm font-semibold text-slate-700">{rule.name}</div>
                        <Field label="Jours"><input type="number" className="tc-input" value={rulesForm.data.rules[index]?.alert_days ?? 30} onChange={(event) => rulesForm.setData('rules', rulesForm.data.rules.map((item, i) => i === index ? { ...item, alert_days: Number(event.target.value) } : item))} /></Field>
                        <Field label="Km"><input type="number" className="tc-input" value={rulesForm.data.rules[index]?.alert_km ?? 500} onChange={(event) => rulesForm.setData('rules', rulesForm.data.rules.map((item, i) => i === index ? { ...item, alert_km: event.target.value } : item))} /></Field>
                        <div />
                    </div>)}
                    <div className="flex justify-end"><button className="tc-btn-primary" disabled={rulesForm.processing}><Save className="h-4 w-4" /> Enregistrer</button></div>
                </form>
            </details>}
        </AppLayout>
    );
}
