import { http, router } from '@inertiajs/react';

export type OfflineStatus = 'pending' | 'syncing' | 'confirmed' | 'conflict' | 'error';

export type OfflineOperation = {
    id: string;
    userId: number;
    method: string;
    url: string;
    data: unknown;
    headers: Record<string, string>;
    expectedVersion: string | null;
    createdAt: string;
    status: OfflineStatus;
    attempts: number;
    error?: string | null;
    serverResponse?: unknown;
};

declare global {
    interface Window {
        __tanamePage?: any;
        __tanameOfflineInstalled?: boolean;
        __tanameUserId?: number;
    }
}

const DB_NAME = 'taname-offline';
const DB_VERSION = 1;
const STORE = 'operations';
const USER_KEY = 'taname_offline_user';
const PAGE_CACHE = 'taname-pages-v1';
let dbPromise: Promise<IDBDatabase> | null = null;
let flushing = false;

function openDb(): Promise<IDBDatabase> {
    if (!dbPromise) {
        dbPromise = new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);
            request.onupgradeneeded = () => {
                const db = request.result;
                if (!db.objectStoreNames.contains(STORE)) {
                    const store = db.createObjectStore(STORE, { keyPath: 'id' });
                    store.createIndex('userId', 'userId', { unique: false });
                }
            };
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    return dbPromise;
}

async function allOperations(): Promise<OfflineOperation[]> {
    const db = await openDb();
    return new Promise((resolve, reject) => {
        const request = db.transaction(STORE, 'readonly').objectStore(STORE).getAll();
        request.onsuccess = () => resolve(request.result as OfflineOperation[]);
        request.onerror = () => reject(request.error);
    });
}

