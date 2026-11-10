import { Head, router, useForm } from '@inertiajs/react';
import { AlertTriangle, CheckCircle2, FileUp, Upload } from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import { Badge, Field, PageHeader } from '@/components/ui';

type Entity = { key: string; label: string; columns: string[] };
type PreviewRow = { raw: Record<string, string>; status: string; errors: string[] };

export default function ImportSettings({
    entities,
    preview,
}: {
    entities: Entity[];
    preview: null | {
        entity: string;
        token: string;
        headers: string[];
        rows: PreviewRow[];
        stats: { total: number; ok: number; duplicate: number; error: number };
        global_errors: string[];
    };
}) {
    const upload = useForm<{ entity: string; file: File | null }>({
        entity: entities[0]?.key ?? 'clients',
        file: null,
    });

    function submitPreview(e: React.FormEvent) {
        e.preventDefault();
        upload.post('/settings/import/preview', { forceFormData: true });
    }

    function confirmImport() {
        if (!preview) return;
        router.post('/settings/import', { entity: preview.entity, token: preview.token });
    }

    return (
        <AppLayout>
            <Head title="Import de données" />
            <PageHeader
                title="Import de données"
                
            />

            <div className="grid gap-6 xl:grid-cols-3">
                <section className="tc-card p-5">
                    <h2 className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-900">
                        <FileUp className="h-4 w-4 text-brand-700" /> 1. Choisir le fichier
                    </h2>
                    <form onSubmit={submitPreview} className="space-y-4">
                        <Field label="Type de données">
                            <select
                                className="tc-input"
                                value={upload.data.entity}
                                onChange={(e) => upload.setData('entity', e.target.value)}
                            >
                                {entities.map((entity) => (
                                    <option key={entity.key} value={entity.key}>{entity.label}</option>
                                ))}
                            </select>
                        </Field>
                        <Field label="Fichier CSV" hint="Séparateur ; ou , - 5 Mo maximum.">
                            <input
                                type="file"
                                accept=".csv,text/csv,text/plain"
                                className="tc-input"
                                onChange={(e) => upload.setData('file', e.target.files?.[0] ?? null)}
                            />
                        </Field>
                        {upload.errors.file && <div className="text-xs text-rose-600">{upload.errors.file}</div>}
                        <button className="tc-btn-primary w-full" disabled={upload.processing || !upload.data.file}>
                            <Upload className="h-4 w-4" /> Prévisualiser
                        </button>
                    </form>

                    <div className="mt-5 rounded-xl bg-slate-50 p-3 text-xs text-slate-500">
                        <div className="font-semibold text-slate-700">Colonnes attendues</div>
                        {entities.map((entity) => (
                            <div key={entity.key} className="mt-2">
                                <span className="font-semibold">{entity.label} :</span> {entity.columns.join(', ')}
                            </div>
                        ))}
                        <div className="mt-2"></div>
                    </div>
                </section>

                <section className="tc-card p-5 xl:col-span-2">
                    {!preview && (
                        <div className="flex h-full min-h-64 flex-col items-center justify-center text-center">
                            <FileUp className="mb-3 h-10 w-10 text-slate-300" />
                            <div className="text-sm font-semibold text-slate-700">Aucun aperçu</div>
                            <div className="mt-1 max-w-md text-xs text-slate-500">
                                Sélectionnez un fichier CSV puis lancez la prévisualisation. Rien ne sera importé avant confirmation.
                            </div>
                        </div>
                    )}

                    {preview && (
                        <div>
                            <div className="mb-4 grid gap-3 sm:grid-cols-4">
                                <div className="rounded-xl bg-slate-50 p-3"><div className="text-[10px] uppercase text-slate-400">Lignes</div><div className="text-xl font-black">{preview.stats.total}</div></div>
                                <div className="rounded-xl bg-emerald-50 p-3"><div className="text-[10px] uppercase text-emerald-600">Importables</div><div className="text-xl font-black text-emerald-700">{preview.stats.ok}</div></div>
                                <div className="rounded-xl bg-amber-50 p-3"><div className="text-[10px] uppercase text-amber-600">Doublons</div><div className="text-xl font-black text-amber-700">{preview.stats.duplicate}</div></div>
                                <div className="rounded-xl bg-rose-50 p-3"><div className="text-[10px] uppercase text-rose-600">Erreurs</div><div className="text-xl font-black text-rose-700">{preview.stats.error}</div></div>
                            </div>

                            {preview.global_errors.length > 0 && (
                                <div className="mb-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                                    {preview.global_errors.map((error) => <div key={error}>{error}</div>)}
                                </div>
                            )}

                            <div className="max-h-[420px] overflow-auto rounded-xl border border-slate-200">
                                <table className="tc-table">
                                    <thead><tr>{preview.headers.map((header) => <th key={header}>{header}</th>)}<th>Statut</th></tr></thead>
                                    <tbody>
                                        {preview.rows.slice(0, 100).map((row, index) => (
                                            <tr key={index}>
                                                {preview.headers.map((header) => <td key={header}>{row.raw[header] ?? ''}</td>)}
                                                <td>
                                                    {row.status === 'ok' && <Badge tone="bg-emerald-50 text-emerald-700 border-emerald-200"><CheckCircle2 className="mr-1 h-3 w-3" />OK</Badge>}
                                                    {row.status === 'duplicate' && <Badge tone="bg-amber-50 text-amber-700 border-amber-200">Doublon</Badge>}
                                                    {row.status === 'error' && <Badge tone="bg-rose-50 text-rose-700 border-rose-200"><AlertTriangle className="mr-1 h-3 w-3" />Erreur</Badge>}
                                                    {row.errors.length > 0 && <div className="mt-1 text-[10px] text-rose-600">{row.errors.join(' ')}</div>}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
                                <button className="tc-btn-secondary" onClick={() => router.get('/settings/import')}>Annuler</button>
                                <button className="tc-btn-primary" onClick={confirmImport} disabled={preview.stats.ok === 0}>
                                    <CheckCircle2 className="h-4 w-4" /> Confirmer l’import ({preview.stats.ok})
                                </button>
                            </div>
                        </div>
                    )}
                </section>
            </div>
        </AppLayout>
    );
}
