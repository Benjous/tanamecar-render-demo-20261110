import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Download } from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import { Badge, PageHeader, PrintButton } from '@/components/ui';
import { date, money, statusTone } from '@/lib/utils';

export default function QuoteShow({ quote }: { quote: any }) {
    return (
        <AppLayout>
            <Head title={`Devis ${quote.reference}`} />
            <PageHeader title={`Devis ${quote.reference}`}  actions={<><Link href="/quotes" className="tc-btn-secondary"><ArrowLeft className="h-4 w-4" /> Retour</Link><PrintButton />
                        <a href={`/quotes/${quote.id}/pdf`} className="tc-btn-primary"><Download className="h-4 w-4" /> PDF</a></>} />
            <div className="grid gap-4 lg:grid-cols-3">
                <section className="tc-card p-5 lg:col-span-2">
                    <div className="mb-4 flex items-center justify-between"><h2 className="text-sm font-bold">Lignes</h2><Badge tone={statusTone(quote.status)}>{quote.status}</Badge></div>
                    <div className="overflow-x-auto"><table className="tc-table"><thead><tr><th>Désignation</th><th>Qté</th><th>P.U. HT</th><th>TVA</th><th>Total</th></tr></thead><tbody>
                        {(quote.lines ?? []).map((line: any) => <tr key={line.id}><td>{line.designation}</td><td>{line.quantity}</td><td>{money(line.unit_price)}</td><td>{line.vat_rate}%</td><td>{money(line.price)}</td></tr>)}
                    </tbody></table></div>
                </section>
                <section className="tc-card p-5"><h2 className="mb-4 text-sm font-bold">Totaux</h2><dl className="space-y-2 text-sm">
                    <div className="flex justify-between"><dt>Sous-total HT</dt><dd>{money(quote.subtotal)}</dd></div>
                    <div className="flex justify-between"><dt>TVA</dt><dd>{money(quote.vat_value)}</dd></div>
                    <div className="flex justify-between border-t pt-2 text-base font-black"><dt>Total TTC</dt><dd>{money(quote.total)}</dd></div>
                </dl></section>
            </div>
        </AppLayout>
    );
}
