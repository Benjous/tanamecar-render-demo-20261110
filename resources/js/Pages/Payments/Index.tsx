import { Head, Link } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import { FilterBar } from '@/components/FilterForm';
import { VirtualDataList, type VirtualColumn } from '@/components/VirtualDataList';
import { Badge, EmptyState, PageHeader } from '@/components/ui';
import { dateTime, exportUrl, money, statusTone } from '@/lib/utils';

type Payment = {
    id: number;
    amount: string;
    payment_method: string;
    payment_status: string;
    created_at: string;
    contract?: { id: number; reference: string; client?: { display_name: string } };
};

export default function PaymentsIndex({ payments, filters, methods }: { payments: Payment[]; filters: Record<string, string>; methods: string[] }) {
    const columns: VirtualColumn<Payment>[] = [
        { key: 'contract', label: 'Contrat', width: '80px', sortValue: (payment) => payment.contract?.reference ?? '', render: (payment) => <span className="font-semibold text-brand-800">{payment.contract?.reference ?? 'Non renseigné'}</span> },
        { key: 'client', label: 'Client', width: 'minmax(150px, 1.2fr)', className: 'workspace-cell-wrap', sortValue: (payment) => payment.contract?.client?.display_name ?? '', render: (payment) => payment.contract?.client?.display_name ?? 'Non renseigné' },
        { key: 'amount', label: 'Montant', width: '90px', render: (payment) => <span className="font-semibold">{money(payment.amount)}</span> },
        { key: 'method', label: 'Mode', width: '80px', render: (payment) => payment.payment_method },
        { key: 'status', label: 'Statut', width: '85px', render: (payment) => <Badge tone={statusTone(payment.payment_status)}>{payment.payment_status}</Badge> },
        { key: 'date', label: 'Date', width: '130px', render: (payment) => dateTime(payment.created_at) },
    ];

    return (
        <AppLayout>
            <Head title="Paiements" />
            <PageHeader
                title="Paiements"
                
                actions={<a href={exportUrl('payments', filters)} className="tc-btn-secondary">Exporter CSV</a>}
            />

            <FilterBar action="/payments" filters={filters} searchPlaceholder="Contrat, client, téléphone, mode, montant" resultCount={payments.length}>
                <select name="status" aria-label="Statut" defaultValue={filters.status ?? ''} className="tc-input"><option value="">Tous statuts</option><option value="paye">Payé</option><option value="impaye">Impayé</option><option value="echeancier">Échéancier</option><option value="remboursement">Remboursement</option></select>
                <select name="method" aria-label="Mode de paiement" defaultValue={filters.method ?? ''} className="tc-input"><option value="">Tous modes</option>{methods.map((method) => <option key={method} value={method}>{method}</option>)}</select>
                <label className="text-xs text-slate-500">Du<input type="date" aria-label="Date de début" name="from" defaultValue={filters.from ?? ''} className="tc-input mt-1" /></label>
                <label className="text-xs text-slate-500">Au<input type="date" aria-label="Date de fin" name="to" defaultValue={filters.to ?? ''} className="tc-input mt-1" /></label>
            </FilterBar>

            <VirtualDataList
                rows={payments}
                columns={columns}
                rowKey={(payment) => payment.id}
                href={(payment) => (payment.contract?.id ? `/contracts/${payment.contract.id}` : '/payments')}
                totalLabel={`${payments.length} paiements`}
                actionsWidth="90px"
                empty={<EmptyState title="Aucun paiement" />}
            />
        </AppLayout>
    );
}

