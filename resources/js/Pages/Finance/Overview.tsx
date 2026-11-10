import { Head } from '@inertiajs/react';
import { Banknote, CarFront, Wallet } from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import { PageHeader, StatCard } from '@/components/ui';
import { date, money, number } from '@/lib/utils';

type Metrics = Record<string, number>;
type Charge = { id: number; charge_date: string; description: string; category: string; amount: string };
type Profit = { id: number; entry_date: string; description: string; source: string | null; amount: string };
type Credit = { id: number; credit_date: string; client_name: string | null; advance: string; remaining: string };

export default function FinanceOverview({ metrics, counts, recentCharges, recentProfits, recentCredits }: {
    metrics: Metrics;
    counts: Record<string, number>;
    recentCharges: Charge[];
    recentProfits: Profit[];
    recentCredits: Credit[];
}) {
    return (
        <AppLayout>
            <Head title="État global" />
            <PageHeader title="État global" />
            <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard label="Encaissements" value={money(metrics.payments_total)} icon={<Banknote className="h-5 w-5" />} tone="emerald" />
                <StatCard label="Charges" value={money(metrics.charges_total)} icon={<Wallet className="h-5 w-5" />} tone="rose" />
                <StatCard label="Solde caisse" value={money(metrics.cash_balance)} icon={<Wallet className="h-5 w-5" />} tone={metrics.cash_balance >= 0 ? 'emerald' : 'rose'} />
                <StatCard label="Reste contrats" value={money(metrics.contract_remaining)} icon={<CarFront className="h-5 w-5" />} tone="amber" />
            </div>

            <section className="tc-card mb-4 overflow-hidden">
                <div className="border-b border-slate-100 px-4 py-3 font-semibold">Bilan</div>
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <tbody>
                            {[
                                ['Contrats', metrics.contracts_total],
                                ['Factures', metrics.invoices_total],
                                ['Encaissements', metrics.payments_total],
                                ['Charges', metrics.charges_total],
                                ['Crédits véhicules', metrics.vehicle_credits_total],
                                ['Traites', metrics.installments_total],
                                ['Avances locataires', metrics.client_advance],
                                ['Restes locataires', metrics.client_remaining],
                                ['Bénéfice enregistré', metrics.profit_total],
                                ['Solde caisse', metrics.cash_balance],
                                ['Reste contrats', metrics.contract_remaining],
                            ].map(([label, value]) => (
                                <tr key={String(label)} className="border-t border-slate-100">
                                    <td className="px-4 py-3 text-slate-600">{label}</td>
                                    <td className="px-4 py-3 text-right font-semibold text-brand-900">{money(Number(value))}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div className="tc-card p-4"><div className="text-xs font-semibold uppercase text-slate-500">Locations</div><div className="mt-1 text-2xl font-black">{number(counts.contracts)}</div></div>
                <div className="tc-card p-4"><div className="text-xs font-semibold uppercase text-slate-500">Clients</div><div className="mt-1 text-2xl font-black">{number(counts.clients)}</div></div>
                <div className="tc-card p-4"><div className="text-xs font-semibold uppercase text-slate-500">Véhicules</div><div className="mt-1 text-2xl font-black">{number(counts.vehicles)}</div></div>
                <div className="tc-card p-4"><div className="text-xs font-semibold uppercase text-slate-500">Factures</div><div className="mt-1 text-2xl font-black">{number(counts.invoices)}</div></div>
            </div>

            <div className="grid gap-4 xl:grid-cols-3">
                <section className="tc-card overflow-hidden">
                    <div className="border-b border-slate-100 px-4 py-3 font-semibold">Charges</div>
                    <div className="divide-y divide-slate-100">
                        {recentCharges.length === 0 ? <div className="px-4 py-6 text-sm text-slate-500">Aucun résultat</div> : recentCharges.map((charge) => (
                            <div key={charge.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                                <span><span className="font-medium">{charge.description}</span><span className="block text-xs text-slate-500">{date(charge.charge_date)}</span></span>
                                <span className="font-semibold">{money(charge.amount)}</span>
                            </div>
                        ))}
                    </div>
                </section>
                <section className="tc-card overflow-hidden">
                    <div className="border-b border-slate-100 px-4 py-3 font-semibold">Bénéfice</div>
                    <div className="divide-y divide-slate-100">
                        {recentProfits.length === 0 ? <div className="px-4 py-6 text-sm text-slate-500">Aucun résultat</div> : recentProfits.map((entry) => (
                            <div key={entry.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                                <span><span className="font-medium">{entry.description}</span><span className="block text-xs text-slate-500">{date(entry.entry_date)}</span></span>
                                <span className="font-semibold">{money(entry.amount)}</span>
                            </div>
                        ))}
                    </div>
                </section>
                <section className="tc-card overflow-hidden">
                    <div className="border-b border-slate-100 px-4 py-3 font-semibold">Crédits locataires</div>
                    <div className="divide-y divide-slate-100">
                        {recentCredits.length === 0 ? <div className="px-4 py-6 text-sm text-slate-500">Aucun résultat</div> : recentCredits.map((credit) => (
                            <div key={credit.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                                <span><span className="font-medium">{credit.client_name ?? 'Client'}</span><span className="block text-xs text-slate-500">{date(credit.credit_date)}</span></span>
                                <span className="text-right"><span className="block font-semibold">{money(credit.remaining)}</span><span className="text-xs text-slate-500">{money(credit.advance)}</span></span>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </AppLayout>
    );
}
