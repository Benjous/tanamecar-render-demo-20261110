import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Pencil, Plus } from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import { Badge, PageHeader, PrintButton } from '@/components/ui';
import { date, dateTime, money, statusTone } from '@/lib/utils';

export default function ClientShow({ client, totals, documents, timeline }: { client: any; totals: any; documents: any[]; timeline: any[] }) {
    return (
        <AppLayout>
            <Head title={client.display_name} />
            <PageHeader
                title={client.display_name}
                
                actions={<><Link href="/clients" className="tc-btn-secondary"><ArrowLeft className="h-4 w-4" /> Retour</Link><Link href={`/clients/${client.id}/edit`} className="tc-btn-secondary"><Pencil className="h-4 w-4" /> Modifier</Link><PrintButton /></>}
            />

            <div className="mb-4 grid gap-4 sm:grid-cols-3">
                <div className="tc-card p-4"><div className="text-[11px] font-bold uppercase text-slate-400">Locations</div><div className="mt-1 text-xl font-black">{totals?.contracts ?? 0}</div></div>
                <div className="tc-card p-4"><div className="text-[11px] font-bold uppercase text-slate-400">Montant total</div><div className="mt-1 text-xl font-black">{money(totals?.total ?? 0)}</div></div>
                <div className="tc-card p-4"><div className="text-[11px] font-bold uppercase text-slate-400">Statut</div><div className="mt-2"><Badge tone={statusTone(client.status)}>{client.status}</Badge></div></div>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
                <section className="tc-card p-5">
                    <h2 className="mb-4 text-sm font-bold text-slate-900">Identité</h2>
                    <dl className="space-y-3 text-sm">
                        <div><dt className="text-[11px] font-semibold uppercase text-slate-400">Email</dt><dd>{client.email ?? 'Non renseigné'}</dd></div>
                        <div><dt className="text-[11px] font-semibold uppercase text-slate-400">Téléphone</dt><dd>{client.phone ?? 'Non renseigné'}</dd></div>
                        <div><dt className="text-[11px] font-semibold uppercase text-slate-400">Adresse</dt><dd>{client.address ?? 'Non renseigné'}</dd></div>
                        <div><dt className="text-[11px] font-semibold uppercase text-slate-400">Date de naissance</dt><dd>{date(client.birth_date)}</dd></div>
                        <div><dt className="text-[11px] font-semibold uppercase text-slate-400">Pays</dt><dd>{client.country?.name ?? 'Non renseigné'}</dd></div>
                    </dl>
                </section>
                <section className="tc-card p-5">
                    <h2 className="mb-4 text-sm font-bold text-slate-900">Pièce d’identité</h2>
                    <dl className="space-y-3 text-sm">
                        <div><dt className="text-[11px] font-semibold uppercase text-slate-400">Type</dt><dd>{client.identity_document_type ?? 'Non renseigné'}</dd></div>
                        <div><dt className="text-[11px] font-semibold uppercase text-slate-400">Numéro</dt><dd>{client.identity_number ?? 'Non renseigné'}</dd></div>
                        <div><dt className="text-[11px] font-semibold uppercase text-slate-400">Expiration</dt><dd>{date(client.identity_expiry_date)}</dd></div>
                        <div><dt className="text-[11px] font-semibold uppercase text-slate-400">Permis</dt><dd>{client.license_number ?? 'Non renseigné'}</dd></div>
                    </dl>
                </section>
                <section className="tc-card p-5">
                    <h2 className="mb-4 text-sm font-bold text-slate-900">Options</h2>
                    <dl className="space-y-3 text-sm">
                        <div><dt className="text-[11px] font-semibold uppercase text-slate-400">Source</dt><dd>{client.source?.name ?? 'Non renseigné'}</dd></div>
                        <div><dt className="text-[11px] font-semibold uppercase text-slate-400">Créé le</dt><dd>{date(client.created_at)}</dd></div>
                        <div><dt className="text-[11px] font-semibold uppercase text-slate-400">Qualité</dt><dd>{client.data_quality_status === 'duplicate_suspect' ? <Badge tone="bg-amber-50 text-amber-700 border-amber-200">Doublon potentiel</Badge> : 'OK'}</dd></div>
                    </dl>
                </section>
            </div>

            <section className="tc-card mt-4 p-5">
                <h2 className="mb-3 text-sm font-bold text-slate-900">Documents du client</h2>
                <div className="space-y-2">
                    {(documents ?? []).map((doc: any) => (
                        <div key={doc.id} className="flex items-center justify-between rounded-xl border border-slate-100 px-4 py-3">
                            <div><div className="text-sm font-semibold">{doc.path.split('/').pop()}</div><div className="text-[11px] text-slate-400">{doc.mime} - {doc.size_bytes} octets</div></div>
                            <a href={`/media/${doc.id}`} className="tc-btn-secondary">Télécharger</a>
                        </div>
                    ))}
                    {!(documents ?? []).length && <div className="text-sm text-slate-400">Aucun document.</div>}
                </div>
            </section>

            <section className="tc-card mt-4 p-5">
                <h2 className="mb-3 text-sm font-bold text-slate-900">Historique</h2>
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
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                    <h2 className="text-sm font-bold text-slate-900">Historique des locations</h2>
                    <Link href="/contracts/create" className="tc-btn-secondary"><Plus className="h-4 w-4" /> Nouvelle location</Link>
                </div>
                <div className="overflow-x-auto">
                    <table className="tc-table">
                        <thead><tr><th>Référence</th><th>Voiture</th><th>Départ</th><th>Retour</th><th>Total</th><th>Statut</th></tr></thead>
                        <tbody>
                            {(client.contracts ?? []).map((contract: any) => (
                                <tr key={contract.id}>
                                    <td><Link href={`/contracts/${contract.id}`} className="font-semibold text-brand-700">{contract.reference}</Link></td>
                                    <td>{contract.vehicle?.display_name ?? 'Non renseigné'}</td>
                                    <td>{dateTime(contract.departure_at)}</td>
                                    <td>{dateTime(contract.return_at)}</td>
                                    <td>{money(contract.total_amount)}</td>
                                    <td><Badge tone={statusTone(contract.returned ? 'returned' : 'en_location')}>{contract.returned ? 'Réceptionné' : 'En cours'}</Badge></td>
                                </tr>
                            ))}
                            {!client.contracts?.length && <tr><td colSpan={6} className="py-10 text-center text-slate-400">Aucune location.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </section>
        </AppLayout>
    );
}
