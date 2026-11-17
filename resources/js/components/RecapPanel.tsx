import { useForm } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { Field, Modal } from '@/components/ui';

type Deadline = {
    id: number;
    title: string;
    vehicle: string;
    plate: string | null;
    due_date: string | null;
    due_km: string | null;
    status: { code: string; label: string; tone: string; detail: string };
    can_complete: boolean;
};
type Counts = { overdue: number; soon: number; up_to_date: number; done: number };
type Recap = { deadlines: { counts: Counts; items: Deadline[] }; refreshed_at: string };

function alertClass(toneName: string): string {
    if (toneName === 'red') return 'al-alert-red';
    if (toneName === 'orange') return 'al-alert-orange';
    return 'al-alert-green';
}

function alertText(item: Deadline): string {
    if (item.status.tone === 'red') {
        return `${item.title.toUpperCase()} pour ${item.vehicle} a été dépassé`;
    }
    if (item.status.tone === 'orange') {
        const detail = item.status.detail ? ` ${item.status.detail}` : '';
        return `${item.title.toUpperCase()} pour ${item.vehicle}${detail}`;
    }
    return `${item.title.toUpperCase()} pour ${item.vehicle}`;
}

export default function RecapPanel() {
    const [data, setData] = useState<Recap | null>(null);
    const [selected, setSelected] = useState<Deadline | null>(null);
    const form = useForm({ completed_at: new Date().toISOString().slice(0, 10), note: '', next_due_date: '', next_due_km: '' });

    const load = async () => {
        try {
            const response = await fetch('/recap', { headers: { Accept: 'application/json' }, credentials: 'same-origin' });
            if (!response.ok) throw new Error('recap failed');
            setData(await response.json());
        } catch {
            setData(null);
        }
    };

    useEffect(() => {
        load();
        const timer = window.setInterval(load, 60_000);
        return () => window.clearInterval(timer);
    }, []);

    const open = (deadline: Deadline) => {
        if (!deadline.can_complete) return;
        form.setData({ completed_at: new Date().toISOString().slice(0, 10), note: '', next_due_date: '', next_due_km: '' });
        setSelected(deadline);
    };

    const items = data?.deadlines?.items ?? [];

    return (
        <>
            <div className="al-alert-scroll" aria-label="Récapitulatif des échéances" data-testid="recap-panel">
                {items.map((item) => (
                    <div
                        key={item.id}
                        className={`al-alert-item ${alertClass(item.status.tone)}`}
                        onClick={() => open(item)}
                        data-testid={`deadline-${item.id}`}
                        title={item.can_complete ? 'Confirmer la réalisation' : item.status.label}
                    >
                        {alertText(item)}
                    </div>
                ))}
                {!items.length && <div className="al-alert-empty">Aucune alerte</div>}
            </div>

            <Modal open={Boolean(selected)} onClose={() => setSelected(null)} title="Confirmer l'échéance" footer={
                <>
                    <button className="al-button" onClick={() => setSelected(null)}>Annuler</button>
                    <button className="al-button al-button-primary" disabled={form.processing} onClick={() => {
                        if (!selected) return;
                        form.post(`/deadlines/${selected.id}/complete`, { preserveScroll: true, onSuccess: () => { setSelected(null); load(); } });
                    }}>Confirmer</button>
                </>
            }>
                {selected && <div className="al-form-table">
                    <div style={{ padding: '3px 0', fontWeight: 'bold' }}>{selected.title} - {selected.vehicle}</div>
                    <Field label="Date de réalisation"><input type="date" value={form.data.completed_at} onChange={(event) => form.setData('completed_at', event.target.value)} /></Field>
                    <Field label="Note"><textarea rows={2} value={form.data.note} onChange={(event) => form.setData('note', event.target.value)} /></Field>
                    <Field label="Nouvelle date"><input type="date" value={form.data.next_due_date} onChange={(event) => form.setData('next_due_date', event.target.value)} /></Field>
                    <Field label="Nouveau kilométrage"><input type="number" value={form.data.next_due_km} onChange={(event) => form.setData('next_due_km', event.target.value)} /></Field>
                </div>}
            </Modal>
        </>
    );
}
