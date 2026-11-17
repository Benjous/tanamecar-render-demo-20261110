import { usePage } from '@inertiajs/react';
import { AlertTriangle, CheckCircle2, CloudOff, RefreshCw, ServerOff, Wifi, WifiOff } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import type { PageProps } from '@/types';
import {
    flushOfflineQueue,
    forceLocalOperation,
    getOfflineOperations,
    removeOfflineOperation,
    retryOperation,
    setOfflineUser,
    type OfflineOperation,
} from '@/lib/offline';
import { dateTime } from '@/lib/utils';

type WadiState = { last_success_at?: string | null; last_status?: string | null } | null;

export default function OfflineDock() {
    const { auth, wadi_sync: wadi } = usePage<PageProps & { wadi_sync?: WadiState }>().props;
    const user = auth.user;
    const [online, setOnline] = useState(() => navigator.onLine);
    const [serverReachable, setServerReachable] = useState(true);
    const [operations, setOperations] = useState<OfflineOperation[]>([]);
    const [syncing, setSyncing] = useState(false);
    const [open, setOpen] = useState(false);

    const refresh = useCallback(async () => {
        if (!user) {
            setOperations([]);
            return;
        }
        setOperations(await getOfflineOperations(user.id));
    }, [user]);

    useEffect(() => {
        if (!user) {
            return;
        }
        setOfflineUser(user.id);
        void refresh();
        if (navigator.onLine) {
            void flushOfflineQueue();
        }

        const connectivity = () => setOnline(navigator.onLine);
        const queue = () => { void refresh(); };
        const syncingStart = () => setSyncing(true);
        const syncingDone = () => { setSyncing(false); void refresh(); };
        const accountSwitch = () => {
            void getOfflineOperations(user.id);
        };

        window.addEventListener('online', connectivity);
        window.addEventListener('offline', connectivity);
        window.addEventListener('taname:connectivity', connectivity);
        window.addEventListener('taname:offline-queue', queue);
        window.addEventListener('taname:offline-syncing', syncingStart);
        window.addEventListener('taname:offline-sync-done', syncingDone);
        window.addEventListener('taname:account-switch', accountSwitch);

        const timer = window.setInterval(() => {
            void refresh();
            if (navigator.onLine) {
                void fetch('/up', { cache: 'no-store' }).then((response) => setServerReachable(response.ok)).catch(() => setServerReachable(false));
            }
        }, 15000);

        if (navigator.onLine) {
            void fetch('/up', { cache: 'no-store' }).then((response) => setServerReachable(response.ok)).catch(() => setServerReachable(false));
        }

        return () => {
            window.clearInterval(timer);
            window.removeEventListener('online', connectivity);
            window.removeEventListener('offline', connectivity);
            window.removeEventListener('taname:connectivity', connectivity);
            window.removeEventListener('taname:offline-queue', queue);
            window.removeEventListener('taname:offline-syncing', syncingStart);
            window.removeEventListener('taname:offline-sync-done', syncingDone);
            window.removeEventListener('taname:account-switch', accountSwitch);
        };
    }, [refresh, user]);

    const pending = operations.filter((operation) => operation.status === 'pending' || operation.status === 'syncing');
    const conflicts = operations.filter((operation) => operation.status === 'conflict');
    const errors = operations.filter((operation) => operation.status === 'error');
    const confirmed = operations.filter((operation) => operation.status === 'confirmed');
    const issueCount = pending.length + conflicts.length + errors.length;

    if (!user) {
        return null;
    }

    const state = !online
        ? { label: 'Hors connexion', icon: WifiOff, className: 'offline-state-offline' }
        : !serverReachable
            ? { label: 'Serveur local indisponible', icon: ServerOff, className: 'offline-state-server' }
            : syncing || pending.length > 0
                ? { label: `Synchronisation en cours${pending.length ? ` (${pending.length})` : ''}`, icon: RefreshCw, className: 'offline-state-syncing' }
                : conflicts.length > 0
                    ? { label: `Conflit à résoudre (${conflicts.length})`, icon: AlertTriangle, className: 'offline-state-conflict' }
                    : errors.length > 0
                        ? { label: `Erreur de synchronisation (${errors.length})`, icon: AlertTriangle, className: 'offline-state-error' }
                        : { label: 'En ligne', icon: Wifi, className: 'offline-state-online' };
    const StateIcon = state.icon;
    const stale = !online || (wadi?.last_status !== 'success');

    return (
        <div className={`offline-dock ${open ? 'is-open' : ''}`} data-testid="offline-dock">
            <button type="button" className={`offline-status ${state.className}`} onClick={() => setOpen((value) => !value)} data-testid="offline-status">
                <StateIcon className={`h-4 w-4 ${state.className === 'offline-state-syncing' ? 'animate-spin' : ''}`} />
                <span>{state.label}</span>
                {issueCount > 0 && <strong>{issueCount}</strong>}
            </button>

            {open && (
                <div className="offline-panel">
                    <div className="offline-panel-head">
                        <div>
                            <strong>Mode hors connexion</strong>
                            <span>{confirmed.length > 0 ? `${confirmed.length} opération(s) synchronisée(s)` : 'Aucune opération confirmée'}</span>
                        </div>
                        <button type="button" onClick={() => void flushOfflineQueue()} disabled={!online || syncing} title="Synchroniser maintenant">
                            <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
                        </button>
                    </div>

                    <div className={`offline-server-note ${!online || !serverReachable ? 'is-down' : ''}`}>
                        {!online ? <CloudOff className="h-3.5 w-3.5" /> : serverReachable ? <CheckCircle2 className="h-3.5 w-3.5" /> : <CloudOff className="h-3.5 w-3.5" />}
                        {!online
                            ? 'Hors connexion : les pages déjà chargées restent consultables et les modifications sont conservées localement.'
                            : serverReachable
                                ? 'Serveur local joignable.'
                                : 'Serveur local indisponible : les pages en cache restent consultables, les modifications restent en attente.'}
                    </div>

                    {wadi?.last_success_at && (
                        <div className={`offline-wadi-note ${stale ? 'is-stale' : ''}`}>
                            <span>Dernière synchronisation WADI : {dateTime(wadi.last_success_at)}</span>
                            {stale && <em>Données possiblement anciennes.</em>}
                        </div>
                    )}

                    {issueCount === 0 && <div className="offline-empty">Aucune modification en attente.</div>}

                    {operations.filter((operation) => operation.status !== 'confirmed').map((operation) => (
                        <div key={operation.id} className={`offline-operation is-${operation.status}`}>
                            <div className="offline-operation-copy">
                                <strong>{operation.method} {operation.url.replace(window.location.origin, '')}</strong>
                                <span>{dateTime(operation.createdAt)} · {operation.status === 'conflict' ? 'Conflit conservé' : operation.status === 'error' ? operation.error : 'En attente'}</span>
                            </div>
                            <div className="offline-operation-actions">
                                {operation.status === 'conflict' && (
                                    <>
                                        <button type="button" onClick={() => void removeOfflineOperation(operation.id)}>Version serveur</button>
                                        <button type="button" className="danger" onClick={() => void forceLocalOperation(operation)}>Forcer la mienne</button>
                                    </>
                                )}
                                {(operation.status === 'error' || operation.status === 'pending') && (
                                    <button type="button" onClick={() => void retryOperation(operation.id)} disabled={!online || syncing}>Réessayer</button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
