import { Head, Link, useForm } from '@inertiajs/react';
import { Save } from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import { Field, PageHeader } from '@/components/ui';

type Template = { id: number; name: string; template_html: string | null; page_size: string | null; page_orientation: string | null };

function TemplateForm({ type, template }: { type: string; template: Template }) {
    const form = useForm({
        name: template.name ?? '',
        template_html: template.template_html ?? '',
        page_size: template.page_size ?? 'A4',
        page_orientation: template.page_orientation ?? 'portrait',
    });
    return (
        <form onSubmit={(event) => { event.preventDefault(); form.put(`/settings/pdf-templates/${type}/${template.id}`); }} className="tc-card p-5">
            <div className="grid gap-4 md:grid-cols-3">
                <Field label="Nom"><input className="tc-input" value={form.data.name} onChange={(event) => form.setData('name', event.target.value)} /></Field>
                <Field label="Format"><select className="tc-input" value={form.data.page_size} onChange={(event) => form.setData('page_size', event.target.value)}><option value="A4">A4</option><option value="A3">A3</option><option value="A5">A5</option><option value="receipt-thermal">Ticket</option></select></Field>
                <Field label="Orientation"><select className="tc-input" value={form.data.page_orientation} onChange={(event) => form.setData('page_orientation', event.target.value)}><option value="portrait">Portrait</option><option value="landscape">Paysage</option></select></Field>
            </div>
            <Field label="Modèle HTML"><textarea className="tc-input font-mono text-xs" rows={18} value={form.data.template_html} onChange={(event) => form.setData('template_html', event.target.value)} /></Field>
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                {['reference', 'client', 'vehicle', 'departure_at', 'return_at', 'total_amount', 'paid', 'remaining', 'subtotal', 'vat', 'company'].map((token) => <span key={token} className="rounded-lg bg-slate-100 px-2 py-1 font-mono">{`{{${token}}}`}</span>)}
            </div>
            <div className="mt-4 flex justify-end"><button className="tc-btn-primary" disabled={form.processing}><Save className="h-4 w-4" /> Enregistrer</button></div>
        </form>
    );
}

export default function PdfTemplates({ type, types, templates }: { type: string; types: Array<{ value: string; label: string }>; templates: Template[] }) {
    return (
        <AppLayout>
            <Head title="Modèles PDF" />
            <PageHeader title="Modèles PDF" />
            <div className="mb-4 flex flex-wrap gap-2">
                {types.map((item) => <Link key={item.value} href={`/settings/pdf-templates?type=${item.value}`} className={item.value === type ? 'tc-btn-primary' : 'tc-btn-secondary'}>{item.label}</Link>)}
            </div>
            <div className="space-y-4">
                {templates.length === 0 ? <div className="tc-card px-4 py-6 text-sm text-slate-500">Aucun résultat</div> : templates.map((template) => <TemplateForm key={template.id} type={type} template={template} />)}
            </div>
        </AppLayout>
    );
}
