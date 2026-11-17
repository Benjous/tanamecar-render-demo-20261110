import { expect, test } from '@playwright/test';
import { createHash } from 'node:crypto';

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:8003';

async function login(page: any) {
    await page.goto(`${baseURL}/login`, { waitUntil: 'domcontentloaded' });
    await page.locator('input[type="email"]').waitFor();
    await page.locator('input[type="email"]').fill((process.env.E2E_EMAIL || ''));
    await page.locator('input[type="password"]').fill((process.env.E2E_PASSWORD || ''));
    await page.getByRole('button', { name: /connecter/i }).click();
    await page.waitForURL((url: URL) => !url.pathname.endsWith('/login'));
}

async function loginUser(page: any) {
    await page.goto(`${baseURL}/login`, { waitUntil: 'domcontentloaded' });
    await page.locator('input[type="email"]').waitFor();
    await page.locator('input[type="email"]').fill(process.env.E2E_USER_EMAIL ?? '');
    await page.locator('input[type="password"]').fill(process.env.E2E_USER_PASSWORD ?? '');
    await page.getByRole('button', { name: /connecter/i }).click();
    await page.waitForURL((url: URL) => !url.pathname.endsWith('/login'));
}

test.describe.configure({ mode: 'serial' });

test('navigation reorganisee et page En retard', async ({ page }) => {
    await login(page);
    await expect(page.locator('.al-main-tab a')).toHaveText(['Manipulation', 'Véhicules', 'Facturations', 'Caisses', 'Traites', 'Espace Administrateur']);
    await expect(page.locator('.al-submenu a')).toHaveText(['En retour', 'En retard', 'Contrat', 'Disponible', 'En location', 'Conducteurs', 'Sous-location']);

    const tabs = await page.locator('.al-return-tabs button').allInnerTexts();
    expect(tabs.join(' ')).not.toContain('En retard');
    await expect(page.locator('.al-return-tabs button').filter({ hasText: "Aujourd'hui" })).toContainText(/\d+/);
    await expect(page.locator('.al-return-tabs button').filter({ hasText: 'Demain' }).first()).toContainText(/\d+/);
    const normalStatuses = await page.locator('.al-return-state').allInnerTexts();
    expect(normalStatuses.every((status) => !status.includes('En retard'))).toBeTruthy();
    const normalIds = await page.locator('.al-data-table tbody input[name="selectLine"]').evaluateAll((elements) => elements.map((element) => element.getAttribute('aria-label') ?? ''));

    await page.locator('.al-submenu a', { hasText: 'En retard' }).click();
    await expect(page).toHaveURL(/status=overdue/);
    await expect(page.locator('.al-return-heading')).toContainText('Retours en retard');
    const statuses = await page.locator('.al-return-state').allInnerTexts();
    expect(statuses.length).toBeGreaterThan(0);
    expect(statuses.every((status) => status.includes('En retard'))).toBeTruthy();
    const lateIds = await page.locator('.al-data-table tbody input[name="selectLine"]').evaluateAll((elements) => elements.map((element) => element.getAttribute('aria-label') ?? ''));
    expect(lateIds.filter((id) => normalIds.includes(id))).toHaveLength(0);
    await expect(page.locator('.al-return-heading')).toContainText('5 contrats en retard');
});

test('recherche client et remplissage automatique du contrat', async ({ page }) => {
    await login(page);
    await page.goto(`${baseURL}/contracts/create`, { waitUntil: 'networkidle' });
    await page.locator('.al-contract-picker button').first().click();
    await page.locator('.al-contract-picker input').first().fill('AAMER');
    await page.locator('[role="option"]').first().waitFor();
    await page.keyboard.press('Enter');

    const locataire = page.locator('.al-contract-person').first();
    await expect(locataire.locator('input').nth(0)).not.toHaveValue('');
    await expect(locataire.locator('input').nth(3)).not.toHaveValue('');
});

