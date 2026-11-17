# Installation

## 1. Pré-requis

| Composant | Version |
|---|---|
| PHP | 8.5 (repli 8.4) |
| Composer | 2.x |
| Node.js | 22.x (≥ 20.19 ou ≥ 22.12) |
| PostgreSQL | 16 |
| Extensions PHP | ctype, curl, dom, fileinfo, filter, hash, mbstring, openssl, pcre, pdo, pdo_pgsql, pgsql, session, tokenizer, xml, zip, gd, intl, opcache |

Vérification :

```bash
php -v
php -m
composer --version
node -v
psql --version
```

## 2. Base de données

```sql
CREATE ROLE tanamecar LOGIN PASSWORD 'mot-de-passe-fort';
CREATE DATABASE tanamecar OWNER tanamecar;
```

## 3. Application

```bash
composer install
cp .env.example .env
php artisan key:generate
```

Configurer `.env` :

```env
APP_NAME=TanameCar
APP_ENV=local
APP_DEBUG=true
APP_URL=http://127.0.0.1:8000
APP_LOCALE=fr
APP_TIMEZONE=Africa/Casablanca
APP_CURRENCY=MAD

DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=tanamecar
DB_USERNAME=tanamecar
DB_PASSWORD=...

SESSION_DRIVER=database
QUEUE_CONNECTION=database
CACHE_STORE=database
FILESYSTEM_DISK=local
MAIL_MAILER=log
HASH_DRIVER=bcrypt
```

## 4. Schéma et données

```bash
php artisan migrate --force
node scripts/import.mjs
```

L'import est **idempotent** (upsert par `id`) et conserve `legacy_payload`, `legacy_uid`, les lots d'import et les flags de qualité.

Les exports source doivent être présents dans `database/import/exports/` et les médias dans `storage/app/private/media/`.

## 5. Frontend

```bash
npm ci
npm run build
```

Pour le développement :

```bash
npm run dev
php artisan serve
```

## 6. Comptes initiaux

`storage/app/private/initial-credentials.txt` contient les comptes générés. **Ne pas versionner ce fichier.** Changer les mots de passe après la première connexion.

## 7. Vérification

```bash
php artisan test --testsuite=Feature
```

Attendu : **29 tests / 164 assertions**.

```bash
npx tsc --noEmit
npm run build
npx playwright test
```

Le test E2E utilise Chrome installé (`channel: 'chrome'`) et une base isolée `tanamecar_e2e`.

```bash
php artisan route:list
php artisan about
```

## 8. Dépannage

| Problème | Solution |
|---|---|
| `could not find driver` | Activer `pdo_pgsql` |
| `SQLSTATE[42703]` | Vérifier `php artisan migrate:fresh` puis réimport |
| `Vite manifest not found` | `npm run build` |
| `This password does not use Bcrypt` | Les hash doivent être `$2y$` ; régénérer via `scripts/fix-passwords.php` |
| CSP bloque un asset | Vérifier `SecurityHeaders` et l'origine |

Pour Playwright, definir E2E_PASSWORD dans l'environnement (ne jamais l'ecrire dans le code) puis lancer npx playwright test.

