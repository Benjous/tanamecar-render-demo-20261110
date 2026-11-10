import { Link, router, usePage } from '@inertiajs/react';
import { useEffect, useState, type ReactNode } from 'react';
import {
    AlertTriangle, Archive, BarChart3, Bell, Building2, Calendar, CarFront, CheckCircle2, ChevronDown, ClipboardList, CreditCard, Database, FileSignature, FileText,
    RotateCcw,
    Gauge, Handshake, Inbox, Landmark, LayoutDashboard, LogOut, MapPin, Menu, MessageCircle, Monitor, Package,
    Receipt, Search, ShieldCheck, Tag, TrendingUp, Truck, Upload, UserCircle, UserCog, UserPlus, Users, Wallet, Wrench, X,
} from 'lucide-react';
import type { PageProps } from '@/types';
import { cn, initials } from '@/lib/utils';
import RecapPanel from '@/components/RecapPanel';
import CommandPalette from '@/components/CommandPalette';

type NavItem = { label: string; href: string; icon: React.ComponentType<{ className?: string }> };
type NavSection = { title?: string; items: NavItem[] };

const sections: NavSection[] = [
    { items: [{ label: 'Tableau de bord', href: '/', icon: LayoutDashboard }] },
    {
        title: 'Exploitation',
        items: [
            { label: 'Locations', href: '/contracts', icon: CarFront },
            { label: 'En retour', href: '/contracts?due=month', icon: RotateCcw },
            { label: 'Disponible', href: '/vehicles?status=disponible', icon: CheckCircle2 },
            { label: 'En location', href: '/vehicles?status=en_location', icon: Truck },
            { label: 'Manipulation', href: '/manipulation', icon: Gauge },
            { label: 'Réservations', href: '/data/slv_reservations', icon: Calendar },
            { label: 'Agenda', href: '/data/agenda', icon: Calendar },
            { label: 'Échéances', href: '/deadlines', icon: AlertTriangle },
            { label: 'Sinistres', href: '/data/incidents', icon: AlertTriangle },
            { label: 'Clients', href: '/clients', icon: Users },
            { label: 'Voitures', href: '/vehicles', icon: Truck },
        ],
    },
    {
        title: 'Finance',
        items: [
            { label: 'État global', href: '/finance', icon: BarChart3 },
            { label: 'Devis', href: '/quotes', icon: FileText },
            { label: 'Factures', href: '/invoices', icon: Receipt },
            { label: 'Facturation', href: '/billing', icon: FileText },
            { label: 'Paiements', href: '/payments', icon: CreditCard },
            { label: 'Charges', href: '/data/charges', icon: Wallet },
            { label: 'Crédits locataires', href: '/data/client_credits', icon: CreditCard },
            { label: 'Bénéfice', href: '/data/profit_entries', icon: TrendingUp },
            { label: 'Traites', href: '/vehicle-installments', icon: CreditCard },
            { label: 'Amortissement', href: '/vehicle-amortizations', icon: BarChart3 },
            { label: 'Sous-location', href: '/sub-rentals', icon: Handshake },
            { label: 'Rapport', href: '/reports', icon: ClipboardList },
            { label: 'Maintenance', href: '/data/slv_maintenance', icon: Wrench },
            { label: 'Crédits voitures', href: '/data/credits_vehicules', icon: Wallet },
        ],
    },
    {
        title: 'Communication',
        items: [
            { label: 'Collaborateurs', href: '/data/slv_collaborateurs', icon: Users },
            { label: 'Messagerie', href: '/data/slv_communication', icon: MessageCircle },
            { label: 'WhatsApp', href: '/data/slv_whatsapp', icon: MessageCircle },
        ],
    },
    {
        title: 'Configurations',
        items: [
            { label: 'Prestations', href: '/data/prestations', icon: Package },
            { label: 'Options', href: '/data/slv_configurations', icon: FileSignature },
            { label: 'Marques', href: '/data/slv_marques', icon: Tag },
            { label: 'Modèles', href: '/data/slv_modeles', icon: Truck },
            { label: 'Pays', href: '/data/slv_pays', icon: MapPin },
            { label: 'Catégories', href: '/data/slv_categories', icon: ClipboardList },
            { label: 'Sources', href: '/data/slv_sources', icon: Inbox },
            { label: 'Couleurs', href: '/data/couleurs', icon: Tag },
            { label: 'Loueurs', href: '/data/loueurs', icon: Handshake },
            { label: 'Maisons de crédit', href: '/data/maisons_de_credit', icon: Landmark },
            { label: 'Types maintenance', href: '/data/slv_type_maintenance', icon: Gauge },
            { label: 'Modèles PDF', href: '/settings/pdf-templates', icon: FileSignature },
        ],
    },
    {
        title: 'Réglages',
        items: [
            { label: 'Utilisateurs', href: '/settings/users', icon: UserCog },
            { label: 'Rôles', href: '/settings/roles', icon: ShieldCheck },
            { label: 'Équipes', href: '/settings/teams', icon: Users },
            { label: 'Sécurité', href: '/settings/security', icon: ShieldCheck },
            { label: 'Société', href: '/settings/company', icon: Building2 },
            { label: 'Import', href: '/settings/import', icon: Upload },
            { label: 'Sauvegarde', href: '/settings/backups', icon: Database },
            { label: 'Contrôle des volumes', href: '/settings/client-volume', icon: Database },
            { label: 'Archivage 2022 2023', href: '/settings/archive', icon: Archive },
            { label: 'Système de design', href: '/settings/design-system', icon: FileSignature },
        ],
    },
];

