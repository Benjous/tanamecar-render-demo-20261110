import { Head, Link } from '@inertiajs/react';
import { FileText, Plus } from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import { FilterBar } from '@/components/FilterForm';
import { VirtualDataList, type VirtualColumn } from '@/components/VirtualDataList';
import { Badge, EmptyState, PageHeader, StatCard } from '@/components/ui';
import { date, exportUrl, money, statusTone } from '@/lib/utils';

type Invoice = {
    id: number;
    reference: string;
    status: string;
    issued_at: string;
    total: string;
    file_reference: string | null;
    client?: { display_name: string };
};

export default function InvoicesIndex({ invoices, filters, totals }: { invoices: Invoice[]; filters: Record<string, string>; totals: { total: number; subtotal: number; vat: number } }) {
    const columns: VirtualColumn<Invoice>[] = [
        { key: 'reference', label: 'Référence', width: '90px', render: (invoice) => <span className="font-bold text-brand-800">{invoice.reference}</span> },
        { key: 'client', label: 'Client', width: 'minmax(130px, 1.4fr)', sortValue: (invoice) => invoice.client?.display_name ?? '', render: (invoice) => invoice.client?.display_name ?? 'Non renseigné' },
        { key: 'status', label: 'Statut', width: '90px', render: (invoice) => <Badge tone={statusTone(invoice.status)}>{invoice.status}</Badge> },
        { key: 'date', label: 'Date', width: '90px', render: (invoice) => date(invoice.issued_at) },
        { key: 'file', label: 'Réf. dossier', width: '90px', render: (invoice) => invoice.file_reference ?? 'Non renseigné' },
        { key: 'total', label: 'Total', width: '90px', render: (invoice) => <span className="font-semibold">{money(invoice.total)}</span> },
    ];

    return (
        <AppLayout>
            <Head title="Factures" />
            <PageHeader
                title="Factures"
                
                actions={<><a href={exportUrl('invoices', filters)} className="tc-btn-secondary">Exporter CSV</a><Link href="/invoices/create" className="tc-btn-primary"><Plus className="h-4 w-4" /> Nouvelle facture</Link></>}
            />

            <div className="mb-4 grid gap-4 sm:grid-cols-3">
                <StatCard label="Total TTC" value={money(totals.total)} icon={<FileText className="h-5 w-5" />} tone="brand" />
                <StatCard label="Total HT" value={money(totals.subtotal)} tone="slate" />
                <StatCard label="TVA" value={money(totals.vat)} tone="amber" />
            </div>

            <FilterBar action="/invoices" filters={filters} searchPlaceholder="Référence, dossier, client, téléphone, montant" resultCount={invoices.length}>
                <select name="status" aria-label="Statut" defaultValue={filters.status ?? ''} className="tc-input"><option value="">Tous statuts</option><option value="draft">Brouillon</option><option value="confirmed">Confirmé</option><option value="canceled">Annulé</option></select>
                <label className="text-xs text-slate-500">Du<input type="date" aria-label="Date de début" name="from" defaultValue={filters.from ?? ''} className="tc-input mt-1" /></label>
                <label className="text-xs text-slate-500">Au<input type="date" aria-label="Date de fin" name="to" defaultValue={filters.to ?? ''} className="tc-input mt-1" /></label>
            </FilterBar>

            <VirtualDataList
                rows={invoices}
                columns={columns}
                rowKey={(invoice) => invoice.id}
                href={(invoice) => `/invoices/${invoice.id}`}
                totalLabel={`${invoices.length} factures`}
                actionsWidth="90px"
                defaultHidden={['file_reference']}
                actions={(invoice) => <a href={`/invoices/${invoice.id}/pdf`} className="text-xs font-semibold text-brand-700">PDF</a>}
                empty={<EmptyState title="Aucune facture" />}
            />
        </AppLayout>
    );
}

