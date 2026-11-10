import { Head, Link } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import { FilterBar } from '@/components/FilterForm';
import { VirtualDataList, type VirtualColumn } from '@/components/VirtualDataList';
import { Badge, EmptyState, PageHeader } from '@/components/ui';
import { date, money, statusTone } from '@/lib/utils';

type Quote = {
    id: number;
    reference: string;
    status: string;
    issued_at: string;
    total: string;
    client?: { display_name: string };
};

export default function QuotesIndex({ quotes, filters }: { quotes: Quote[]; filters: Record<string, string> }) {
    const columns: VirtualColumn<Quote>[] = [
        { key: 'reference', label: 'Référence', width: '90px', render: (quote) => <span className="font-bold text-brand-800">{quote.reference}</span> },
        { key: 'client', label: 'Client', width: 'minmax(140px, 1.5fr)', render: (quote) => quote.client?.display_name ?? 'Non renseigné' },
        { key: 'status', label: 'Statut', width: '90px', render: (quote) => <Badge tone={statusTone(quote.status)}>{quote.status}</Badge> },
        { key: 'date', label: 'Date', width: '90px', render: (quote) => date(quote.issued_at) },
        { key: 'total', label: 'Total', width: '90px', render: (quote) => <span className="font-semibold">{money(quote.total)}</span> },
    ];

    return (
        <AppLayout>
            <Head title="Devis" />
            <PageHeader
                title="Devis"
                
                actions={<Link href="/quotes/create" className="tc-btn-primary"><Plus className="h-4 w-4" /> Nouveau devis</Link>}
            />
            <FilterBar action="/quotes" filters={filters} searchPlaceholder="Référence, client, téléphone, montant" resultCount={quotes.length}>
                <select name="status" aria-label="Statut" defaultValue={filters.status ?? ''} className="tc-input"><option value="">Tous statuts</option><option value="draft">Brouillon</option><option value="confirmed">Confirmé</option><option value="canceled">Annulé</option></select>
                <label className="text-xs text-slate-500">Du<input type="date" aria-label="Date de début" name="from" defaultValue={filters.from ?? ''} className="tc-input mt-1" /></label>
                <label className="text-xs text-slate-500">Au<input type="date" aria-label="Date de fin" name="to" defaultValue={filters.to ?? ''} className="tc-input mt-1" /></label>
            </FilterBar>

            <VirtualDataList
                rows={quotes}
                columns={columns}
                rowKey={(quote) => quote.id}
                href={(quote) => `/quotes/${quote.id}`}
                totalLabel={`${quotes.length} devis`}
                actionsWidth="90px"
                actions={(quote) => <a href={`/quotes/${quote.id}/pdf`} className="text-xs font-semibold text-brand-700">PDF</a>}
                empty={<EmptyState title="Aucun devis" />}
            />
        </AppLayout>
    );
}
