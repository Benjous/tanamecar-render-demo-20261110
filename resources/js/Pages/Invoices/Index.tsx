import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { FilterBar } from '@/components/FilterForm';
import { VirtualDataList, type VirtualColumn } from '@/components/VirtualDataList';
import { isoDate, amount } from '@/lib/utils';

type Invoice = {
    id: number;
    reference: string;
    status: string;
    issued_at: string;
    due_date: string | null;
    total: string;
    file_reference: string | null;
    subject?: string | null;
    client?: { display_name: string };
};

const statusLabels: Record<string, string> = {
    confirmed: 'Confirmée',
    paid: 'Payée',
    cancelled: 'Annulée',
    draft: 'Brouillon',
};

export default function InvoicesIndex({ invoices, filters }: { invoices: Invoice[]; filters: Record<string, string> }) {
    const columns: VirtualColumn<Invoice>[] = [
        { key: 'reference', label: 'RÉFÉRENCE', width: '120px', sortValue: (invoice) => invoice.reference, render: (invoice) => <span className="font-semibold text-brand-700">{invoice.reference}</span> },
        { key: 'dossier', label: 'RÉF. DOSSIER', width: '130px', sortValue: (invoice) => invoice.file_reference ?? '', render: (invoice) => invoice.file_reference ?? '-' },
        { key: 'client', label: 'CLIENT', width: '24%', sortValue: (invoice) => invoice.client?.display_name ?? '', render: (invoice) => invoice.client?.display_name ?? '' },
        { key: 'issued', label: 'ÉMISSION', width: '100px', sortValue: (invoice) => invoice.issued_at, render: (invoice) => isoDate(invoice.issued_at) },
        { key: 'due', label: 'ÉCHÉANCE', width: '100px', sortValue: (invoice) => invoice.due_date ?? '', render: (invoice) => (invoice.due_date ? isoDate(invoice.due_date) : '-') },
        { key: 'subject', label: 'OBJET', sortValue: (invoice) => invoice.subject ?? '', render: (invoice) => invoice.subject ?? '-' },
        { key: 'total', label: 'MONTANT', width: '110px', sortValue: (invoice) => Number(invoice.total), render: (invoice) => amount(invoice.total) },
        { key: 'status', label: 'ÉTAT', width: '100px', sortValue: (invoice) => invoice.status, render: (invoice) => statusLabels[invoice.status] ?? invoice.status },
    ];

    return (
        <AppLayout>
            <Head title="Facturation" />

            <FilterBar
                action="/invoices"
                filters={filters}
                fields={[
                    { name: 'reference', label: 'Référence', width: '120px' },
                    { name: 'dossier', label: 'Réf. dossier', width: '120px' },
                    { name: 'nom', label: 'Client' },
                    { name: 'date', label: 'Date (aaaa-mm-jj)' },
                ]}
            />

            <VirtualDataList
                rows={invoices}
                columns={columns}
                rowKey={(invoice) => invoice.id}
                href={(invoice) => `/invoices/${invoice.id}`}
                totalLabel={`${invoices.length} factures`}
                actions={(invoice) => <Link href={`/invoices/${invoice.id}`} className="al-link-modifier">Ouvrir</Link>}
                empty="Aucun résultat"
            />
        </AppLayout>
    );
}
