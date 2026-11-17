# RAPPORT GLOBAL - FINALISATION TANAME CAR

**Date :** 07/11/2026
**Statut :** application locale finalisée, importée, testée ; aucun déploiement public.

---

## 1. Identité visuelle officielle

Le logo officiel a été retrouvé dans les ressources du compte source (`stores/115/logo.jpeg`) et intégré sous `public/brand/login-logo.jpg`.

Couleurs relevées sur les ressources de référence :

| Usage | Couleur |
|---|---|
| Bleu logo | `#1C6D9C` |
| Vert logo / accent | `#7EBA27` |
| Boutons / texte fort | `#175171` |
| Fond connexion | `#E2E8F0` |
| Blanc cartes | `#FFFFFF` |

L'identité est appliquée Ã  la connexion, la barre latérale, les boutons, les liens, les tableaux, les états, les pages d'erreur et les PDF. La page de connexion reprend la composition du logiciel de référence (carte blanche centrée, logo officiel, champs, bouton `#175171`, pied de page TANAME CAR).

---

## 2. Pile technique

| Composant | Version |
|---|---|
| Laravel | 13.40.0 |
| PHP | 8.5.12 |
| Inertia Laravel | 3.7.0 |
| Inertia React | 3.11.0 |
| React | 19.3.1 |
| TypeScript | 7.0.2 |
| Vite | 8.3.6 |
| Tailwind CSS | 4.3.5 |
| PostgreSQL | 16.15 |
| dompdf | 3.1.6 |
| Playwright | 1.56.1 |

---

## 3. Données et réconciliation

| Entité | Importé |
|---|---:|
| Locations | **1 078** |
| Clients | **2 023** |
| Véhicules | **81** |
| Paiements | **71** |
| Factures | **288** |
| Lignes de facture | **320** |
| Maintenance | **1** |
| Collaborateurs | **2** |
| Prestations | **2** |
| Marques | **11** |
| Modèles | **40** |
| Couleurs | **31** |
| Catégories | **5** |
| Pays | **21** |
| Sources | **1** |
| Loueurs | **2** |
| Maisons de crédit | **5** |
| Types maintenance | **3** |
| Modèles contrat/facture/devis | **2 / 2 / 1** |
| **Total entités** | **3 670** |

### Sommes

| Indicateur | Valeur |
|---|---:|
| Contrats | **2 120 609,00 MAD** |
| Paiements | **93 268,00 MAD** |
| Factures | **556 345,50 MAD** |

### Médias

- **407 documents** + **5 médias** = **412 références**
- **303 fichiers uniques**, SHA-256 vérifiés

### Anomalies conservées

- **304** contrats sans véhicule (WAFA, import du 11/08/2026).
- **18** paiements Ã  0 MAD.
- **8** contrats avec écart Payé/Reste.
- **15** groupes de doublons nom+téléphone, **28** groupes nom, **17** groupes identité.
- **1** doublon de plaque.
- Références **4 chiffres (616)** et **6 chiffres (462)**.
- **7** entités vides conservées.

Aucune correction, fusion ou suppression.

---

## 4. Fonctionnalités livrées

### Terminées et vérifiées

- Connexion / déconnexion, mot de passe oublié (journal local), limitation des tentatives.
- Identité officielle et page de connexion.
- Tableau de bord temps réel.
- Recherche globale.
- **Locations** : liste, filtres, création, édition, retour, PDF, paiements, documents, historique.
- **Clients** : liste, fiche, création, édition, documents, historique de locations.
- **Véhicules** : liste, fiche, création, édition.
- **Paiements** : liste, création.
- **Factures** : liste, création avec lignes/TVA, PDF.
- **Devis** : liste, création avec lignes/TVA, PDF.
- **CRUD générique** : réservations, maintenance, crédits, collaborateurs, prestations, marques, modèles, pays, catégories, sources, couleurs, loueurs, maisons de crédit, types maintenance, modèles PDF, WhatsApp, communication, suivi, configurations.
- **Recherche dynamique des clients** dans le formulaire de location (plus de 2 023 options chargées).
- **Permissions `own`** : contrôle serveur sur modification/suppression des clients et locations ; admin conservé.
- **Timeline** sur la fiche location (création, modification, retour, suppression).
- **Import CSV** avec prévisualisation, validation, détection des doublons, confirmation et journalisation ; aucun écrasement.
- **Exports CSV** contrôlés par permissions.
- **Notifications internes** (création location, retour, paiement, facture) avec centre de notifications.
- **Documents privés** protégés par permissions.
- PDF contrat/facture/devis avec logo officiel, couleurs, totaux et pagination.
- Pages d'erreur 403/404/419/429/500 aux couleurs TanameCar.
- Rôles/permissions, utilisateurs, société, audit.

