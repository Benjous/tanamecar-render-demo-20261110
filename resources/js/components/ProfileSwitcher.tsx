import { router, useForm, usePage } from '@inertiajs/react';
import { ChevronDown, LogIn, LogOut, ShieldCheck, UserRound, X } from 'lucide-react';
import { useState } from 'react';
import type { PageProps, ProfileSummary } from '@/types';

function initials(name: string): string {
    return name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? '')
        .join('');
}

function roleOf(profile: ProfileSummary): string {
    return profile.role ?? (profile.is_admin ? 'Administrateur' : 'Utilisateur');
}

export default function ProfileSwitcher() {
    const { auth, profiles } = usePage<PageProps>().props;
    const user = auth.user;
    const [open, setOpen] = useState(false);
    const [selected, setSelected] = useState<ProfileSummary | null>(null);
    const [localError, setLocalError] = useState<string | null>(null);
    const form = useForm({ user_id: '' });

    if (!user) {
        return null;
    }

    const available = profiles?.available ?? [];
    const currentUser = user;

    function choose(profile: ProfileSummary) {
        if (profile.id === currentUser.id) {
            return;
        }
        setSelected(profile);
        setLocalError(null);
        form.setData('user_id', String(profile.id));
        form.clearErrors();
    }

    function submit(event: React.FormEvent) {
        event.preventDefault();
        if (!selected) {
            return;
        }
        if (!navigator.onLine) {
            setLocalError('La connexion au serveur local est nécessaire pour changer de compte.');
            return;
        }
        window.dispatchEvent(new CustomEvent('taname:account-switch'));
        form.post('/profile/switch', {
            preserveScroll: true,
            onSuccess: () => {
                setOpen(false);
                setSelected(null);
                form.reset();
            },
        });
    }

    function close() {
        setOpen(false);
        setSelected(null);
        setLocalError(null);
        form.reset();
        form.clearErrors();
    }

    return (
        <>
            <div className="al-profile-bar">
                <button type="button" className="al-profile-button" onClick={() => setOpen(true)}>
                    <span className="al-profile-avatar">{initials(user.name)}</span>
                    <span className="al-profile-copy">
                        <strong>{user.name}</strong>
                        <small>{user.role ?? (user.is_admin ? 'Administrateur' : 'Utilisateur')}</small>
                    </span>
                    <ChevronDown className="h-3.5 w-3.5" />
                </button>
            </div>

            {open && (
                <div className="al-profile-overlay" onClick={close}>
                    <div className="al-profile-modal" onClick={(event) => event.stopPropagation()}>
                        <div className="al-profile-modal-head">
                            <div>
                                <strong>Changer de compte</strong>
                                <span>{user.email}</span>
                            </div>
                            <button type="button" onClick={close} aria-label="Fermer">
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <form onSubmit={submit} className="al-profile-form">
                            <div className="al-profile-list">
                                {available.map((profile) => {
                                    const active = profile.id === user.id;
                                    const picked = selected?.id === profile.id;
                                    return (
                                        <button
                                            type="button"
                                            key={profile.id}
                                            className={`al-profile-row${picked ? ' selected' : ''}${active ? ' current' : ''}`}
                                            onClick={() => choose(profile)}
                                            disabled={active}
                                        >
                                            <span className="al-profile-avatar small">{initials(profile.name)}</span>
                                            <span className="al-profile-row-copy">
                                                <strong>{profile.name}</strong>
                                                <small>{profile.email}</small>
                                            </span>
                                            <span className="al-profile-role">{roleOf(profile)}</span>
                                            {active && <span className="al-profile-current">Connecté</span>}
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="al-profile-warning">
                                <ShieldCheck className="h-3.5 w-3.5" />
                                <span>
                                    La session actuelle sera fermée. Le compte sélectionné devra saisir son propre mot de passe sur l’écran de connexion.
                                </span>
                            </div>

                            {localError && <em className="al-profile-local-error">{localError}</em>}
                            {form.errors.user_id && <em>{form.errors.user_id}</em>}

                            <div className="al-profile-actions">
                                <button type="button" className="al-profile-cancel" onClick={close}>Annuler</button>
                                <button type="submit" className="al-profile-submit" disabled={!selected || form.processing}>
                                    <LogIn className="h-3.5 w-3.5" /> Continuer vers la connexion
                                </button>
                            </div>
                        </form>

                        <div className="al-profile-footer">
                            {user.is_admin && <a className="al-profile-manage" href="/settings/users">Gérer les profils</a>}
                            <button
                                type="button"
                                className="al-profile-logout-button"
                                onClick={() => {
                                    if (!navigator.onLine) {
                                        setLocalError('La connexion au serveur local est nécessaire pour se déconnecter.');
                                        return;
                                    }
                                    window.dispatchEvent(new CustomEvent('taname:account-switch'));
                                    router.post('/logout');
                                }}
                            >
                                <LogOut className="h-3.5 w-3.5" /> Se déconnecter
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
