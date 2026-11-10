# Déploiement Render Free — TANAME CAR

## Choix

- Plateforme : **Render Free**.
- Web service Docker : 512 Mo RAM, 0,1 CPU, HTTPS Render.
- PostgreSQL Free : 1 Go, 256 Mo RAM.
- Aucune carte bancaire, aucun abonnement, aucun dépassement automatique.
- Base cible : `tanamecar_demo_20261109`, jamais `tanamecar_live`.

## Limites Render Free

- Le service s’endort après 15 minutes sans trafic et se réveille en environ une minute.
- Le PostgreSQL gratuit expire 30 jours après sa création, avec 14 jours de grâce.
- Le disque local est éphémère. Les fichiers existants sont inclus dans l’image et les nouveaux fichiers sont aussi stockés dans la table PostgreSQL `stored_files`.
- 750 heures d’instance gratuites par mois.
- Render peut redémarrer le service sans préavis.

## Préparation déjà effectuée

- Image Docker : `Dockerfile`.
- Blueprint Render : `render.yaml`.
- Entrée Docker : `docker/entrypoint.sh`.
- Configuration Apache/PHP : `docker/apache.conf`, `docker/php.ini`.
- Export SQL isolé : `private/DEPLOIEMENT-RENDER-2026-11-10/tanamecar_demo_render.sql`.
- Clé applicative : `private/DEPLOIEMENT-RENDER-2026-11-10/APP_KEY.txt`.
- Les 328 fichiers existants sont stockés dans la table PostgreSQL `stored_files` ; l’image Docker ne contient aucun fichier client privé.
- Le dump a été testé dans une base temporaire : 2 028 clients, 1 091 locations, 33 échéances, 328 fichiers.

## Étapes nécessaires avec authentification personnelle

1. Se connecter à Render avec le compte du propriétaire.
2. Créer un dépôt Git privé contenant ce projet, ou utiliser le bouton Blueprint de Render.
3. Déployer `render.yaml`.
4. Renseigner `APP_KEY` avec la valeur du fichier privé `APP_KEY.txt`.
5. Attendre la création du service et de la base PostgreSQL.
6. Récupérer l’URL PostgreSQL externe dans Render.
7. Importer le dump :

```powershell
$env:DB_URL = "postgresql://..."
.\deploy\render\import-db.ps1 -DatabaseUrl $env:DB_URL
```

8. Redémarrer le service Render.
9. Vérifier l’URL HTTPS avec `deploy/render/verify.ps1`.
10. Communiquer l’URL et les identifiants de démonstration séparément.

## Après la démonstration

- Suspendre le service Render.
- Supprimer le service et la base si l’accès n’est plus nécessaire.
- Conserver le dump privé et les preuves.
- Ne jamais supprimer la base `tanamecar_live`.

## Fichiers à ne jamais publier

- `private/DEPLOIEMENT-RENDER-2026-11-10/APP_KEY.txt`
- `private/DEPLOIEMENT-RENDER-2026-11-10/tanamecar_demo_render.sql`
- `private/DEMO-ACCES.txt`
- Tout fichier `.env`.