async function putOperation(operation: OfflineOperation): Promise<void> {
    const db = await openDb();
    return new Promise((resolve, reject) => {
        const request = db.transaction(STORE, 'readwrite').objectStore(STORE).put(operation);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

async function removeOperation(id: string): Promise<void> {
    const db = await openDb();
    return new Promise((resolve, reject) => {
        const request = db.transaction(STORE, 'readwrite').objectStore(STORE).delete(id);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

function emit(): void {
    window.dispatchEvent(new CustomEvent('taname:offline-queue'));
}

function userId(): number {
    return Number(localStorage.getItem(USER_KEY) ?? window.__tanameUserId ?? 0);
}

export function setOfflineUser(id: number): void {
    const previous = userId();
    if (previous && previous !== id) {
        void clearOfflinePages();
    }
    localStorage.setItem(USER_KEY, String(id));
    window.__tanameUserId = id;
}

export async function clearOfflinePages(): Promise<void> {
    if ('caches' in window) {
        await caches.delete(PAGE_CACHE);
    }
    navigator.serviceWorker?.controller?.postMessage({ type: 'clear-pages' });
}

function uuid(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }

    return `offline-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function serializableData(data: unknown): unknown {
    if (typeof FormData !== 'undefined' && data instanceof FormData) {
        const values: Record<string, string | string[]> = {};
        for (const [key, value] of data.entries()) {
            if (/password|secret|token/i.test(key)) {
                continue;
            }
            if (typeof value === 'string') {
                if (values[key]) {
                    const existing = values[key];
                    values[key] = Array.isArray(existing) ? [...existing, value] : [existing, value];
                } else {
                    values[key] = value;
                }
            }
        }
        return { __formData: true, values };
    }

    if (typeof data === 'string') {
        return data;
    }

    const sanitize = (value: unknown): unknown => {
        if (Array.isArray(value)) {
            return value.map(sanitize);
        }
        if (value && typeof value === 'object') {
            return Object.fromEntries(
                Object.entries(value as Record<string, unknown>)
                    .filter(([key]) => !/password|secret|token/i.test(key))
                    .map(([key, child]) => [key, sanitize(child)]),
            );
        }
        return value;
    };

    try {
        return sanitize(JSON.parse(JSON.stringify(data ?? {})));
    } catch {
        return {};
    }
}

function safeHeaders(headers: Record<string, unknown> | undefined): Record<string, string> {
    const allowed = ['accept', 'x-inertia', 'x-inertia-version', 'x-requested-with'];
    return Object.fromEntries(
        Object.entries(headers ?? {})
            .filter(([key]) => allowed.includes(key.toLowerCase()))
            .map(([key, value]) => [key, String(value)]),
    );
}

function findRecord(value: unknown, id: string, depth = 0): any {
    if (!value || depth > 5 || typeof value !== 'object') {
        return null;
    }
    const candidate = value as Record<string, unknown>;
    if (String(candidate.id ?? '') === id && candidate.updated_at) {
        return candidate;
    }
    for (const child of Object.values(candidate)) {
        if (!Array.isArray(child)) {
            const found = findRecord(child, id, depth + 1);
            if (found) {
                return found;
            }
        }
    }
    return null;
}

function expectedVersionFor(url: string): string | null {
    const page = window.__tanamePage;
    if (!page?.props) {
        return null;
    }
    const path = new URL(url, window.location.href).pathname;
    const id = path.match(/\/(\d+)(?:\/|$)/)?.[1];
    if (!id) {
        return null;
    }
    const record = findRecord(page.props, id);
    return record?.updated_at ? String(record.updated_at) : null;
}

function currentPageResponse(): { status: number; data: string; headers: Record<string, string> } {
    const page = window.__tanamePage ?? readInitialPage();
    const flash = {
        success: 'Modification enregistrée hors connexion. Elle sera transmise dès que le serveur sera disponible.',
        error: null,
    };
    const payload = page ? {
        ...page,
        flash,
        props: {
            ...(page.props ?? {}),
            flash: {
                ...(page.props?.flash ?? {}),
                ...flash,
            },
        },
    } : {
        component: 'Errors/OfflineQueued',
        props: { errors: [], flash },
        url: window.location.pathname + window.location.search,
        version: null,
    };

    return {
        status: 200,
        data: JSON.stringify(payload),
        headers: { 'x-inertia': 'true', 'content-type': 'application/json' },
    };
}

function readInitialPage(): any {
    const element = document.querySelector('[data-page]');
    if (!element) {
        return null;
    }

    try {
        const raw = element.getAttribute('data-page') ?? '';
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

async function enqueue(config: any): Promise<OfflineOperation> {
    const operation: OfflineOperation = {
        id: uuid(),
        userId: userId(),
        method: String(config.method).toUpperCase(),
        url: String(config.url),
        data: serializableData(config.data),
        headers: safeHeaders(config.headers),
        expectedVersion: expectedVersionFor(String(config.url)),
        createdAt: new Date().toISOString(),
        status: 'pending',
        attempts: 0,
        error: null,
    };

    // Un double clic ou une reprise immédiate ne doit pas créer deux opérations financières.
    const existing = (await allOperations()).find((item) => (
        item.userId === operation.userId
        && item.method === operation.method
        && item.url === operation.url
        && JSON.stringify(item.data) === JSON.stringify(operation.data)
        && (item.status === 'pending' || item.status === 'syncing')
        && Date.now() - new Date(item.createdAt).getTime() < 15000
    ));
    if (existing) {
        return existing;
    }

    await putOperation(operation);
    emit();
    return operation;
}

function shouldQueue(config: any): boolean {
    const method = String(config.method).toLowerCase();
    return ['post', 'put', 'patch', 'delete'].includes(method)
        && !String(config.url).includes('/logout')
        && !String(config.url).includes('/profile/switch')
        && !String(config.url).includes('/settings/security')
        && !String(config.url).includes('/settings/users');
}

async function installHttpClient(): Promise<void> {
    const base = http.getClient();
    http.setClient({
        async request(config: any) {
            if (!shouldQueue(config)) {
                return base.request(config);
            }

            if (!navigator.onLine) {
                await enqueue(config);
                return currentPageResponse();
            }

            try {
                return await base.request(config);
            } catch (error: any) {
                if (error?.code === 'ERR_NETWORK' || error?.name === 'HttpNetworkError') {
                    await enqueue(config);
                    return currentPageResponse();
                }
                throw error;
            }
        },
    });
}

function installBrowserEvents(): void {
    router.on('navigate', (event: any) => {
        if (event?.detail?.page) {
            window.__tanamePage = event.detail.page;
        }
    });
    window.__tanamePage = readInitialPage();

    const update = () => {
        window.dispatchEvent(new CustomEvent('taname:connectivity'));
        if (navigator.onLine) {
            void flushOfflineQueue();
        }
    };
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    window.addEventListener('taname:account-switch', () => {
        void clearOfflinePages();
    });
}

export function installOfflineSupport(): void {
    if (typeof window === 'undefined' || window.__tanameOfflineInstalled) {
        return;
    }
    window.__tanameOfflineInstalled = true;

    installBrowserEvents();
    void installHttpClient();

    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js').catch(() => {
            // Le mode hors connexion restera limité aux pages déjà présentes dans le cache HTTP.
        });
    }
}

export async function getOfflineOperations(forUser = userId()): Promise<OfflineOperation[]> {
    const operations = await allOperations();
    return operations
        .filter((operation) => operation.userId === forUser)
        .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

export async function flushOfflineQueue(): Promise<void> {
    if (flushing || !navigator.onLine) {
        return;
    }

    const currentUser = userId();
    if (!currentUser) {
        return;
    }

    flushing = true;
    window.dispatchEvent(new CustomEvent('taname:offline-syncing'));
    try {
        const operations = (await getOfflineOperations(currentUser))
            .filter((operation) => operation.status === 'pending' || operation.status === 'error')
            .reverse();

        for (const operation of operations) {
            await putOperation({ ...operation, status: 'syncing' });
            emit();

            const headers: Record<string, string> = {
                ...operation.headers,
                'X-Offline-Operation-Id': operation.id,
                'X-Requested-With': 'XMLHttpRequest',
                Accept: 'text/html, application/xhtml+xml',
                'Content-Type': 'application/json',
            };
            if (operation.expectedVersion) {
                headers['X-Offline-Expected-Version'] = operation.expectedVersion;
            }
            const xsrf = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/)?.[1];
            if (xsrf) {
                headers['X-XSRF-TOKEN'] = decodeURIComponent(xsrf);
            }
            const csrf = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            if (csrf) {
                headers['X-CSRF-TOKEN'] = csrf;
            }

            try {
                const response = await fetch(operation.url, {
                    method: operation.method,
                    headers,
                    credentials: 'same-origin',
                    body: (() => {
                        if (typeof operation.data === 'string') {
                            return operation.data;
                        }
                        if (operation.data && typeof operation.data === 'object' && '__formData' in operation.data) {
                            return JSON.stringify((operation.data as any).values ?? {});
                        }
                        return JSON.stringify(operation.data ?? {});
                    })(),
                });
                const text = await response.text();
                let parsed: unknown = text;
                try {
                    parsed = JSON.parse(text);
                } catch {
                    // Réponse HTML : le statut suffit pour l’état de la file.
                }

                if (response.ok) {
                    const validationErrors = (parsed as any)?.props?.errors;
                    if (validationErrors && Object.keys(validationErrors).length > 0) {
                        await putOperation({
                            ...operation,
                            status: 'error',
                            attempts: operation.attempts + 1,
                            error: 'Validation serveur refusée. Vérifiez la modification locale.',
                            serverResponse: parsed,
                        });
                    } else {
                        await putOperation({
                            ...operation,
                            status: 'confirmed',
                            attempts: operation.attempts + 1,
                            error: null,
                            serverResponse: parsed,
                        });
                    }
                } else if (response.status === 409) {
                    await putOperation({
                        ...operation,
                        status: 'conflict',
                        attempts: operation.attempts + 1,
                        error: 'Conflit avec une version serveur plus récente.',
                        serverResponse: parsed,
                    });
                } else if (response.status === 419 || response.url.includes('/login')) {
                    await putOperation({
                        ...operation,
                        status: 'error',
                        attempts: operation.attempts + 1,
                        error: 'Session expirée : reconnectez-vous pour synchroniser.',
                        serverResponse: parsed,
                    });
                } else {
                    await putOperation({
                        ...operation,
                        status: response.status >= 500 ? 'error' : 'error',
                        attempts: operation.attempts + 1,
                        error: `Réponse serveur ${response.status}.`,
                        serverResponse: parsed,
                    });
                }
            } catch {
                await putOperation({
                    ...operation,
                    status: 'error',
                    attempts: operation.attempts + 1,
                    error: 'Serveur local indisponible pendant la synchronisation.',
                });
            }
            emit();
        }
    } finally {
        flushing = false;
        window.dispatchEvent(new CustomEvent('taname:offline-sync-done'));
        emit();
    }
}

export async function retryOperation(id: string): Promise<void> {
    const operations = await allOperations();
    const operation = operations.find((item) => item.id === id);
    if (!operation) {
        return;
    }
    await putOperation({ ...operation, status: 'pending', error: null });
    emit();
    await flushOfflineQueue();
}

export async function removeOfflineOperation(id: string): Promise<void> {
    await removeOperation(id);
    emit();
}

export async function forceLocalOperation(operation: OfflineOperation): Promise<void> {
    await removeOperation(operation.id);
    await putOperation({
        ...operation,
        id: uuid(),
        status: 'pending',
        expectedVersion: null,
        error: null,
        attempts: 0,
    });
    emit();
    await flushOfflineQueue();
}
