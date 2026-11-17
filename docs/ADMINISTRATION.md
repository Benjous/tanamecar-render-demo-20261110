# Administration

## Utilisateurs et rôles

- **Administrateur** : accès complet, y compris réglages.
- **Gestion de contrat** : locations, clients, voitures (lecture), pas de paiements/factures/réglages.
- Un utilisateur inactif est déconnecté et bloqué.

Créer un utilisateur : **Réglages → Utilisateurs**.
Changer un mot de passe : **Mon profil** ou **Réglages > Utilisateurs**, champ « Mot de passe ».
Désactiver : bouton dédié ; impossible sur son propre compte.

## Permissions

Les permissions sont stockées dans `roles.permissions` (JSON) et vérifiées côté serveur :
- middleware `permission:{ressource},{action}` pour les modules cœur ;
- contrôle dynamique dans le contrôleur générique ;
- middleware `admin` pour les réglages.

Les portées `all`/`own` sont contrôlées côté serveur sur les clients et les locations. Les enregistrements sans `created_by` restent non filtrables (voir `LIMITES.md`).

## Séquences

Table `sequences` :
- `contracts` : 6 chiffres, prochaine valeur 20419 ;
- `invoices` : `{value}/{year}` ;
- `quotes`, `reservations`.

Modifier une séquence : SQL contrôlé ou futur écran d'administration. Ne jamais réutiliser une valeur historique.

## Paramètres société

`settings` (clé/valeur JSON) :
- `company.name`, `company.brand_name`, `company.currency`, `company.timezone`, `company.date_format` ;
- `theme.primary`, `theme.accent`.

## Traçabilité interne

`activity_log` : utilisateur, action, entité, ID, avant/après, IP, user-agent, date.
Non exposé dans l’interface client.

## Qualité des données

Tables :
- `data_quality_flags` : `CONTRACT_NO_VEHICLE`, `ZERO_PAYMENT`, `PAID_MISMATCH`, `DUPLICATE_CLIENT`, `DUPLICATE_PLATE` ;
- `potential_duplicate_groups` / `potential_duplicate_members` : rapprochements proposés, aucune fusion ;
- `import_batches` : lots d'import.

## Maintenance

- `php artisan optimize` en production.
- `php artisan queue:work` pour les files.
- `php artisan schedule:work` pour les tâches planifiées.
- Sauvegardes : voir `SAUVEGARDE-RESTAURATION.md`.

## Sécurité opérationnelle

- `APP_DEBUG=false` en production.
- `SESSION_SECURE_COOKIE=true`, `SESSION_ENCRYPT=true` derrière HTTPS.
- Restreindre l'accès aux réglages aux administrateurs.
- Ne jamais exposer `storage/app/private`.
- Changer les mots de passe initiaux.

## Import CSV

L'écran **Réglages → Import** permet d'importer des clients ou voitures depuis un CSV. Le fichier est d'abord prévisualisé ; les doublons et erreurs sont signalés. L'import ne s'exécute qu'après confirmation et ne met jamais à jour un enregistrement existant. Chaque import crée un lot dans import_batches et une entrée de traçabilité interne.

## Notifications

Les administrateurs reçoivent une notification interne lors d'une création de location, d'un retour, d'un paiement ou d'une facture. Le centre est accessible par la cloche de la barre supérieure.

## Permissions own

Les permissions own sont contrôlées côté serveur : un utilisateur non administrateur ne peut modifier ou supprimer que les clients/locations dont created_by correspond à son identifiant. Les lectures ll restent autorisées. Les enregistrements sans created_by ne sont pas filtrables par propriétaire.


## Double authentification

Chaque utilisateur peut activer la 2FA TOTP dans Reglages > Securite : un secret et un lien otpauth sont affiches, puis un code a 6 chiffres confirme l'activation. Huit codes de recuperation sont generes. La desactivation exige le mot de passe actuel.


## Menu utilisateur

Le nom de l'utilisateur connecté ouvre un menu : **Mon profil**, **Ajouter un utilisateur** (administrateurs), **Sécurité (2FA)** et **Déconnexion**. Le formulaire d'ajout crée un administrateur par défaut, avec mot de passe saisi ou généré, affiché une seule fois. Aucun e-mail réel n'est envoyé.

## Listes complètes

Les listes ne sont pas paginées. Elles chargent tous les enregistrements filtrés, affichent le total et utilisent une virtualisation avec en-tête collant. Le tri par colonne et les filtres instantanés sont disponibles. Les exports CSV reprennent les filtres actifs.
