import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, CheckCircle2, Copy, Pencil } from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import { PageHeader, PrintButton } from '@/components/ui';
import type { EntityConfig } from '@/types';

export default function GenericShow({ entity, row }: { entity: EntityConfig; row: any }) {
    return (
        <AppLayout>
            <Head title={`${entity.label} #${row.id}`} />
            <PageHeader
                title={`${entity.label} #${row.id}`}
                
                actions={<><Link href={`/data/${entity.key}`} className="tc-btn-secondary"><ArrowLeft className="h-4 w-4" /> Retour</Link><Link href={`/data/${entity.key}/${row.id}/edit`} className="tc-btn-secondary"><Pencil className="h-4 w-4" /> Modifier</Link><button className="tc-btn-secondary" onClick={() => router.post(`/data/${entity.key}/${row.id}/duplicate`)}><Copy className="h-4 w-4" /> Dupliquer</button><PrintButton />{entity.key === 'slv_reservations' && !row.converted_contract_id && row.status !== 'convertie' && <button className="tc-btn-primary" onClick={() => router.post(`/reservations/${row.id}/convert`)}><CheckCircle2 className="h-4 w-4" /> Convertir en location</button>}</>}
            />
            {row.converted_contract_id && <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900"><Link href={`/contracts/${row.converted_contract_id}`} className="font-semibold text-brand-700">Location {row.converted_contract_id}</Link></div>}
            <div className="tc-card p-5">
                <dl className="grid gap-4 md:grid-cols-2">
                    {entity.fields.map((field) => (
                        <div key={field.name}>
                            <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{field.label}</dt>
                            <dd className="mt-1 text-sm text-slate-800">{row[field.name] === null || row[field.name] === '' ? 'Non renseigné' : String(row[field.name])}</dd>
                        </div>
                    ))}
                </dl>
            </div>
        </AppLayout>
    );
}
