import { Head, useForm } from '@inertiajs/react';
import { Plus, Save, Search, UserX } from 'lucide-react';
import { useMemo, useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { Badge, ConfirmButton, Field, PageHeader } from '@/components/ui';
import { normalizeText } from '@/lib/utils';

export default function UsersSettings({ users, roles }: { users: any[]; roles: { id: number; name: string }[] }) {
    const create = useForm({ name: '', email: '', password: '', role_id: '', is_admin: false, active: true });
    const [query, setQuery] = useState('');
    const filteredUsers = useMemo(() => {
        const needle = normalizeText(query);
        if (!needle) return users;
        return users.filter((user) => normalizeText(`${user.name} ${user.email} ${user.role?.name ?? ''}`).includes(needle));
    }, [users, query]);

    return (
        <AppLayout>
            <Head title="Utilisateurs" />
            <PageHeader title="Utilisateurs"  />
            <div className="grid gap-6 xl:grid-cols-3">
                <section className="tc-card p-5">
                    <h2 className="mb-4 text-sm font-bold">Créer un utilisateur</h2>
                    <form onSubmit={(e) => { e.preventDefault(); create.post('/settings/users', { preserveScroll: true, onSuccess: () => create.reset() }); }} className="space-y-3">
                        <Field label="Nom *" error={create.errors.name}><input className="tc-input" value={create.data.name} onChange={(e) => create.setData('name', e.target.value)} /></Field>
                        <Field label="Email *" error={create.errors.email}><input type="email" className="tc-input" value={create.data.email} onChange={(e) => create.setData('email', e.target.value)} /></Field>
                        <Field label="Mot de passe *" error={create.errors.password}><input type="password" className="tc-input" value={create.data.password} onChange={(e) => create.setData('password', e.target.value)} /></Field>
                        <Field label="Rôle"><select className="tc-input" value={create.data.role_id} onChange={(e) => create.setData('role_id', e.target.value)}><option value="">-</option>{roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}</select></Field>
                        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={create.data.is_admin} onChange={(e) => create.setData('is_admin', e.target.checked)} /> Administrateur</label>
                        <button className="tc-btn-primary w-full" disabled={create.processing}><Plus className="h-4 w-4" /> Créer</button>
                    </form>
                </section>

                <section className="tc-card overflow-hidden xl:col-span-2">
                    <div className="border-b border-slate-100 p-4">
                        <label className="relative block">
                            <span className="sr-only">Rechercher un utilisateur</span>
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input className="tc-input pl-9" placeholder="Nom, email, rôle" value={query} onChange={(event) => setQuery(event.target.value)} />
                        </label>
                        <div className="mt-2 text-xs text-slate-500">{filteredUsers.length} utilisateur{filteredUsers.length > 1 ? 's' : ''}</div>
                    </div>
                    <div className="overflow-x-auto"><table className="tc-table">
                        <thead><tr><th>Nom</th><th>Email</th><th>Rôle</th><th>Admin</th><th>Actif</th><th></th></tr></thead>
                        <tbody>
                            {filteredUsers.map((user) => <UserRow key={user.id} user={user} roles={roles} />)}
                        </tbody>
                    </table></div>
                </section>
            </div>
        </AppLayout>
    );
}

function UserRow({ user, roles }: { user: any; roles: { id: number; name: string }[] }) {
    const form = useForm({
        name: user.name,
        email: user.email,
        password: '',
        role_id: user.role_id ?? '',
        is_admin: !!user.is_admin,
        active: !!user.active,
    });

    return (
        <tr>
            <td><input className="tc-input h-8 py-1 text-[12px]" value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} /></td>
            <td><input className="tc-input h-8 py-1 text-[12px]" value={form.data.email} onChange={(e) => form.setData('email', e.target.value)} /></td>
            <td><select className="tc-input h-8 py-1 text-[12px]" value={form.data.role_id} onChange={(e) => form.setData('role_id', e.target.value)}><option value="">-</option>{roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}</select></td>
            <td><input type="checkbox" checked={form.data.is_admin} onChange={(e) => form.setData('is_admin', e.target.checked)} /></td>
            <td><Badge tone={user.active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'}>{user.active ? 'Oui' : 'Non'}</Badge></td>
            <td>
                <div className="flex items-center gap-2 [&_button]:px-2 [&_button]:py-1 [&_button]:text-[11px]">
                    <button className="tc-btn-secondary" onClick={() => form.put(`/settings/users/${user.id}`, { preserveScroll: true })} disabled={form.processing}><Save className="h-4 w-4" /> Enregistrer</button>
                    {user.active && <ConfirmButton label={<UserX className="h-4 w-4" />} variant="secondary" title="Désactiver l’utilisateur" onConfirm={() => form.post(`/settings/users/${user.id}/deactivate`, { preserveScroll: true })} />}
                </div>
            </td>
        </tr>
    );
}