### Limites restantes

Voir `docs/LIMITES.md` :

- Modèles PDF personnalisés (`template_html`) non repris ; PDF générés par vues Blade professionnelles.
- 
- Pas d'envoi réel d'e-mails ni de WhatsApp (structures conservées, aucun service activé).
- Équipes et éditeur d'entités/propriétés non repris.
- Pas de tests de charge ni de pentest.
- Pas de déploiement public/VPS.
- Migration finale/delta non exécutée ; source intacte.

---

## 5. Tests exécutés

### Backend

```bash
php artisan test --testsuite=Feature
```

**29 tests, 164 assertions - PASS.**

### Frontend

```bash
npx tsc --noEmit
npm run build
```

**0 erreur TypeScript ; build Vite OK.**

### E2E navigateur

```bash
npx playwright test
```

**7 parcours complets - PASS** (connexion, tableau de bord, recherche, fiche location, PDF, création location, paiement, responsive 390Ã-844, déconnexion, absence d'erreurs console).

### Sécurité des dépendances

```bash
composer audit
npm audit --omit=dev
```

**0 vulnérabilité signalée.**

### Vérifications manuelles

Dashboard, locations, clients, véhicules, paiements, factures, devis, données génériques, réglages, import, notifications, recherche, PDF, export, page 404.

---

## 6. Sécurité

- Sessions Laravel, cookies HttpOnly, régénération après login.
- Bcrypt 12 rounds.
- Rate limiting 5/15 min.
- CSRF.
- RBAC serveur (`permission`, `admin`) + périmètres `own`.
- Validation serveur.
- RequÃªtes paramétrées.
- CSP, X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy, HSTS en production.
- En production, `script-src 'self'` sans `unsafe-inline` ; en local, `unsafe-inline` pour le HMR Vite.
- Fichiers privés et routes authentifiées ; contrôle des documents.
- Exports contrôlés par permission.
- Audit des actions sensibles.
- `.env`, données privées et credentials hors Git.

Résidus : pas de pentest, portées `own` non appliquées aux enregistrements sans `created_by`.

---

## 7. Performances

- Listes paginées Ã  25.
- Recherche client dynamique avec limite de 20 résultats et debounce 250 ms.
- Calculs financiers et compteurs en vues SQL.
- Index sur références, clients, véhicules, dates, statuts.
- `contracts/create` ne charge plus les 2 023 clients.
- Aucun test de charge exécuté.

---

## 8. Préparation production

PrÃªt :
- `.env.example` ;
- migrations ;
- configuration Nginx/PHP-FPM documentée ;
- sauvegarde/restauration ;
- en-tÃªtes de sécurité ;
- tests ;
- assets officiels.

À finaliser :
- VPS, domaine, TLS ;
- import final/delta ;
- changement des mots de passe initiaux ;
- `APP_DEBUG=false` ;
- `SESSION_SECURE_COOKIE=true`, `SESSION_ENCRYPT=true` ;
- sauvegardes opérationnelles ;
- recette propriétaire.

---

## 9. Livrables

Dossier **`tanamecar-livraison-2026-11-07`** :

| Fichier | Contenu |
|---|---|
| `tanamecar-source-2026-11-07.zip` | Code source complet |
| `tanamecar-db-2026-11-07.dump` | Sauvegarde PostgreSQL |
| `tanamecar-media-2026-11-07.zip` | 303 médias |
| `tanamecar-import-2026-11-07.zip` | Exports d'import (privé) |
| `RAPPORT-FINAL.md` | Rapport global |
| `docs/` | Documentation complète |
| `manifest-sha256.txt` | Empreintes |
| `initial-credentials.txt` | Comptes initiaux (privé) |

---

## 10. Actions du propriétaire

1. Tester l'application locale et valider les écrans.
2. Changer les mots de passe initiaux.
3. Fournir VPS/domaine et accès.
4. Fournir les paramètres SMTP (sans mot de passe en clair).
5. Valider les modèles PDF attendus.
6. Décider du sort des 7 entités vides.
7. Planifier la migration finale et le gel court.
8. Valider la recette avant déploiement.

---

**Conclusion :** l'application locale est fonctionnelle, testée, alignée sur l'identité officielle TANAME CAR, avec les 3 670 enregistrements, les 303 médias et les anomalies préservées. Les éléments non réalisables sans dépendance externe ou hors périmètre sont documentés sans Ãªtre présentés comme terminés.



---

## 11. Accès local

- Application : `C:\Users\hp\tanamecar-app`
- URL locale : `http://127.0.0.1:8000`
- Base principale : PostgreSQL 16, port 5433, base `tanamecar`
- Base E2E isolée : `tanamecar_e2e` (tests navigateur)
- Identifiants initiaux : `storage/app/private/initial-credentials.txt` (privé)
- Livraison : `C:\Users\hp\Documents\Projet par défaut\tanamecar-livraison-2026-11-07`

Aucune modification de l'application source. Aucun déploiement public. Aucun achat.



- **2FA TOTP optionnelle** : activation, confirmation, codes de récupération, désactivation par mot de passe.



---

## 12. Mise à jour finale

- Barre latérale bleu foncé avec logo officiel sur plaque blanche et accent vert.
- Palette centralisée dans `resources/js/lib/theme.ts` et variables Tailwind.
- Listes complètes sans pagination, virtualisées avec TanStack Virtual, en-têtes collants, tri par colonne.
- Lignes entièrement cliquables avec lien réel, actions internes protégées.
- Filtres instantanés avec debounce de 280 ms.
- Menu utilisateur : Mon profil, Ajouter un utilisateur, Sécurité (2FA), Déconnexion.
- Création d’un second administrateur avec génération de mot de passe et validation serveur.
- Audit retiré de l’interface client ; journal conservé et exportable par `php artisan audit:export`.
- Timeline métier sans IP ni détail technique.
- Aucun tiret long dans l’interface, les traductions, les vues PDF et la documentation.


---

## 13. Vérification finale

| Contrôle | Commande | Résultat |
|---|---|---|
| Backend | `php artisan test --testsuite=Feature` | 29 tests, 164 assertions, PASS |
| TypeScript | `npx tsc --noEmit` | 0 erreur |
| Build | `npm run build` | OK, avertissement de taille de chunk |
| E2E | `npx playwright test` | 7 parcours, 7 PASS |
| Dépendances PHP | `composer audit` | 0 avis de sécurité |
| Dépendances JS | `npm audit --omit=dev` | 0 vulnérabilité |

### Volumes vérifiés

- 1 078 locations, 2 023 clients, 81 voitures, 71 paiements, 288 factures.
- 407 documents et 5 médias, 303 fichiers.
- 3 670 enregistrements au total.
- Sommes : contrats 2 120 609,00 MAD, paiements 93 268,00 MAD, factures 556 345,50 MAD.
- Anomalies conservées : 304 contrats sans voiture, 18 paiements à 0, 8 écarts Payé/Reste, doublons clients, références 4/6 chiffres, 7 entités vides.

### Performance des listes

Mesures sur base E2E, trois passages, virtualisation active :

| Liste | Desktop 1280 px | Mobile 390 px |
|---|---:|---:|
| Clients (2 023) | 1,0 s | 0,8 s |
| Locations (1 086) | 1,4 s | 0,9 s |
| Factures (288) | 0,5 s | 0,4 s |

### Captures

`storage/app/private/e2e/login-mobile.png`, `dashboard-desktop.png`, `dashboard-mobile.png`, `clients-desktop.png`, `client-detail.png`, `contract-form-tablet.png`, `clients-mobile.png`.

### Non réalisé

- Aucun déploiement public, faute de VPS, domaine et accès SSH.
- Aucun envoi SMTP ou WhatsApp réel, faute d'identifiants.
- Pas de QR code 2FA, le secret et le lien otpauth sont fournis.
- Les modèles PDF source `template_html` ne sont pas repris ; les PDF Blade sont utilisés.
- Aucune décision sur les 7 entités vides.
- Migration finale, delta et gel court non exécutés ; la source reste intacte.
- Pas de test de charge ni de pentest.
- Pas de seconde copie chiffrée sur disque externe.


---

## 14. Corrections Locations et Voitures

- Cartes Aujourd hui, Demain et Après-demain reliées à un filtre due visible et à la même portée Eloquent que les listes.
- Fuseau Africa/Casablanca, exclusion des contrats réceptionnés et des dates absentes.
- Cartes Voitures Sous-location, Disponibles et Locations ajoutées, avec compteurs partagés et liens filtrés.
- Groupe de navigation Suivi renommé Finance, sans modifier l entité de données Suivi.


---

## 15. Évolutions source métier

- Inventaire source métier en lecture seule, 31 sections consultées.
- Base de préparation séparée tanamecar_prep_source avec 305 conducteurs actifs.
- Navigation supérieure avec menus groupés, renommage Voitures, adresse de résidence dans la liste Clients.
- Remplacement des cartes Aujourd hui, Demain et Après-demain par Retours du mois.
- Sous-location, rapport métier, récapitulatif et amortissement non repris dans cette phase. Le module Traites est livré séparément à la section 16.
La baisse de 173 à 164 assertions sur 29 tests vient de la consolidation du test des cartes Locations : les trois buckets Aujourd hui, Demain et Après-demain ont été remplacés par le seul bucket Retours du mois, avec moins d assertions redondantes.

## 16. Module Traites, 2026-11-09

- source métier, 49 voitures et 49 synthèses ouvertes par l’interface. Import privé puis live : 49 synthèses et 378 traites payées, somme enregistrée 2 213 911,33 MAD.
- Rapprochement par matricule normalisé contre plaque et CPI WW : 44 voitures liées sans ambiguïté, 5 synthèses non rapprochées, aucune traite individuelle orpheline.
- Calculs contrôlés : 25 sur 25 totaux avec mensualité positive concordent; mois payés et restants concordent sur 49 synthèses; montant payé concorde sur 49. Dix exceptions de total à mensualité zéro sont conservées et détaillées dans `private/INVENTAIRE-SOURCE/traites-ecarts-valeurs.md`.
- Import sans écrasement : clé historique composite voiture source métier et rang de ligne, car l’écran ne montre pas d’identifiant individuel de traite. Montants, dates, descriptions et statuts source sont conservés séparément des valeurs modifiables.
- Tests : 39 tests backend, 347 assertions, PASS; 9 tests Playwright, PASS; TypeScript sans erreur; build OK avec avertissement de taille de bundle.
- Instance live locale testée : liste 378 lignes, 49 synthèses, fiches et absence d’IP visibles vérifiées. Vérification publique bloquée : DNS du lien trycloudflare en échec et tunnel signalant « Tunnel not found ». Tunnel non redémarré.
- Seuil orange de 30 jours configuré pour les saisies non payées. Aucun seuil de proximité n'a été visible dans les écrans source métier consultés; ce seuil d'application reste à confirmer. Les mois non payés source métier sont agrégés sans dates individuelles, donc aucune échéance historique n'a été fabriquée.

## 17. Finalisation 2026-11-09

- Serveur : Caddy 2.11.9 vérifié par SHA-256, 20 workers php-cgi avec OPcache, caches de production. Ancien `artisan serve` arrêté.
- Persistance utilisateur : tâche `TANAMECAR-Availability-User` à l'ouverture de session et raccourci Démarrage. La tâche AtStartup administrateur a été refusée par UAC, sans contournement. Le site ne redémarre donc pas avant l'ouverture de session Windows.
- Watchdog : arrêt forcé de Caddy, retour local en 26,4 s. Arrêt forcé de cloudflared, nouvelle URL et retour public en 48,1 s.
- Veille et hibernation secteur désactivées; annulation dans `private/POWERCFG-TANAME.md`.
- URL au moment du rapport : https://roy-command-controllers-fellowship.trycloudflare.com.
- Listes : composant partagé avec virtualisation, texte 15 px, filtres par colonne, tri, total collant et restauration du défilement. Clients : première ligne entre 0,78 et 1,11 s via le tunnel public. Filtre 60 à 63 ms. Tri 53 à 151 ms. Zooms 50 à 200 % et quatre largeurs : 24 combinaisons PASS.
- Charge navigateur 20 sessions, 15 minutes : 1 436 requêtes, médiane 8,9 s, p95 20,1 s, 2 timeouts. Cause principale : 20 instances Chrome sur le même PC, saturation CPU et mémoire.
- Charge HTTP 20 sessions, 15 minutes propres : 5 705 requêtes, médiane 462 ms, p95 1 253 ms, 1 connexion reset et 40 réponses Cloudflare 530, aucun timeout. Pilote de 3 minutes : 1 049 requêtes, 0 erreur, médiane 668 ms, p95 2 646 ms.
- Amortissement : 49 fiches importées, 44 rapprochées, 5 non rapprochées. Totaux enregistrés : revenu 3 773 987,00; crédit 1 871 832,27; solde 1 902 154,73; prix 6 794 673,40; reste 3 045 186,12 MAD. Solde calculé = revenu - crédit, 49/49, aucune exception.
- Récapitulatif gauche et rapport métier livrés. Préremplissage adresse et téléphone par sélection explicite livré, sans fusion.
- Sous-location non importée : source métier expose 900 lignes, pas 7. Le volume doit être validé avant import.
- Facturation par sous-sections non refondue. Manipulation, Disponible, Case règlement non implémenté faute de consigne. Nombre de clients de référence non fourni.
- Volumes live : 1 078 locations, 2 023 clients, 81 voitures, 71 paiements, 288 factures, 378 traites, 49 amortissements. Sommes et anomalies inchangées.


## 18. Addendum, tableau des 14 consignes

| # | Consigne | Statut | Preuve et tentatives |
|---|---|---|---|
| 1 | Sections en haut | Fait et testé | Barre supérieure groupée, menus clavier et mobile, test Playwright responsive. |
| 2 | Adresse de résidence visible | Fait et testé | Colonne Adresse de résidence dans la liste Clients, test E2E et capture. |
| 3 | Vérification du nombre de clients | Fait par interprétation, à valider | Page Contrôle des volumes : 2 023 en direct, référence 2 025 modifiable, écart -2, simulation et import avec doublons. Tentatives : comparaison live, rapprochement 305 conducteurs, outil d’import. Référence propriétaire encore attendue. |
| 4 | Remplissage automatique adresse et téléphone | Fait et testé | Recherche insensible aux accents et à la casse, tolérance aux fautes, téléphone et dernière location pour les homonymes, remplissage du formulaire client. Écran de rapprochement des 305 conducteurs avec création sur confirmation. |
| 5 | Manipulation, Disponible, Case règlement | Fait par interprétation, à valider | Menus source métier inspectés, Disponible contient 48 voitures, aucun libellé Case règlement trouvé. Page interprétée avec Manipulation, Disponible et reste à payer, sans écriture comptable automatique. |
| 6 | Retours du mois | Fait et testé | Carte due=month, bornes Africa/Casablanca, compteur égal au nombre de lignes. |
| 7 | Aération à tout zoom | Fait et testé | 24 combinaisons 50 à 200 % sur 1920, 1366, 768 et 390 px, aucun débordement. |
| 8 | Sous-location complète | Non fait | Tentative A : 7 fiches détail, insuffisant. Tentative B : 900 lignes lues, 900 identifiants uniques, total 1 239 096 contre 1 246 408 au pied source métier, écart 7 312. Tentative C : dédoublonnage et contrôle des sommes, prix, bénéfice, avance et crédit concordent, total non cohérent. Import refusé. |
| 9 | Rapport avec utilisateur modificateur | Fait et testé | Finance > Rapport, utilisateur et date, aucune IP, test E2E. |
| 10 | Voitures au lieu de Véhicules | Fait et testé | Navigation, titres, filtres, PDF et tests. |
| 11 | Récapitulatif à gauche orange et rouge | Fait et testé | Panneau gauche, seuil 30 jours à valider, rafraîchi 60 s, liens filtrés, compteur égal aux lignes. |
| 12 | Facturation avec sous-sections | Fait par interprétation, à valider | Page Facturation avec Contrat, Facturation, Profil société et Versions et mises à jour. Aucune fonction métier inventée. |
| 13 | Tableau d’amortissement | Fait et testé | 49 fiches importées, 44 rapprochées, 5 non rapprochées, solde calculé 49/49, écarts visibles. |
| 14 | Traites | Fait et testé | 378 traites, 2 213 911,33 MAD, 49 synthèses, 5 non rapprochées, tests backend et E2E. |

### Innovations

Aucune innovation bornée n’a été ajoutée. Le temps a été consacré aux 14 consignes et aux tests, conformément à la priorité demandée.

### Tests et mesures

- Backend : 43 tests, 364 assertions, PASS.
- Playwright : 10 tests, 10 PASS.
- TypeScript : 0 erreur.
- Build : OK, avertissement de taille de chunk.
- Charge HTTP 20 sessions, 15 minutes : 5 705 requêtes, médiane 462 ms, p95 1 253 ms, 1 reset, 40 réponses Cloudflare 530, aucun timeout applicatif.
- Charge navigateur 20 sessions : 1 436 requêtes, médiane 8,9 s, p95 20,1 s, 2 timeouts, saturation du poste.
- URL actuelle : https://roy-command-controllers-fellowship.trycloudflare.com.
- Volumes live : 1 078 locations, 2 023 clients, 81 voitures, 71 paiements, 288 factures, 378 traites, 49 amortissements. Sommes et anomalies inchangées.

### À fournir par le propriétaire

1. Nombre de clients de référence.
2. Description du parcours Manipulation, Disponible, Case règlement.
3. Validation du volume et du total de sous-location.
4. Domaine et jeton Cloudflare pour une URL stable.
5. Session administrateur pour le démarrage avant ouverture de session.
6. Priorité pour les innovations et la refonte Facturation.

---

## 19. Corrective 2026-11-09 - thème clair et interface sans texte explicatif

**Fait et prouvé**

- Thème clair uniquement : fond page gris très clair, cartes, tableaux et formulaires blancs, textes gris très foncé. `color-scheme: light`, aucune bascule clair/sombre, aucun `prefers-color-scheme`, aucun script de thème chargé.
- Sous-titres de page, notes de tableaux, bandeaux d'information et mentions de synchronisation ou d'interprétation retirés de l'interface. États vides limités à « Aucun résultat » et au bouton de création.
- Test de contrôle des textes explicatifs et des mentions tierces.
- axe-core WCAG 2.2 AA : zéro violation de contraste sur 17 écrans, dont connexion, tableau de bord, clients, locations, voitures, paiements, factures, devis, traites, amortissements, sous-locations, rapport, notifications, archivage, système de design, formulaires et rapprochement.
- 48 captures clair dans `private/e2e/light` : 8 écrans à 390, 768, 1366, 1920 et 2560 px, plus tableau de bord et clients à 50, 100, 150 et 200 % de zoom. Zéro débordement horizontal.
- Backend sur clone isolé : 47 tests, 379 assertions, PASS. Playwright : 14 tests, 14 PASS. TypeScript : 0 erreur. Build : OK.
- Live synchronisé, manifeste identique au build testé, `/up` répond 200. Menus publics testés sur l'URL actuelle.
- Volumes et sommes inchangés : 1 078 locations, 2 023 clients, 81 voitures, 71 paiements, 288 factures, 378 traites, 49 amortissements, 900 sous-locations, 305 conducteurs. Sommes 2 120 609,00 / 93 268,00 / 556 345,50 MAD ; traites 2 213 911,33 MAD.

**Non fait**

- Aucun domaine permanent ni jeton Cloudflare fourni : URL quick tunnel actuelle conservée.
- Démarrage avant ouverture de session : tâche AtStartup toujours refusée par UAC.

**URL actuelle**

https://roy-command-controllers-fellowship.trycloudflare.com

---

## 20. Complétude 2026-11-09

**Données**

- 27 entités, 296 champs mappés, 3 670 enregistrements.
- 412 références de médias, 407 documents, 5 médias, 303 fichiers, aucun fichier manquant.
- Relations contrôlées : aucune référence orpheline.
- Sommes conservées : contrats 2 120 609,00 MAD, paiements 93 268,00 MAD, factures 556 345,50 MAD, traites 2 213 911,33 MAD.
- Anomalies conservées : 304 locations sans voiture, 18 paiements à zéro, 8 écarts payé/reste, doublons et entités vides.

**Fonctionnalités ajoutées**

- Agenda, charges, crédits locataires, bénéfice, sinistres.
- État global et bilan calculés sur les données réelles.
- Sauvegarde PostgreSQL depuis l'administration.
- Archivage et restauration des véhicules.
- Exclusion des archives des listes, compteurs et exports principaux.
- Menus Messagerie et Options.

**Tests**

- Backend sur clone isolé : 52 tests, 403 assertions, PASS.
- Playwright : 14 tests, 14 PASS.
- axe-core : 0 violation sur 24 écrans.
- TypeScript : 0 erreur. Build : OK.

**Partiel**

- Envoi WhatsApp et email transactionnel non configuré.
- Éditeur de modèles PDF non repris.
- Conversion réservation vers contrat non automatisée.
- Prochaine échéance maintenance non calculée automatiquement.
- Timeline globale client et véhicule partielle.
- Actions de masse, duplication et impression non ajoutées.
- QR code 2FA non généré.
- Équipes conservées sans écran.

**URL actuelle**

https://roy-command-controllers-fellowship.trycloudflare.com


---

## 21. Finalisation 2026-11-09

**Verdict**

- Développement local prêt pour validation client.
- Mise en production publique non prête : domaine, serveur et autorisation de synchronisation live requis.
- Instance live inchangée pendant cette mission.

**Terminé et testé**

- Conversion réservation vers contrat.
- Éditeur de modèles PDF.
- Timeline client et véhicule.
- Calcul des prochaines échéances de maintenance.
- Duplication simple et en masse.
- Impression.
- QR code 2FA.
- Gestion des équipes.
- Libellé « Réglement » et champ Caution.

**Données**

- 27 entités, 296 champs, 3 670 enregistrements.
- 412 références, 407 documents, 5 médias, 303 fichiers.
- 0 fichier manquant, 0 relation orpheline contrôlée.
- Sommes et anomalies conservées.

**Tests**

- Backend : 61 tests, 438 assertions, PASS.
- Playwright : 15 tests, 15 PASS.
- TypeScript : 0 erreur. Build : OK.
- axe-core : 0 violation sur 26 écrans.
- Restauration isolée : volumes et sommes identiques.

**Reste à valider**

- 7 lignes de sous-location manquantes, total 7 312 MAD.
- Identifiants WhatsApp et email.
- Modèles PDF définitifs.
- Domaine et serveur.
- Autorisation de synchronisation live.

**Lien actuel**

https://roy-command-controllers-fellowship.trycloudflare.com

---

## 22. Professionnalisation 2026-11-09

**Interface**

- Listes compactes sur une ligne, contenu 13 px, en-têtes 11 px, lignes 40 à 43 px.
- Colonnes masquables et mémorisées.
- Barre de navigation secondaire persistante.
- 80 contrôles responsive de 1920 à 375 px, 0 débordement global.
- 28 captures finales à 1366 et 390 px.

**Tests**

- Backend : 61 tests, 438 assertions, PASS.
- Playwright : 15 tests, 15 PASS.
- axe-core : 0 violation sur 26 écrans.
- TypeScript : 0 erreur. Build : OK.

**Données**

- 27 entités, 296 champs, 3 670 enregistrements.
- 412 références, 407 documents, 5 médias, 303 fichiers.
- Aucune donnée live modifiée.
- Source externe inaccessible sans identifiant : 2 023 clients présents, 2 028 annoncés, 5 manquants.
- 7 lignes de sous-location manquantes, 7 312 MAD, non importées.

**Démonstration**

- URL temporaire : https://roy-command-controllers-fellowship.trycloudflare.com
- Compte de démonstration : `private/DEMO-ACCES.txt`.

**Verdict**

NON PRÊT POUR LIVRAISON OFFICIELLE tant que les 5 clients et le lien permanent ne sont pas fournis. Version prête pour recette UI.


---

## 23. Synchronisation finale des données 09 novembre 2026

- Source consultée en lecture seule avec les identifiants fournis.
- 2 028 clients, 1 091 locations, 312 factures, 72 paiements, 3 713 enregistrements.
- Sommes : contrats 2 145 389,00 MAD, paiements 95 268,00 MAD, factures 595 176,50 MAD.
- 431 documents, 5 médias, 436 références, 328 chemins physiques.
- 378 traites, 49 amortissements, 900 sous-locations, 305 conducteurs.
- Anomalies conservées : 304 locations sans véhicule, 18 paiements à zéro, 8 écarts.
- 7 lignes de sous-location non importées, 7 312 MAD, en attente de validation.
- Système d'échéances automobiles : 33 alertes réelles, 1 proche, 1 à jour, 1 traitée, 3 enregistrements de démonstration.
- Backend : 70 tests, 479 assertions. Playwright : 16 tests. axe-core : 0 violation sur 27 écrans.
- Démonstration : https://roy-command-controllers-fellowship.trycloudflare.com

