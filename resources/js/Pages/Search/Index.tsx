import { Head, Link } from '@inertiajs/react';
import { CarFront, FileText, Search, Users } from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import { PageHeader } from '@/components/ui';
import { dateTime, money } from '@/lib/utils';

export default function SearchIndex({ q, results }: { q: string; results: { contracts: any[]; clients: any[]; vehicles: any[]; invoices: any[] } }) {
    return (
        <AppLayout>
            <Head title="Recherche" />
            <PageHeader title="Recherche globale" />

            <div className="grid gap-4 lg:grid-cols-2">
                <section className="tc-card p-5">
                    <h2 className="mb-3 flex items-center gap-2 text-sm font-bold"><FileText className="h-4 w-4" /> Contrats</h2>
                    <div className="space-y-2">
                        {results.contracts.map((c) => <Link key={c.id} href={`/contracts/${c.id}`} className="block rounded-lg border border-slate-100 px-3 py-2 text-sm hover:bg-slate-50"><span className="font-semibold text-brand-700">{c.reference}</span> - {c.client?.display_name} - {c.vehicle?.plate_number ?? 'sans voiture'}</Link>)}
                        {!results.contracts.length && <div className="text-sm text-slate-400">Aucun contrat.</div>}
                    </div>
                </section>
                <section className="tc-card p-5">
                    <h2 className="mb-3 flex items-center gap-2 text-sm font-bold"><Users className="h-4 w-4" /> Clients</h2>
                    <div className="space-y-2">
                        {results.clients.map((c) => <Link key={c.id} href={`/clients/${c.id}`} className="block rounded-lg border border-slate-100 px-3 py-2 text-sm hover:bg-slate-50"><span className="font-semibold text-brand-700">{c.display_name}</span> - {c.phone ?? 'sans téléphone'}</Link>)}
                        {!results.clients.length && <div className="text-sm text-slate-400">Aucun client.</div>}
                    </div>
                </section>
                <section className="tc-card p-5">
                    <h2 className="mb-3 flex items-center gap-2 text-sm font-bold"><CarFront className="h-4 w-4" /> Voitures</h2>
                    <div className="space-y-2">
                        {results.vehicles.map((v) => <Link key={v.id} href={`/vehicles/${v.id}`} className="block rounded-lg border border-slate-100 px-3 py-2 text-sm hover:bg-slate-50"><span className="font-semibold text-brand-700">{v.display_name}</span> - {v.plate_number}</Link>)}
                        {!results.vehicles.length && <div className="text-sm text-slate-400">Aucun voiture.</div>}
                    </div>
                </section>
                <section className="tc-card p-5">
                    <h2 className="mb-3 flex items-center gap-2 text-sm font-bold"><Search className="h-4 w-4" /> Factures</h2>
                    <div className="space-y-2">
                        {results.invoices.map((i) => <Link key={i.id} href={`/invoices/${i.id}`} className="block rounded-lg border border-slate-100 px-3 py-2 text-sm hover:bg-slate-50"><span className="font-semibold text-brand-700">{i.reference}</span> - {i.client?.display_name} - {money(i.total)}</Link>)}
                        {!results.invoices.length && <div className="text-sm text-slate-400">Aucune facture.</div>}
                    </div>
                </section>
            </div>
        </AppLayout>
    );
}
