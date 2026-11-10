import { Head, Link, router } from '@inertiajs/react';
import { AlertTriangle, CarFront, CircleDollarSign, Clock, FileText, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { Badge, PageHeader, StatCard } from '@/components/ui';
import { dateTime, money, number, statusTone } from '@/lib/utils';

type Contract = {
    id: number;
    reference: string;
    departure_at: string;
    return_at: string;
    total_amount: string;
    returned: boolean;
    client?: { display_name: string };
    vehicle?: { display_name: string; plate_number: string };
};

type Props = {
    counters: { overdue: number; due_today: number; due_tomorrow: number; due_after_tomorrow: number; in_rental: number; available: number; in_repair: number };
    revenue: number;
    payments: number;
    contractsTotal: number;
    recent: Contract[];
    upcoming: Contract[];
    vehiclesByStatus: Record<string, number>;
    counts: { clients: number; vehicles: number; contracts: number; invoices: number };
    stats: { revenue_trend: number | null; occupancy: number; returns_month: number };
};

export default function Dashboard({ counters, revenue, payments, contractsTotal, recent, upcoming, vehiclesByStatus, counts, stats }: Props) {
    const [bigScreen, setBigScreen] = useState(false);
    useEffect(() => {
        const enabled = window.localStorage.getItem('taname-bigscreen') === '1' || new URLSearchParams(window.location.search).get('bigscreen') === '1';
        setBigScreen(enabled);
        document.documentElement.classList.toggle('bigscreen', enabled);
        if (!enabled) return;
        let wakeLock: any = null;
        const acquire = async () => { try { wakeLock = await (navigator as any).wakeLock?.request('screen'); } catch {} };
        acquire();
        const timer = window.setInterval(() => router.reload({ only: ['counters', 'stats', 'recent', 'upcoming'] }), 60_000);
        const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') { window.localStorage.setItem('taname-bigscreen', '0'); setBigScreen(false); if (document.fullscreenElement) document.exitFullscreen?.(); } };
        window.addEventListener('keydown', escape);
        return () => { window.clearInterval(timer); window.removeEventListener('keydown', escape); wakeLock?.release?.(); document.documentElement.classList.remove('bigscreen'); };
    }, []);
    return (
        <AppLayout>
            <Head title="Tableau de bord" />
            <PageHeader
                title="Tableau de bord"
                
                actions={<Link href="/contracts/create" className="tc-btn-primary">Nouvelle location</Link>}
            />

            <div className={bigScreen ? 'grid gap-5 sm:grid-cols-2 xl:grid-cols-5' : 'grid gap-4 sm:grid-cols-2 xl:grid-cols-5'}>
                <StatCard label="En location" value={number(counters?.in_rental ?? 0)} hint={`Taux d’occupation ${stats.occupancy} %`} icon={<CarFront className="h-5 w-5" />} tone="brand" href="/contracts?status=open" />
                <StatCard label="Retours dépassés" value={number(counters?.overdue ?? 0)} hint={`${stats.returns_month} retours ce mois`} icon={<AlertTriangle className="h-5 w-5" />} tone="rose" href="/contracts?status=overdue" />
                <StatCard label="Voitures disponibles" value={number(counters?.available ?? 0)} hint={`${counts.vehicles} voitures au total`} icon={<CarFront className="h-5 w-5" />} tone="emerald" href="/vehicles?status=disponible" testId="dashboard-available" />
                <StatCard label="Chiffre d’affaires facturé" value={money(revenue)} hint={stats.revenue_trend === null ? 'Tendance non calculable' : `Tendance ${stats.revenue_trend > 0 ? '+' : ''}${stats.revenue_trend} % sur le mois`} icon={<CircleDollarSign className="h-5 w-5" />} tone="amber" href="/invoices" />
                <StatCard label="Paiements encaissés" value={money(payments)} hint="Somme des paiements" icon={<Clock className="h-5 w-5" />} tone="emerald" href="/payments" />
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <StatCard label="Montant des contrats" value={money(contractsTotal)} hint="Prix total des locations" icon={<FileText className="h-5 w-5" />} tone="brand" href="/contracts" />
                <StatCard label="Clients" value={number(counts.clients)} hint="Fiches clients" icon={<Users className="h-5 w-5" />} tone="slate" href="/clients" />
                <StatCard label="Factures" value={number(counts.invoices)} hint="Factures émises" icon={<FileText className="h-5 w-5" />} tone="slate" href="/invoices" />
            </div>

            <div className="mt-6 grid gap-6 xl:grid-cols-2">
                <section className="tc-card overflow-hidden">
                    <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                        <h2 className="text-sm font-bold text-slate-900">Dernières locations</h2>
                        <Link href="/contracts" className="text-xs font-semibold text-brand-700 hover:text-brand-500">Tout voir</Link>
                    </div>
                    <div className="hidden border-b border-brand-100 bg-brand-50/60 px-5 py-2.5 text-[10px] font-bold uppercase tracking-wider text-brand-800 sm:grid sm:grid-cols-5 sm:gap-3">
                        <div>Référence</div><div>Client</div><div>Voiture</div><div>Départ</div><div>Total</div>
                    </div>
                    <div className="divide-y divide-brand-100/70">
                        {recent.map((contract) => (
                            <Link key={contract.id} href={`/contracts/${contract.id}`} className="grid grid-cols-2 gap-2 px-5 py-3 text-sm transition-colors hover:bg-brand-50/70 sm:grid-cols-5 sm:gap-3">
                                <div className="font-semibold text-brand-800">{contract.reference}</div>
                                <div className="whitespace-normal break-words text-slate-700">{contract.client?.display_name ?? 'Non renseigné'}</div>
                                <div className="whitespace-normal break-words text-slate-700">{contract.vehicle?.display_name ?? contract.vehicle?.plate_number ?? 'Non renseigné'}</div>
                                <div className="text-slate-600">{dateTime(contract.departure_at)}</div>
                                <div className="font-semibold text-slate-800">{money(contract.total_amount)}</div>
                            </Link>
                        ))}
                        {!recent.length && <div className="px-5 py-10 text-center text-sm text-slate-400">Aucune location.</div>}
                    </div>
                </section>

                <section className="tc-card overflow-hidden">
                    <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                        <h2 className="text-sm font-bold text-slate-900">Retours à venir (7 jours)</h2>
                        <Link href="/contracts?status=open" className="text-xs font-semibold text-brand-700 hover:text-brand-500">{upcoming.length} contrats</Link>
                    </div>
                    <div className="divide-y divide-slate-100">
                        {upcoming.map((contract) => (
                            <Link key={contract.id} href={`/contracts/${contract.id}`} className="flex items-center justify-between gap-3 px-5 py-3 transition-colors hover:bg-brand-50/70">
                                <div>
                                    <div className="text-sm font-semibold text-slate-800">{contract.reference} · {contract.client?.display_name}</div>
                                    <div className="text-xs text-slate-500">{contract.vehicle?.display_name ?? 'Voiture non renseigné'}</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs font-semibold text-slate-700">{dateTime(contract.return_at)}</div>
                                    <Badge tone={statusTone(contract.returned ? 'returned' : 'en_location')}>{contract.returned ? 'Reçu' : 'En cours'}</Badge>
                                </div>
                            </Link>
                        ))}
                        {!upcoming.length && <div className="px-5 py-10 text-center text-sm text-slate-400">Aucun retour prévu.</div>}
                    </div>
                </section>
            </div>

            <section className="tc-card mt-6 p-5">
                <h2 className="text-sm font-bold text-slate-900">Répartition des voitures</h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-3">
                    {Object.entries(vehiclesByStatus).map(([status, total]) => (
                        <Link key={status} href={`/vehicles?status=${encodeURIComponent(status)}`} className="group block rounded-xl p-2 transition-colors hover:bg-brand-50">
                            <div className="flex items-center justify-between text-xs">
                                <span className="font-semibold capitalize text-slate-600 group-hover:text-brand-800">{status.replaceAll('_', ' ')}</span>
                                <span className="font-bold text-slate-900">{total}</span>
                            </div>
                            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                                <div className="h-full rounded-full bg-brand-600" style={{ width: `${Math.min(100, (Number(total) / Math.max(1, counts.vehicles)) * 100)}%` }} />
                            </div>
                        </Link>
                    ))}
                </div>
            </section>
        </AppLayout>
    );
}

