import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

function parseEnv(file) {
  const out = {};
  if (!fs.existsSync(file)) return out;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    if (!line || line.trim().startsWith('#')) continue;
    const i = line.indexOf('=');
    if (i < 1) continue;
    out[line.slice(0, i)] = line.slice(i + 1).replace(/^"(.*)"$/, '$1');
  }
  return out;
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const env = { ...parseEnv(path.join(root, '.env')), ...process.env };
const base = (env.WADI_BASE_URL || 'https://app.wadi.dev').replace(/\/$/, '');
const account = env.WADI_ACCOUNT || 'tanamecar';
const email = env.WADI_EMAIL;
const password = env.WADI_PASSWORD;
const outDir = env.WADI_SNAPSHOT_DIR || path.join(root, 'storage', 'app', 'private', 'wadi-sync');
const snapshotPath = path.join(outDir, `snapshot-${Date.now()}.json`);
const resultPath = path.join(outDir, 'last-fetch.json');
fs.mkdirSync(outDir, { recursive: true });

function writeResult(payload) {
  fs.writeFileSync(resultPath, JSON.stringify(payload, null, 2));
}

if (!email || !password) {
  writeResult({ ok: false, error: 'WADI_EMAIL/WADI_PASSWORD absents du fichier .env local.' });
  process.exit(2);
}

const commonHeaders = {
  Accept: 'application/json, text/plain, */*',
  'Content-Type': 'application/json',
  'x-device-name': 'Win32',
  Referer: `${base}/${account}/login`,
  Origin: base,
};

try {
  const loginResponse = await fetch(`${base}/api/auth/login`, {
    method: 'POST',
    headers: commonHeaders,
    body: JSON.stringify({ account, email, password }),
  });
  const loginPayload = await loginResponse.json().catch(() => ({}));
  if (!loginResponse.ok || !loginPayload.token) {
    throw new Error(loginPayload.message ? JSON.stringify(loginPayload.message).slice(0, 500) : `Authentification WADI HTTP ${loginResponse.status}`);
  }

  const token = String(loginPayload.token);
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/json',
    Referer: `${base}/${account}`,
  };

  const entitiesResponse = await fetch(`${base}/api/settings/entities`, { headers });
  if (!entitiesResponse.ok) {
    throw new Error(`Liste des entités WADI : HTTP ${entitiesResponse.status}`);
  }
  const entitiesPayload = await entitiesResponse.json();
  const entities = (entitiesPayload.data || []).filter((entity) => entity?.name && entity?.uid);

  const snapshot = {
    ok: true,
    fetched_at: new Date().toISOString(),
    base_url: base,
    account,
    entities: [],
    errors: [],
  };

  for (const entity of entities) {
    const items = [];
    let pageNumber = 1;
    let lastPage = 1;
    let total = 0;
    try {
      do {
        const params = new URLSearchParams({
          limit: '200',
          page: String(pageNumber),
          sort_column: 'id',
          sort_direction: 'asc',
          filters: '{}',
        });
        let response = await fetch(`${base}/api/items/${entity.name}/${entity.uid}?${params}`, { headers });
        if (response.status === 412) {
          params.set('sort_column', 'created_at');
          response = await fetch(`${base}/api/items/${entity.name}/${entity.uid}?${params}`, { headers });
        }
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const payload = await response.json();
        total = Number(payload.meta?.total ?? payload.total ?? items.length);
        lastPage = Number(payload.meta?.last_page ?? 1);
        items.push(...(payload.data || []));
        pageNumber += 1;
      } while (pageNumber <= lastPage && pageNumber <= 200);

      snapshot.entities.push({
        name: entity.name,
        uid: entity.uid,
        label: entity.label || entity.name,
        total,
        fetched: items.length,
        items,
      });
    } catch (error) {
      snapshot.errors.push({
        entity: entity.name,
        label: entity.label || entity.name,
        error: String(error.message || error),
      });
    }
  }

  if (snapshot.entities.length === 0) {
    snapshot.ok = false;
    snapshot.error = 'Aucune entité WADI récupérée.';
  }

  fs.writeFileSync(snapshotPath, JSON.stringify(snapshot));
  writeResult({
    ok: snapshot.ok,
    fetched_at: snapshot.fetched_at,
    snapshot: snapshotPath,
    entities: snapshot.entities.map((entity) => ({
      name: entity.name,
      label: entity.label,
      total: entity.total,
      fetched: entity.fetched,
    })),
    errors: snapshot.errors,
  });
  console.log(JSON.stringify({ ok: snapshot.ok, snapshot: snapshotPath, entities: snapshot.entities.length, errors: snapshot.errors.length }));
  process.exit(snapshot.ok ? 0 : 3);
} catch (error) {
  writeResult({ ok: false, error: String(error.message || error), at: new Date().toISOString() });
  console.error(JSON.stringify({ ok: false, error: String(error.message || error) }));
  process.exit(4);
}
