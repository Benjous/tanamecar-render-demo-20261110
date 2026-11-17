import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
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
            <form onSubmit={submit}>
                <table className="al-form-table">
                    <tbody>
                        {fields.map((field) => {
                            const error = (errors as any)[field.name];
                            const value = (data as any)[field.name] ?? '';
                            const label = field.label;
                            let control;
                            if (field.input === 'relation') {
                                const options = relations[field.name] ?? [];
                                control = (
                                    <select value={value} onChange={(e) => setData(field.name, e.target.value)}>
                                        <option value="">-</option>
                                        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                                    </select>
                                );
                            } else if (field.input === 'select') {
                                const options = field.options.length ? field.options : [{ label: String(value || 'Non renseigné'), value: String(value) }];
                                control = (
                                    <select value={value} onChange={(e) => setData(field.name, e.target.value)}>
                                        <option value="">-</option>
                                        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                                    </select>
                                );
                            } else if (field.input === 'checkbox') {
                                control = <input type="checkbox" checked={Boolean(value)} onChange={(e) => setData(field.name, e.target.checked)} />;
                            } else if (field.input === 'textarea') {
                                control = <textarea rows={3} value={value} onChange={(e) => setData(field.name, e.target.value)} />;
                            } else {
                                const type = field.input === 'number' ? 'number' : field.input === 'date' ? 'date' : field.input === 'datetime' ? 'datetime-local' : 'text';
                                control = <input type={type} value={value} onChange={(e) => setData(field.name, e.target.value)} />;
                            }
                            return (
                                <tr key={field.name}>
                                    <td className="al-form-label">
                                        <span className="al-triangle">&#9654;</span>{label}{field.required ? ' *' : ''}
                                    </td>
                                    <td>
                                        {control}
                                        {error && <div className="al-login-error">{error}</div>}
                                    </td>
                                </tr>
                            );
                        })}
                        <tr>
                            <td />
                            <td className="al-form-actions">
                                <button type="submit" className="al-button al-button-primary" disabled={processing}>
                                    {processing ? 'Enregistrement...' : 'Valider'}
                                </button>
                                <Link href={`/data/${entity.key}`} className="al-button" style={{ marginLeft: 6 }}>Annuler</Link>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </form>
        </AppLayout>
    );
}
