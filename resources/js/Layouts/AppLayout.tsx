import { Link, usePage } from '@inertiajs/react';
import { useState } from 'react';
import type { ReactNode } from 'react';
import { Bell, CalendarDays, ChevronDown, CloudDownload, Maximize2, Plus, RefreshCw, Search } from 'lucide-react';
import type { PageProps } from '@/types';
import ProfileSwitcher from '@/components/ProfileSwitcher';
import OfflineDock from '@/components/OfflineDock';
import RecapPanel from '@/components/RecapPanel';
import {
    activeWorkspaceGroup, activeWorkspaceItem, contextualCreateHref, workspaceGroups,
} from '@/lib/workspaceNav';

export default function AppLayout({ children }: { children: ReactNode; title?: string }) {
    const { props, url } = usePage<PageProps>();
    const user = props.auth?.user;
    const flash = props.flash ?? {};
    const [newOpen, setNewOpen] = useState(false);
    const [calendarOpen, setCalendarOpen] = useState(false);
    const unread = Number((props as any).notifications?.unread ?? 0);
    const today = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Africa/Casablanca',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).format(new Date());
    const branding = (props as any).branding ?? { logo: '/brand/login-logo.jpg', name: 'TANAME CAR' };
    const visibleGroups = workspaceGroups;
    const activeGroupRaw = activeWorkspaceGroup(url);
    const activeGroup = activeGroupRaw && visibleGroups.some((group) => group.key === activeGroupRaw.key) ? activeGroupRaw : null;
    const activeItem = activeWorkspaceItem(url, activeGroup);
    const createHref = contextualCreateHref(url);
    const currentPath = url.split('?')[0] || '/';
    const showActions = currentPath !== '/' && currentPath !== '/dashboard' && !currentPath.startsWith('/settings/security');

    const deleteSelected = () => {
        window.dispatchEvent(new CustomEvent('taname:workspace-delete'));
    };

    return (
        <div className="legacy-app">
            <table className="al-root">
                <tbody>
                    <tr>
                        <td colSpan={6}>
                            <table className="al-header">
                                <tbody>
                                    <tr>
                                        <td className="al-logo-cell" colSpan={2}>
                                            <Link href="/" className="al-logo-link">
                                                <img src="/legacy/logo-tanamecar.png" alt={branding.name ?? 'TANAME CAR'} />
                                            </Link>
                                        </td>
                                        <td className="al-load-cell" id="load" />
                                        <td className="al-percent-cell" id="per" />
                                        <td className="al-account-cell">
                                            <div className="al-top-actions">
                                                <form action="/search" method="get" className="al-top-search">
                                                    <Search className="h-4 w-4" />
                                                    <input name="q" placeholder="Rechercher..." aria-label="Recherche globale" />
                                                </form>
                                                <div className="al-top-menu">
                                                    <button type="button" className="al-top-icon" onClick={() => setNewOpen((v) => !v)} aria-label="Nouveau">
                                                        <Plus className="h-4 w-4" /><span>Nouveau</span><ChevronDown className="h-3 w-3" />
                                                    </button>
                                                    {newOpen && (
                                                        <div className="al-top-dropdown">
                                                            <Link href="/contracts/create" onClick={() => setNewOpen(false)}>Nouveau contrat</Link>
                                                            <Link href="/clients/create" onClick={() => setNewOpen(false)}>Nouveau client</Link>
                                                            <Link href="/invoices/create" onClick={() => setNewOpen(false)}>Nouvelle facture</Link>
                                                            <Link href="/deadlines" onClick={() => setNewOpen(false)}>Nouvel entretien</Link>
                                                        </div>
                                                    )}
                                                </div>
                                                <Link href="/notifications" className="al-top-icon" aria-label="Notifications">
                                                    <Bell className="h-4 w-4" />
                                                    {unread > 0 && <span className="al-top-badge">{unread > 99 ? '99+' : unread}</span>}
                                                </Link>
                                                <div className="al-top-menu al-top-calendar">
                                                    <button type="button" className="al-top-icon" onClick={() => setCalendarOpen((v) => !v)} aria-label="Calendrier">
                                                        <CalendarDays className="h-4 w-4" />
                                                    </button>
                                                    {calendarOpen && (
                                                        <div className="al-top-dropdown">
                                                            <Link href={`/contracts?view=returns&date=${today}`} onClick={() => setCalendarOpen(false)}>Retours aujourd’hui</Link>
                                                            <Link href={`/contracts?date=${today}`} onClick={() => setCalendarOpen(false)}>Départs aujourd’hui</Link>
                                                            <Link href="/contracts?status=overdue&view=returns" onClick={() => setCalendarOpen(false)}>Retours en retard</Link>
                                                        </div>
                                                    )}
                                                </div>
                                                <button type="button" className="al-top-icon al-top-refresh" onClick={() => window.location.reload()} aria-label="Actualiser">
                                                    <RefreshCw className="h-4 w-4" />
                                                </button>
                                                {user && (props as any).wadi_sync?.last_success_at && (
                                                    <Link
                                                        href="/settings/wadi-sync"
                                                        className="al-top-icon"
                                                        title={`Dernière synchronisation WADI : ${new Date((props as any).wadi_sync.last_success_at).toLocaleString('fr-FR')}`}
                                                        aria-label="Fraîcheur des données WADI"
                                                    >
                                                        <CloudDownload className="h-4 w-4" />
                                                        <span style={{ fontSize: 10 }}>
                                                            {new Date((props as any).wadi_sync.last_success_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </Link>
                                                )}
                                                <button
                                                    type="button"
                                                    className="al-top-icon al-top-fullscreen"
                                                    aria-label="Plein écran"
                                                    onClick={() => {
                                                        if (document.fullscreenElement) document.exitFullscreen();
                                                        else document.documentElement.requestFullscreen?.();
                                                    }}
                                                >
                                                    <Maximize2 className="h-4 w-4" />
                                                </button>
                                                <ProfileSwitcher />
                                            </div>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </td>
                    </tr>

                    <tr>
                        <td colSpan={6} className="al-main-tabs-row">
                            <table className="al-main-tabs">
                                <tbody>
                                    <tr>
                                        {visibleGroups.map((group, index) => (
                                            <FragmentTab
                                                key={group.key}
                                                group={group}
                                                active={activeGroup?.key === group.key}
                                                last={index === visibleGroups.length - 1}
                                            />
                                        ))}
                                    </tr>
                                </tbody>
                            </table>
                        </td>
                    </tr>

                    <tr>
                        <td colSpan={6} className="al-subbar-row">
                            <table className="al-submenu">
                                <tbody>
                                    <tr>
                                        {(activeGroup?.items ?? visibleGroups[0].items).map((item) => (
                                            <td key={`${item.label}-${item.href}`} className={activeItem?.href === item.href ? 'active' : ''}>
                                                <Link href={item.href}>{item.label}</Link>
                                            </td>
                                        ))}
                                    </tr>
                                </tbody>
                            </table>
                        </td>
                    </tr>

                    <tr>
                        <td colSpan={6}>
                            <table className="al-body-table">
                                <tbody>
                                    <tr>
                                        <td className="al-left-column">
                                            <table className="al-left-inner">
                                                <tbody>
                                                    <tr>
                                                        <td className="al-left-actions-cell">
                                                            <table className="al-left-actions">
                                                                <tbody>
                                                                    <tr>
                                                                        <td className="al-left-action" id="VIS">
                                                                            {showActions && createHref ? (
                                                                                <Link href={createHref} data-testid="workspace-create">Nouveau</Link>
                                                                            ) : (
                                                                                <span>Nouveau</span>
                                                                            )}
                                                                        </td>
                                                                    </tr>
                                                                    <tr>
                                                                        <td className="al-left-action" id="SPP">
                                                                            {showActions ? (
                                                                                <button type="button" onClick={deleteSelected} data-testid="workspace-delete">Supprimer</button>
                                                                            ) : (
                                                                                <span>Supprimer</span>
                                                                            )}
                                                                        </td>
                                                                    </tr>
                                                                    <tr>
                                                                        <td className="al-left-blank">&nbsp;</td>
                                                                    </tr>
                                                                </tbody>
                                                            </table>
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td className="al-recap-header">
                                                            <button type="button" onClick={() => window.print()}>Récapitulatif</button>
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td>
                                                            <RecapPanel />
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </td>

                                        <td className="al-colon">&nbsp;</td>

                                        <td className="al-main-column">
                                            <table className="al-main-table">
                                                <tbody>
                                                    <tr>
                                                        <td className="al-content-cell">
                                                            <div className="al-content-scroll" id="ContentPage">
                                                                {children}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </td>
                    </tr>

                    <tr className="al-footer-row">
                        <td colSpan={6}>&nbsp;</td>
                    </tr>
                </tbody>
            </table>

            {(flash.success || flash.error) && (
                <div className="workspace-flash-wrap">
                    <div className={`workspace-flash ${flash.success ? 'workspace-flash-success' : 'workspace-flash-error'}`}>
                        {flash.success ?? flash.error}
                    </div>
                </div>
            )}

            <OfflineDock />
        </div>
    );
}

function FragmentTab({ group, active, last }: { group: { key: string; label: string; items: Array<{ href: string }> }; active: boolean; last: boolean }) {
    return (
        <>
            <td className={`al-main-tab ${active ? 'al-main-tab-active' : ''}`} id={group.key}>
                <Link href={group.items[0].href}>{group.label}</Link>
            </td>
            {!last && (
                <td className="al-main-tab-separator">
                    <img src="/legacy/ryAdmin_05.jpg" width={6} height={33} alt="" />
                </td>
            )}
        </>
    );
}
