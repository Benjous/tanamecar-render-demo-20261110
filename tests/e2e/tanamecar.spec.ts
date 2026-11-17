import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const e2ePassword = process.env.E2E_PASSWORD;
test.skip(!e2ePassword, 'E2E_PASSWORD non défini');

async function login(page: any, email = 'e2e@example.test', password = e2ePassword!) {
    await page.goto('/login');
    await expect(page.locator('img[alt*="TANAMECAR"]')).toBeVisible();
    await page.locator('input[type="email"]').fill(email);
    await page.locator('input[type="password"]').fill(password);
    await page.getByRole('button', { name: 'Connexion' }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole('heading', { name: 'Tableau de bord' })).toBeVisible();
}

async function clickRow(page: any, hrefPattern: RegExp) {
    const row = page.locator('[data-testid="row-link"]').first();
    await expect(row).toBeVisible();
    await row.click({ position: { x: 40, y: 20 } });
    await expect(page).toHaveURL(hrefPattern);
}

test('connexion responsive mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/login');
    await expect(page.locator('img[alt*="TANAMECAR"]')).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(2);
    await page.screenshot({ path: 'storage/app/private/e2e/login-mobile.png', fullPage: false });
});

test('captures desktop tablette mobile', async ({ page }) => {
    await login(page);

    await page.goto('/clients');
    await expect(page.getByRole('heading', { name: 'Clients' })).toBeVisible();
    await page.screenshot({ path: 'storage/app/private/e2e/clients-desktop.png', fullPage: false });

    await clickRow(page, /\/clients\/\d+$/);
    await page.screenshot({ path: 'storage/app/private/e2e/client-detail.png', fullPage: false });

    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/contracts/create');
    await expect(page.getByRole('heading', { name: 'Nouvelle location' })).toBeVisible();
    await page.screenshot({ path: 'storage/app/private/e2e/contract-form-tablet.png', fullPage: false });

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/clients');
    await expect(page.getByRole('heading', { name: 'Clients' })).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(2);
    await page.screenshot({ path: 'storage/app/private/e2e/clients-mobile.png', fullPage: false });
});

test('responsive sans débordement 1920 1366 768 390', async ({ page }) => {
    await login(page);

    for (const viewport of [
        { width: 1920, height: 1080 },
        { width: 1600, height: 900 },
        { width: 1366, height: 768 },
        { width: 1024, height: 768 },
        { width: 768, height: 1024 },
        { width: 390, height: 844 },
        { width: 360, height: 800 },
    ]) {
        await page.setViewportSize(viewport);
        for (const path of ['/', '/clients']) {
            await page.goto(path);
            const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
            expect(overflow, `${path} ${viewport.width}px`).toBeLessThanOrEqual(2);
        }
    }
});

