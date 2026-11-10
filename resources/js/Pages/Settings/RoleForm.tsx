import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Save } from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import { Field, PageHeader } from '@/components/ui';

export default function RoleForm({ role }: { role: any }) {
    const { data, setData, put, processing, errors, transform } = useForm({
        name: role.name,
        permissions: JSON.stringify(role.permissions ?? {}, null, 2),
    });

    transform((data) => ({ name: data.name, permissions: JSON.parse(data.permissions || '{}') }));

    return (
        <AppLayout>
            <Head title={`Rôle ${role.name}`} />
            <PageHeader title={`Rôle ${role.name}`}  actions={<Link href="/settings/roles" className="tc-btn-secondary"><ArrowLeft className="h-4 w-4" /> Retour</Link>} />
            <form onSubmit={(e) => { e.preventDefault(); put(`/settings/roles/${role.id}`); }} className="tc-card max-w-3xl p-5">
                <div className="space-y-4">
                    <Field label="Nom" error={errors.name}><input className="tc-input" value={data.name} onChange={(e) => setData('name', e.target.value)} /></Field>
                    <Field label="Permissions (JSON)" error={(errors as any).permissions} hint="Clés entity_<entité>_<action> avec valeurs yes/no/all/own.">
                        <textarea className="tc-input font-mono text-xs" rows={18} value={data.permissions} onChange={(e) => setData('permissions', e.target.value)} />
                    </Field>
                </div>
                <div className="mt-4 flex justify-end"><button className="tc-btn-primary" disabled={processing}><Save className="h-4 w-4" /> Enregistrer</button></div>
            </form>
        </AppLayout>
    );
}
