# Réconciliation finale

## Volumes importés

| Entité | Attendu | Importé |
|---|---:|---:|
| Locations | 1 078 | 1 078 |
| Clients | 2 023 | 2 023 |
| Voitures | 81 | 81 |
| Paiements | 71 | 71 |
| Factures | 288 | 288 |
| Lignes de facture | 320 | 320 |
| Maintenance | 1 | 1 |
| Collaborateurs | 2 | 2 |
| Prestations | 2 | 2 |
| Marques | 11 | 11 |
| Modèles | 40 | 40 |
| Couleurs | 31 | 31 |
| Catégories | 5 | 5 |
| Pays | 21 | 21 |
| Sources | 1 | 1 |
| Loueurs | 2 | 2 |
| Maisons de crédit | 5 | 5 |
| Types maintenance | 3 | 3 |
| Modèles contrat | 2 | 2 |
| Modèles facture | 2 | 2 |
| Modèles devis | 1 | 1 |
| **Total entités** | **3 670** | **3 670** |

## Sommes

| Indicateur | Source | Cible |
|---|---:|---:|
| Contrats | 2 120 609,00 MAD | 2 120 609,00 MAD |
| Paiements | 93 268,00 MAD | 93 268,00 MAD |
| Factures | 556 345,50 MAD | 556 345,50 MAD |

## Médias

| Indicateur | Valeur |
|---|---:|
| Références | 412 |
| Documents importés | 407 |
| Médias (pièces jointes) | 5 |
| Fichiers uniques | 303 |

## Anomalies conservées

| Anomalie | Nombre |
|---|---:|
| Contrats sans voiture | 304 |
| Paiements à 0 | 18 |
| Écarts Payé/Reste | 8 |
| Doublons clients (nom+téléphone) | 15 groupes |
| Doublons nom | 28 groupes |
| Doublons identité | 17 groupes |
| Doublon plaque | 1 |
| Entités vides | 7 |

## Tests automatiques

`php artisan test --testsuite=Feature` : **29 tests, 164 assertions**, tous passés.
`npx playwright test` : **7 parcours E2E complets**, passé.
`npx tsc --noEmit` et `npm run build` : OK.

Couverture :
- authentification et redirections ;
- permissions admin / non-admin ;
- création de location + paiement + statut voiture ;
- retour + km + statut ;
- facture + TVA + totaux ;
- devis + totaux ;
- CRUD générique ;
- PDF contrat ;
- téléchargement média ;
- recherche globale ;
- filtres ;
- export CSV ;
- pages des entités vides ;
- upload document client ;
- paramètres société ;
- réconciliation des volumes et sommes.

