import { Head, Link, useForm } from '@inertiajs/react';

export default function ForgotPassword() {
    const { data, setData, post, processing, errors } = useForm({ email: '' });

    return (
        <>
            <Head title="Mot de passe oublié" />
            <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
                <div className="w-full max-w-md">
                    <div className="mb-6 text-xl font-black text-brand-900">TANAMECAR</div>
                    <div className="tc-card p-6">
                        <h1 className="text-xl font-black text-slate-900">Mot de passe oublié</h1>
                        <p className="mt-1 text-sm text-slate-500"></p>
                        <form
                            className="mt-6 space-y-4"
                            onSubmit={(e) => { e.preventDefault(); post('/forgot-password'); }}
                        >
                            <div>
                                <label className="tc-label">Adresse email</label>
                                <input
                                    type="email"
                                    className="tc-input"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    required
                                />
                                {errors.email && <div className="mt-1 text-xs text-rose-600">{errors.email}</div>}
                            </div>
                            <button className="tc-btn-primary w-full" disabled={processing}>Envoyer le lien</button>
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
