import { Head, router } from '@inertiajs/react';
import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { PageHeader } from '@/components/ui';
import { date, normalizeText } from '@/lib/utils';

type Proposal = { id: number; display_name: string; phone: string | null; address: string | null; last_rental: string | null };
type Row = { id: number; source_row: number; display_name: string; phone: string | null; address: string | null; status: string; matched_client_id: number | null; proposals: Proposal[] };

export default function ClientMatching({ rows, counts }: { rows: Row[]; filters: Record<string, string>; counts: Record<string, number> }) {
    const [query, setQuery] = useState('');
    const [status, setStatus] = useState('');
    const filtered = useMemo(() => {
        const needle = normalizeText(query);
        return rows.filter((row) => (!status || row.status === status) && (!needle || normalizeText(`${row.display_name} ${row.phone ?? ''} ${row.address ?? ''}`).includes(needle)));
    }, [rows, query, status]);
    const post = (url: string, data: any = {}) => router.post(url, data, { preserveScroll: true });

    return (
        <AppLayout>
            <Head title="Rapprochement conducteurs historiques" />
            <PageHeader title="Rapprochement conducteurs historiques"  />
            <div className="tc-card mb-4 grid gap-3 p-4 sm:grid-cols-3">
                <label className="relative sm:col-span-2"><span className="sr-only">Recherche</span><Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><input className="tc-input pl-9" placeholder="Nom, téléphone, adresse" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
                <select aria-label="Statut" className="tc-input" value={status} onChange={(event) => setStatus(event.target.value)}><option value="">Tous les statuts</option><option value="pending">En attente</option><option value="matched">Rapprochés</option><option value="ignored">Ignorés</option></select>
            </div>
            <section className="tc-card overflow-hidden">
                <div className="border-b border-brand-100 bg-brand-50/80 px-4 py-3 text-xs font-semibold text-brand-900">{filtered.length} conducteurs affichés</div>
                <div className="overflow-x-auto"><table className="min-w-full divide-y divide-slate-100 text-sm">
                    <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">Conducteur historique</th><th className="px-4 py-3">Téléphone / adresse</th><th className="px-4 py-3">Proposition TANAME CAR</th><th className="px-4 py-3">Statut</th><th className="px-4 py-3">Actions</th></tr></thead>
                    <tbody className="divide-y divide-slate-100">{filtered.map((row) => <tr key={row.id} className="align-top">
                        <td className="px-4 py-3 font-semibold">{row.display_name}<div className="text-xs text-slate-400">Ligne historique {row.source_row}</div></td>
                        <td className="px-4 py-3 text-xs text-slate-600">{row.phone ?? 'Non renseigné'}<div>{row.address ?? 'Adresse non renseignée'}</div></td>
                        <td className="px-4 py-3">{row.proposals.length === 0 ? <span className="text-slate-500">Aucune correspondance proposée</span> : <div className="space-y-2">{row.proposals.map((proposal) => <div key={proposal.id} className="rounded-lg border border-brand-100 bg-brand-50/50 p-2 text-xs"><div className="font-semibold">{proposal.display_name}</div><div>{proposal.phone ?? 'Téléphone non renseigné'}</div><div>{proposal.address ?? 'Adresse non renseignée'}</div><div className="text-slate-500">Dernière location : {proposal.last_rental ? date(proposal.last_rental) : 'aucune'}</div>{row.status !== 'matched' && <button className="mt-1 font-semibold text-brand-700" onClick={() => post(`/clients/matching/${row.id}/link`, { client_id: proposal.id })}>Lier ce client</button>}</div>)}</div>}</td>
                        <td className="px-4 py-3">{row.status === 'matched' ? 'Rapproché' : row.status === 'ignored' ? 'Ignoré' : 'En attente'}</td>
                        <td className="px-4 py-3"><div className="flex flex-col gap-2">{row.status !== 'matched' && <button className="tc-btn-secondary text-xs" onClick={() => post(`/clients/matching/${row.id}/create`)}>Créer le client</button>}{row.status !== 'ignored' && row.status !== 'matched' && <button className="text-xs text-slate-500" onClick={() => post(`/clients/matching/${row.id}/ignore`)}>Ignorer</button>}</div></td>
                    </tr>)}</tbody>
                </table></div>
            </section>
        </AppLayout>
    );
}


