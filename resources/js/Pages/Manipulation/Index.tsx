import { Head, Link } from '@inertiajs/react';
import { CarFront, CircleDollarSign, ClipboardCheck, Search, TriangleAlert } from 'lucide-react';
import { useMemo, useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { PageHeader } from '@/components/ui';
import { money, normalizeText } from '@/lib/utils';

export default function Index({ counts, available, unsettled }: { counts: Record<string, number>; available: any[]; unsettled: any[] }) {
    const [query, setQuery] = useState('');
    const needle = normalizeText(query);
    const filteredAvailable = useMemo(() => available.filter((vehicle) => !needle || normalizeText(`${vehicle.display_name} ${vehicle.plate_number ?? ''}`).includes(needle)), [available, needle]);
    const filteredUnsettled = useMemo(() => unsettled.filter((contract) => !needle || normalizeText(`${contract.reference} ${contract.client_name ?? ''}`).includes(needle)), [unsettled, needle]);

    return (
        <AppLayout>
            <Head title="Manipulation, Disponible, Règlement" />
            <PageHeader title="Manipulation, Disponible, Règlement"  />
            <div className="mb-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Link href="/contracts?status=open" className="tc-card p-4 hover:border-brand-300"><ClipboardCheck className="mb-2 h-5 w-5 text-brand-700" /><div className="text-xs text-slate-500">Manipulation, locations en cours</div><div className="text-2xl font-black">{counts.in_rental}</div></Link>
                <Link href="/vehicles?status=disponible" className="tc-card p-4 hover:border-brand-300"><CarFront className="mb-2 h-5 w-5 text-emerald-700" /><div className="text-xs text-slate-500">Disponible, voitures</div><div className="text-2xl font-black">{counts.available}</div></Link>
                <Link href="/contracts?status=overdue" className="tc-card p-4 hover:border-brand-300"><TriangleAlert className="mb-2 h-5 w-5 text-rose-700" /><div className="text-xs text-slate-500">Retours dépassés</div><div className="text-2xl font-black">{counts.overdue}</div></Link>
                <div className="tc-card p-4"><CircleDollarSign className="mb-2 h-5 w-5 text-amber-700" /><div className="text-xs text-slate-500">Contrats avec reste à régler</div><div className="text-2xl font-black">{counts.unsettled}</div></div>
            </div>
            <div className="tc-card mb-4 p-4">
                <label className="relative block">
                    <span className="sr-only">Rechercher dans les aperçus</span>
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input className="tc-input pl-9" type="search" placeholder="Voiture, plaque, contrat, client" value={query} onChange={(event) => setQuery(event.target.value)} />
                </label>
                <div className="mt-2 text-xs text-slate-500">{filteredAvailable.length} disponible{filteredAvailable.length > 1 ? 's' : ''}, {filteredUnsettled.length} règlement{filteredUnsettled.length > 1 ? 's' : ''}</div>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
                <section className="tc-card overflow-hidden"><div className="border-b border-slate-100 px-4 py-3"><h2 className="font-semibold">Disponible, aperçu</h2></div><div className="max-h-96 divide-y divide-slate-100 overflow-auto">{filteredAvailable.map((vehicle) => <Link key={vehicle.id} href={`/vehicles/${vehicle.id}`} className="flex items-center justify-between px-4 py-3 text-sm hover:bg-brand-50"><span className="font-medium">{vehicle.display_name}</span><span className="text-slate-500">{vehicle.plate_number ?? 'Sans plaque'}</span></Link>)}{!filteredAvailable.length && <div className="px-4 py-6 text-sm text-slate-500">Aucun résultat</div>}</div></section>
                <section className="tc-card overflow-hidden"><div className="border-b border-slate-100 px-4 py-3"><h2 className="font-semibold">Règlement</h2></div><div className="max-h-96 divide-y divide-slate-100 overflow-auto">{filteredUnsettled.map((contract) => <Link key={contract.id} href={`/contracts/${contract.id}`} className="flex items-center justify-between gap-3 px-4 py-3 text-sm hover:bg-brand-50"><span><span className="font-medium">{contract.reference}</span><span className="block text-xs text-slate-500">{contract.client_name ?? 'Client non renseigné'}</span></span><span className="font-semibold text-amber-800">{money(contract.remaining_calculated)}</span></Link>)}{!filteredUnsettled.length && <div className="px-4 py-6 text-sm text-slate-500">Aucun résultat</div>}</div></section>
            </div>
            
        </AppLayout>
    );
}
