# Limites et éléments restants

## Terminé et vérifié

- Identité officielle TANAME CAR : logo, couleurs, connexion, navigation, PDF, erreurs.
- Schéma PostgreSQL des 27 entités + tables transverses.
- Import de 3 670 enregistrements avec identifiants et relations.
- 407 documents + 5 médias (412 références, 303 fichiers).
- Authentification, rôles, permissions, périmètres `own`, traçabilité interne.
- Tableau de bord, recherche globale, filtres instantanés, listes complètes virtualisées, exports CSV filtrés.
- CRUD Locations, Clients, Voitures, Paiements, Factures, Devis.
- CRUD générique pour les 20 autres entités.
- PDF contrat, facture, devis avec logo et pagination.
- Upload et téléchargement de documents clients, protégés par permissions.
- Recherche dynamique des clients (debounce, limite 20).
- Timeline de la fiche location.
- Import CSV avec prévisualisation, doublons, confirmation et journalisation.
- Notifications internes et centre de notifications.
- 29 tests backend / 164 assertions ; 7 parcours E2E Playwright.
- En-têtes de sécurité, rate limiting, fichiers privés.

## Partiel / à compléter

| Élément | État |
|---|---|
| Modèles PDF personnalisés (`template_html`) | PDF professionnels générés par vues Blade ; le moteur d'édition des modèles source n'est pas repris |
| 2FA | TOTP optionnelle (secret/otpauth, codes de récupération) ; pas de QR code généré |
| Notifications | Centre interne opérationnel ; pas de push/email temps réel |
| Emails | `MAIL_MAILER=log`, aucun envoi réel |
| WhatsApp | Entité conservée, aucun envoi |
| Équipes | Table conservée, pas d'écran |
| Entités/propriétés | Schéma statique, pas d'éditeur low-code |
| Portées `own` | Appliquées aux enregistrements avec `created_by` ; les enregistrements sans propriétaire restent non filtrables |
| Timeline | Fiche location ; pas de timeline globale par client/voiture |
| Réservations | CRUD générique, pas de workflow de conversion en contrat |
| Crédits voitures | CRUD générique, pas d'écran de suivi dédié |
| Maintenance | CRUD générique, pas de calcul automatique d'échéance |
| Performance | Listes complètes virtualisées, recherche client dynamique ; temps mesurés (clients 1,0 s desktop, 0,8 s mobile) ; pas de test de charge |
| Tests | 28 tests backend + 6 E2E ; pas de tests de charge ni de pentest |
| Déploiement | Aucun VPS, aucun déploiement public |
| Migration finale | Non exécutée ; source intacte |

## Non couvert volontairement

- Modules plateforme non utilisés (POS, stock, e-commerce, campagnes email/SMS, wallet, website builder).
- Services payants.
- Toute action sur l'application source.

## Finalisation 2026-11-09

- Persistance avant ouverture de session non installée : UAC refusé, tâche AtStartup non créée.
- Quick tunnel gratuit sans adresse stable.
- Sous-location non importée : historique expose 900 lignes, volume à valider.
- Facturation par sous-sections non refondue.
- Manipulation, Disponible, Case règlement non implémenté : consigne propriétaire vide.
- Nombre de clients de référence non fourni.
- Charge navigateur 20 sessions : 2 timeouts sur 1 436 requêtes, médiane 8,9 s, p95 20,1 s, à cause de la saturation du poste qui héberge aussi les navigateurs. Charge HTTP séparée disponible dans `private/LOAD-TEST-HTTP-15M.json`.

## Modules ajoutés 2026-11-09

- Agenda, charges, crédits locataires, bénéfice, sinistres.
- État global et bilan calculés sur les données réelles.
- Sauvegarde PostgreSQL depuis l'administration.
- Archivage et restauration des véhicules.
- Exclusion des archives des listes, compteurs et exports principaux.
- Menus Messagerie et Options exposés.
- Tests backend : 52 tests, 403 assertions.
- Playwright : 14 tests.
- axe-core : 0 violation sur 24 écrans.

## Reste partiel

- Envoi WhatsApp et email transactionnel non configuré.
- Éditeur de modèles PDF non repris.
- Conversion réservation vers contrat non automatisée.
- Prochaine échéance maintenance non calculée automatiquement.
- Timeline globale client et véhicule partielle.
- Actions de masse, duplication et impression non ajoutées.
- QR code 2FA non généré.
- Équipes conservées sans écran.


## Prochaines étapes recommandées

1. Générer un QR code pour la 2FA (secret et lien otpauth déjà fournis).
2. Reprendre ou valider les modèles PDF source (`template_html`).
3. Ajouter la timeline globale client/voiture.
4. Activer les emails transactionnels et WhatsApp avec identifiants fournis.
5. Renforcer les portées `own` pour les enregistrements sans `created_by`.
6. Ajouter tests de charge, audit d'intrusion et recette propriétaire.
7. Préparer le VPS, TLS, sauvegardes et migration finale.




## Finalisation 2026-11-09

- Réservation vers contrat : terminé et testé.
- Modèles PDF éditables : terminé et testé.
- Timeline client et véhicule : terminée.
- Prochaine échéance maintenance : calcul automatique des kilomètres et des mois.
- Duplication simple et en masse : terminée.
- Impression : terminée.
- QR code 2FA : généré depuis le lien otpauth.
- Équipes : interface de gestion terminée.
- Libellé « Réglement » et champ Caution : confirmés et ajoutés.
- Sous-location : 7 lignes manquantes identifiées, total 7 312 MAD, aucune donnée modifiée.
- Sauvegarde live restaurée sur base isolée : contrôles identiques.
