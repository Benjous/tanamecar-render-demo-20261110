import { router, useForm } from '@inertiajs/react';
import { CheckCircle2 } from 'lucide-react';
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

function tone(toneName: string) {
    if (toneName === 'red') return 'border-rose-200 bg-rose-50 text-rose-900';
    if (toneName === 'orange') return 'border-amber-200 bg-amber-50 text-amber-900';
    return 'border-emerald-200 bg-emerald-50 text-emerald-900';
}

export default function RecapPanel() {
    const [data, setData] = useState<Recap | null>(null);
    const [failed, setFailed] = useState(false);
    const [selected, setSelected] = useState<Deadline | null>(null);
    const form = useForm({ completed_at: new Date().toISOString().slice(0, 10), note: '', next_due_date: '', next_due_km: '' });

    const load = async () => {
        try {
            const response = await fetch('/recap', { headers: { Accept: 'application/json' }, credentials: 'same-origin' });
            if (!response.ok) throw new Error('recap failed');
            const payload = await response.json();
            setData(payload);
            setFailed(false);
        } catch {
            setFailed(true);
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

    const counts = data?.deadlines?.counts ?? { overdue: 0, soon: 0, up_to_date: 0, done: 0 };
    const items = data?.deadlines?.items ?? [];

    return (
        <aside className="w-full xl:w-56 xl:shrink-0" aria-label="Récapitulatif des échéances">
            <div className="space-y-3 xl:sticky xl:top-32">
                <div className="tc-card p-3">
                    <div className="flex items-center justify-between gap-2">
                        <h2 className="text-sm font-bold text-brand-900">Récapitulatif</h2>
                        <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] text-brand-700" data-testid="recap-refresh">60 s</span>
                    </div>
                    {failed && <div className="mt-2 text-xs text-rose-600">Rafraîchissement indisponible.</div>}
                    <div className="mt-3 grid grid-cols-2 gap-2">
                        <div className="rounded-lg border border-rose-200 bg-rose-50 px-2 py-1.5" data-testid="deadline-count-overdue"><div className="text-[10px] font-bold uppercase text-rose-700">Dépassées</div><div className="text-lg font-black text-rose-800">{counts.overdue}</div></div>
                        <div className="rounded-lg border border-amber-200 bg-amber-50 px-2 py-1.5" data-testid="deadline-count-soon"><div className="text-[10px] font-bold uppercase text-amber-800">Proches</div><div className="text-lg font-black text-amber-800">{counts.soon}</div></div>
                        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1.5" data-testid="deadline-count-up"><div className="text-[10px] font-bold uppercase text-emerald-700">À jour</div><div className="text-lg font-black text-emerald-800">{counts.up_to_date}</div></div>
                        <div className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5" data-testid="deadline-count-done"><div className="text-[10px] font-bold uppercase text-slate-500">Traitées</div><div className="text-lg font-black text-slate-700">{counts.done}</div></div>
                    </div>
                    <div className="mt-3 max-h-[55vh] space-y-2 overflow-y-auto pr-1 xl:max-h-[calc(100vh-300px)]">
                        {items.map((item) => (
                            <div key={item.id} className={`rounded-lg border px-2 py-2 ${tone(item.status.tone)}`} data-testid={`deadline-${item.id}`}>
                                <div className="flex items-start gap-2">
                                    <input
                                        type="checkbox"
                                        checked={false}
                                        disabled={!item.can_complete}
                                        onChange={() => open(item)}
                                        aria-label={`Traiter ${item.title}`}
                                        title={item.can_complete ? 'Confirmer la réalisation' : 'Permission requise'}
                                        className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded border-slate-300"
                                    />
                                    <div className="min-w-0">
                                        <div className="text-[11px] font-bold leading-4">{item.title}</div>
                                        <div className="overflow-hidden text-ellipsis whitespace-nowrap text-[10px] leading-4" title={item.vehicle}>{item.vehicle}</div>
                                        {item.status.detail && <div className="text-[10px] font-semibold">{item.status.detail}</div>}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {!items.length && <div className="text-xs text-slate-500">Aucun résultat</div>}
                    </div>
                </div>
            </div>

            <Modal open={Boolean(selected)} onClose={() => setSelected(null)} title="Confirmer l’échéance" footer={
                <>
                    <button className="tc-btn-secondary" onClick={() => setSelected(null)}>Annuler</button>
                    <button className="tc-btn-primary" disabled={form.processing} onClick={() => {
                        if (!selected) return;
                        form.post(`/deadlines/${selected.id}/complete`, { preserveScroll: true, onSuccess: () => { setSelected(null); load(); } });
                    }}><CheckCircle2 className="h-4 w-4" /> Confirmer</button>
                </>
            }>
                {selected && <div className="space-y-3">
                    <div className="rounded-xl bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-800">{selected.title} - {selected.vehicle}</div>
                    <Field label="Date de réalisation"><input type="date" className="tc-input" value={form.data.completed_at} onChange={(event) => form.setData('completed_at', event.target.value)} /></Field>
                    <Field label="Note"><textarea className="tc-input" rows={2} value={form.data.note} onChange={(event) => form.setData('note', event.target.value)} /></Field>
                    <div className="grid gap-3 sm:grid-cols-2">
                        <Field label="Nouvelle date"><input type="date" className="tc-input" value={form.data.next_due_date} onChange={(event) => form.setData('next_due_date', event.target.value)} /></Field>
                        <Field label="Nouveau kilométrage"><input type="number" className="tc-input" value={form.data.next_due_km} onChange={(event) => form.setData('next_due_km', event.target.value)} /></Field>
                    </div>
                </div>}
            </Modal>
        </aside>
    );
}
