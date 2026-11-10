import { Head, useForm } from '@inertiajs/react';
import { KeyRound } from 'lucide-react';

export default function TwoFactorChallenge() {
    const { data, setData, post, processing, errors } = useForm({ code: '' });

    return (
        <>
            <Head title="Vérification en deux étapes" />
            <div className="flex min-h-screen items-center justify-center bg-brand-100 px-4 py-8">
                <div className="w-full max-w-md rounded-lg bg-white px-6 py-8 shadow-xl sm:px-10">
                    <div className="mb-6 flex justify-center">
                        <img src="/brand/login-logo.jpg" alt="TANAMECAR" className="h-auto w-[240px]" />
                    </div>
                    <h1 className="text-center text-xl font-bold text-brand-700">Vérification en deux étapes</h1>
                    <p className="mt-2 text-center text-sm text-slate-500">
                        Saisissez le code à 6 chiffres de votre application d’authentification, ou un code de récupération.
                    </p>
                    <form
                        className="mt-6 space-y-4"
                        onSubmit={(event) => {
                            event.preventDefault();
                            post('/two-factor-challenge');
                        }}
                    >
                        <div>
                            <label className="mb-1 block text-sm font-medium text-slate-600">Code</label>
                            <div className="relative">
                                <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <input
                                    className="w-full rounded-md border-2 border-brand-700 px-3 py-3 pl-10 text-center text-lg tracking-[0.3em] outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-200"
                                    value={data.code}
                                    onChange={(event) => setData('code', event.target.value)}
                                    autoComplete="one-time-code"
                                    autoFocus
                                    required
                                />
                            </div>
                            {errors.code && <div className="mt-1 text-xs text-rose-600">{errors.code}</div>}
                        </div>
                        <button className="w-full rounded-md bg-brand-700 px-4 py-3 font-semibold text-white hover:bg-brand-800 disabled:opacity-60" disabled={processing}>
                            {processing ? 'Vérification…' : 'Vérifier'}
                        </button>
                    </form>
                </div>
            </div>
        </>
    );
}

