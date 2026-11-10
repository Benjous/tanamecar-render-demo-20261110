import { Head, useForm } from '@inertiajs/react';
import { Upload } from 'lucide-react';
import { useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { Field, PageHeader } from '@/components/ui';
import { dateTime } from '@/lib/utils';

type Row = { display_name: string; phone: string; address: string; status: string; reason: string };

export default function ClientVolume({ count, reference, gap, journal }: { count: number; reference: number; gap: number; journal: any[] }) {
    const referenceForm = useForm({ reference: String(reference) });
    const importForm = useForm({ payload: '' });
    const [analysis, setAnalysis] = useState<{ rows: Row[]; duplicates: number; invalid: number; new: number } | null>(null);
    const [error, setError] = useState('');

    const simulate = async () => {
        setError('');
        const response = await fetch('/settings/client-volume/simulate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? '' },
            body: JSON.stringify({ payload: importForm.data.payload }),
        });
        if (!response.ok) { setError('Simulation impossible.'); return; }
        setAnalysis(await response.json());
    };

    return (
        <AppLayout>
            <Head title="Contrôle des volumes clients" />
            <PageHeader title="Contrôle des volumes clients"  />
            <div className="mb-4 grid gap-4 sm:grid-cols-3">
                <div className="tc-card p-4"><div className="text-xs text-slate-500">Clients en base live</div><div className="mt-1 text-3xl font-black text-brand-900" data-testid="client-volume-count">{count}</div></div>
                <div className="tc-card p-4"><div className="text-xs text-slate-500">Référence configurée</div><div className="mt-1 text-3xl font-black">{reference}</div></div>
                <div className={`tc-card p-4 ${gap === 0 ? 'border-emerald-200' : 'border-amber-200'}`}><div className="text-xs text-slate-500">Écart</div><div className="mt-1 text-3xl font-black">{gap > 0 ? `+${gap}` : gap}</div></div>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
                <form onSubmit={(event) => { event.preventDefault(); referenceForm.put('/settings/client-volume/reference'); }} className="tc-card p-5">
                    <h2 className="mb-3 font-semibold">Nombre de référence</h2>
                    <Field label="Référence administrateur" error={referenceForm.errors.reference} hint="Valeur modifiable. Elle ne modifie aucune donnée client.">
                        <input type="number" min="0" className="tc-input" value={referenceForm.data.reference} onChange={(event) => referenceForm.setData('reference', event.target.value)} />
                    </Field>
                    <button className="tc-btn-primary mt-3" disabled={referenceForm.processing}>Enregistrer la référence</button>
                </form>
                <form onSubmit={(event) => { event.preventDefault(); importForm.post('/settings/client-volume/import', { preserveScroll: true }); }} className="tc-card p-5">
                    <h2 className="mb-3 font-semibold">Import d’écart</h2>
                    <Field label="Clients manquants" error={(importForm.errors as any).payload} hint="JSON [{name,phone,address}] ou une ligne par client : nom,téléphone,adresse. Aucun doublon n’est fusionné.">
                        <textarea className="tc-input min-h-32 font-mono text-xs" value={importForm.data.payload} onChange={(event) => importForm.setData('payload', event.target.value)} placeholder={'NOM PRENOM,0600000000,ADRESSE\nAUTRE CLIENT,0611111111,ADRESSE'} />
                    </Field>
                    <div className="mt-3 flex flex-wrap gap-2">
                        <button type="button" className="tc-btn-secondary" onClick={simulate}><Upload className="h-4 w-4" /> Simuler</button>
                        <button className="tc-btn-primary" disabled={importForm.processing || !analysis || analysis.new === 0}>Confirmer l’import</button>
                    </div>
                    {error && <div className="mt-2 text-sm text-rose-600">{error}</div>}
                    {analysis && <div className="mt-3 text-sm text-slate-600">{analysis.new} nouveaux, {analysis.duplicates} doublons, {analysis.invalid} invalides.</div>}
                </form>
            </div>
            {analysis && (
                <section className="tc-card mt-4 overflow-hidden">
                    <div className="border-b border-slate-100 px-4 py-3 font-semibold">Simulation</div>
                    <div className="max-h-80 overflow-auto"><table className="min-w-full text-sm"><thead className="bg-slate-50 text-left text-xs uppercase text-slate-500"><tr><th className="px-3 py-2">Nom</th><th className="px-3 py-2">Téléphone</th><th className="px-3 py-2">Adresse</th><th className="px-3 py-2">Statut</th></tr></thead><tbody>{analysis.rows.map((row, index) => <tr key={index} className="border-t border-slate-100"><td className="px-3 py-2">{row.display_name || 'Non renseigné'}</td><td className="px-3 py-2">{row.phone || 'Non renseigné'}</td><td className="px-3 py-2">{row.address || 'Non renseignée'}</td><td className={`px-3 py-2 ${row.status === 'new' ? 'text-emerald-700' : row.status === 'duplicate' ? 'text-amber-700' : 'text-rose-700'}`}>{row.reason}</td></tr>)}</tbody></table></div>
                </section>
            )}
            <section className="tc-card mt-4 overflow-hidden">
                <div className="border-b border-slate-100 px-4 py-3 font-semibold">Journal des imports</div>
                <div className="divide-y divide-slate-100">{journal.length === 0 ? <div className="px-4 py-6 text-sm text-slate-500">Aucun import d’écart enregistré.</div> : journal.map((entry, index) => <div key={index} className="flex flex-wrap justify-between gap-2 px-4 py-3 text-sm"><span>{entry.user_name ?? 'Utilisateur inconnu'}, {dateTime(entry.created_at)}</span><span className="font-mono text-xs text-slate-500">{entry.after}</span></div>)}</div>
            </section>
        </AppLayout>
    );
}
