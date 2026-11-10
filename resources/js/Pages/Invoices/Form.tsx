import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Plus, Save, Trash2 } from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import { Field, PageHeader } from '@/components/ui';
import { money } from '@/lib/utils';

type Client = { id: number; display_name: string };
type Service = { id: number; name: string; price: string; vat_rate: string };

export default function InvoiceForm({ clients, services }: { clients: Client[]; services: Service[] }) {
    const { data, setData, post, processing, errors } = useForm({
        client_id: '',
        issued_at: new Date().toISOString().slice(0, 10),
        due_date: '',
        subject: '',
        note: '',
        lines: [{ designation: '', quantity: 1, unit_price: 0, vat_rate: 20 }],
    });

    const subtotal = data.lines.reduce((sum, line) => sum + Number(line.quantity || 0) * Number(line.unit_price || 0), 0);
    const vat = data.lines.reduce((sum, line) => sum + Number(line.quantity || 0) * Number(line.unit_price || 0) * Number(line.vat_rate || 0) / 100, 0);
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

    return (
        <AppLayout>
            <Head title="Nouvelle facture" />
            <PageHeader title="Nouvelle facture"  actions={<Link href="/invoices" className="tc-btn-secondary"><ArrowLeft className="h-4 w-4" /> Retour</Link>} />
            <form onSubmit={(e) => { e.preventDefault(); post('/invoices'); }} className="space-y-6">
                <section className="tc-card p-5">
                    <div className="grid gap-4 md:grid-cols-3">
                        <Field label="Client *" error={errors.client_id}><select className="tc-input" value={data.client_id} onChange={(e) => setData('client_id', e.target.value)}><option value="">Sélectionner…</option>{clients.map((c) => <option key={c.id} value={c.id}>{c.display_name}</option>)}</select></Field>
                        <Field label="Date d’émission *"><input type="date" className="tc-input" value={data.issued_at} onChange={(e) => setData('issued_at', e.target.value)} /></Field>
                        <Field label="Date d’échéance"><input type="date" className="tc-input" value={data.due_date} onChange={(e) => setData('due_date', e.target.value)} /></Field>
                        <Field label="Objet"><input className="tc-input" value={data.subject} onChange={(e) => setData('subject', e.target.value)} /></Field>
                        <Field label="Note"><input className="tc-input" value={data.note} onChange={(e) => setData('note', e.target.value)} /></Field>
                    </div>
                </section>

                <section className="tc-card p-5">
                    <div className="mb-3 flex items-center justify-between">
                        <h2 className="text-sm font-bold">Lignes</h2>
                        <button type="button" className="tc-btn-secondary" onClick={() => setData('lines', [...data.lines, { designation: '', quantity: 1, unit_price: 0, vat_rate: 20 }])}><Plus className="h-4 w-4" /> Ajouter</button>
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
                    <div className="mt-4 flex justify-end gap-6 text-sm">
                        <div>Sous-total HT : <span className="font-bold">{money(subtotal)}</span></div>
                        <div>TVA : <span className="font-bold">{money(vat)}</span></div>
                        <div>Total TTC : <span className="font-black">{money(total)}</span></div>
                    </div>
                </section>

                <div className="flex justify-end gap-2"><Link href="/invoices" className="tc-btn-secondary">Annuler</Link><button className="tc-btn-primary" disabled={processing}><Save className="h-4 w-4" /> Enregistrer</button></div>
            </form>
        </AppLayout>
    );
}
