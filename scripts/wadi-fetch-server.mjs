import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const env = { ...parseEnv(path.join(root, '.env')), ...process.env };
const port = Number(env.WADI_FETCH_PORT || 8899);
const host = '127.0.0.1';
const token = env.WADI_FETCH_TOKEN || '';
const script = path.join(root, 'scripts', 'wadi-fetch-snapshot.mjs');
let busy = false;

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

function json(response, status, payload) {
  const body = JSON.stringify(payload);
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Content-Length': Buffer.byteLength(body) });
  response.end(body);
}

const server = http.createServer((request, response) => {
  if (request.method !== 'POST' || request.url !== '/fetch') {
    json(response, 404, { ok: false, error: 'Route inconnue.' });
    return;
  }

  if (token && request.headers['x-wadi-token'] !== token) {
    json(response, 401, { ok: false, error: 'Jeton local invalide.' });
    return;
  }

  if (busy) {
    json(response, 409, { ok: false, error: 'Une récupération WADI est déjà en cours.' });
    return;
  }

  busy = true;
  const child = spawn(process.execPath, [script], {
    cwd: root,
    env: { ...process.env },
    windowsHide: true,
  });
  let stdout = '';
  let stderr = '';
  child.stdout.on('data', (chunk) => { stdout += chunk.toString(); });
  child.stderr.on('data', (chunk) => { stderr += chunk.toString(); });
  child.on('close', (code) => {
    busy = false;
    let result = null;
    try {
      result = JSON.parse(stdout.trim().split(/\r?\n/).filter(Boolean).pop() || 'null');
    } catch {
      result = null;
    }
    if (code === 0 && result?.ok) {
      json(response, 200, result);
      return;
    }
    json(response, 502, {
      ok: false,
      error: result?.error || stderr.trim().slice(-1200) || `Récupération WADI échouée (code ${code}).`,
      result,
    });
  });
});

server.listen(port, host, () => {
  console.log(JSON.stringify({ ok: true, listening: `http://${host}:${port}`, at: new Date().toISOString() }));
});
