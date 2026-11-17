import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Plus, Save, Trash2 } from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import { Field, PageHeader } from '@/components/ui';
import { money } from '@/lib/utils';

type Client = { id: number; display_name: string; phone?: string | null; address?: string | null; identity_number?: string | null };
type Service = { id: number; name: string; price: string; vat_rate: string };
type InvoiceLine = { designation: string; quantity: number | string; unit_price: number | string; vat_rate: number | string };
type Invoice = {
    id: number;
    reference: string;
    status: string;
    client_id: number;
    issued_at: string;
    due_date: string | null;
    file_reference: string | null;
    subject: string | null;
    note: string | null;
    discount_value: string | number | null;
    discount_percent: string | number | null;
    lines: InvoiceLine[];
};

const emptyLine = { designation: '', quantity: 1, unit_price: 0, vat_rate: 20 };

export default function InvoiceForm({ clients, services, invoice }: { clients: Client[]; services: Service[]; invoice?: Invoice }) {
    const editing = Boolean(invoice);
    const { data, setData, post, put, processing, errors } = useForm({
        reference: invoice?.reference ?? '',
        status: invoice?.status ?? 'confirmed',
        client_id: invoice?.client_id ?? '',
        issued_at: invoice?.issued_at?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
        due_date: invoice?.due_date?.slice(0, 10) ?? new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
        file_reference: invoice?.file_reference ?? '',
        subject: invoice?.subject ?? '',
        note: invoice?.note ?? '',
        discount_value: invoice?.discount_value ?? 0,
        discount_percent: invoice?.discount_percent ?? 0,
        lines: invoice?.lines?.length
            ? invoice.lines.map((line) => ({ designation: line.designation, quantity: line.quantity, unit_price: line.unit_price, vat_rate: line.vat_rate }))
            : [{ ...emptyLine }],
    });

    const selectedClient = clients.find((client) => String(client.id) === String(data.client_id));
    const subtotalBefore = data.lines.reduce((sum, line) => sum + Number(line.quantity || 0) * Number(line.unit_price || 0), 0);
    const vatBefore = data.lines.reduce((sum, line) => sum + Number(line.quantity || 0) * Number(line.unit_price || 0) * Number(line.vat_rate || 0) / 100, 0);
    const discountTotal = Math.min(subtotalBefore, Number(data.discount_value || 0) + subtotalBefore * Number(data.discount_percent || 0) / 100);
    const subtotal = subtotalBefore - discountTotal;
    const ratio = subtotalBefore > 0 ? subtotal / subtotalBefore : 0;
    const vat = vatBefore * ratio;
    const total = subtotal + vat;

    function setLine(index: number, key: string, value: any) {
        const lines = [...data.lines];
        (lines[index] as any)[key] = value;
        setData('lines', lines);
    }

    function pickService(index: number, serviceId: string) {
        const service = services.find((s) => String(s.id) === serviceId);
        if (!service) return;
        const lines = [...data.lines];
        lines[index] = { ...lines[index], designation: service.name, unit_price: Number(service.price), vat_rate: Number(service.vat_rate) };
        setData('lines', lines);
    }

    function submit() {
        if (editing && invoice) {
            put(`/invoices/${invoice.id}`);
        } else {
            post('/invoices');
        }
    }

    return (
        <AppLayout>
            <Head title={editing ? `Modifier ${invoice?.reference}` : 'Nouvelle facture'} />
            <PageHeader
                title={editing ? `Modifier la facture ${invoice?.reference}` : 'Nouvelle facture'}
                actions={<Link href={editing ? `/invoices/${invoice?.id}` : '/invoices'} className="tc-btn-secondary"><ArrowLeft className="h-4 w-4" /> Retour</Link>}
            />
            <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="space-y-6">
                <section className="tc-card p-5">
                    <div className="grid gap-4 md:grid-cols-3">
                        {editing && (
                            <>
                                <Field label="Référence *" error={errors.reference}>
                                    <input className="tc-input" value={data.reference} onChange={(e) => setData('reference', e.target.value)} />
                                </Field>
                                <Field label="Statut *" error={errors.status}>
                                    <select className="tc-input" value={data.status} onChange={(e) => setData('status', e.target.value)}>
                                        <option value="confirmed">Confirmée</option>
                                        <option value="paid">Payée</option>
                                        <option value="cancelled">Annulée</option>
                                        <option value="draft">Brouillon</option>
                                    </select>
                                </Field>
                            </>
                        )}
                        <Field label="Client *" error={errors.client_id}><select className="tc-input" value={data.client_id} onChange={(e) => setData('client_id', e.target.value)}><option value="">Sélectionner…</option>{clients.map((c) => <option key={c.id} value={c.id}>{c.display_name}</option>)}</select></Field>
                        <Field label="Date d’émission *" error={errors.issued_at}><input type="date" className="tc-input" value={data.issued_at} onChange={(e) => setData('issued_at', e.target.value)} /></Field>
                        <Field label="Date d’échéance" error={errors.due_date}><input type="date" className="tc-input" value={data.due_date} min={data.issued_at} onChange={(e) => setData('due_date', e.target.value)} /></Field>
                        <Field label="Réf. Dossier" error={errors.file_reference}><input className="tc-input" value={data.file_reference} onChange={(e) => setData('file_reference', e.target.value)} /></Field>
                        <Field label="Objet" error={errors.subject}><input className="tc-input" value={data.subject} onChange={(e) => setData('subject', e.target.value)} /></Field>
                        <Field label="Note"><input className="tc-input" value={data.note} onChange={(e) => setData('note', e.target.value)} /></Field>
                    </div>
                    {selectedClient && (
                        <div className="mt-3 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                            <strong className="text-slate-800">{selectedClient.display_name}</strong>
                            {selectedClient.phone ? ` · ${selectedClient.phone}` : ''}
                            {selectedClient.identity_number ? ` · ICE ${selectedClient.identity_number}` : ''}
                            {selectedClient.address ? ` · ${selectedClient.address}` : ''}
                        </div>
                    )}
                </section>

                <section className="tc-card p-5">
                    <div className="mb-3 flex items-center justify-between">
                        <h2 className="text-sm font-bold">Lignes</h2>
                        <button type="button" className="tc-btn-secondary" onClick={() => setData('lines', [...data.lines, { ...emptyLine }])}><Plus className="h-4 w-4" /> Ajouter</button>
                    </div>
                    <div className="space-y-3">
                        {data.lines.map((line, index) => (
                            <div key={index} className="grid gap-2 rounded-xl border border-slate-100 p-3 md:grid-cols-12">
                                <div className="md:col-span-4"><label className="tc-label">Désignation</label><input className="tc-input" value={line.designation} onChange={(e) => setLine(index, 'designation', e.target.value)} /></div>
                                <div className="md:col-span-3"><label className="tc-label">Prestation</label><select className="tc-input" onChange={(e) => pickService(index, e.target.value)} defaultValue=""><option value="">-</option>{services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
                                <div className="md:col-span-1"><label className="tc-label">Qté</label><input type="number" className="tc-input" value={line.quantity} onChange={(e) => setLine(index, 'quantity', e.target.value)} /></div>
                                <div className="md:col-span-2"><label className="tc-label">P.U. HT</label><input type="number" className="tc-input" value={line.unit_price} onChange={(e) => setLine(index, 'unit_price', e.target.value)} /></div>
                                <div className="md:col-span-1"><label className="tc-label">TVA %</label><input type="number" className="tc-input" value={line.vat_rate} onChange={(e) => setLine(index, 'vat_rate', e.target.value)} /></div>
                                <div className="flex items-end md:col-span-1"><button type="button" className="tc-btn-danger w-full" onClick={() => setData('lines', data.lines.filter((_, i) => i !== index))}><Trash2 className="h-4 w-4" /></button></div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                        <Field label="Remise (montant)"><input type="number" className="tc-input" value={data.discount_value} onChange={(e) => setData('discount_value', e.target.value)} /></Field>
                        <Field label="Remise (%)"><input type="number" className="tc-input" value={data.discount_percent} onChange={(e) => setData('discount_percent', e.target.value)} /></Field>
                    </div>
                    <div className="mt-4 flex flex-wrap justify-end gap-6 text-sm">
                        <div>Sous-total HT : <span className="font-bold">{money(subtotalBefore)}</span></div>
                        <div>Remise : <span className="font-bold">{money(discountTotal)}</span></div>
                        <div>Sous-total remisé : <span className="font-bold">{money(subtotal)}</span></div>
                        <div>TVA : <span className="font-bold">{money(vat)}</span></div>
                        <div>Total TTC : <span className="font-black">{money(total)}</span></div>
                    </div>
                </section>

                <div className="flex justify-end gap-2">
                    <Link href={editing ? `/invoices/${invoice?.id}` : '/invoices'} className="tc-btn-secondary">Annuler</Link>
                    <button className="tc-btn-primary" disabled={processing}><Save className="h-4 w-4" /> {editing ? 'Enregistrer les modifications' : 'Enregistrer'}</button>
                </div>
            </form>
        </AppLayout>
    );
}
