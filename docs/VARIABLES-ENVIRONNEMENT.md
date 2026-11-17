# Variables d'environnement

## Application

- `APP_NAME`
- `APP_ENV`
- `APP_KEY`
- `APP_URL`
- `APP_DEBUG`
- `APP_TIMEZONE`
- `APP_LOCALE`
- `APP_FALLBACK_LOCALE`

## Base de données

- `DB_CONNECTION`
- `DB_HOST`
- `DB_PORT`
- `DB_DATABASE`
- `DB_USERNAME`
- `DB_PASSWORD`
- `DB_DUMP_BINARY`
- `BACKUP_RETENTION_DAYS`

## Identité

- `BRAND_NAME`
- `BRAND_LOGO`
- `BRAND_PRIMARY`
- `BRAND_BLUE`
- `BRAND_ACCENT`
- `BRAND_FOOTER`

## Messagerie

- `MAIL_MAILER`
- `MAIL_HOST`
- `MAIL_PORT`
- `MAIL_USERNAME`
- `MAIL_PASSWORD`
- `MAIL_FROM_ADDRESS`
- `MAIL_FROM_NAME`

## Sessions et sécurité

- `SESSION_DRIVER`
- `SESSION_LIFETIME`
- `SESSION_SECURE_COOKIE`
- `SESSION_DOMAIN`

## Fichiers

- `FILESYSTEM_DISK`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_DEFAULT_REGION`
- `AWS_BUCKET`

## Sauvegarde

Le binaire `pg_dump` doit être accessible par `DB_DUMP_BINARY` ou par le `PATH` du serveur.
