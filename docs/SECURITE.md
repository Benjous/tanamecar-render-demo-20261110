# Sécurité

## Mesures implémentées

| Mesure | Détail |
|---|---|
| Authentification | Session Laravel, cookies HttpOnly, régénération après login |
| Hachage | Bcrypt 12 rounds (`HASH_DRIVER=bcrypt`) |
| Rate limiting | 5 tentatives / 15 min par email+IP |
| CSRF | Middleware Laravel sur les formulaires |
| Validation | Règles serveur (validate / contrôleurs) |
| RBAC | Rôles/permissions, middleware `permission` et `admin` |
| Périmètres `own` | Contrôle serveur sur modification/suppression clients et locations |
| Injections SQL | Eloquent / query builder paramétré |
| XSS | Échappement React/Blade |
| En-têtes | CSP, X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy, HSTS en production |
| CSP production | `script-src 'self'` sans `unsafe-inline` ; `unsafe-inline` conservé en local pour Vite |
| Fichiers privés | `storage/app/private`, routes authentifiées + contrôle par entité |
| Exports | Contrôlés par permission (`slv_contrats`, `slv_locataires`, etc.) |
| Imports | Validation, prévisualisation, doublons, confirmation, journalisation |
| Journalisation | `activity_log` (login, create, update, delete, return, import), non exposé dans l'interface client |
| 2FA | TOTP optionnelle, codes de récupération, désactivation par mot de passe |
| Audit | Journal conservé en base ; export développeur via `php artisan audit:export` |
| Notifications | Centre interne par utilisateur |
| Secrets | `.env` non versionné |
| Données de test | `DatabaseTransactions`, base E2E séparée |

## Points de vigilance

- 2FA TOTP optionnelle disponible (secret/otpauth, codes de récupération).
- CSP conserve `style-src 'unsafe-inline'` pour les styles React.
- Pas de test d'intrusion.
- Pas de chiffrement applicatif des pièces d'identité (stockage privé + ACL).
- Les enregistrements sans `created_by` ne peuvent pas être filtrés par périmètre `own`.
- `APP_DEBUG=true` en local uniquement ; passer à `false` en production.
- `MAIL_MAILER=log` : aucun email réel.
- Aucun service de paiement/WhatsApp activé.
- Les mots de passe initiaux doivent être changés.

## Recommandations production

1. HTTPS + HSTS.
2. `APP_DEBUG=false`.
3. `SESSION_SECURE_COOKIE=true`, `SESSION_ENCRYPT=true`.
4. Changer les mots de passe initiaux.
5. Restreindre l'accès SSH et les réglages.
6. Sauvegardes chiffrées, clés séparées.
7. Revue de code, test d'intrusion, 2FA.
8. Journalisation centralisée.
