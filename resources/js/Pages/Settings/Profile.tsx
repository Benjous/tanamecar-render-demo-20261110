import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Save, UserCircle } from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import { Field, PageHeader } from '@/components/ui';

export default function Profile({ user }: { user: any }) {
    const form = useForm({
        name: user.name,
        email: user.email,
        password: '',
        password_confirmation: '',
    });

    return (
        <AppLayout>
            <Head title="Mon profil" />
            <PageHeader
                title="Mon profil"
                
                actions={<Link href="/" className="tc-btn-secondary"><ArrowLeft className="h-4 w-4" /> Tableau de bord</Link>}
            />
            <form
                className="tc-card max-w-3xl p-5"
                onSubmit={(event) => {
                    event.preventDefault();
                    form.put('/settings/profile');
                }}
            >
                <h2 className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-900">
                    <UserCircle className="h-4 w-4 text-brand-700" /> Compte
                </h2>
                <div className="grid gap-4 md:grid-cols-2">
                    <Field label="Nom complet *" error={form.errors.name}>
                        <input className="tc-input" value={form.data.name} onChange={(event) => form.setData('name', event.target.value)} />
                    </Field>
                    <Field label="Adresse e-mail *" error={form.errors.email}>
                        <input type="email" className="tc-input" value={form.data.email} onChange={(event) => form.setData('email', event.target.value)} />
                    </Field>
                    <Field label="Nouveau mot de passe" error={form.errors.password} hint="Laisser vide pour conserver le mot de passe actuel.">
                        <input type="password" className="tc-input" value={form.data.password} onChange={(event) => form.setData('password', event.target.value)} autoComplete="new-password" />
                    </Field>
                    <Field label="Confirmation" error={form.errors.password_confirmation}>
                        <input type="password" className="tc-input" value={form.data.password_confirmation} onChange={(event) => form.setData('password_confirmation', event.target.value)} autoComplete="new-password" />
                    </Field>
                </div>
                <div className="mt-6 flex justify-end">
                    <button className="tc-btn-primary" disabled={form.processing}><Save className="h-4 w-4" /> Enregistrer</button>
                </div>
            </form>
        </AppLayout>
    );
}
