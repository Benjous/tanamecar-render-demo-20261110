import { chromium } from 'playwright';

const base = (process.env.RENDER_URL || '').replace(/\/$/, '');
const email = process.env.DEMO_EMAIL || 'demo@tanamecar.test';
const password = process.env.DEMO_PASSWORD || '';

if (!base || !password) {
    console.error('RENDER_URL et DEMO_PASSWORD sont requis.');
    process.exit(2);
}

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const context = await browser.newContext({ viewport: { width: 1366, height: 900 } });
const page = await context.newPage();
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));
page.on('console', (message) => {
    if (message.type() === 'error' && !message.text().includes('favicon')) errors.push(message.text());
});

const login = await page.goto(`${base}/login`, { waitUntil: 'domcontentloaded' });
await page.locator('input[type=email]').fill(email);
await page.locator('input[type=password]').fill(password);
await page.getByRole('button', { name: 'Connexion' }).click();
await page.waitForTimeout(2500);

const dashboard = page.url() === `${base}/` && (await page.locator('body').innerText()).includes('Tableau de bord');
const chart = await page.getByText('Facturation mensuelle', { exact: true }).count();

await page.goto(`${base}/clients`);
await page.waitForTimeout(1000);
const clientsTotal = await page.locator('[data-testid=list-total]').first().innerText();
const pagination = await page.locator('[data-testid=list-pagination]').innerText();
await page.locator('input[type=search][name=q]').fill('REGUIG');
await page.waitForTimeout(1200);
const clientsSearch = await page.locator('[data-testid=list-total]').first().innerText();

await page.goto(`${base}/deadlines`);
await page.waitForTimeout(1000);
const deadlinesText = await page.locator('body').innerText();
const demoMentions = (deadlinesText.match(/\(demo\)/gi) || []).length;

await page.goto(`${base}/contracts`);
await page.waitForTimeout(1000);
const contractHref = await page.getByTestId('row-link').first().getAttribute('href');
const contractId = contractHref?.match(/\/contracts\/(\d+)/)?.[1];
let pdf = { status: 0, type: '' };
if (contractId) {
    pdf = await page.evaluate(async (url) => {
        const response = await fetch(url);
        return { status: response.status, type: response.headers.get('content-type') || '' };
    }, `/contracts/${contractId}/pdf`);
}

await page.setViewportSize({ width: 390, height: 844 });
await page.goto(`${base}/clients`);
await page.waitForTimeout(1000);
const mobileOverflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);

await page.locator('[data-testid=user-menu]').click();
await page.getByRole('menuitem', { name: /Déconnexion/ }).click();
await page.waitForTimeout(1000);
const loggedOut = page.url().endsWith('/login');

console.log(JSON.stringify({
    loginStatus: login?.status(),
    dashboard,
    chart,
    clientsTotal,
    pagination,
    clientsSearch,
    demoMentions,
    pdf,
    mobileOverflow,
    loggedOut,
    errors,
}, null, 2));

await browser.close();
process.exit(dashboard && chart === 0 && demoMentions === 0 && pdf.status === 200 && mobileOverflow <= 2 && loggedOut && errors.length === 0 ? 0 : 1);
