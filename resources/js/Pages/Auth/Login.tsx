import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { useState } from 'react';
import type { PageProps } from '@/types';

export default function Login() {
    const [showPassword, setShowPassword] = useState(false);
    const { branding } = usePage<PageProps>().props;
    const { data, setData, post, processing, errors } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post('/login');
    }

    return (
        <>
            <Head title="Connexion" />
            <div className="flex min-h-screen items-center justify-center bg-brand-100 px-4 py-8">
                <div className="w-full max-w-4xl">
                    <div className="rounded-lg bg-white px-6 py-8 shadow-xl sm:px-14 sm:py-10">
                        <div className="mx-auto mb-8 flex justify-center">
                            <img
                                src="/brand/login-logo.jpg"
                                alt="TANAMECAR - So easy with us"
                                className="h-auto w-[260px] max-w-full object-contain sm:w-[310px]"
                            />
                        </div>

                        <form onSubmit={submit} className="mx-auto max-w-3xl space-y-5">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-600">
                                    Adresse email <span className="text-rose-600">*</span>
                                </label>
                                <div className="relative">
                                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="email"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        className="w-full rounded-md border-2 border-brand-700 bg-white px-3 py-3 pl-10 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-200"
                                        autoComplete="username"
                                        required
                                    />
                                </div>
                                {errors.email && <div className="mt-1 text-xs text-rose-600">{errors.email}</div>}
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-600">
                                    Mot de passe <span className="text-rose-600">*</span>
                                </label>
                                <div className="relative">
                                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        className="w-full rounded-md border border-slate-300 bg-white px-3 py-3 pl-10 pr-11 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand-700 focus:ring-2 focus:ring-brand-200"
                                        autoComplete="current-password"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((value) => !value)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-brand-700"
                                        aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                                    >
                                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                    </button>
                                </div>
                                {errors.password && <div className="mt-1 text-xs text-rose-600">{errors.password}</div>}
                            </div>

                            <label className="flex items-center gap-2 text-sm text-slate-600">
                                <input
                                    type="checkbox"
                                    checked={data.remember}
                                    onChange={(e) => setData('remember', e.target.checked)}
                                    className="h-4 w-4 rounded border-slate-300 text-brand-700 focus:ring-brand-600"
                                />
                                Se souvenir de moi
                            </label>

                            <button
                                type="submit"
                                className="w-full rounded-md bg-brand-700 px-4 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-brand-800 focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                                disabled={processing}
                            >
                                {processing ? 'Connexion…' : 'Connexion'}
                            </button>
                        </form>

                        <div className="mx-auto mt-6 flex max-w-3xl flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                            <Link href="/forgot-password" className="font-medium text-slate-800 hover:text-brand-700">
                                Mot de passe oublié
                            </Link>
                            
                        </div>
                    </div>

                    <div className="mt-8 text-center text-sm text-slate-500">
                        <div>{branding.footer}</div>
                        <div className="mt-3 text-slate-500">Espace de travail</div>
                    </div>
                </div>
            </div>
        </>
    );
}

