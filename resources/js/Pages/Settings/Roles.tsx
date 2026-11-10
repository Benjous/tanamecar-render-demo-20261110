import { Head, Link } from '@inertiajs/react';
import { Pencil, ShieldCheck } from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import { PageHeader } from '@/components/ui';

export default function RolesSettings({ roles }: { roles: any[] }) {
    return (
        <AppLayout>
            <Head title="Rôles" />
            <PageHeader title="Rôles et permissions"  />
            <div className="grid gap-4 md:grid-cols-2">
                {roles.map((role) => (
                    <div key={role.id} className="tc-card p-5">
                        <div className="flex items-start justify-between">
                            <div>
                                <div className="flex items-center gap-2 text-sm font-bold text-slate-900"><ShieldCheck className="h-4 w-4 text-brand-700" /> {role.name}</div>
                                <div className="mt-1 text-xs text-slate-500">{role.users_count} utilisateur(s) · {role.by_default ? 'Profil par défaut' : 'Profil personnalisé'}</div>
                            </div>
                            <Link href={`/settings/roles/${role.id}/edit`} className="tc-btn-secondary"><Pencil className="h-4 w-4" /> Modifier</Link>
                        </div>
                        <div className="mt-4 flex flex-wrap gap-1">
                            {Object.entries(role.permissions ?? {}).slice(0, 12).map(([key, value]) => (
                                <span key={key} className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600">{key}: {String(value)}</span>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </AppLayout>
    );
}