function isActive(url: string, href: string) {
    if (href === '/') return url === '/';
    return url === href || url.startsWith(`${href}/`);
}

export default function AppLayout({ children, title }: { children: ReactNode; title?: string }) {
    const { props, url } = usePage<PageProps>();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [openSection, setOpenSection] = useState<string | null>(null);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [bigScreen, setBigScreen] = useState(false);
    const user = props.auth?.user;
    const branding = (props as any).branding ?? { logo: '/brand/login-logo.jpg', name: 'TANAME CAR' };
    const flash = props.flash ?? {};
    const unreadNotifications = Number((props as any).notifications?.unread ?? 0);
    const activeSection = sections.find((section) => section.items.some((item) => isActive(url, item.href)));

    useEffect(() => {
        const close = (event: MouseEvent) => {
            if (!(event.target as HTMLElement).closest('[data-nav-menu]')) setOpenSection(null);
        };
        document.addEventListener('mousedown', close);
        return () => document.removeEventListener('mousedown', close);
    }, []);

    useEffect(() => {
        setBigScreen(window.localStorage.getItem('taname-bigscreen') === '1' || new URLSearchParams(window.location.search).get('bigscreen') === '1');
    }, []);

    useEffect(() => {
        const escape = (event: KeyboardEvent) => {
            if (event.key !== 'Escape') return;
            setBigScreen(false);
            window.localStorage.setItem('taname-bigscreen', '0');
            document.documentElement.classList.remove('bigscreen');
            if (document.fullscreenElement) document.exitFullscreen?.();
        };
        window.addEventListener('keydown', escape);
        return () => window.removeEventListener('keydown', escape);
    }, []);

    const toggleBigScreen = async () => {
        const next = !bigScreen;
        setBigScreen(next);
        window.localStorage.setItem('taname-bigscreen', next ? '1' : '0');
        if (next) {
            try { await document.documentElement.requestFullscreen?.(); } catch {}
            router.visit('/?bigscreen=1');
        } else {
            if (document.fullscreenElement) await document.exitFullscreen?.();
            router.visit('/');
        }
    };

    return (
        <div className="min-h-screen bg-brand-50">
            <header className="sticky top-0 z-40 border-b border-brand-100 bg-white/95 shadow-sm backdrop-blur">
                <div className="flex min-h-16 flex-wrap items-center gap-3 px-4 py-2 lg:px-8">
                    <button className="lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Ouvrir le menu">
                        <Menu className="h-5 w-5 text-slate-600" />
                    </button>

                    <Link href="/" className="flex shrink-0 items-center">
                        <img src={branding.logo} alt={branding.name} className="h-10 w-auto max-w-[110px] object-contain sm:max-w-[150px] lg:max-w-[180px]" />
                    </Link>

                    <form action="/search" method="get" className="relative ml-2 hidden max-w-sm flex-1 xl:block">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            name="q"
                            placeholder="Rechercher un contrat, client, voiture, facture."
                            className="tc-input pl-9"
                            defaultValue={new URLSearchParams(url.split('?')[1] ?? '').get('q') ?? ''}
                        />
                    </form>

                    <div className="ml-auto flex items-center gap-2">
                        <button type="button" onClick={() => window.dispatchEvent(new Event('taname-command-open'))} className="hidden items-center gap-2 rounded-lg border border-brand-100 px-2.5 py-1.5 text-xs text-slate-500 hover:bg-brand-50 sm:flex" title="Recherche globale, Ctrl+K" data-testid="command-trigger">
                            <Search className="h-4 w-4" /> <span className="hidden xl:inline">Rechercher</span><kbd className="rounded border border-brand-100 px-1 text-[10px]">Ctrl K</kbd>
                        </button>
                        <button type="button" onClick={toggleBigScreen} className="rounded-lg p-2 text-slate-500 hover:bg-brand-50" aria-label="Mode grand écran" data-testid="bigscreen-toggle">
                            <Monitor className="h-5 w-5" />
                        </button>
                        <Link href="/notifications" className="relative rounded-lg p-2 text-slate-500 transition-colors hover:bg-brand-50 hover:text-brand-700" title="Notifications">
                            <Bell className="h-5 w-5" />
                            {unreadNotifications > 0 && (
                                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-700 px-1 text-[10px] font-bold text-white">
                                    {unreadNotifications > 99 ? '99+' : unreadNotifications}
                                </span>
                            )}
                        </Link>
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setUserMenuOpen((value) => !value)}
                                className="flex items-center gap-2 rounded-xl px-2 py-1.5 transition-colors hover:bg-brand-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
                                aria-expanded={userMenuOpen}
                                aria-haspopup="menu"
                                data-testid="user-menu"
                            >
                                <div className="hidden text-right sm:block">
                                    <div className="text-sm font-semibold text-slate-800">{user?.name}</div>
                                    <div className="text-[11px] text-slate-400">{user?.role ?? 'Administrateur'}</div>
                                </div>
                                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-800">
                                    {initials(user?.name)}
                                </div>
                                <ChevronDown className={cn('h-4 w-4 text-slate-400 transition-transform', userMenuOpen && 'rotate-180')} />
                            </button>

                            {userMenuOpen && (
                                <div className="absolute right-0 z-50 mt-2 w-60 rounded-xl border border-brand-100 bg-white p-1.5 shadow-xl" role="menu">
                                    <Link href="/settings/profile" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-brand-50" role="menuitem">
                                        <UserCircle className="h-4 w-4 text-brand-600" /> Mon profil
                                    </Link>
                                    {user?.is_admin && (
                                        <Link href="/settings/users/create" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-brand-50" role="menuitem">
                                            <UserPlus className="h-4 w-4 text-brand-600" /> Ajouter un utilisateur
                                        </Link>
                                    )}
                                    <Link href="/settings/security" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-brand-50" role="menuitem">
                                        <ShieldCheck className="h-4 w-4 text-brand-600" /> Sécurité (2FA)
                                    </Link>
                                    <div className="my-1 border-t border-brand-100" />
                                    <form method="post" action="/logout">
                                        <input type="hidden" name="_token" value={(document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? ''} />
                                        <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-rose-600 hover:bg-rose-50" role="menuitem">
                                            <LogOut className="h-4 w-4" /> Déconnexion
                                        </button>
                                    </form>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <nav className="hidden min-h-11 flex-wrap items-center gap-1 border-t border-brand-100 px-4 py-1 lg:flex lg:px-8" aria-label="Navigation principale">
                    {sections.map((section) => {
                        if (!section.title) {
                            return (
                                <Link key={section.items[0].href} href={section.items[0].href} className={cn('rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors', isActive(url, section.items[0].href) ? 'bg-brand-100 text-brand-900' : 'text-slate-600 hover:bg-brand-50 hover:text-brand-800')}>
                                    {section.items[0].label}
                                </Link>
                            );
                        }
                        const active = section.items.some((item) => isActive(url, item.href));
                        const open = openSection === section.title;
                        return (
                            <div key={section.title} className="relative" data-nav-menu onMouseEnter={() => setOpenSection(section.title ?? null)} onMouseLeave={() => setOpenSection(null)}>
                                <button
                                    type="button"
                                    className={cn('flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors', active ? 'bg-brand-100 text-brand-900' : 'text-slate-600 hover:bg-brand-50 hover:text-brand-800')}
                                    aria-expanded={open}
                                    aria-haspopup="menu"
                                    onClick={() => setOpenSection(open ? null : section.title ?? null)}
                                    onKeyDown={(event) => {
                                        if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
                                            event.preventDefault();
                                            setOpenSection(section.title ?? null);
                                            window.setTimeout(() => document.querySelector<HTMLElement>(`[data-menu="${section.title}"] a`)?.focus(), 0);
                                        } else if (event.key === 'Escape') {
                                            setOpenSection(null);
                                        }
                                    }}
                                >
                                    {section.title}
                                    <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', open && 'rotate-180')} />
                                </button>
                                {open && (
                                    <div className="absolute left-0 top-full z-50 mt-1 w-64 rounded-xl border border-brand-100 bg-white p-1.5 shadow-xl" role="menu" data-menu={section.title} onKeyDown={(event) => {
                                        if (event.key === 'Escape') { setOpenSection(null); }
                                        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                                            event.preventDefault();
                                            const items = Array.from((event.currentTarget as HTMLElement).querySelectorAll<HTMLElement>('a'));
                                            const current = items.indexOf(document.activeElement as HTMLElement);
                                            const next = event.key === 'ArrowDown' ? (current + 1) % items.length : (current - 1 + items.length) % items.length;
                                            items[next]?.focus();
                                        }
                                    }}>
                                        {section.items.map((item) => {
                                            const Icon = item.icon;
                                            return (
                                                <Link key={item.href} href={item.href} onClick={() => setOpenSection(null)} className={cn('flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors', isActive(url, item.href) ? 'bg-brand-50 font-semibold text-brand-900' : 'text-slate-700 hover:bg-brand-50')} role="menuitem">
                                                    <Icon className="h-4 w-4 text-brand-600" /> {item.label}
                                                </Link>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </nav>

                {activeSection && (
                    <div className="hidden border-t border-brand-100 bg-white lg:block">
                        <nav aria-label="Navigation secondaire" className="flex flex-wrap items-center gap-1 px-4 py-1.5 lg:px-8">
                            {activeSection.items.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <Link key={item.href} href={item.href} className={cn('flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[12px] font-semibold transition-colors', isActive(url, item.href) ? 'bg-brand-700 text-white' : 'text-slate-600 hover:bg-brand-50 hover:text-brand-800')}>
                                        <Icon className="h-3.5 w-3.5" /> {item.label}
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>
                )}
            </header>

            {mobileOpen && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <div className="absolute inset-0 bg-brand-950/50 backdrop-blur-[1px]" onClick={() => setMobileOpen(false)} />
                    <div className="relative h-full w-[min(88vw,340px)] overflow-y-auto bg-white p-4 shadow-2xl">
                        <div className="mb-4 flex items-center justify-between">
                            <img src={branding.logo} alt={branding.name} className="h-auto w-[150px]" />
                            <button onClick={() => setMobileOpen(false)} aria-label="Fermer le menu"><X className="h-5 w-5 text-slate-500" /></button>
                        </div>
                        <form action="/search" method="get" className="relative mb-4">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input name="q" placeholder="Rechercher" className="tc-input pl-9" />
                        </form>
                        {sections.map((section) => {
                            if (!section.title) {
                                return <Link key="dashboard-mobile" href={section.items[0].href} onClick={() => setMobileOpen(false)} className="mb-4 flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-semibold text-slate-800 hover:bg-brand-50"><LayoutDashboard className="h-4 w-4 text-brand-600" /> {section.items[0].label}</Link>;
                            }
                            return <details key={section.title} className="mb-3 rounded-xl border border-brand-100 bg-brand-50/40 px-2 py-1">
                                <summary className="cursor-pointer px-2 py-2 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">{section.title}</summary>
                                <div className="space-y-1 pb-2">
                                    {section.items.map((item) => {
                                        const Icon = item.icon;
                                        return (
                                            <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)} className={cn('flex items-center gap-2 rounded-lg px-2 py-2 text-sm', isActive(url, item.href) ? 'bg-white font-semibold text-brand-900' : 'text-slate-700 hover:bg-white')}>
                                                <Icon className="h-4 w-4 text-brand-600" /> {item.label}
                                            </Link>
                                        );
                                    })}
                                </div>
                            </details>;
                        })}
                    </div>
                </div>
            )}

            {(flash.success || flash.error) && (
                <div className="px-4 pt-4 lg:px-8">
                    <div className={cn('rounded-xl border px-4 py-3 text-sm', flash.success ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-rose-200 bg-rose-50 text-rose-800')}>
                        {flash.success ?? flash.error}
                    </div>
                </div>
            )}

            <main className="px-4 py-6 lg:px-8">
                <div className="flex flex-col items-start gap-5 xl:flex-row">
                    <RecapPanel />
                    <div className="min-w-0 flex-1">
                        {title && <h1 className="mb-6 text-2xl font-black tracking-tight text-slate-900">{title}</h1>}
                        {children}
                    </div>
                </div>
            </main>
            <CommandPalette />
        </div>
    );
}



