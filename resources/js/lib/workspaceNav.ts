export type WorkspaceNavItem = {
    label: string;
    href: string;
};

export type WorkspaceNavGroup = {
    key: string;
    label: string;
    items: WorkspaceNavItem[];
};

/**
 * Navigation reprise de la reference reference.
 * L'ordre, les intitules et le regroupement sont ceux de la reference.
 */
export const workspaceGroups: WorkspaceNavGroup[] = [
    {
        key: 'manipulation',
        label: 'Manipulation',
        items: [
            { label: 'En retour', href: '/contracts?view=returns' },
            { label: 'En retard', href: '/contracts?status=overdue&view=returns' },
            { label: 'Contrat', href: '/contracts' },
            { label: 'Disponible', href: '/vehicles?status=disponible' },
            { label: 'En location', href: '/contracts?status=open&view=rental' },
            { label: 'Conducteurs', href: '/clients' },
            { label: 'Sous-location', href: '/sub-rentals' },
        ],
    },
    {
        key: 'vehicules',
        label: 'Véhicules',
        items: [
            { label: 'Voiture', href: '/vehicles' },
            { label: 'Entretiens', href: '/data/slv_type_maintenance' },
            { label: 'Paramétrage', href: '/deadlines' },
            { label: 'Réparation', href: '/vehicles?status=en_reparation' },
        ],
    },
    {
        key: 'facturations',
        label: 'Facturations',
        items: [
            { label: 'Facturation', href: '/invoices' },
        ],
    },
    {
        key: 'caisses',
        label: 'Caisses',
        items: [
            { label: 'Charge', href: '/data/charges' },
            { label: "Tableau d'amortissement", href: '/vehicle-amortizations' },
            { label: 'État Global', href: '/finance?view=global' },
            { label: 'Bilan', href: '/finance?view=bilan' },
        ],
    },
    {
        key: 'traites',
        label: 'Traites',
        items: [
            { label: 'Traite', href: '/vehicle-installments' },
            { label: 'Traite 2', href: '/vehicle-installments?view=summary' },
        ],
    },
    {
        key: 'histograme',
        label: 'Espace Administrateur',
        items: [
            { label: 'État de Parc', href: '/dashboard' },
            { label: 'Source des Clients', href: '/data/slv_sources' },
            { label: 'Profil', href: '/settings/company' },
            { label: 'Mise à jour', href: '/billing/versions' },
            { label: 'Rapport', href: '/reports' },
            { label: 'Synchronisation WADI', href: '/settings/wadi-sync' },
            { label: 'Clé 2FA', href: '/settings/security' },
        ],
    },
];

function pathOf(url: string): string {
    return url.split('?')[0] || '/';
}

function queryOf(url: string): URLSearchParams {
    return new URLSearchParams(url.split('?')[1] ?? '');
}

function queryMatchScore(url: string, href: string): number {
    const target = href.split('?');
    const targetQuery = new URLSearchParams(target[1] ?? '');
    if (!targetQuery.size) {
        return 0;
    }
    const currentQuery = queryOf(url);
    let score = 0;
    for (const [key, value] of targetQuery.entries()) {
        if (currentQuery.get(key) !== value) {
            return -1;
        }
        score += 1;
    }
    return score;
}

export function isWorkspaceActive(url: string, href: string): boolean {
    if (href === '/') {
        return pathOf(url) === '/';
    }

    const targetPath = href.split('?')[0];
    const currentPath = pathOf(url);

    if (currentPath !== targetPath && !currentPath.startsWith(`${targetPath}/`)) {
        return false;
    }

    return queryMatchScore(url, href) >= 0;
}

/** Element de sous-menu le plus precis pour l'URL courante. */
export function activeWorkspaceItem(url: string, group: WorkspaceNavGroup | null): WorkspaceNavItem | undefined {
    if (!group) {
        return undefined;
    }

    const path = pathOf(url);
    const candidates = group.items
        .map((item) => {
            const targetPath = item.href.split('?')[0];
            const pathMatch = item.href === '/'
                ? path === '/'
                : (path === targetPath || path.startsWith(`${targetPath}/`));
            const score = pathMatch ? queryMatchScore(url, item.href) : -1;
            return { item, score, pathMatch };
        })
        .filter((candidate) => candidate.pathMatch && candidate.score >= 0)
        .sort((left, right) => right.score - left.score);

    return candidates[0]?.item;
}

