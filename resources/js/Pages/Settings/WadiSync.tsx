import { Head, router } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, CloudDownload, Clock3, Database, RefreshCw, ShieldCheck, WifiOff } from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import { dateTime, number } from '@/lib/utils';

type Run = {
    id: number;
    status: string;
    mode: string;
    started_at: string | null;
    finished_at: string | null;
    snapshot_at: string | null;
    records_fetched: number;
    created_count: number;
    updated_count: number;
    unchanged_count: number;
    conflict_count: number;
    pending_count: number;
    error_count: number;
    message: string | null;
    summary: { entities?: Record<string, EntitySummary>; business_applied?: number; business_created?: number; dry_run?: boolean } | null;
    errors: Array<{ scope?: string; entity?: string; wadi_id?: string; error?: string }> | null;
};

type EntitySummary = {
    label: string;
    fetched: number;
    raw_created: number;
    raw_updated: number;
    raw_unchanged: number;
    business_applied: number;
    business_created: number;
    pending: number;
    conflicts: number;
    errors: number;
};

type EntityCount = { entity: string; total: number; last_seen_at: string | null };

const statusStyles: Record<string, string> = {
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    partial: 'bg-amber-50 text-amber-700 border-amber-200',
    failed: 'bg-rose-50 text-rose-700 border-rose-200',
    running: 'bg-sky-50 text-sky-700 border-sky-200',
};

