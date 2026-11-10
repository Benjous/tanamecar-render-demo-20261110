import { Head, router } from '@inertiajs/react';
import { Archive, RotateCcw } from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import { PageHeader } from '@/components/ui';
import { dateTime, money, number } from '@/lib/utils';

export default function ArchivePage({ dryRun, batches }: { dryRun: Array<{ entity: string; count: number; sum: number }>; batches: any[] }) {
    const total = dryRun.reduce((sum, row) => sum + row.count, 0);
    return (
        <AppLayout>
            <Head title="Archivage 2022 2023" />
            <PageHeader title="Archivage 2022 2023"  />
            <div className="mb-4 grid gap-3 sm:grid-cols-3">
                <div className="tc-card p-4"><div className="text-xs text-slate-500">Lignes à archiver</div><div className="text-3xl font-black">{number(total)}</div></div>
                <div className="tc-card p-4"><div className="text-xs text-slate-500">Lots existants</div><div className="text-3xl font-black">{batches.length}</div></div>
                <div className="tc-card p-4"><div className="text-xs text-slate-500">Périmètre</div><div className="text-sm">Avant 2024</div></div>
            </div>
            <section className="tc-card mb-4 overflow-hidden"><div className="border-b border-slate-100 px-4 py-3 font-semibold">Simulation par entité</div><div className="overflow-x-auto"><table className="min-w-full text-sm"><thead className="bg-slate-50 text-left text-xs uppercase text-slate-500"><tr><th className="px-4 py-2">Entité</th><th className="px-4 py-2">Lignes</th><th className="px-4 py-2">Somme</th></tr></thead><tbody>{dryRun.map((row) => <tr key={row.entity} className="border-t border-slate-100"><td className="px-4 py-2">{row.entity}</td><td className="px-4 py-2">{number(row.count)}</td><td className="px-4 py-2">{money(row.sum)}</td></tr>)}</tbody></table></div></section>
            <div className="flex flex-wrap gap-2">
                <button className="tc-btn-secondary" onClick={() => router.get('/settings/archive', {}, { preserveScroll: true })}>Relancer la simulation</button>
                <button className="tc-btn-primary" onClick={() => router.post('/settings/archive/apply')} disabled={total === 0}><Archive className="h-4 w-4" /> Appliquer l’archivage</button>
            </div>
            <section className="tc-card mt-4 overflow-hidden"><div className="border-b border-slate-100 px-4 py-3 font-semibold">Lots et restauration</div><div className="divide-y divide-slate-100">{batches.length === 0 ? <div className="px-4 py-6 text-sm text-slate-500">Aucun lot d’archivage.</div> : batches.map((batch) => <div key={batch.batch_id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"><span><span className="font-mono">{batch.batch_id}</span><span className="ml-2 text-slate-500">{dateTime(batch.created_at)}</span></span><span className="flex items-center gap-3"><span>{number(batch.total)} lignes</span><button className="text-brand-700" onClick={() => router.post('/settings/archive/restore', { batch: batch.batch_id })}><RotateCcw className="mr-1 inline h-3 w-3" /> Restaurer</button></span></div>)}</div></section>
        </AppLayout>
    );
}
