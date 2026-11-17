import { Head, useForm } from '@inertiajs/react';
import { useEffect } from 'react';
import { clearOfflinePages } from '@/lib/offline';

export default function Login({ email = '' }: { email?: string | null }) {
    const { data, setData, post, processing, errors } = useForm({
        email: email ?? '',
        password: '',
        remember: false,
    });

    useEffect(() => {
        void clearOfflinePages();
    }, []);

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post('/login');
    }

    return (
        <>
            <Head title="Connexion" />
            <div className="tc-login-page tc-login-minimal">
                <video className="tc-login-video" autoPlay muted loop playsInline preload="metadata">
                    <source src="/videos/login-rental-cars.mp4" type="video/mp4" />
                </video>
                <div className="tc-login-shade" />

                <div className="tc-login-minimal-content">
                    <img
                        className="tc-login-minimal-logo"
                        src="/legacy/logo-tanamecar-transparent.png"
                        alt="TANAME CAR"
                    />

                    <form onSubmit={submit} className="tc-login-minimal-card" aria-label="Connexion">
                        <label className="tc-login-minimal-field">
                            <span>Identifiant</span>
                            <input
                                type="email"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                autoComplete="username"
                                required
                            />
                            {errors.email && <div className="tc-login-minimal-error">{errors.email}</div>}
                        </label>

                        <label className="tc-login-minimal-field">
                            <span>Mot de passe</span>
                            <input
                                type="password"
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                autoComplete="current-password"
                                required
                            />
                            {errors.password && <div className="tc-login-minimal-error">{errors.password}</div>}
                        </label>

                        <label className="tc-login-minimal-remember">
                            <input
                                type="checkbox"
                                checked={data.remember}
                                onChange={(e) => setData('remember', e.target.checked)}
                            />
                            Se souvenir de moi
                        </label>

                        <button type="submit" className="tc-login-minimal-submit" disabled={processing}>
                            {processing ? 'Connexion...' : 'Se connecter'}
                        </button>
                    </form>
                </div>
            </div>
        </>
    );
}
