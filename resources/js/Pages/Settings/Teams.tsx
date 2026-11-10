import { Head, router, useForm } from '@inertiajs/react';
import { Plus, Save, Search, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { ConfirmButton, Field, PageHeader } from '@/components/ui';
import { normalizeText } from '@/lib/utils';

type User = { id: number; name: string; email: string };
type Team = { id: number; name: string; member_ids: number[] };

function TeamRow({ team, users }: { team: Team; users: User[] }) {
    const form = useForm({ name: team.name, member_ids: team.member_ids ?? [] });
    return (
        <form onSubmit={(event) => { event.preventDefault(); form.put(`/settings/teams/${team.id}`); }} className="border-t border-slate-100 px-4 py-4">
            <div className="grid gap-3 md:grid-cols-[1fr_2fr_auto] md:items-end">
                <Field label="Nom"><input className="tc-input" value={form.data.name} onChange={(event) => form.setData('name', event.target.value)} /></Field>
                <div>
                    <div className="tc-label">Membres</div>
                    <div className="flex flex-wrap gap-3 rounded-xl border border-slate-200 px-3 py-2">
                        {users.map((user) => (
                            <label key={user.id} className="flex items-center gap-2 text-sm text-slate-700">
                                <input type="checkbox" checked={form.data.member_ids.includes(user.id)} onChange={(event) => form.setData('member_ids', event.target.checked ? [...form.data.member_ids, user.id] : form.data.member_ids.filter((id) => id !== user.id))} />
                                {user.name}
                            </label>
                        ))}
                    </div>
                </div>
                <div className="flex gap-2">
                    <button className="tc-btn-primary" disabled={form.processing}><Save className="h-4 w-4" /> Enregistrer</button>
                    <ConfirmButton label={<Trash2 className="h-4 w-4" />} variant="secondary" title="Supprimer cette équipe ?" description="Supprimer cette équipe ?" onConfirm={() => router.delete(`/settings/teams/${team.id}`)} />
                </div>
            </div>
        </form>
    );
}

export default function Teams({ teams, users }: { teams: Team[]; users: User[] }) {
    const create = useForm({ name: '', member_ids: [] as number[] });
    const [query, setQuery] = useState('');
    const filteredTeams = useMemo(() => {
        const needle = normalizeText(query);
        if (!needle) return teams;
        return teams.filter((team) => normalizeText(team.name).includes(needle));
    }, [teams, query]);
    return (
        <AppLayout>
            <Head title="Équipes" />
            <PageHeader title="Équipes" />
            <form onSubmit={(event) => { event.preventDefault(); create.post('/settings/teams'); }} className="tc-card mb-4 p-4">
                <div className="grid gap-3 md:grid-cols-[1fr_2fr_auto] md:items-end">
                    <Field label="Nom"><input className="tc-input" value={create.data.name} onChange={(event) => create.setData('name', event.target.value)} /></Field>
                    <div>
                        <div className="tc-label">Membres</div>
                        <div className="flex flex-wrap gap-3 rounded-xl border border-slate-200 px-3 py-2">
                            {users.map((user) => (
                                <label key={user.id} className="flex items-center gap-2 text-sm text-slate-700">
                                    <input type="checkbox" checked={create.data.member_ids.includes(user.id)} onChange={(event) => create.setData('member_ids', event.target.checked ? [...create.data.member_ids, user.id] : create.data.member_ids.filter((id) => id !== user.id))} />
                                    {user.name}
                                </label>
                            ))}
                        </div>
                    </div>
                    <button className="tc-btn-primary" disabled={create.processing}><Plus className="h-4 w-4" /> Ajouter</button>
                </div>
            </form>
            <section className="tc-card overflow-hidden">
                <div className="border-b border-slate-100 p-4">
                    <label className="relative block">
                        <span className="sr-only">Rechercher une équipe</span>
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input className="tc-input pl-9" type="search" placeholder="Nom de l’équipe" value={query} onChange={(event) => setQuery(event.target.value)} />
                    </label>
                    <div className="mt-2 text-xs text-slate-500">{filteredTeams.length} équipe{filteredTeams.length > 1 ? 's' : ''}</div>
                </div>
                {filteredTeams.length === 0 ? <div className="px-4 py-6 text-sm text-slate-500">Aucun résultat</div> : filteredTeams.map((team) => <TeamRow key={team.id} team={team} users={users} />)}
            </section>
        </AppLayout>
    );
}
