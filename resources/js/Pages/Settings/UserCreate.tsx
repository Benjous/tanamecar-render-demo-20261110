import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, KeyRound, Save, UserPlus } from 'lucide-react';
import { useMemo, useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { Field, PageHeader } from '@/components/ui';

type Role = { id: number; name: string };

function randomIndex(max: number) {
    const value = new Uint32Array(1);
    window.crypto.getRandomValues(value);
    return value[0] % max;
}

function generatePassword() {
    const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const lower = 'abcdefghijkmnopqrstuvwxyz';
    const digits = '23456789';
    const symbols = '!@#$%';
    const all = upper + lower + digits + symbols;
    const pick = (set: string) => set[randomIndex(set.length)];
    const base = [pick(upper), pick(lower), pick(digits), pick(symbols)];
    while (base.length < 16) base.push(pick(all));
    for (let i = base.length - 1; i > 0; i--) {
        const j = randomIndex(i + 1);
        [base[i], base[j]] = [base[j], base[i]];
    }
    return base.join('');
}

export default function UserCreate({ roles, defaultRoleId }: { roles: Role[]; defaultRoleId: number | null }) {
    const [generated, setGenerated] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const form = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        role_id: defaultRoleId ?? '',
        is_admin: true,
        active: true,
    });

    const strength = useMemo(() => {
        const value = form.data.password;
        let score = 0;
        if (value.length >= 10) score++;
        if (/[a-z]/.test(value)) score++;
        if (/[A-Z]/.test(value)) score++;
        if (/\d/.test(value)) score++;
        if (/[^A-Za-z0-9]/.test(value)) score++;
        return score;
    }, [form.data.password]);

    function makePassword() {
        const password = generatePassword();
        setGenerated(password);
        form.setData('password', password);
        form.setData('password_confirmation', password);
        setShowPassword(true);
    }

    return (
        <AppLayout>
            <Head title="Ajouter un utilisateur" />
            <PageHeader
                title="Ajouter un utilisateur"
                
                actions={<Link href="/settings/users" className="tc-btn-secondary"><ArrowLeft className="h-4 w-4" /> Retour</Link>}
            />

            <form
                className="grid gap-6 xl:grid-cols-3"
                onSubmit={(event) => {
                    event.preventDefault();
                    form.post('/settings/users');
                }}
            >
                <section className="tc-card p-5 xl:col-span-2">
                    <h2 className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-900">
                        <UserPlus className="h-4 w-4 text-brand-700" /> Identité du compte
                    </h2>
                    <div className="grid gap-4 md:grid-cols-2">
                        <Field label="Nom complet *" error={form.errors.name}>
                            <input className="tc-input" value={form.data.name} onChange={(event) => form.setData('name', event.target.value)} autoFocus />
                        </Field>
                        <Field label="Adresse e-mail *" error={form.errors.email}>
                            <input type="email" className="tc-input" value={form.data.email} onChange={(event) => form.setData('email', event.target.value)} autoComplete="off" />
                        </Field>
                        <Field label="Rôle" error={form.errors.role_id} hint="Administrateur par défaut : accès complet au site.">
                            <select className="tc-input" value={form.data.role_id} onChange={(event) => form.setData('role_id', event.target.value)}>
                                <option value="">Administrateur par défaut</option>
                                {roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}
                            </select>
                        </Field>
                        <label className="flex items-center gap-2 self-end rounded-xl border border-brand-100 bg-brand-50 px-3 py-2 text-sm text-slate-700">
                            <input type="checkbox" checked={form.data.is_admin} onChange={(event) => form.setData('is_admin', event.target.checked)} />
                            Administrateur (accès complet)
                        </label>
                    </div>

                    <h2 className="mb-4 mt-6 flex items-center gap-2 text-sm font-bold text-slate-900">
                        <KeyRound className="h-4 w-4 text-brand-700" /> Mot de passe
                    </h2>
                    <div className="grid gap-4 md:grid-cols-2">
                        <Field label="Mot de passe *" error={form.errors.password} hint="10 caractères minimum, majuscule, minuscule et chiffre.">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                className="tc-input"
                                value={form.data.password}
                                onChange={(event) => form.setData('password', event.target.value)}
                                autoComplete="new-password"
                            />
                        </Field>
                        <Field label="Confirmation *" error={form.errors.password_confirmation}>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                className="tc-input"
                                value={form.data.password_confirmation}
                                onChange={(event) => form.setData('password_confirmation', event.target.value)}
                                autoComplete="new-password"
                            />
                        </Field>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-3">
                        <button type="button" className="tc-btn-secondary" onClick={makePassword}>
                            <KeyRound className="h-4 w-4" /> Générer un mot de passe
                        </button>
                        <button type="button" className="text-xs font-semibold text-brand-700" onClick={() => setShowPassword((value) => !value)}>
                            {showPassword ? 'Masquer' : 'Afficher'}
                        </button>
                        <div className="flex gap-1" aria-label="Robustesse du mot de passe">
                            {[1, 2, 3, 4, 5].map((level) => (
                                <span key={level} className={`h-1.5 w-6 rounded-full ${strength >= level ? (strength >= 4 ? 'bg-emerald-500' : 'bg-amber-400') : 'bg-slate-200'}`} />
                            ))}
                        </div>
                    </div>

                    {generated && (
                        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
                            Mot de passe généré, visible une seule fois : <span className="font-mono font-bold">{generated}</span>
                        </div>
                    )}

                    <div className="mt-6 flex justify-end gap-2">
                        <Link href="/settings/users" className="tc-btn-secondary">Annuler</Link>
                        <button className="tc-btn-primary" disabled={form.processing}><Save className="h-4 w-4" /> Créer le compte</button>
                    </div>
                </section>

                <aside className="tc-card h-fit p-5">
                    <h2 className="text-sm font-bold text-slate-900">Accès immédiat</h2>
                    <p className="mt-2 text-sm leading-relaxed text-slate-500">
                        Le nouveau compte peut se connecter dès sa création. La double authentification reste optionnelle et peut être activée dans Sécurité.
                    </p>
                    <div className="mt-4 rounded-xl bg-brand-50 p-3 text-xs text-brand-800">
                        Le mot de passe n’est jamais envoyé par e-mail. Communiquez-le à l’utilisateur par un canal sûr.
                    </div>
                </aside>
            </form>
        </AppLayout>
    );
}

