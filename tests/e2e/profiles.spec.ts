import { expect, test } from '@playwright/test';

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:8003';

const userEmail = process.env.E2E_USER_EMAIL ?? '';
const userPassword = process.env.E2E_USER_PASSWORD ?? '';

async function loginUser(page: any) {
    await page.goto(`${baseURL}/login`, { waitUntil: 'domcontentloaded' });
    await page.locator('input[type="email"]').waitFor();
    await page.locator('input[type="email"]').fill(userEmail);
    await page.locator('input[type="password"]').fill(userPassword);
    await page.getByRole('button', { name: /connecter/i }).click();
    await page.waitForURL((url: URL) => !url.pathname.endsWith('/login'));
}

async function login(page: any) {
    await page.goto(`${baseURL}/login`, { waitUntil: 'domcontentloaded' });
    await page.locator('input[type="email"]').waitFor();
    await page.locator('input[type="email"]').fill((process.env.E2E_EMAIL || ''));
    await page.locator('input[type="password"]').fill((process.env.E2E_PASSWORD || ''));
    await page.getByRole('button', { name: /connecter/i }).click();
    await page.waitForURL((url: URL) => !url.pathname.endsWith('/login'));
}

test.describe.configure({ mode: 'serial' });

test('page de connexion minimaliste', async ({ page }) => {
    await page.goto(`${baseURL}/login`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.tc-login-minimal-logo')).toBeVisible();
    await expect(page.locator('.tc-login-contact')).toHaveCount(0);
    await expect(page.locator('.tc-login-story')).toHaveCount(0);
    await expect(page.locator('video')).toHaveCount(1);
    await expect(page.locator('.tc-login-minimal-field input')).toHaveCount(2);
    await expect(page.locator('.tc-login-minimal-remember')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Se connecter' })).toBeVisible();

    await login(page);
    await expect(page).toHaveURL(/contracts\?view=returns/);
});

test('utilisateur sans acces administration', async ({ page }) => {
    await loginUser(page);
    await expect(page.locator('.al-main-tab a')).toHaveText(['Manipulation', 'Véhicules', 'Facturations', 'Caisses', 'Traites', 'Espace Administrateur']);
    await expect(page.locator('.al-main-tab a', { hasText: 'Espace Administrateur' })).toHaveCount(1);

    await page.locator('.al-profile-button').click();
    await expect(page.locator('.al-profile-modal')).toBeVisible();
    await expect(page.locator('.al-profile-row', { hasText: 'SECRETAIRE TANAME' })).toHaveCount(1);

    expect((await page.request.get(`${baseURL}/settings/users`)).status()).toBe(403);
    expect((await page.request.get(`${baseURL}/settings/security`)).status()).toBe(403);
    expect((await page.request.get(`${baseURL}/dashboard`)).status()).toBe(403);
    expect((await page.request.get(`${baseURL}/reports`)).status()).toBe(403);
    expect((await page.request.get(`${baseURL}/data/slv_sources`)).status()).toBe(403);
    expect((await page.request.get(`${baseURL}/clients`)).status()).toBe(200);
    expect((await page.request.get(`${baseURL}/payments`)).status()).toBe(200);

    const denied = await page.goto(`${baseURL}/dashboard`, { waitUntil: 'domcontentloaded' });
    expect(denied?.status()).toBe(403);
    await expect(page.locator('body')).toContainText("Vous n'avez pas accès à cette section,");
    await expect(page.locator('body')).toContainText('Merci !');
});

test('logo et formulaire visibles sur mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${baseURL}/login`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.tc-login-minimal-logo')).toBeVisible();
    await expect(page.locator('.tc-login-minimal-card')).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(2);
});
test('deconnexion reelle', async ({ page }) => {
    await login(page);
    await page.locator('.al-profile-button').click();
    await expect(page.locator('.al-profile-logout-button')).toBeVisible();
    await page.locator('.al-profile-logout-button').click();
    await page.waitForURL('**/login');
    await page.goto(`${baseURL}/clients`, { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/login$/);
});

test('listes sans defilement horizontal', async ({ page }) => {
    test.setTimeout(300000);
    const pages = ['/clients', '/contracts', '/contracts?view=returns', '/sub-rentals', '/vehicle-amortizations', '/reports', '/deadlines', '/vehicle-installments', '/dashboard', '/invoices', '/invoices/2000003', '/clients/368744', '/contracts/create', '/invoices/create'];

    await login(page);
    for (const [width, height] of [[1366, 768], [1024, 768], [768, 1024], [390, 844]]) {
        await page.setViewportSize({ width, height });
        for (const path of pages) {
            await page.goto(`${baseURL}${path}`, { waitUntil: 'networkidle' });
            const overflow = await page.evaluate(() => {
                const scroll = document.querySelector('.al-table-scroll');
                return {
                    table: scroll ? scroll.scrollWidth - scroll.clientWidth : 0,
                    page: document.documentElement.scrollWidth - window.innerWidth,
                };
            });
            expect(overflow.table, `${path} ${width}px`).toBeLessThanOrEqual(1);
            expect(overflow.page, `${path} ${width}px`).toBeLessThanOrEqual(1);
        }
    }
});
