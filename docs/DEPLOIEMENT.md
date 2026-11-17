# Déploiement

> Aucun déploiement public n'a été effectué. Aucun VPS n'était disponible.

## 1. Cible

- Ubuntu 24.04 LTS
- PHP 8.5 FPM + extensions
- PostgreSQL 16
- Nginx
- Node 22 (build uniquement)
- Supervisor/systemd pour la queue

## 2. Installation serveur

```bash
sudo apt update
sudo apt install nginx postgresql-16 php8.5-fpm php8.5-cli \
  php8.5-pgsql php8.5-mbstring php8.5-xml php8.5-curl php8.5-zip \
  php8.5-gd php8.5-intl php8.5-bcmath php8.5-opcache
```

## 3. Application

```bash
git clone <dépôt> /var/www/tanamecar
cd /var/www/tanamecar
composer install --no-dev --optimize-autoloader
cp .env.example .env
php artisan key:generate
# éditer .env
php artisan migrate --force
node scripts/import.mjs   # uniquement lors de la migration initiale
npm ci && npm run build
php artisan optimize
```

Permissions :

```bash
chown -R www-data:www-data storage bootstrap/cache
chmod -R 775 storage bootstrap/cache
```

## 4. Nginx

```nginx
server {
    listen 80;
    server_name tanamecar.example.tld;
    root /var/www/tanamecar/public;

    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";
    add_header Referrer-Policy "strict-origin-when-cross-origin";

    index index.php;
    charset utf-8;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ ^/index\.php(/|$) {
        fastcgi_pass unix:/run/php/php8.5-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
        fastcgi_buffer_size 32k;
        fastcgi_buffers 8 32k;
        fastcgi_busy_buffers_size 64k;
        fastcgi_hide_header X-Powered-By;
    }

    location ~ \.php$ { return 404; }
    location ~ /\.(?!well-known).* { deny all; }
}
```

HTTPS : Certbot/Let's Encrypt.

## 5. Variables de production

```env
APP_ENV=production
APP_DEBUG=false
INERTIA_DEVTOOLS_ENABLED=false
APP_URL=https://tanamecar.example.tld
SESSION_SECURE_COOKIE=true
SESSION_ENCRYPT=true
LOG_LEVEL=warning
MAIL_MAILER=smtp
MAIL_HOST=...
MAIL_PORT=587
MAIL_ENCRYPTION=tls
MAIL_USERNAME=...
MAIL_PASSWORD=...
```

## 6. Queue et scheduler

```ini
[program:tanamecar-worker]
command=php /var/www/tanamecar/artisan queue:work --sleep=3 --tries=3
autostart=true
autorestart=true
user=www-data
numprocs=2
```

Cron :

```cron
* * * * * www-data php /var/www/tanamecar/artisan schedule:run >> /dev/null 2>&1
```

## 7. Sécurité

- `APP_DEBUG=false`.
- Base non exposée publiquement.
- `storage` hors racine web.
- En-têtes CSP/HSTS via `SecurityHeaders` et Nginx.
- Sauvegardes chiffrées, clés séparées.
- Journalisation et supervision.
- Journal d'audit non exposé dans l'interface ; export réservé au développeur via `php artisan audit:export`.

## 8. Checklist de mise en production

- [ ] Domaine et TLS.
- [ ] `.env` production complet.
- [ ] `php artisan migrate --force`.
- [ ] Import initial + réconciliation.
- [ ] `npm run build`.
- [ ] Queue/scheduler actifs.
- [ ] Sauvegarde testée.
- [ ] Mots de passe initiaux changés.
- [ ] `APP_DEBUG=false`.
- [ ] Recette fonctionnelle.

## Assets d'identité

Le logo officiel est dans public/brand/login-logo.jpg. Il doit être déployé avec le code et rester accessible via /brand/login-logo.jpg. Les PDF l'embarquent en base64.

## Tests avant mise en ligne

Exécuter `php artisan test --testsuite=Feature`, `npx tsc --noEmit`, `npm run build` et, si Chrome est disponible, `npx playwright test` sur une base isolée. Ne pas exécuter les tests E2E sur la base de production.

