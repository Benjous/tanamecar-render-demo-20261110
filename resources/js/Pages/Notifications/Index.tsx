import { Head, Link, router } from '@inertiajs/react';
import { Bell, CheckCheck, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { EmptyState, PageHeader } from '@/components/ui';
import { dateTime, normalizeText } from '@/lib/utils';

function notificationHref(notification: any): string {
    const data = notification.data ?? {};
    if (data.contract_id) return `/contracts/${data.contract_id}`;
    if (data.invoice_id) return `/invoices/${data.invoice_id}`;
    if (data.payment_id && data.contract_id) return `/contracts/${data.contract_id}`;
    return '/notifications';
}

export default function NotificationsIndex({ notifications }: { notifications: any[] }) {
    const [query, setQuery] = useState('');
    const filtered = useMemo(() => {
        const needle = normalizeText(query);
        if (!needle) return notifications;
        return notifications.filter((notification) => normalizeText(`${notification.title ?? ''} ${notification.body ?? ''}`).includes(needle));
    }, [notifications, query]);

    return (
        <AppLayout>
            <Head title="Notifications" />
            <PageHeader
                title="Notifications"
                
                actions={
                    <button className="tc-btn-secondary" onClick={() => router.post('/notifications/read-all')}>
                        <CheckCheck className="h-4 w-4" /> Tout marquer comme lu
                    </button>
                }
            />
            <div className="tc-card mb-4 p-4">
                <label className="relative block">
                    <span className="sr-only">Rechercher une notification</span>
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input className="tc-input pl-9" type="search" placeholder="Titre ou contenu" value={query} onChange={(event) => setQuery(event.target.value)} />
                </label>
                <div className="mt-2 text-xs text-slate-500">{filtered.length} notification{filtered.length > 1 ? 's' : ''}</div>
            </div>
            <div className="tc-card overflow-hidden">
                {filtered.map((notification) => (
                    <div key={notification.id} className={`relative border-b border-brand-100/70 transition-colors hover:bg-brand-50/70 ${notification.read_at ? 'bg-white' : 'bg-brand-50/50'}`}>
                        <Link href={notificationHref(notification)} data-testid="row-link" aria-label={`Ouvrir ${notification.title}`} className="absolute inset-0 z-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-500" />
                        <div className="pointer-events-none relative z-10 flex items-start gap-3 px-5 py-4">
                            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700">
                                <Bell className="h-4 w-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div className="text-sm font-semibold text-slate-800">{notification.title}</div>
                                    <div className="text-xs text-slate-400">{dateTime(notification.created_at)}</div>
                                </div>
                                {notification.body && <div className="mt-1 text-sm text-slate-500">{notification.body}</div>}
                                {!notification.read_at && (
                                    <button
                                        onClick={(event) => {
                                            event.stopPropagation();
                                            router.post(`/notifications/${notification.id}/read`);
                                        }}
                                        className="pointer-events-auto mt-2 text-xs font-semibold text-brand-700 hover:underline"
                                    >
                                        Marquer comme lu
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
                {!filtered.length && <EmptyState title={query ? 'Aucun résultat' : 'Aucune notification'} />}
            </div>
        </AppLayout>
    );
}
