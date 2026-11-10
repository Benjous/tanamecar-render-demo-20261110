import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Save } from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import { Field, PageHeader } from '@/components/ui';
import type { EntityConfig, EntityField } from '@/types';

type RelationOption = { value: number; label: string };

function initial(field: EntityField, row: any) {
    const value = row?.[field.name];
    if (field.input === 'checkbox') return Boolean(value);
    return value ?? '';
}

export default function GenericForm({ entity, row, relations }: { entity: EntityConfig; row: any; relations: Record<string, RelationOption[]> }) {
    const hidden = new Set(['created_at', 'created_by', 'updated_at', 'data_quality_status', 'import_batch_id', 'legacy_uid', 'legacy_payload']);
    const fields = entity.fields.filter((f) => f.kind !== 'recorded' && f.kind !== 'legacy' && !hidden.has(f.name));
    const { data, setData, post, put, processing, errors } = useForm(
        Object.fromEntries(fields.map((f) => [f.name, initial(f, row)])),
    );

    function submit(e: React.FormEvent) {
        e.preventDefault();
        if (row) put(`/data/${entity.key}/${row.id}`);
        else post(`/data/${entity.key}`);
    }

    return (
        <AppLayout>
            <Head title={row ? `Modifier ${entity.label}` : `Nouveau ${entity.label}`} />
            <PageHeader
                title={row ? `Modifier ${entity.label} #${row.id}` : `Nouveau - ${entity.label}`}
                
                actions={<Link href={`/data/${entity.key}`} className="tc-btn-secondary"><ArrowLeft className="h-4 w-4" /> Retour</Link>}
            />
            <form onSubmit={submit} className="space-y-6">
                <section className="tc-card p-5">
                    <div className="grid gap-4 md:grid-cols-3">
                        {fields.map((field) => {
                            const error = (errors as any)[field.name];
                            const value = (data as any)[field.name] ?? '';
                            if (field.input === 'relation') {
                                const options = relations[field.name] ?? [];
                                return (
                                    <Field key={field.name} label={field.label + (field.required ? ' *' : '')} error={error}>
                                        <select className="tc-input" value={value} onChange={(e) => setData(field.name, e.target.value)}>
                                            <option value="">-</option>
                                            {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                                        </select>
                                    </Field>
                                );
                            }
                            if (field.input === 'select') {
                                const options = field.options.length ? field.options : [{ label: String(value || 'Non renseigné'), value: String(value) }];
                                return (
                                    <Field key={field.name} label={field.label + (field.required ? ' *' : '')} error={error}>
                                        <select className="tc-input" value={value} onChange={(e) => setData(field.name, e.target.value)}>
                                            <option value="">-</option>
                                            {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                                        </select>
                                    </Field>
                                );
                            }
                            if (field.input === 'checkbox') {
                                return (
                                    <label key={field.name} className="flex items-center gap-2 self-end rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700">
                                        <input type="checkbox" checked={Boolean(value)} onChange={(e) => setData(field.name, e.target.checked)} />
                                        {field.label}
                                    </label>
                                );
                            }
                            if (field.input === 'textarea') {
                                return (
                                    <Field key={field.name} label={field.label + (field.required ? ' *' : '')} error={error}>
                                        <textarea className="tc-input" rows={3} value={value} onChange={(e) => setData(field.name, e.target.value)} />
                                    </Field>
                                );
                            }
                            const type = field.input === 'number' ? 'number' : field.input === 'date' ? 'date' : field.input === 'datetime' ? 'datetime-local' : 'text';
                            return (
                                <Field key={field.name} label={field.label + (field.required ? ' *' : '')} error={error}>
                                    <input type={type} className="tc-input" value={value} onChange={(e) => setData(field.name, e.target.value)} />
                                </Field>
                            );
                        })}
                    </div>
                </section>
                <div className="flex justify-end gap-2">
                    <Link href={`/data/${entity.key}`} className="tc-btn-secondary">Annuler</Link>
                    <button className="tc-btn-primary" disabled={processing}><Save className="h-4 w-4" /> {processing ? 'Enregistrement…' : 'Enregistrer'}</button>
                </div>
            </form>
        </AppLayout>
    );
}
