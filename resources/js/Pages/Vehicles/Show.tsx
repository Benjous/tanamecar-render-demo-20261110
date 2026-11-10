import { Head, Link, router } from '@inertiajs/react';
import { Archive, ArrowLeft, Pencil } from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import { Badge, ConfirmButton, PageHeader, PrintButton } from '@/components/ui';
import DeadlineCheck from '@/components/DeadlineCheck';
import { date, dateTime, money, number, statusTone } from '@/lib/utils';

export default function VehicleShow({ vehicle, timeline, deadlines, canUpdateDeadlines }: { vehicle: any; timeline: any[]; deadlines: any[]; canUpdateDeadlines: boolean }) {
    return (
        <AppLayout>
            <Head title={vehicle.display_name} />
            <PageHeader
                title={vehicle.display_name}
                
                actions={<><Link href="/vehicles" className="tc-btn-secondary"><ArrowLeft className="h-4 w-4" /> Retour</Link><Link href={`/vehicles/${vehicle.id}/edit`} className="tc-btn-secondary"><Pencil className="h-4 w-4" /> Modifier</Link><PrintButton /><ConfirmButton label={<><Archive className="h-4 w-4" /> Archiver</>} variant="secondary" title="Archiver ce véhicule ?" description="Archiver ce véhicule ?" onConfirm={() => router.post(`/vehicles/${vehicle.id}/archive`)} /></>}
            />

            <div className="mb-4 grid gap-4 sm:grid-cols-4">
                <div className="tc-card p-4"><div className="text-[11px] font-bold uppercase text-slate-400">Statut</div><div className="mt-2"><Badge tone={statusTone(vehicle.status)}>{vehicle.status.replaceAll('_', ' ')}</Badge></div></div>
                <div className="tc-card p-4"><div className="text-[11px] font-bold uppercase text-slate-400">Mode</div><div className="mt-1 text-sm font-semibold capitalize">{vehicle.operating_mode.replaceAll('_', ' ')}</div></div>
                <div className="tc-card p-4"><div className="text-[11px] font-bold uppercase text-slate-400">Kilométrage</div><div className="mt-1 text-xl font-black">{number(vehicle.km ?? 0)} km</div></div>
                <div className="tc-card p-4"><div className="text-[11px] font-bold uppercase text-slate-400">Prix/jour</div><div className="mt-1 text-xl font-black">{money(vehicle.daily_rate ?? 0)}</div></div>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
                <section className="tc-card p-5"><h2 className="mb-4 text-sm font-bold">Technique</h2><dl className="space-y-3 text-sm">
                    <div><dt className="text-[11px] uppercase text-slate-400">Marque</dt><dd>{vehicle.brand?.name ?? 'Non renseigné'}</dd></div>
                    <div><dt className="text-[11px] uppercase text-slate-400">Modèle</dt><dd>{vehicle.model?.name ?? 'Non renseigné'}</dd></div>
                    <div><dt className="text-[11px] uppercase text-slate-400">Couleur</dt><dd>{vehicle.color?.name ?? 'Non renseigné'}</dd></div>
                    <div><dt className="text-[11px] uppercase text-slate-400">Catégorie</dt><dd>{vehicle.category?.name ?? 'Non renseigné'}</dd></div>
                    <div><dt className="text-[11px] uppercase text-slate-400">Carburant</dt><dd>{vehicle.fuel_type ?? 'Non renseigné'}</dd></div>
                    <div><dt className="text-[11px] uppercase text-slate-400">Boîte</dt><dd>{vehicle.gearbox ?? 'Non renseigné'}</dd></div>
                    <div><dt className="text-[11px] uppercase text-slate-400">Châssis</dt><dd>{vehicle.chassis_number ?? 'Non renseigné'}</dd></div>
                </dl></section>
                <section className="tc-card p-5"><h2 className="mb-4 text-sm font-bold">Finance</h2><dl className="space-y-3 text-sm">
                    <div><dt className="text-[11px] uppercase text-slate-400">Prix d’achat</dt><dd>{money(vehicle.purchase_price ?? 0)}</dd></div>
                    <div><dt className="text-[11px] uppercase text-slate-400">Maison de crédit</dt><dd>{vehicle.credit_house?.name ?? 'Non renseigné'}</dd></div>
                    <div><dt className="text-[11px] uppercase text-slate-400">Avance</dt><dd>{money(vehicle.credit_down_payment ?? 0)}</dd></div>
                    <div><dt className="text-[11px] uppercase text-slate-400">Traite/mois</dt><dd>{money(vehicle.monthly_installment ?? 0)}</dd></div>
                    <div><dt className="text-[11px] uppercase text-slate-400">Échéance</dt><dd>{date(vehicle.credit_due_date)}</dd></div>
                </dl></section>
                <section className="tc-card p-5"><h2 className="mb-4 text-sm font-bold">Identification</h2><dl className="space-y-3 text-sm">
                    <div><dt className="text-[11px] uppercase text-slate-400">Mise en circulation</dt><dd>{date(vehicle.first_registration_date)}</dd></div>
                    <div><dt className="text-[11px] uppercase text-slate-400">Puissance fiscale</dt><dd>{vehicle.fiscal_power ?? 'Non renseigné'}</dd></div>
                    <div><dt className="text-[11px] uppercase text-slate-400">CPI WW</dt><dd>{vehicle.cpi_ww ?? 'Non renseigné'}</dd></div>
                    <div><dt className="text-[11px] uppercase text-slate-400">Créé le</dt><dd>{date(vehicle.created_at)}</dd></div>
                </dl></section>
            </div>

            {deadlines?.length > 0 && <section className="tc-card mt-4 p-5">
                <h2 className="mb-3 text-sm font-bold">Échéances</h2>
                <div className="space-y-2">
                    {deadlines.map((deadline) => (
                        <div key={deadline.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-100 px-3 py-2 text-sm">
                            <div className="flex items-center gap-2"><DeadlineCheck deadline={deadline} canUpdate={canUpdateDeadlines} /><span className="font-semibold">{deadline.title}</span></div>
                            <span className="text-xs text-slate-500">{deadline.status.label} - {deadline.status.detail}</span>
                        </div>
                    ))}
                </div>
            </section>}

            <section className="tc-card mt-4 p-5">
                <h2 className="mb-3 text-sm font-bold">Historique</h2>
                <div className="space-y-2">
                    {(timeline ?? []).map((event, index) => (
                        <div key={`${event.type}-${event.date}-${index}`} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-100 px-4 py-3 text-sm">
                            <span className="font-medium">{event.title}</span>
                            <span className="text-xs text-slate-500">{dateTime(event.date)}</span>
                        </div>
                    ))}
                    {!(timeline ?? []).length && <div className="text-sm text-slate-400">Aucun résultat</div>}
                </div>
            </section>

            <section className="tc-card mt-4 overflow-hidden">
                <div className="border-b border-slate-100 px-5 py-4"><h2 className="text-sm font-bold">Locations liées</h2></div>
                <div className="overflow-x-auto"><table className="tc-table">
                    <thead><tr><th>Référence</th><th>Client</th><th>Départ</th><th>Retour</th><th>Total</th><th>Statut</th></tr></thead>
                    <tbody>
                        {(vehicle.contracts ?? []).map((contract: any) => (
                            <tr key={contract.id}><td><Link href={`/contracts/${contract.id}`} className="font-semibold text-brand-700">{contract.reference}</Link></td><td>{contract.client?.display_name ?? 'Non renseigné'}</td><td>{dateTime(contract.departure_at)}</td><td>{dateTime(contract.return_at)}</td><td>{money(contract.total_amount)}</td><td><Badge tone={statusTone(contract.returned ? 'returned' : 'en_location')}>{contract.returned ? 'Réceptionné' : 'En cours'}</Badge></td></tr>
                        ))}
                        {!vehicle.contracts?.length && <tr><td colSpan={6} className="py-10 text-center text-slate-400">Aucune location.</td></tr>}
                    </tbody>
                </table></div>
            </section>
        </AppLayout>
    );
}
