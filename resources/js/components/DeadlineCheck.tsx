import { useForm } from '@inertiajs/react';
import { CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import { Field, Modal } from '@/components/ui';

export type DeadlineRow = {
    id: number;
    vehicle_id: number;
    vehicle: string | null;
    plate: string | null;
    title: string;
    type: string | null;
    due_date: string | null;
    due_km: string | null;
    completed_at: string | null;
    completed_by: string | null;
    completion_note: string | null;
    status: { code: string; label: string; tone: string; detail: string };
};

export default function DeadlineCheck({ deadline, canUpdate }: { deadline: DeadlineRow; canUpdate: boolean }) {
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
