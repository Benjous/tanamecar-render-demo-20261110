import { Head, router } from '@inertiajs/react';
import { Database, HardDrive } from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import { PageHeader } from '@/components/ui';
import { dateTime, number } from '@/lib/utils';

type Run = { id: number; type: string; started_at: string; finished_at: string | null; size_bytes: number | null; status: string; notes: string | null };
type BackupFile = { name: string; size: number; modified_at: string };

export default function Backups({ runs, files }: { runs: Run[]; files: BackupFile[] }) {
    return (
        <AppLayout>
            <Head title="Sauvegarde" />
            <PageHeader title="Sauvegarde" actions={<button className="tc-btn-primary" onClick={() => router.post('/settings/backups/run')}><Database className="h-4 w-4" /> Nouvelle sauvegarde</button>} />

            <section className="tc-card mb-4 overflow-hidden">
                <div className="border-b border-slate-100 px-4 py-3 font-semibold">Sauvegardes</div>
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500"><tr><th className="px-4 py-2">Date</th><th className="px-4 py-2">Type</th><th className="px-4 py-2">Taille</th><th className="px-4 py-2">Statut</th></tr></thead>
                        <tbody>
                            {runs.length === 0 ? <tr><td colSpan={4} className="px-4 py-6 text-slate-500">Aucun résultat</td></tr> : runs.map((run) => (
                                <tr key={run.id} className="border-t border-slate-100">
                                    <td className="px-4 py-2">{dateTime(run.started_at)}</td>
                                    <td className="px-4 py-2">{run.type}</td>
                                    <td className="px-4 py-2">{run.size_bytes ? number(run.size_bytes) : '-'}</td>
                                    <td className="px-4 py-2">{run.status}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            <section className="tc-card overflow-hidden">
                <div className="border-b border-slate-100 px-4 py-3 font-semibold">Fichiers</div>
                <div className="divide-y divide-slate-100">
                    {files.length === 0 ? <div className="px-4 py-6 text-sm text-slate-500">Aucun résultat</div> : files.map((file) => (
                        <div key={file.name} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
                            <span className="flex items-center gap-2"><HardDrive className="h-4 w-4 text-slate-400" /> {file.name}</span>
                            <span className="flex items-center gap-3 text-slate-500"><span>{number(file.size)}</span><span>{dateTime(file.modified_at)}</span></span>
                        </div>
                    ))}
                </div>
            </section>
        </AppLayout>
    );
}
