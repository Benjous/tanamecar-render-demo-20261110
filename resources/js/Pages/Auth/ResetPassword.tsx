import { Head, Link, useForm } from '@inertiajs/react';

export default function ResetPassword({ token, email }: { token: string; email?: string }) {
    const { data, setData, post, processing, errors } = useForm({
        token,
        email: email ?? '',
        password: '',
        password_confirmation: '',
    });

    return (
        <>
            <Head title="Réinitialiser le mot de passe" />
            <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
                <div className="w-full max-w-md">
                    <div className="mb-6 text-xl font-black text-brand-900">TANAMECAR</div>
                    <div className="tc-card p-6">
                        <h1 className="text-xl font-black text-slate-900">Nouveau mot de passe</h1>
                        <form className="mt-6 space-y-4" onSubmit={(e) => { e.preventDefault(); post('/reset-password'); }}>
                            <div>
                                <label className="tc-label">Adresse email</label>
                                <input type="email" className="tc-input" value={data.email} onChange={(e) => setData('email', e.target.value)} required />
                                {errors.email && <div className="mt-1 text-xs text-rose-600">{errors.email}</div>}
                            </div>
                            <div>
                                <label className="tc-label">Mot de passe</label>
                                <input type="password" className="tc-input" value={data.password} onChange={(e) => setData('password', e.target.value)} required />
                                {errors.password && <div className="mt-1 text-xs text-rose-600">{errors.password}</div>}
                            </div>
                            <div>
                                <label className="tc-label">Confirmation</label>
                                <input type="password" className="tc-input" value={data.password_confirmation} onChange={(e) => setData('password_confirmation', e.target.value)} required />
                            </div>
                            <button className="tc-btn-primary w-full" disabled={processing}>Réinitialiser</button>
                        </form>
                        <div className="mt-4 text-sm">
                            <Link href="/login" className="font-semibold text-brand-700">Retour à la connexion</Link>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
