# TANAME CAR â€” application reconstruite

Application locale de gestion de location de voitures, reconstruite pour TANAME CAR avec son identité officielle.

## IdentitÃ©

- Logo officiel : `public/brand/login-logo.jpg`
- Bleu : `#1C6D9C`
- Vert : `#7EBA27`
- Bouton/accent : `#175171`
- Fond connexion : `#E2E8F0`

## Pile

- Laravel **13.40.0**
- PHP **8.5.12**
- Inertia.js **3.7** / React **19.3.1**
- TypeScript **7.0.2**
- Vite **8.3.6**
- Tailwind CSS **4.3.5**
- PostgreSQL **16.15**
- Playwright **1.56.1**

## DÃ©marrage rapide

```bash
composer install
cp .env.example .env
php artisan key:generate
# configurer DB_* dans .env
php artisan migrate --force
node scripts/import.mjs
npm ci
npm run build
php artisan serve
```

Les identifiants initiaux sont gÃ©nÃ©rÃ©s dans `storage/app/private/initial-credentials.txt` (non versionnÃ©).

## Tests

```bash
php artisan test --testsuite=Feature
npx tsc --noEmit
npm run build
npm run test:e2e
```

RÃ©sultats de rÃ©fÃ©rence : **39 tests backend / 347 assertions**, **9 parcours E2E**, build et TypeScript OK.

## Documentation

- `docs/INSTALLATION.md`
- `docs/UTILISATION.md`
- `docs/ADMINISTRATION.md`
- `docs/DEPLOIEMENT.md`
- `docs/SAUVEGARDE-RESTAURATION.md`
- `docs/MIGRATION.md`
- `docs/RECONCILIATION.md`
- `docs/SECURITE.md`
- `docs/LIMITES.md`
- `docs/EXPLOITATION-WINDOWS.md`

## PÃ©rimÃ¨tre

27 entitÃ©s, 296 champs, 3 670 enregistrements importÃ©s, 407 documents + 5 mÃ©dias (412 rÃ©fÃ©rences, 303 fichiers uniques).

Anomalies conservÃ©es : 304 contrats sans vÃ©hicule, 18 paiements Ã  0, 8 Ã©carts PayÃ©/Reste, doublons clients, rÃ©fÃ©rences 4/6 chiffres.

## SÃ©curitÃ©

Ne jamais committer `.env`, `storage/app/private`, `database/import` (donnÃ©es personnelles) ni les sauvegardes. Voir `docs/SECURITE.md`.

