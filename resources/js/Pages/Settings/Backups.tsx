import { Head, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { dateTime, number } from '@/lib/utils';

type Run = { id: number; type: string; started_at: string; finished_at: string | null; size_bytes: number | null; status: string; notes: string | null };
type BackupFile = { name: string; size: number; modified_at: string };

export default function Backups({ runs, files }: { runs: Run[]; files: BackupFile[] }) {
    return (
        <AppLayout>
            <Head title="Sauvegarde" />
            <div style={{ padding: '3px 0' }}>
                <button type="button" className="al-button al-button-primary" onClick={() => router.post('/settings/backups/run')}>Sauvegarder</button>
            </div>

            <table className="al-data-table">
                <thead><tr><td>DATE</td><td>TYPE</td><td>TAILLE</td><td>STATUT</td></tr></thead>
                <tbody>
                    {runs.length === 0 ? <tr className="al-empty-row"><td colSpan={4}>Aucun résultat</td></tr> : runs.map((run) => (
                        <tr key={run.id}>
                            <td>{dateTime(run.started_at)}</td>
                            <td>{run.type}</td>
                            <td>{run.size_bytes ? number(run.size_bytes) : '-'}</td>
                            <td>{run.status}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <h3 style={{ font: 'bold 14px Tahoma', margin: '8px 0 4px' }}>Fichiers</h3>
            <table className="al-data-table">
                <thead><tr><td>NOM</td><td>TAILLE</td><td>DATE</td></tr></thead>
                <tbody>
                    {files.length === 0 ? <tr className="al-empty-row"><td colSpan={3}>Aucun résultat</td></tr> : files.map((file) => (
                        <tr key={file.name}>
                            <td>{file.name}</td>
                            <td>{number(file.size)}</td>
                            <td>{dateTime(file.modified_at)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </AppLayout>
    );
}
