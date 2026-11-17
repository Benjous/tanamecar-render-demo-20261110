# Livraison TANAME CAR

## PrÃ©requis

- PHP 8.5 avec extensions Laravel.
- PostgreSQL 16 avec `pg_trgm`.
- Node.js 22 pour reconstruire les assets.
- `pg_dump` et `pg_restore` accessibles.
- Serveur web avec TLS.

## Installation

1. Copier le code source.
2. Copier `.env.example` vers `.env`.
3. Renseigner `APP_URL`, `APP_KEY`, `DB_*`, `BRAND_*`, `MAIL_*` et `DB_DUMP_BINARY`.
4. ExÃ©cuter `composer install --no-dev --optimize-autoloader`.
5. ExÃ©cuter `php artisan key:generate`.
6. ExÃ©cuter `php artisan migrate --force`.
7. ExÃ©cuter `npm ci` et `npm run build`.
8. ExÃ©cuter `php artisan config:cache`, `route:cache` et `view:cache`.
9. Configurer le serveur web sur le dossier `public`.
10. VÃ©rifier `/up`.

## Sauvegarde

- Page Administration, Sauvegarde, bouton Nouvelle sauvegarde.
- Commande de secours : `pg_dump -Fc -d base -f sauvegarde.dump`.
- Conserver les sauvegardes hors du serveur.
- VÃ©rifier le SHA-256 et tester la restauration.

## Restauration

1. CrÃ©er une base vide isolÃ©e.
2. ExÃ©cuter `pg_restore --no-owner --exit-on-error -d base sauvegarde.dump`.
3. VÃ©rifier les volumes et les sommes.
4. Basculer l'application aprÃ¨s validation.

## Tests

- `php artisan test`
- `npx tsc --noEmit`
- `npm run build`
- `npx playwright test`
- ContrÃ´le axe-core

## Dossiers

- `app` : application.
- `resources/js` : interface React.
- `resources/views` : vues et PDF.
- `database` : schÃ©ma et migrations.
- `docs` : documentation.
- `tests` : tests backend et navigateur.
- `public/build` : assets compilÃ©s.

## Interventions client restantes

- Valider les 2 028 clients synchronisés, dont les 5 nouveaux clients.
- Valider l'ajout des 7 lignes de sous-location manquantes, total 7 312 MAD.
- Valider le libellÃ© et l'usage de Â« RÃ©glement Â» et de la caution.
- Fournir les identifiants WhatsApp et email si les envois rÃ©els sont requis.
- Valider les modÃ¨les PDF.
- Fournir le domaine et le serveur dÃ©finitifs.