function StatusBadge({ status }: { status: string }) {
    return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusStyles[status] ?? 'bg-slate-50 text-slate-600 border-slate-200'}`}>{status}</span>;
}

export default function WadiSync({
    runs,
    lastRun,
    lastSuccess,
    nextAttempt,
    entities,
    configuration,
}: {
    runs: Run[];
    lastRun: Run | null;
    lastSuccess: Run | null;
    nextAttempt: string | null;
    entities: EntityCount[];
    configuration: { enabled: boolean; apply: boolean; interval: number; credentials_configured: boolean };
}) {
    const running = lastRun?.status === 'running';
    const summary = lastRun?.summary?.entities ?? {};

    return (
        <AppLayout>
            <Head title="Synchronisation WADI" />
            <div className="mb-4 flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-xl font-bold tracking-tight text-slate-900">Synchronisation WADI</h1>
                    <p className="mt-1 text-sm text-slate-500">Lecture seule de WADI DEV vers TANAME, toutes les 15 minutes.</p>
                </div>
                <button
                    type="button"
                    className="tc-btn-primary shrink-0"
                    disabled={running}
                    onClick={() => router.post('/settings/wadi-sync/run')}
                >
                    <RefreshCw className={`h-4 w-4 ${running ? 'animate-spin' : ''}`} />
                    {running ? 'Synchronisation en cours' : 'Synchroniser maintenant'}
                </button>
            </div>

            {!configuration.credentials_configured && (
                <div className="mb-4 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    <div>Les identifiants WADI sont absents du fichier <strong>.env</strong> local. La synchronisation est suspendue.</div>
                </div>
            )}

            {!configuration.enabled && (
                <div className="mb-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                    <WifiOff className="mt-0.5 h-4 w-4 shrink-0" />
                    <div>La synchronisation planifiée est désactivée. Le bouton manuel reste disponible.</div>
                </div>
            )}

            <div className="mb-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <Card icon={<CheckCircle2 className="h-5 w-5" />} label="Dernier succès" value={lastSuccess ? dateTime(lastSuccess.finished_at) : 'Jamais'} tone="emerald" />
                <Card icon={<Clock3 className="h-5 w-5" />} label="Prochaine tentative" value={nextAttempt ? dateTime(nextAttempt) : 'Planification inactive'} tone="sky" />
                <Card icon={<Database className="h-5 w-5" />} label="Enregistrements WADI" value={number(lastRun?.records_fetched ?? 0)} tone="slate" />
                <Card icon={<ShieldCheck className="h-5 w-5" />} label="Mode" value={lastRun ? (lastRun.mode === 'apply' ? 'Mise à jour' : 'Simulation') : 'Aucun passage'} tone="slate" />
            </div>

            <section className="tc-card mb-4 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h2 className="text-sm font-bold text-slate-900">Dernier passage</h2>
                        <p className="mt-1 text-xs text-slate-500">
                            {lastRun ? `${dateTime(lastRun.started_at)}${lastRun.finished_at ? ` → ${dateTime(lastRun.finished_at)}` : ''}` : 'Aucune synchronisation enregistrée.'}
                        </p>
                    </div>
                    {lastRun && <StatusBadge status={lastRun.status} />}
                </div>

                {lastRun && (
                    <>
                        <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-6">
                            <Metric label="Récupérés" value={number(lastRun.records_fetched)} />
                            <Metric label="Nouveaux WADI" value={number(lastRun.created_count)} />
                            <Metric label="Modifiés" value={number(lastRun.updated_count)} />
                            <Metric label="Mises à jour métier" value={number(lastRun.summary?.business_applied ?? 0)} />
                            <Metric label="Créés dans TANAME" value={number(lastRun.summary?.business_created ?? 0)} tone={lastRun.summary?.business_created ? 'amber' : undefined} />
                            <Metric label="En attente" value={number(lastRun.pending_count)} tone={lastRun.pending_count ? 'amber' : undefined} />
                            <Metric label="Conflits" value={number(lastRun.conflict_count)} tone={lastRun.conflict_count ? 'amber' : undefined} />
                        </div>

                        {lastRun.message && <p className="mt-3 text-xs text-slate-500">{lastRun.message}</p>}
                        <p className="mt-2 text-xs text-slate-500">
                            Les conflits correspondent aux écarts WADI non écrasés : la version TANAME est plus récente ou la correspondance n’est pas suffisamment fiable.
                        </p>

                        {lastRun.errors && lastRun.errors.length > 0 && (
                            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">
                                <div className="mb-2 flex items-center gap-2 font-semibold"><AlertTriangle className="h-4 w-4" /> Anomalies ({lastRun.error_count})</div>
                                <ul className="space-y-1">
                                    {lastRun.errors.slice(0, 8).map((error, index) => (
                                        <li key={`${error.entity ?? 'run'}-${index}`}>
                                            {error.entity ? <strong>{error.entity} : </strong> : null}{error.error ?? 'Erreur inconnue.'}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </>
                )}
            </section>

            <div className="grid gap-4 xl:grid-cols-2">
                <section className="tc-card overflow-hidden">
                    <div className="border-b border-slate-100 px-5 py-4">
                        <h2 className="text-sm font-bold text-slate-900">Données récupérées par entité</h2>
                        <p className="mt-1 text-xs text-slate-500">Toutes les entités sont conservées localement, même celles non encore mappées.</p>
                    </div>
                    <div className="max-h-[420px] overflow-auto">
                        <table className="al-data-table">
                            <thead><tr><td>ENTITÉ</td><td>DERNIER PASSAGE</td><td>LOCAL</td><td>NOUVEAUX</td><td>MISES À JOUR</td></tr></thead>
                            <tbody>
                                {entities.length === 0 ? <tr className="al-empty-row"><td colSpan={5}>Aucune donnée WADI locale.</td></tr> : entities.map((entity) => {
                                    const stats = summary[entity.entity];
                                    return (
                                        <tr key={entity.entity}>
                                            <td className="font-medium text-slate-700">{stats?.label ?? entity.entity}</td>
                                            <td>{dateTime(entity.last_seen_at)}</td>
                                            <td>{number(entity.total)}</td>
                                            <td>{number(stats?.raw_created ?? 0)}</td>
                                            <td>{number(stats?.raw_updated ?? 0)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </section>

                <section className="tc-card overflow-hidden">
                    <div className="border-b border-slate-100 px-5 py-4">
                        <h2 className="text-sm font-bold text-slate-900">Historique des synchronisations</h2>
                        <p className="mt-1 text-xs text-slate-500">Les 30 derniers passages, avec reprise après interruption.</p>
                    </div>
                    <div className="max-h-[420px] overflow-auto">
                        <table className="al-data-table">
                            <thead><tr><td>DATE</td><td>STATUT</td><td>MODE</td><td>REÇUS</td><td>ERREURS</td></tr></thead>
                            <tbody>
                                {runs.length === 0 ? <tr className="al-empty-row"><td colSpan={5}>Aucun passage.</td></tr> : runs.map((run) => (
                                    <tr key={run.id}>
                                        <td>{dateTime(run.started_at)}</td>
                                        <td><StatusBadge status={run.status} /></td>
                                        <td>{run.mode === 'apply' ? 'Mise à jour' : 'Simulation'}</td>
                                        <td>{number(run.records_fetched)}</td>
                                        <td className={run.error_count ? 'text-amber-700' : ''}>{number(run.error_count)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>

            <p className="mt-4 flex items-center gap-2 text-xs text-slate-500">
                <CloudDownload className="h-4 w-4" /> WADI est interrogé en lecture seule. Aucune écriture n’est envoyée vers WADI.
            </p>
        </AppLayout>
    );
}

function Card({ icon, label, value, tone }: { icon: ReactNode; label: string; value: string; tone: 'emerald' | 'sky' | 'slate' }) {
    const tones = {
        emerald: 'bg-emerald-50 text-emerald-700',
        sky: 'bg-sky-50 text-sky-700',
        slate: 'bg-slate-100 text-slate-600',
    };

    return (
        <div className="tc-card flex items-center gap-3 p-4">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${tones[tone]}`}>{icon}</div>
            <div className="min-w-0">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</div>
                <div className="truncate text-sm font-bold text-slate-800">{value}</div>
            </div>
        </div>
    );
}

function Metric({ label, value, tone }: { label: string; value: string; tone?: 'amber' }) {
    return (
        <div className={`rounded-xl border p-3 ${tone === 'amber' ? 'border-amber-200 bg-amber-50' : 'border-slate-100 bg-slate-50'}`}>
            <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</div>
            <div className="mt-1 text-lg font-bold text-slate-800">{value}</div>
        </div>
    );
}