test('cartes compteurs et listes filtrées', async ({ page }) => {
    await login(page);

    const countFrom = async (locator: any) => {
        const text = await locator.innerText();
        const firstLine = text.split(/\r?\n/).find((line: string) => /\d/.test(line)) ?? text;
        const match = firstLine.match(/\d[\d\s\u00a0]*/);
        return match ? Number(match[0].replace(/\D/g, '')) : 0;
    };

    const assertCardList = async (testId: string, urlPattern: RegExp) => {
        const card = page.locator(`[data-testid="${testId}"]`);
        const expected = await countFrom(card);
        await card.click();
        await expect(page).toHaveURL(urlPattern);
        const actual = await countFrom(page.locator('[data-testid="list-total"]'));
        expect(actual, testId).toBe(expected);
    };

    for (const [testId, pattern] of [
        ['stat-overdue', /\/contracts\?status=overdue$/],
        ['stat-due-month', /\/contracts\?due=month$/],
        ['stat-in-rental', /\/contracts\?status=open$/],
    ] as const) {
        await page.goto('/contracts');
        await assertCardList(testId, pattern);
    }

    for (const [testId, pattern] of [
        ['stat-sous-location', /\/vehicles\?mode=sous_location$/],
        ['stat-vehicles-available', /\/vehicles\?status=disponible$/],
        ['stat-vehicles-location', /\/vehicles\?mode=location$/],
    ] as const) {
        await page.goto('/vehicles');
        await assertCardList(testId, pattern);
    }

    await page.goto('/');
    const dashboardAvailable = await countFrom(page.locator('[data-testid="dashboard-available"]'));
    await page.goto('/vehicles');
    const vehiclesAvailable = await countFrom(page.locator('[data-testid="stat-vehicles-available"]'));
    expect(vehiclesAvailable).toBe(dashboardAvailable);

    for (const path of ['/clients', '/contracts', '/vehicles']) {
        await page.goto(path);
        await expect(page.locator('.truncate')).toHaveCount(0);
        const whiteSpace = await page.locator('[data-testid="row-link"]').first().locator('xpath=..').locator('div').first().evaluate((element) => getComputedStyle(element).whiteSpace);
        expect(whiteSpace).not.toBe('nowrap');
    }

    await expect(page.getByRole('link', { name: 'Caisses', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Histograme', exact: true })).toBeVisible();
});

test('zoom 50 a 200 sans debordement horizontal', async ({ page }) => {
    test.setTimeout(120000);
    await login(page);
    for (const width of [1920, 1366, 768, 390]) {
        await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
        for (const zoom of [0.5, 0.75, 1, 1.25, 1.5, 2]) {
            await page.goto('/clients');
            await page.evaluate((value) => {
                document.documentElement.style.zoom = String(value);
            }, zoom);
            await page.waitForTimeout(80);
            const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
            expect(overflow, `${width}px zoom ${zoom}`).toBeLessThanOrEqual(2);
        }
    }
});

test('parcours complet TANAME CAR', async ({ page }) => {
    test.setTimeout(120000);
    const consoleErrors: string[] = [];
    page.on('pageerror', (error: Error) => consoleErrors.push(error.message));
    page.on('console', (message: any) => {
        if (message.type() === 'error') consoleErrors.push(message.text());
    });

    await login(page);
    await page.screenshot({ path: 'storage/app/private/e2e/dashboard-desktop.png', fullPage: false });

    await page.getByRole('link', { name: 'Voir Voitures disponibles' }).click();
    await expect(page).toHaveURL(/\/vehicles\?status=disponible/);
    await page.goto('/');
    await page.getByRole('link', { name: 'Voir Retours dépassés' }).click();
    await expect(page).toHaveURL(/\/contracts\?status=overdue/);

    await page.locator('input[name="q"]').first().fill('020418');
    await page.locator('input[name="q"]').first().press('Enter');
    await expect(page).toHaveURL(/\/search\?q=020418/);
    await expect(page.getByText('020418').first()).toBeVisible();

    await page.goto('/contracts');
    await expect(page.getByText(/\d+ locations/).first()).toBeVisible();
    await expect(page.getByTestId('list-pagination')).toContainText(/Page 1/);
    await clickRow(page, /\/contracts\/\d+$/);
    await expect(page.getByRole('heading', { name: /Location \d+/ })).toBeVisible();
    const contractUrl = page.url();
    const contractId = contractUrl.match(/\/contracts\/(\d+)/)?.[1];
    expect(contractId).toBeTruthy();

    const pdf = await page.evaluate(async (url) => { const response = await fetch(url); return { status: response.status, type: response.headers.get('content-type') }; }, `/contracts/${contractId}/pdf`);
    expect(pdf.status).toBe(200);
    expect(pdf.type).toContain('application/pdf');

    await page.goto('/clients');
    await expect(page.getByText(/\d+ clients/).first()).toBeVisible();
    await clickRow(page, /\/clients\/\d+$/);

    await page.goto('/vehicles');
    await expect(page.getByText(/\d+ voitures/).first()).toBeVisible();
    await clickRow(page, /\/vehicles\/\d+$/);

    await page.goto('/invoices');
    await expect(page.getByText(/\d+ factures/).first()).toBeVisible();
    await clickRow(page, /\/invoices\/\d+$/);

    await page.goto('/contracts/create');
    await page.locator('form button').filter({ hasText: 'Rechercher un client' }).first().click();
    await page.locator('input[placeholder*="Nom, téléphone"]').fill('REGUIG');
    await page.getByRole('button', { name: /REGUIG BOUCHRA/ }).last().click();
    const vehicleSelect = page.locator('form select').first();
    const vehicleId = await vehicleSelect.locator('option').nth(1).getAttribute('value');
    await vehicleSelect.selectOption(vehicleId!);
    await expect(vehicleSelect).toHaveValue(vehicleId!);
    const numbers = page.locator('input[type="number"]');
    await numbers.nth(2).fill('200');
    await numbers.nth(3).fill('2');
    await numbers.nth(4).fill('400');
    await page.getByRole('button', { name: 'Enregistrer' }).click();
    await expect(page).toHaveURL(/\/contracts\/\d+$/);
    await page.getByRole('button', { name: /Historique/ }).click();
    await expect(page.getByText('Création')).toBeVisible();
    await expect(page.getByText(/IP non disponible/)).toHaveCount(0);

    await page.goto('/payments/create');
    await page.locator('select').first().selectOption({ index: 1 });
    await page.locator('input[type="number"]').first().fill('100');
    await page.getByRole('button', { name: 'Enregistrer' }).click();
    await expect(page).toHaveURL(/\/payments/);

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(2);
    await page.screenshot({ path: 'storage/app/private/e2e/dashboard-mobile.png', fullPage: false });

    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/');
    await page.locator('[data-testid="user-menu"]').click();
    await page.getByRole('menuitem', { name: 'Déconnexion' }).click();
    await expect(page).toHaveURL(/\/login$/);

    expect(consoleErrors.filter((error) => !error.includes('favicon'))).toEqual([]);
});

test('ajout d un second administrateur et absence d audit', async ({ page }) => {
    await login(page);

    await expect(page.getByRole('link', { name: 'Audit' })).toHaveCount(0);
    await page.goto('/settings/audit');
    await expect(page.locator('body')).toContainText('Page introuvable');
    await page.goto('/');

    await page.locator('[data-testid="user-menu"]').click();
    await page.getByRole('menuitem', { name: 'Ajouter un utilisateur' }).click();
    await expect(page.getByRole('heading', { name: 'Ajouter un utilisateur' })).toBeVisible();

    const email = `admin-e2e-${Date.now()}@example.test`;
    await page.locator('form.grid input').nth(0).fill('Admin E2E');
    await page.locator('form.grid input[type="email"]').fill(email);
    await page.locator('form.grid input[type="password"]').first().fill('TestAdmin!2026');
    await page.locator('form.grid input[type="password"]').nth(1).fill('TestAdmin!2026');
    await page.getByRole('button', { name: 'Créer le compte' }).click();
    await expect(page).toHaveURL(/\/settings\/users$/);
    const hasAdmin = await page.locator('input').evaluateAll((inputs) => inputs.some((input) => (input as HTMLInputElement).value === 'Admin E2E'));
    expect(hasAdmin).toBe(true);

    await page.locator('[data-testid="user-menu"]').click();
    await page.getByRole('menuitem', { name: 'Déconnexion' }).click();
    await expect(page).toHaveURL(/\/login$/);

    await login(page, email, 'TestAdmin!2026');
    await page.goto('/clients');
    await expect(page.getByRole('heading', { name: 'Clients' })).toBeVisible();
});

test('filtres combinables, reinitialisation et pagination', async ({ page }) => {
    test.setTimeout(120000);
    const consoleErrors: string[] = [];
    page.on('pageerror', (error: Error) => consoleErrors.push(error.message));
    page.on('console', (message: any) => {
        if (message.type() === 'error') consoleErrors.push(message.text());
    });

    await login(page);
    await expect(page.getByText('Facturation mensuelle', { exact: true })).toHaveCount(0);

    await page.goto('/clients');
    await page.waitForTimeout(700);
    const initialClientsText = await page.getByTestId('list-total').first().innerText();
    const initialClients = (initialClientsText.match(/\d[\d\s\u00a0]*/)?.[0] ?? '0').replace(/\D/g, '');
    await expect(page.getByTestId('list-pagination')).toContainText('Page 1');
    await page.locator('input[type=search][name=q]').fill('REGUIG');
    await expect(page).toHaveURL(/q=REGUIG/);
    await expect(page.getByTestId('list-total').first()).toContainText('1 clients');
    await page.getByRole('link', { name: 'Réinitialiser les filtres' }).click();
    await expect(page).toHaveURL(/\/clients$/);
    await expect(page.getByTestId('list-total').first()).toContainText(`${initialClients} clients`);

    await page.goto('/clients?q=a');
    await page.waitForTimeout(700);
    const firstPageUrl = page.url();
    await page.getByRole('button', { name: 'Page suivante' }).click();
    await expect(page.getByTestId('list-pagination')).toContainText('Page 2');
    expect(page.url()).toBe(firstPageUrl);
    await page.getByRole('button', { name: /Nom complet/ }).click();
    expect(page.url()).toBe(firstPageUrl);

    await page.goto('/contracts');
    await page.waitForTimeout(700);
    const allContracts = await page.getByTestId('list-total').first().innerText();
    await page.locator('select[name=status]').selectOption('returned');
    await expect(page).toHaveURL(/status=returned/);
    await expect(page.getByTestId('list-total').first()).not.toContainText(allContracts);

    await page.goto('/payments');
    await page.waitForTimeout(700);
    await page.locator('select[name=status]').selectOption('paye');
    await expect(page).toHaveURL(/status=paye/);

    await page.goto('/data/charges');
    await page.waitForTimeout(700);
    await page.locator('input[type=search][name=q]').fill('zzzz-introuvable');
    await expect(page.getByTestId('list-total').first()).toContainText('0 enregistrements');

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/clients');
    await page.waitForTimeout(700);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(2);
    await expect(page.getByTestId('list-pagination')).toBeVisible();
    expect(consoleErrors.filter((error) => !error.includes('favicon'))).toEqual([]);
});

test('palette commandes grand ecran et accessibilite', async ({ page }) => {
    test.setTimeout(180000);
    await login(page);
    await page.keyboard.press('Control+k');
    await expect(page.getByRole('dialog', { name: 'Palette de commandes' })).toBeVisible();
    await page.getByRole('dialog', { name: 'Palette de commandes' }).locator('input').fill('client');
    await expect(page.getByRole('dialog', { name: 'Palette de commandes' }).getByRole('button').first()).toBeVisible();
    await page.keyboard.press('Escape');
    await page.getByTestId('bigscreen-toggle').click();
    await expect(page).toHaveURL(/bigscreen=1/);
    await page.keyboard.press('Escape');
    await expect(page.locator('html')).not.toHaveClass(/bigscreen/);
    await page.goto('/settings/archive');
    await expect(page.getByRole('heading', { name: 'Archivage 2022 2023' })).toBeVisible();
    await page.goto('/settings/design-system');
    await expect(page.getByRole('heading', { name: 'Système de design' })).toBeVisible();
    for (const path of ['/', '/clients', '/contracts', '/vehicles', '/payments', '/invoices', '/quotes', '/vehicle-installments', '/vehicle-amortizations', '/sub-rentals', '/reports', '/notifications', '/settings/archive', '/settings/design-system', '/clients/create', '/contracts/create', '/clients/matching', '/finance', '/data/charges', '/data/agenda', '/data/client_credits', '/data/profit_entries', '/data/incidents', '/settings/backups']) {
        await page.goto(path);
        const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
        const serious = axe.violations.filter((violation) => ['critical', 'serious'].includes(violation.impact ?? ''));
        expect(serious, `${path}\n${serious.map((violation) => `${violation.id}: ${violation.help}`).join('\n')}`).toEqual([]);
    }
});

test('sous-location 900 lignes et fiche', async ({ page }) => {
    await login(page);
    await page.goto('/sub-rentals');
    await expect(page.getByRole('heading', { name: 'Sous-location' })).toBeVisible();
    await expect(page.getByTestId('list-total').first()).toContainText('900');
    await page.getByTestId('row-link').first().click();
    await expect(page).toHaveURL(/\/sub-rentals\/\d+$/);
    await expect(page.getByRole('heading', { name: 'Fiche sous-location' })).toBeVisible();
    await expect(page.getByText('Détails')).toBeVisible();
});

test('navigation centree et icone de recherche dans le champ', async ({ page }) => {
    await login(page);
    const viewport = page.viewportSize()!;
    const nav = await page.locator('.workspace-primary-tabs').boundingBox();
    expect(nav).not.toBeNull();
    expect(Math.abs((nav!.x + nav!.width / 2) - viewport.width / 2)).toBeLessThanOrEqual(2);

    const search = await page.locator('.workspace-global-search input').boundingBox();
    const icon = await page.locator('.workspace-global-search .workspace-search-icon').boundingBox();
    expect(search).not.toBeNull();
    expect(icon).not.toBeNull();
    expect(icon!.x).toBeGreaterThanOrEqual(search!.x);
    expect(icon!.y).toBeGreaterThanOrEqual(search!.y);
    expect(icon!.x + icon!.width).toBeLessThanOrEqual(search!.x + search!.width);
    expect(icon!.y + icon!.height).toBeLessThanOrEqual(search!.y + search!.height);

    await expect(page.getByText('Référence des indicateurs : 13/11/2026')).toBeVisible();

    await page.goto('/clients');
    const filterSearch = await page.locator('.workspace-filter-search input').boundingBox();
    const filterIcon = await page.locator('.workspace-filter-search .workspace-search-icon').boundingBox();
    expect(filterSearch).not.toBeNull();
    expect(filterIcon).not.toBeNull();
    expect(filterIcon!.x).toBeGreaterThanOrEqual(filterSearch!.x);
    expect(filterIcon!.y).toBeGreaterThanOrEqual(filterSearch!.y);
    expect(filterIcon!.x + filterIcon!.width).toBeLessThanOrEqual(filterSearch!.x + filterSearch!.width);
    expect(filterIcon!.y + filterIcon!.height).toBeLessThanOrEqual(filterSearch!.y + filterSearch!.height);
});

test('sous-menus exacts des six sections', async ({ page }) => {
    await login(page);
    const expected: Record<string, string[]> = {
        Manipulation: ['Réservation', 'Agenda', 'En retour', 'Disponible', 'En location', 'Conducteurs', 'Sous Location', 'Rapport', 'Messagerie', 'Sauvegarde'],
        Vehicules: ['Voiture', 'Options', 'Parametrage', 'Reparation', 'Sinistre', 'Archive'],
        Facturations: ['Contrat', 'Facturation'],
        Caisses: ['Charge', 'Credit Locataire', 'Etat Global', 'Bilan', 'Benefice'],
        Traites: ['Traite', 'Traite 2', 'Credit', "Tableau d'amortissement"],
        Histograme: ['Histograme', 'Etat de Parc', 'Source des Clients'],
    };
    for (const [group, labels] of Object.entries(expected)) {
        await page.goto('/');
        await page.getByLabel('Navigation principale').getByRole('link', { name: group, exact: true }).click();
        await page.waitForTimeout(350);
        await expect(page.getByLabel('Navigation secondaire').getByRole('link')).toHaveText(labels);
    }
});

test('navigation workspace desktop et mobile', async ({ page }) => {
    await login(page);

    for (const section of ['Manipulation', 'Vehicules', 'Facturations', 'Caisses', 'Traites', 'Histograme']) {
        await page.goto('/');
        const tab = page.getByLabel('Navigation principale').getByRole('link', { name: section, exact: true });
        await expect(tab).toBeVisible();
        await tab.click();
        const secondary = page.getByRole('navigation', { name: 'Navigation secondaire' });
        await expect(secondary).toBeVisible();
        expect(await secondary.getByRole('link').count()).toBeGreaterThan(0);
    }

    await page.goto('/');
    await page.getByTitle('Configurations et réglages').click();
    await expect(page).toHaveURL(/\/settings\/company$/);
    const settingsNav = page.getByRole('navigation', { name: 'Navigation secondaire' });
    await expect(settingsNav.getByRole('link', { name: 'Utilisateurs' })).toBeVisible();

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await page.getByRole('button', { name: 'Ouvrir le menu' }).click();
    await expect(page.locator('details')).toHaveCount(7);
    await page.locator('details').filter({ hasText: 'Facturations' }).locator('summary').click();
    await expect(page.locator('details').filter({ hasText: 'Facturations' }).getByRole('link').first()).toBeVisible();
});

test('toutes les listes utilisent le composant partage', async ({ page }) => {
    await login(page);
    await page.setViewportSize({ width: 1280, height: 900 });
    for (const path of ['/clients', '/contracts', '/vehicles', '/payments', '/invoices', '/quotes', '/vehicle-amortizations', '/vehicle-installments', '/reports', '/data/slv_marques', '/data/charges', '/data/agenda', '/data/client_credits', '/data/profit_entries', '/data/incidents']) {
        await page.goto(path);
        await expect(page.locator('[data-testid="virtual-data-list"]')).toHaveCount(1);
        const globalOverflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
        expect(globalOverflow).toBeLessThanOrEqual(2);
        const scroll = page.locator('[data-testid="list-horizontal-scroll"]').first();
        if (await scroll.count()) {
            const overflow = await scroll.evaluate((element) => element.scrollWidth - element.clientWidth);
            if (overflow > 2) {
                expect(await scroll.evaluate((element) => getComputedStyle(element).overflowX)).toMatch(/auto|scroll/);
            }
        }
    }
});

test('controle volumes matching manipulation facturation', async ({ page }) => {
    await login(page);
    await page.goto('/clients');
    const clientsText = await page.getByTestId('list-total').first().innerText();
    const clientsCount = (clientsText.match(/\d[\d\s\u00a0]*/)?.[0] ?? '0').replace(/\D/g, '');
    await page.goto('/settings/client-volume');
    await expect(page.getByRole('heading', { name: 'Contrôle des volumes clients' })).toBeVisible();
    await expect(page.getByTestId('client-volume-count')).toHaveText(clientsCount);
    await page.goto('/clients/matching');
    await expect(page.getByRole('heading', { name: 'Rapprochement conducteurs historiques' })).toBeVisible();
    await expect(page.getByText(/conducteurs/i).first()).toBeVisible();
    await page.goto('/manipulation');
    await expect(page.getByRole('heading', { name: 'Manipulation, Disponible, Règlement' })).toBeVisible();
    await page.goto('/billing');
    await expect(page.getByRole('heading', { name: 'Facturation' })).toBeVisible();
    await page.getByRole('link', { name: /Mise à jour/ }).click();
    await expect(page.getByRole('heading', { name: 'Versions et mises à jour' })).toBeVisible();
});

test('amortissement recap et rapport', async ({ page }) => {
    await login(page);
    await page.goto('/vehicle-amortizations');
    await expect(page.getByRole('heading', { name: 'Tableau d’amortissement' })).toBeVisible();
    await expect(page.getByTestId('list-total').first()).toContainText('49 fiches');
    await page.getByTestId('row-link').first().click();
    await expect(page).toHaveURL(/\/vehicle-amortizations\/\d+$/);
    await expect(page.getByText('Solde', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Détails', { exact: true })).toBeVisible();
    await page.goto('/reports');
    await expect(page.getByRole('heading', { name: 'Rapport' })).toBeVisible();
    await page.goto('/clients');
    await expect(page.getByTestId('deadline-count-overdue')).toBeVisible();
    const recap = await page.request.get('/recap', { headers: { Accept: 'application/json' } });
    expect(recap.status()).toBe(200);
    const payload = await recap.json();
    expect(payload.items).toHaveLength(4);
});

test('module Traites creation modification filtre et compteur', async ({ page }) => {
    await login(page);
    await page.goto('/vehicle-installments');
    await page.getByTestId('workspace-create').click();
    await expect(page).toHaveURL(/\/vehicle-installments\/create$/);
    const vehicleSelect = page.locator('form select').first();
    const vehicleId = await vehicleSelect.locator('option').nth(1).getAttribute('value');
    await vehicleSelect.selectOption(vehicleId!);
    await expect(vehicleSelect).toHaveValue(vehicleId!);
    await page.locator('input[type="number"]').fill('1250.375');
    await page.locator('input[type="date"]').fill('2020-01-01');
    await page.locator('form select').nth(1).selectOption('unpaid');
    await page.locator('textarea').fill('Test E2E traite');
    const createRequest = page.waitForRequest((request) => request.url().endsWith('/vehicle-installments') && request.method() === 'POST');
    await page.getByRole('button', { name: 'Enregistrer' }).click();
    const createPayload = await (await createRequest).postDataJSON();
    expect(String(createPayload.vehicle_id)).toBe(vehicleId);
    await expect(page).toHaveURL(/\/vehicle-installments\/\d+$/);
    await expect(page.getByText('1250.375000 MAD')).toBeVisible();
    await expect(page.getByText('Dépassée', { exact: true })).toBeVisible();
    await page.getByRole('link', { name: 'Modifier' }).click();
    await page.locator('input[type="number"]').fill('1300.500');
    await page.locator('form select').nth(1).selectOption('paid');
    await page.getByRole('button', { name: 'Enregistrer' }).click();
    await expect(page.getByText('Modifié par')).toBeVisible();
    await expect(page.getByText('1300.500000 MAD')).toBeVisible();
    await page.getByRole('link', { name: 'Retour', exact: true }).click();
    await expect(page).toHaveURL(/\/vehicle-installments$/);
    await page.getByTestId('workspace-create').click();
    await expect(page).toHaveURL(/\/vehicle-installments\/create$/);
    const nearVehicleSelect = page.locator('form select').first();
    const nearVehicleId = await nearVehicleSelect.locator('option').nth(1).getAttribute('value');
    await nearVehicleSelect.selectOption(nearVehicleId!);
    await page.locator('input[type="number"]').fill('400');
    const nearDue = new Date();
    nearDue.setDate(nearDue.getDate() + 15);
    await page.locator('input[type="date"]').fill(nearDue.toISOString().slice(0, 10));
    await page.locator('form select').nth(1).selectOption('unpaid');
    await page.getByRole('button', { name: 'Enregistrer' }).click();
    await page.getByRole('link', { name: 'Retour', exact: true }).click();
    await page.locator('select').first().selectOption('unpaid');
    await page.getByRole('button', { name: 'Filtrer' }).click();
    await expect(page.locator('[data-testid="installment-row-container"].bg-orange-50').first()).toBeVisible();
    await page.locator('select').first().selectOption('paid');
    await page.getByRole('button', { name: 'Filtrer' }).click();
    await expect(page).toHaveURL(/status=paid/);
    const count = Number(await page.getByTestId('installment-count').innerText());
    expect(count).toBeGreaterThan(0);
    await expect(page.getByTestId('installment-row').first()).toBeVisible();
});






test('workflow charge duplication equipes et modeles pdf', async ({ page }) => {
    await login(page);
    await page.goto('/data/charges/create');
    await page.getByLabel('Description').fill('Charge E2E finalisation');
    await page.getByLabel('Date').fill('2026-11-09');
    await page.getByLabel('Catégorie').selectOption('autre');
    await page.getByLabel('Montant').fill('99');
    await page.getByRole('button', { name: 'Enregistrer' }).click();
    await expect(page).toHaveURL(/\/data\/charges$/);
    await page.getByTestId('row-link').first().click();
    await expect(page).toHaveURL(/\/data\/charges\/\d+$/);
    await page.getByRole('button', { name: 'Dupliquer' }).click();
    await expect(page).toHaveURL(/\/data\/charges\/\d+$/);
    await page.goto('/settings/teams');
    await expect(page.getByRole('heading', { name: 'Équipes' })).toBeVisible();
    await page.goto('/settings/pdf-templates');
    await expect(page.getByRole('heading', { name: 'Modèles PDF' })).toBeVisible();
});

test('workflow echeances orange rouge validation et mobile', async ({ page }) => {
    await login(page);
    await page.goto('/deadlines');
    await page.getByText('Nouvelle échéance').click();
    const deadlineCreate = page.locator('details').filter({ hasText: 'Nouvelle échéance' });
    await deadlineCreate.locator('select[name=vehicle_id]').selectOption({ index: 1 });
    await deadlineCreate.locator('select[name=maintenance_type_id]').selectOption({ index: 1 });
    await deadlineCreate.locator('input[name=title]').fill('Échéance E2E');
    await deadlineCreate.locator('input[name=due_date]').fill('2026-11-16');
    await page.getByRole('button', { name: 'Ajouter' }).click();
    await expect(page.getByText('Échéance E2E').first()).toBeVisible();
    const checkbox = page.getByRole('checkbox', { name: /Traiter Échéance E2E/ }).first();
    await checkbox.click();
    await page.getByRole('button', { name: 'Confirmer' }).click();
    await expect(page.getByText('Échéance traitée.')).toBeVisible();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/deadlines');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(2);
    await expect(page.getByRole('heading', { name: 'Échéances' })).toBeVisible();
});


