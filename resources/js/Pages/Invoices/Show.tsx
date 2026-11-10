import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Download } from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import { Badge, PageHeader, PrintButton } from '@/components/ui';
import { date, money, statusTone } from '@/lib/utils';

export default function InvoiceShow({ invoice, documents }: { invoice: any; documents: any[] }) {
    return (
        <AppLayout>
            <Head title={`Facture ${invoice.reference}`} />
            <PageHeader
                title={`Facture ${invoice.reference}`}
                
                actions={<><Link href="/invoices" className="tc-btn-secondary"><ArrowLeft className="h-4 w-4" /> Retour</Link><PrintButton />
                        <a href={`/invoices/${invoice.id}/pdf`} className="tc-btn-primary"><Download className="h-4 w-4" /> PDF</a></>}
            />

            <div className="grid gap-4 lg:grid-cols-3">
                <section className="tc-card p-5 lg:col-span-2">
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-sm font-bold">Lignes</h2>
                        <Badge tone={statusTone(invoice.status)}>{invoice.status}</Badge>
                    </div>
                    <div className="overflow-x-auto"><table className="tc-table">
                        <thead><tr><th>Désignation</th><th>Qté</th><th>P.U. HT</th><th>TVA</th><th>Total</th></tr></thead>
                        <tbody>
                            {(invoice.lines ?? []).map((line: any) => (
                                <tr key={line.id}><td>{line.designation ?? 'Non renseigné'}</td><td>{line.quantity}</td><td>{money(line.unit_price)}</td><td>{line.vat_rate}%</td><td className="font-semibold">{money(line.price)}</td></tr>
                            ))}
                        </tbody>
                    </table></div>
                </section>
                <section className="tc-card p-5">
                    <h2 className="mb-4 text-sm font-bold">Totaux</h2>
                    <dl className="space-y-2 text-sm">
                        <div className="flex justify-between"><dt className="text-slate-500">Sous-total HT</dt><dd>{money(invoice.subtotal)}</dd></div>
                        <div className="flex justify-between"><dt className="text-slate-500">TVA</dt><dd>{money(invoice.vat_value)}</dd></div>
                        <div className="flex justify-between border-t border-slate-100 pt-2 text-base font-black"><dt>Total TTC</dt><dd>{money(invoice.total)}</dd></div>
                    </dl>
                    <div className="mt-4 text-xs text-slate-500">Réf. dossier : {invoice.file_reference ?? 'Non renseigné'}</div>
                </section>
            </div>

            <section className="tc-card mt-4 p-5">
                <h2 className="mb-3 text-sm font-bold">Documents</h2>
                <div className="space-y-2">
                    {documents.map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between rounded-xl border border-slate-100 px-4 py-3">
                            <span className="text-sm font-semibold">{doc.name}</span>
                            <a href={`/documents/${doc.id}`} className="tc-btn-secondary"><Download className="h-4 w-4" /> Télécharger</a>
                        </div>
                    ))}
                    {!documents.length && <div className="text-sm text-slate-400">Aucun document généré.</div>}
                </div>
            </section>
        </AppLayout>
    );
}