const primaryGroupByPath: Array<[RegExp, string]> = [
    [/^\/dashboard/, 'histograme'],
    [/^\/contracts/, 'manipulation'],
    [/^\/invoices/, 'facturations'],
    [/^\/quotes/, 'facturations'],
    [/^\/billing\/versions/, 'histograme'],
    [/^\/billing/, 'facturations'],
    [/^\/settings\/company/, 'histograme'],
    [/^\/settings\/archive/, 'vehicules'],
    [/^\/settings\/backups/, 'manipulation'],
    [/^\/payments/, 'caisses'],
    [/^\/finance/, 'caisses'],
    [/^\/data\/charges/, 'caisses'],
    [/^\/data\/client_credits/, 'caisses'],
    [/^\/data\/profit_entries/, 'caisses'],
    [/^\/vehicles/, 'vehicules'],
    [/^\/data\/slv_configurations/, 'vehicules'],
    [/^\/data\/slv_categories/, 'vehicules'],
    [/^\/data\/slv_maintenance/, 'vehicules'],
    [/^\/data\/incidents/, 'vehicules'],
    [/^\/deadlines/, 'vehicules'],
    [/^\/vehicle-installments/, 'traites'],
    [/^\/vehicle-amortizations/, 'caisses'],
    [/^\/data\/credits_vehicules/, 'caisses'],
    [/^\/data\/slv_sources/, 'histograme'],
    [/^\/clients/, 'manipulation'],
    [/^\/manipulation/, 'manipulation'],
    [/^\/sub-rentals/, 'manipulation'],
    [/^\/reports/, 'histograme'],
    [/^\/settings\/wadi-sync/, 'histograme'],
    [/^\/data\/slv_reservations/, 'manipulation'],
    [/^\/data\/agenda/, 'manipulation'],
    [/^\/data\/slv_communication/, 'manipulation'],
    [/^\/data\/slv_collaborateurs/, 'manipulation'],
    [/^\/data\/slv_whatsapp/, 'manipulation'],
];

export function activeWorkspaceGroup(url: string): WorkspaceNavGroup | null {
    const path = pathOf(url);

    // Un element de sous-menu porte une query precise (statut, vue) : il est
    // prioritaire sur l'affectation par chemin.
    let best: { group: WorkspaceNavGroup; score: number } | null = null;
    for (const group of workspaceGroups) {
        for (const item of group.items) {
            if (!item.href.includes('?')) {
                continue;
            }
            const targetPath = item.href.split('?')[0];
            const pathMatch = path === targetPath || path.startsWith(`${targetPath}/`);
            if (!pathMatch) {
                continue;
            }
            const score = queryMatchScore(url, item.href);
            if (score > 0 && (!best || score > best.score)) {
                best = { group, score };
            }
        }
    }
    if (best) {
        return best.group;
    }

    const mapped = primaryGroupByPath.find(([pattern]) => pattern.test(path));
    if (mapped) {
        return workspaceGroups.find((group) => group.key === mapped[1]) ?? null;
    }

    return workspaceGroups.find((group) => group.items.some((item) => isWorkspaceActive(url, item.href))) ?? null;
}

export function contextualCreateHref(url: string): string | null {
    const path = pathOf(url);

    if (path === '/contracts') {
        return '/contracts/create';
    }
    if (path === '/vehicles') {
        return '/vehicles/create';
    }
    if (path === '/clients') {
        return '/clients/create';
    }
    if (path === '/invoices') {
        return '/invoices/create';
    }
    if (path === '/payments') {
        return '/payments/create';
    }
    if (path === '/quotes') {
        return '/quotes/create';
    }
    if (path === '/vehicle-installments') {
        return '/vehicle-installments/create';
    }
    if (path === '/settings/users') {
        return '/settings/users/create';
    }
    if (path.startsWith('/data/') && !path.endsWith('/create')) {
        return `${path}/create`;
    }

    return null;
}
