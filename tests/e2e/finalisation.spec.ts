import { expect, test } from '@playwright/test';

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:8003';

async function login(page: any) {
    await page.goto(`${baseURL}/login`, { waitUntil: 'domcontentloaded' });
    await page.locator('input[type="email"]').waitFor();
    await page.locator('input[type="email"]').fill((process.env.E2E_EMAIL || ''));
    await page.locator('input[type="password"]').fill((process.env.E2E_PASSWORD || ''));
    await page.getByRole('button', { name: /connecter/i }).click();
    await page.waitForURL((url: URL) => !url.pathname.endsWith('/login'));
    await expect(page.locator('#ContentPage')).toBeVisible();
}

test('connexion et navigation finale', async ({ page }) => {
    await login(page);
    await expect(page).toHaveURL(/contracts\?view=returns/);
    await expect(page.locator('.al-main-tab-active a')).toHaveText('Manipulation');
    await expect(page.locator('.al-main-tab a')).toHaveText(['Manipulation', 'Véhicules', 'Facturations', 'Caisses', 'Traites', 'Espace Administrateur']);
    await expect(page.locator('.al-submenu a')).toHaveText(['En retour', 'En retard', 'Contrat', 'Disponible', 'En location', 'Conducteurs', 'Sous-location']);
    const returnTabs = await page.locator('.al-return-tabs button').allInnerTexts();
    expect(returnTabs.join(' ')).not.toContain('En retard');

    await page.locator('.al-submenu a', { hasText: 'En retard' }).click();
    await expect(page).toHaveURL(/status=overdue/);
    await expect(page.locator('.al-return-heading')).toContainText('Retours en retard');

    await page.locator('.al-main-tab a', { hasText: 'Véhicules' }).click();
    await expect(page.locator('.al-submenu a')).toHaveText(['Voiture', 'Entretiens', 'Paramétrage', 'Réparation']);

    await page.locator('.al-main-tab a', { hasText: 'Facturations' }).click();
    await expect(page.locator('.al-submenu a')).toHaveText(['Facturation']);



    await page.locator('.al-main-tab a', { hasText: 'Caisses' }).click();
    await expect(page.locator('.al-submenu a')).toHaveText(['Charge', "Tableau d'amortissement", 'État Global', 'Bilan']);
});

test('donnees AUTOLOC supprimees et WADI conservees', async ({ page }) => {
    await login(page);
    await page.locator('.al-submenu a', { hasText: 'Sous-location' }).click();
    await expect(page.locator('.al-data-table tbody tr').first()).toBeVisible();
    expect(await page.locator('.al-data-table tbody tr').count()).toBeGreaterThan(0);

    await page.locator('.al-main-tab a', { hasText: 'Caisses' }).click();
    await page.locator('.al-submenu a', { hasText: "Tableau d'amortissement" }).click();
    await expect(page.locator('.al-empty-row')).toBeVisible();

    await page.locator('.al-main-tab a', { hasText: 'Traites' }).click();
    await expect(page.locator('.al-empty-row')).toBeVisible();
    await page.locator('.al-submenu a', { hasText: 'Traite 2' }).click();
    await expect(page.locator('.al-empty-row')).toBeVisible();

    await page.locator('.al-main-tab a', { hasText: 'Manipulation' }).click();
    await page.locator('.al-submenu a', { hasText: 'Conducteurs' }).click();
    await expect(page.locator('.al-data-table tbody tr')).toHaveCount(2078);
});

test('filtre et tri de la liste Conducteurs', async ({ page }) => {
    await login(page);
    await page.goto(`${baseURL}/clients`);
    await page.locator('input[name="nom"]').fill('AAMER');
    await expect(page).toHaveURL(/nom=AAMER/);
    const cells = page.locator('.al-data-table tbody tr td:nth-child(2)');
    await expect(cells.first()).toContainText('AAMER');
    expect(await cells.count()).toBeGreaterThan(0);
    await page.locator('.al-data-table thead td', { hasText: 'TÉLÉPHONE' }).click();
    await expect(page.locator('.al-data-table tbody tr').first()).toBeVisible();
});

test('formulaire client au format final', async ({ page }) => {
    await login(page);
    await page.goto(`${baseURL}/clients`);
    await page.locator('[data-testid="workspace-create"]').click();
    await expect(page).toHaveURL(/\/clients\/create$/);
    await expect(page.locator('.al-form-table label, .al-form-label')).toHaveCount(18);
    await expect(page.getByRole('button', { name: 'Valider' })).toBeVisible();
});

test('zones de clic et absence de lien mort', async ({ page }) => {
    await login(page);
    const small = await page.evaluate(() => Array.from(document.querySelectorAll('button, .al-main-tab a, .al-submenu a, .al-link-modifier, .al-left-action a, .al-left-action button, .al-button'))
        .map((element) => ({ text: (element.textContent ?? '').trim(), height: Math.round(element.getBoundingClientRect().height) }))
        .filter((element) => element.height > 0 && element.height < 28));
    expect(small).toEqual([]);

    const dead = await page.evaluate(() => Array.from(document.querySelectorAll('a'))
        .filter((anchor) => {
            const href = anchor.getAttribute('href');
            return !href || href === '#' || href.startsWith('javascript:;');
        })
        .map((anchor) => (anchor.textContent ?? '').trim())
        .filter(Boolean));
    expect(dead).toEqual([]);
});

test('mobile 390 sans debordement de page', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await login(page);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(2);
    await expect(page.locator('.al-search-box')).toBeVisible();
    await expect(page.locator('.al-data-table')).toBeAttached();
});



