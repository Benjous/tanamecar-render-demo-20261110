import { Head, router, useForm } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { CheckCircle2, KeyRound, ShieldCheck, ShieldOff } from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import { Field, PageHeader } from '@/components/ui';

export default function SecuritySettings({
    enabled,
    pending,
    secret,
    otpauth,
    recovery_codes,
}: {
    enabled: boolean;
    pending: boolean;
    secret: string | null;
    otpauth: string | null;
    recovery_codes: string[];
}) {
    const confirm = useForm({ code: '' });
    const disable = useForm({ password: '' });
    const [qr, setQr] = useState<string | null>(null);

    useEffect(() => {
        if (!otpauth) { setQr(null); return; }
        QRCode.toDataURL(otpauth, { margin: 1, width: 220 }).then(setQr).catch(() => setQr(null));
    }, [otpauth]);

    return (
        <AppLayout>
            <Head title="Sécurité" />
            <PageHeader title="Sécurité"  />

            <div className="grid gap-6 xl:grid-cols-3">
                <section className="tc-card p-5 xl:col-span-2">
                    <div className="flex items-start gap-3">
                        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${enabled ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                            {enabled ? <ShieldCheck className="h-5 w-5" /> : <ShieldOff className="h-5 w-5" />}
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-slate-900">Double authentification</h2>
                            <p className="mt-1 text-sm text-slate-500">
                                {enabled ? 'Active sur votre compte.' : pending ? 'Configuration en attente de confirmation.' : 'Désactivée.'}
                            </p>
                        </div>
                    </div>

                    {!enabled && !pending && (
                        <button className="tc-btn-primary mt-5" onClick={() => router.post('/settings/security/enable')}>
                            <ShieldCheck className="h-4 w-4" /> Activer la double authentification
                        </button>
                    )}

                    {pending && secret && (
                        <div className="mt-5 space-y-4">
                            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                                Ajoutez ce secret dans votre application d’authentification (Google Authenticator, Authy, 1Password…), puis confirmez.
                            </div>
                            {qr && <div className="flex justify-center rounded-xl border border-slate-200 bg-white p-4"><img src={qr} alt="QR code 2FA" className="h-52 w-52" /></div>}
                            <Field label="Secret TOTP">
                                <input readOnly value={secret} className="tc-input font-mono text-sm" />
                            </Field>
                            {otpauth && (
                                <Field label="Lien otpauth">
                                    <input readOnly value={otpauth} className="tc-input text-xs" />
                                </Field>
                            )}
                            <form
                                className="flex flex-col gap-3 sm:flex-row sm:items-end"
                                onSubmit={(event) => {
                                    event.preventDefault();
                                    confirm.post('/settings/security/confirm');
                                }}
                            >
                                <Field label="Code à 6 chiffres" error={confirm.errors.code}>
                                    <input className="tc-input" value={confirm.data.code} onChange={(event) => confirm.setData('code', event.target.value)} autoComplete="one-time-code" />
                                </Field>
                                <button className="tc-btn-primary shrink-0" disabled={confirm.processing}>
                                    <CheckCircle2 className="h-4 w-4" /> Confirmer
                                </button>
                            </form>
                        </div>
                    )}

                    {enabled && (
                        <div className="mt-5 space-y-5">
                            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                                <div className="flex items-center gap-2 font-semibold"><CheckCircle2 className="h-4 w-4" /> 2FA active</div>
                                <div className="mt-1">Code après mot de passe.</div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <button className="tc-btn-secondary" onClick={() => router.post('/settings/security/recovery-codes')}>
                                    <KeyRound className="h-4 w-4" /> Régénérer les codes de récupération
                                </button>
                            </div>
                            <form
                                className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-end"
                                onSubmit={(event) => {
                                    event.preventDefault();
                                    disable.post('/settings/security/disable');
                                }}
                            >
                                <Field label="Mot de passe actuel" error={disable.errors.password}>
                                    <input type="password" className="tc-input" value={disable.data.password} onChange={(event) => disable.setData('password', event.target.value)} />
                                </Field>
                                <button className="tc-btn-danger shrink-0" disabled={disable.processing}>
                                    <ShieldOff className="h-4 w-4" /> Désactiver
                                </button>
                            </form>
                        </div>
                    )}
                </section>

                <section className="tc-card p-5">
                    <h2 className="text-sm font-bold text-slate-900">Codes de récupération</h2>
                    <p className="mt-1 text-xs text-slate-500">Codes à usage unique.</p>
                    <div className="mt-4 grid grid-cols-1 gap-2">
                        {(recovery_codes ?? []).map((code) => (
                            <div key={code} className="rounded-lg bg-slate-50 px-3 py-2 font-mono text-xs text-slate-700">{code}</div>
                        ))}
                        {!(recovery_codes ?? []).length && <div className="text-xs text-slate-400">Aucun code.</div>}
                    </div>
                </section>
            </div>
        </AppLayout>
    );
}