test('contrat existant : valeurs reelles et autocompletion par prenom', async ({ page }) => {
    await login(page);
    await page.goto(`${baseURL}/contracts/366400/edit`, { waitUntil: 'networkidle' });

    await expect(page.locator('.al-contract-top')).toContainText('019948');
    const locataire = page.locator('.al-contract-person').first();
    await expect(locataire.locator('input').nth(0)).toHaveValue('RMA ASSISTANCE');
    await expect(page.locator('.al-contract-field').filter({ hasText: 'Lieu' }).first().locator('input')).toHaveValue('AGENCE');
    await expect(page.locator('input[type="date"]').first()).toHaveValue('2026-05-20');
    await expect(page.locator('input[type="time"]').first()).toHaveValue('13:00');

    await page.goto(`${baseURL}/contracts/create`, { waitUntil: 'networkidle' });
    await page.locator('.al-contract-picker button').first().click();
    await page.locator('.al-contract-picker input').first().fill('Haiba');
    await page.locator('[role="option"]').first().waitFor();
    await page.keyboard.press('Enter');

    const nouveauLocataire = page.locator('.al-contract-person').first();
    await expect(nouveauLocataire.locator('input').nth(0)).toHaveValue('HOURMATALLA');
    await expect(nouveauLocataire.locator('input').nth(1)).toHaveValue('HAIBA');
    await expect(nouveauLocataire.locator('input').nth(3)).toHaveValue('+212661525153');
});

test('tableau de bord reserve a l administrateur', async ({ page }) => {
    await loginUser(page);
    const response = await page.goto(`${baseURL}/dashboard`, { waitUntil: 'domcontentloaded' });
    expect(response?.status()).toBe(403);
});

test('sous-location alimentee par les vehicules', async ({ page }) => {
    await login(page);
    await page.goto(`${baseURL}/sub-rentals`, { waitUntil: 'networkidle' });
    const rows = await page.locator('.al-data-table tbody tr').count();
    expect(rows).toBeGreaterThan(0);
    await expect(page.locator('.al-data-table tbody tr').first()).toContainText('Sous-location');
});

test('impression facture : sans entete direct', async ({ page }) => {
    await login(page);
    await page.goto(`${baseURL}/invoices/2000003`, { waitUntil: 'networkidle' });

    const printLink = page.getByRole('link', { name: 'Imprimer', exact: true });
    await expect(printLink).toHaveAttribute('href', `/invoices/2000003/print/no-header`);
    await expect(page.locator('a[href$="/print/header"]')).toHaveCount(0);

    const hash = (buffer: Buffer) => createHash('sha256').update(buffer).digest('hex');
    const downloadNoHeader = await page.request.get(`${baseURL}/invoices/2000003/pdf/no-header`);
    const printNoHeader = await page.request.get(`${baseURL}/invoices/2000003/print/no-header`);
    expect(printNoHeader.headers()['content-disposition']).toContain('inline');
    expect(hash(await printNoHeader.body())).toBe(hash(await downloadNoHeader.body()));

    await printLink.click();
    await page.waitForURL(/\/invoices\/2000003\/print\/no-header/, { timeout: 30000 });
});


test('facture existante : formulaire de modification prerempli', async ({ page }) => {
    await login(page);
    await page.goto(`${baseURL}/invoices/393061`, { waitUntil: 'networkidle' });
    await page.getByRole('link', { name: /Modifier la facture/i }).click();
    await expect(page).toHaveURL(/\/invoices\/393061\/edit/);
    await expect(page.locator('form').nth(1).locator('input').first()).toHaveValue('1173/2026');
    await expect(page.getByText('Total TTC').first()).toBeVisible();
});

test('cle 2FA : acces reserve administrateur', async ({ page }) => {
    await loginUser(page);
    const response = await page.goto(`${baseURL}/settings/security`, { waitUntil: 'domcontentloaded' });
    expect(response?.status()).toBe(403);
});

test('facture : champs obligatoires et deux telechargements', async ({ page }) => {
    await login(page);
    await page.goto(`${baseURL}/invoices/create`, { waitUntil: 'networkidle' });
    await expect(page.getByText('Client *')).toBeVisible();
    await expect(page.getByText('Date d’émission *')).toBeVisible();
    await expect(page.getByText('Date d’échéance')).toBeVisible();
    await expect(page.getByText('Réf. Dossier')).toBeVisible();
    await expect(page.getByText('Objet')).toBeVisible();

    await page.goto(`${baseURL}/invoices/2000003`, { waitUntil: 'networkidle' });
    await expect(page.locator('a[href$="/pdf/header"]')).toBeVisible();
    await expect(page.locator('a[href$="/pdf/no-header"]')).toBeVisible();
});

