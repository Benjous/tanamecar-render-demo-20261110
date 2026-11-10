import { Head, Link, router, useForm } from '@inertiajs/react';
import { ArrowLeft, CheckCircle2, Copy, Download, FileText, Pencil, RotateCcw, Trash2 } from 'lucide-react';
import { useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { Badge, ConfirmButton, Field, PageHeader, PrintButton } from '@/components/ui';
import { dateTime, money, statusTone } from '@/lib/utils';

export default function ContractShow({ contract, financials, documents, timeline }: { contract: any; financials: any; documents: any[]; timeline: any[] }) {
    const [tab, setTab] = useState<'details' | 'payments' | 'documents' | 'timeline'>('details');
    const returnForm = useForm({ return_km: contract.return_km ?? '', return_at: contract.return_at ?? '' });

    function submitReturn(e: React.FormEvent) {
        e.preventDefault();
        returnForm.post(`/contracts/${contract.id}/return`, { preserveScroll: true });
    }

    return (
        <AppLayout>
            <Head title={`Location ${contract.reference}`} />
            <PageHeader
                title={`Location ${contract.reference}`}
                
                actions={
                    <>
                        <Link href="/contracts" className="tc-btn-secondary"><ArrowLeft className="h-4 w-4" /> Retour</Link>
                        <Link href={`/contracts/${contract.id}/edit`} className="tc-btn-secondary"><Pencil className="h-4 w-4" /> Modifier</Link><button className="tc-btn-secondary" onClick={() => router.post(`/contracts/${contract.id}/duplicate`)}><Copy className="h-4 w-4" /> Dupliquer</button>
                        <PrintButton />
                        <a href={`/contracts/${contract.id}/pdf`} className="tc-btn-primary"><Download className="h-4 w-4" /> PDF contrat</a>
                    </>
                }
            />

            <div className="mb-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div className="tc-card p-4"><div className="text-[11px] font-bold uppercase text-slate-400">Prix total</div><div className="mt-1 text-xl font-black">{money(contract.total_amount)}</div></div>
                <div className="tc-card p-4"><div className="text-[11px] font-bold uppercase text-slate-400">Payé</div><div className="mt-1 text-xl font-black text-emerald-700">{money(financials?.paid_amount_calculated ?? 0)}</div></div>
                <div className="tc-card p-4"><div className="text-[11px] font-bold uppercase text-slate-400">Reste</div><div className="mt-1 text-xl font-black text-amber-700">{money(financials?.remaining_calculated ?? 0)}</div></div>
                <div className="tc-card p-4"><div className="text-[11px] font-bold uppercase text-slate-400">Statut</div><div className="mt-2"><Badge tone={statusTone(contract.returned ? 'returned' : 'en_location')}>{contract.returned ? 'Réceptionné' : 'En cours'}</Badge></div>{financials?.has_mismatch && <div className="mt-1 text-[11px] font-semibold text-rose-600">Écart Payé/Reste signalé</div>}</div>
            </div>

            <div className="mb-4 flex gap-2 border-b border-slate-200">
                {[
                    ['details', 'Détails'],
                    ['payments', `Paiements (${contract.payments?.length ?? 0})`],
                    ['documents', `Documents (${documents?.length ?? 0})`],
                    ['timeline', `Historique (${timeline?.length ?? 0})`],
                ].map(([key, label]) => (
                    <button key={key} onClick={() => setTab(key as any)} className={`border-b-2 px-4 py-2 text-sm font-semibold ${tab === key ? 'border-brand-700 text-brand-800' : 'border-transparent text-slate-500'}`}>{label}</button>
                ))}
            </div>

            {tab === 'details' && (
                <div className="grid gap-4 lg:grid-cols-3">
                    <section className="tc-card p-5">
                        <h2 className="mb-4 text-sm font-bold text-slate-900">Basique</h2>
                        <dl className="space-y-3 text-sm">
                            <div><dt className="text-[11px] font-semibold uppercase text-slate-400">Référence</dt><dd className="font-semibold">{contract.reference}</dd></div>
                            <div><dt className="text-[11px] font-semibold uppercase text-slate-400">Client</dt><dd>{contract.client?.display_name ?? 'Non renseigné'}</dd></div>
                            <div><dt className="text-[11px] font-semibold uppercase text-slate-400">Voiture</dt><dd>{contract.vehicle?.display_name ?? <span className="text-amber-600">Non renseigné</span>}</dd></div>
                            <div><dt className="text-[11px] font-semibold uppercase text-slate-400">Agent</dt><dd>{contract.employee?.display_name ?? 'Non renseigné'}</dd></div>
                            <div><dt className="text-[11px] font-semibold uppercase text-slate-400">Caution</dt><dd>{contract.caution_type === 'cheque' ? 'Ch.' : contract.caution_type === 'visa' ? 'Visa' : contract.caution_type === 'passeport' ? 'Passeport' : 'Non renseigné'}</dd></div>
                            <div><dt className="text-[11px] font-semibold uppercase text-slate-400">1er conducteur</dt><dd>{contract.first_driver?.display_name ?? 'Non renseigné'}</dd></div>
                        </dl>
                    </section>
                    <section className="tc-card p-5">
                        <h2 className="mb-4 text-sm font-bold text-slate-900">Départ</h2>
                        <dl className="space-y-3 text-sm">
                            <div><dt className="text-[11px] font-semibold uppercase text-slate-400">Date</dt><dd>{dateTime(contract.departure_at)}</dd></div>
                            <div><dt className="text-[11px] font-semibold uppercase text-slate-400">Lieu</dt><dd>{contract.departure_place ?? 'Non renseigné'}</dd></div>
                            <div><dt className="text-[11px] font-semibold uppercase text-slate-400">Km</dt><dd>{contract.departure_km ?? 'Non renseigné'}</dd></div>
                        </dl>
                    </section>
                    <section className="tc-card p-5">
                        <h2 className="mb-4 text-sm font-bold text-slate-900">Retour</h2>
                        <dl className="space-y-3 text-sm">
                            <div><dt className="text-[11px] font-semibold uppercase text-slate-400">Date</dt><dd>{dateTime(contract.return_at)}</dd></div>
                            <div><dt className="text-[11px] font-semibold uppercase text-slate-400">Lieu</dt><dd>{contract.return_place ?? 'Non renseigné'}</dd></div>
                            <div><dt className="text-[11px] font-semibold uppercase text-slate-400">Km</dt><dd>{contract.return_km ?? 'Non renseigné'}</dd></div>
                        </dl>
                    </section>

                    {!contract.returned && (
                        <section className="tc-card p-5 lg:col-span-3">
                            <h2 className="mb-4 text-sm font-bold text-slate-900">Enregistrer le retour</h2>
                            <form onSubmit={submitReturn} className="grid gap-4 md:grid-cols-3">
                                <Field label="Km au retour"><input type="number" className="tc-input" value={returnForm.data.return_km} onChange={(e) => returnForm.setData('return_km', e.target.value)} /></Field>
                                <Field label="Date de retour"><input type="datetime-local" className="tc-input" value={String(returnForm.data.return_at).slice(0, 16)} onChange={(e) => returnForm.setData('return_at', e.target.value)} /></Field>
                                <div className="flex items-end"><button className="tc-btn-primary" disabled={returnForm.processing}><RotateCcw className="h-4 w-4" /> Réceptionner</button></div>
                            </form>
                        </section>
                    )}
                </div>
            )}

            {tab === 'payments' && (
                <div className="tc-card overflow-hidden">
                    <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                        <h2 className="text-sm font-bold text-slate-900">Paiements liés</h2>
                        <Link href="/payments/create" className="tc-btn-secondary">Ajouter un paiement</Link>
                    </div>
                    <div className="overflow-x-auto"><table className="tc-table">
                        <thead><tr><th>Montant</th><th>Mode</th><th>Statut</th><th>Date</th></tr></thead>
                        <tbody>
                            {(contract.payments ?? []).map((p: any) => (
                                <tr key={p.id}><td className="font-semibold">{money(p.amount)}</td><td>{p.payment_method}</td><td><Badge tone={statusTone(p.payment_status)}>{p.payment_status}</Badge></td><td>{dateTime(p.created_at)}</td></tr>
                            ))}
                            {!contract.payments?.length && <tr><td colSpan={4} className="py-10 text-center text-slate-400">Aucun paiement.</td></tr>}
                        </tbody>
                    </table></div>
                </div>
            )}

            {tab === 'documents' && (
                <div className="tc-card p-5">
                    <h2 className="mb-4 text-sm font-bold text-slate-900">Documents générés</h2>
                    <div className="space-y-2">
                        {documents.map((doc) => (
                            <div key={doc.id} className="flex items-center justify-between rounded-xl border border-slate-100 px-4 py-3">
                                <div className="flex items-center gap-3"><FileText className="h-4 w-4 text-slate-400" /><div><div className="text-sm font-semibold">{doc.name}</div><div className="text-[11px] text-slate-400">{doc.created_at}</div></div></div>
                                <a href={`/documents/${doc.id}`} className="tc-btn-secondary"><Download className="h-4 w-4" /> Télécharger</a>
                            </div>
                        ))}
                        {!documents.length && <div className="py-10 text-center text-sm text-slate-400">Aucun document. Générez le PDF contrat.</div>}
                    </div>
                </div>
            )}
            {tab === 'timeline' && (
                <div className="tc-card p-5">
                    <h2 className="mb-4 text-sm font-bold text-slate-900">Historique de la location</h2>
                    <div className="space-y-3">
                        {(timeline ?? []).map((event) => (
                            <div key={event.id} className="flex items-start gap-3 rounded-xl border border-slate-100 px-4 py-3">
                                <div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-accent-500" />
                                <div className="flex-1">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <span className="text-sm font-semibold text-slate-800">
                                            {event.entity_type === 'payments' ? 'Paiement' : ({ create: 'Création', update: 'Modification', return: 'Retour' } as Record<string, string>)[event.action] ?? event.action}
                                        </span>
                                        <span className="text-xs text-slate-400">{dateTime(event.created_at)}</span>
                                    </div>
                                    <div className="mt-1 text-xs text-slate-500">
                                        Par {event.user_name ?? 'Système'}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {!(timeline ?? []).length && (
                            <div className="py-10 text-center text-sm text-slate-400">Aucun événement enregistré pour cette location.</div>
                        )}
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
