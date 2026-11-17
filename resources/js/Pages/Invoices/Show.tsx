import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Download, FileText, Pencil, Printer } from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import { Badge, PageHeader } from '@/components/ui';
import { date, dateTime, money, statusTone } from '@/lib/utils';

const statusLabels: Record<string, string> = {
    confirmed: 'Confirmée',
    paid: 'Payée',
    cancelled: 'Annulée',
    draft: 'Brouillon',
};

export default function InvoiceShow({
    invoice,
    documents,
    contract,
    payments,
    paid,
    balance,
}: {
    invoice: any;
    documents: any[];
    contract: any;
    payments: any[];
    paid: number | null;
    balance: number | null;
}) {
    const paymentCount = (payments ?? []).length;

    return (
        <AppLayout>
            <Head title={`Facture ${invoice.reference}`} />
            <div className="invoice-show-page">
                <PageHeader
                    title={`Facture ${invoice.reference}`}
                    actions={
                        <>
                            <Link href="/invoices" className="tc-btn-secondary"><ArrowLeft className="h-4 w-4" /> Retour</Link>
                            <Link href={`/invoices/${invoice.id}/edit`} className="tc-btn-secondary"><Pencil className="h-4 w-4" /> Modifier la facture</Link>
                            <a href={`/invoices/${invoice.id}/print/no-header`} className="tc-btn-secondary"><Printer className="h-4 w-4" /> Imprimer</a>
                            <a href={`/invoices/${invoice.id}/pdf/header`} className="tc-btn-secondary"><FileText className="h-4 w-4" /> PDF avec entête</a>
                            <a href={`/invoices/${invoice.id}/pdf/no-header`} className="tc-btn-primary"><Download className="h-4 w-4" /> PDF sans entête</a>
                        </>
                    }
                />
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
                <section className="tc-card p-5">
                    <h2 className="mb-3 text-sm font-bold">Client</h2>
                    <div className="space-y-2 text-sm">
                        <div className="text-base font-black">{invoice.client?.display_name ?? '-'}</div>
                        <div><span className="text-slate-500">ICE : </span>{invoice.client?.identity_number ?? '-'}</div>
                        <div><span className="text-slate-500">Téléphone : </span>{invoice.client?.phone ?? '-'}</div>
                        <div><span className="text-slate-500">Adresse : </span>{invoice.client?.address ?? '-'}</div>
                    </div>
                </section>

                <section className="tc-card p-5">
                    <h2 className="mb-3 text-sm font-bold">Facture</h2>
                    <dl className="space-y-2 text-sm">
                        <div className="flex justify-between gap-3"><dt className="text-slate-500">Référence</dt><dd className="font-semibold">{invoice.reference}</dd></div>
                        <div className="flex justify-between gap-3"><dt className="text-slate-500">Réf. dossier</dt><dd>{invoice.file_reference ?? '-'}</dd></div>
                        <div className="flex justify-between gap-3"><dt className="text-slate-500">Émission</dt><dd>{date(invoice.issued_at)}</dd></div>
                        <div className="flex justify-between gap-3"><dt className="text-slate-500">Échéance</dt><dd>{invoice.due_date ? date(invoice.due_date) : '-'}</dd></div>
                        <div className="flex justify-between gap-3"><dt className="text-slate-500">Objet</dt><dd className="text-right">{invoice.subject ?? '-'}</dd></div>
                        <div className="flex justify-between gap-3"><dt className="text-slate-500">État</dt><dd><Badge tone={statusTone(invoice.status)}>{statusLabels[invoice.status] ?? invoice.status}</Badge></dd></div>
                    </dl>
                </section>

                <section className="tc-card p-5">
                    <h2 className="mb-3 text-sm font-bold">Règlement</h2>
                    {contract ? (
                        <dl className="space-y-2 text-sm">
                            <div className="flex justify-between gap-3"><dt className="text-slate-500">Contrat</dt><dd><Link href={`/contracts/${contract.id}`} className="font-semibold text-brand-700">{contract.reference}</Link></dd></div>
                            <div className="flex justify-between gap-3"><dt className="text-slate-500">Total TTC</dt><dd className="font-semibold">{money(invoice.total)}</dd></div>
                            <div className="flex justify-between gap-3"><dt className="text-slate-500">Encaissé</dt><dd className="font-semibold">{money(paid ?? 0)}</dd></div>
                            <div className="flex justify-between gap-3 border-t border-slate-100 pt-2"><dt className="text-slate-500">Solde</dt><dd className="font-black">{money(balance ?? 0)}</dd></div>
                            <div className="text-xs text-slate-500">{paymentCount} règlement{paymentCount > 1 ? 's' : ''}</div>
                        </dl>
                    ) : (
                        <div className="text-sm text-slate-600">
                            <div className="font-semibold">Règlement non rapproché</div>
                            <div className="mt-1 text-xs text-slate-500"><span>Aucun contrat lié.</span> <span>Montant payé inconnu.</span></div>
                            <div className="mt-3 flex justify-between"><span className="text-slate-500">Total TTC</span><span className="font-semibold">{money(invoice.total)}</span></div>
                        </div>
                    )}
                </section>
            </div>

            <section className="tc-card mt-4 p-5">
                <h2 className="mb-3 text-sm font-bold">Lignes de facturation</h2>
                <div className="overflow-x-auto">
                    <table className="tc-table">
                        <thead><tr><th>Désignation</th><th>Qté</th><th>P.U. HT</th><th>TVA</th><th>Total HT</th><th>Total TTC</th></tr></thead>
                        <tbody>
                            {(invoice.lines ?? []).map((line: any) => (
                                <tr key={line.id}>
                                    <td>{line.designation ?? 'Non renseigné'}</td>
                                    <td>{line.quantity}</td>
                                    <td>{money(line.unit_price)}</td>
                                    <td>{line.vat_rate}%</td>
                                    <td>{money(line.net_price)}</td>
                                    <td className="font-semibold">{money(line.price)}</td>
                                </tr>
                            ))}
                            {!invoice.lines?.length && <tr><td colSpan={6} className="py-8 text-center text-slate-400">Aucune ligne.</td></tr>}
                        </tbody>
                    </table>
                </div>
                <div className="mt-4 flex justify-end">
                    <dl className="w-full max-w-sm space-y-2 text-sm">
                        <div className="flex justify-between"><dt className="text-slate-500">Sous-total HT</dt><dd>{money(invoice.subtotal)}</dd></div>
                        {(Number(invoice.discount_value ?? 0) > 0 || Number(invoice.discount_percent ?? 0) > 0) && (
                            <>
                                <div className="flex justify-between"><dt className="text-slate-500">Avant remise</dt><dd>{money(invoice.subtotal_before_discount)}</dd></div>
                                <div className="flex justify-between"><dt className="text-slate-500">Remise</dt><dd>{money(Number(invoice.subtotal_before_discount ?? 0) - Number(invoice.subtotal ?? 0))}</dd></div>
                            </>
                        )}
                        <div className="flex justify-between"><dt className="text-slate-500">TVA</dt><dd>{money(invoice.vat_value)}</dd></div>
                        <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-black"><dt>Total TTC</dt><dd>{money(invoice.total)}</dd></div>
                    </dl>
                </div>
            </section>

            <section className="tc-card mt-4 p-5">
                <h2 className="mb-3 text-sm font-bold">Paiements associés</h2>
                {contract ? (
                    <div className="overflow-x-auto">
                        <table className="tc-table">
                            <thead><tr><th>Date</th><th>Contrat</th><th>Mode</th><th>Montant</th><th>État</th><th>Référence</th></tr></thead>
                            <tbody>
                                {(payments ?? []).map((payment: any) => (
                                    <tr key={payment.id}>
                                        <td>{dateTime(payment.created_at)}</td>
                                        <td>{contract.reference}</td>
                                        <td>{payment.payment_method ?? '-'}</td>
                                        <td className="font-semibold">{money(payment.amount)}</td>
                                        <td>{payment.payment_status ?? '-'}</td>
                                        <td>{payment.display_name ?? '-'}</td>
                                    </tr>
                                ))}
                                {!payments?.length && <tr><td colSpan={6} className="py-8 text-center text-slate-400">Aucun paiement enregistré.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-sm text-slate-500">Aucun paiement rapproché de cette facture.</div>
                )}
            </section>

            <section className="tc-card mt-4 p-5">
                <h2 className="mb-3 text-sm font-bold">Documents</h2>
                <div className="space-y-2">
                    {(documents ?? []).map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between rounded-xl border border-slate-100 px-4 py-3">
                            <span className="text-sm font-semibold">{doc.name}</span>
                            <a href={`/documents/${doc.id}`} className="tc-btn-secondary"><Download className="h-4 w-4" /> Télécharger</a>
                        </div>
                    ))}
                    {!documents?.length && <div className="text-sm text-slate-400">Aucun document généré.</div>}
                </div>
            </section>
        </AppLayout>
    );
}
