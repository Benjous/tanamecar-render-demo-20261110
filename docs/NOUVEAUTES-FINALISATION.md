# Nouveautés de finalisation

## Réservations

- Bouton « Convertir en location » sur une réservation confirmée.
- Création du contrat avec référence, client, véhicule, dates, jours, tarif et total.
- Mise à jour du statut de la réservation et du véhicule.
- Blocage d'une seconde conversion.

## Modèles PDF

- Page « Modèles PDF » pour contrat, facture et devis.
- Édition du nom, du format, de l'orientation et du HTML.
- Variables disponibles : `reference`, `client`, `vehicle`, `departure_at`, `return_at`, `total_amount`, `paid`, `remaining`, `subtotal`, `vat`, `company`.
- Utilisation du modèle HTML si celui-ci contient des variables, sinon modèle PDF standard.

## Timeline

- Historique client : locations, paiements, factures, documents, actions.
- Historique véhicule : locations, maintenance, sinistres, crédits, actions.
- Affichage sur les fiches client et véhicule.

## Maintenance

- Calcul de `next_km` à partir de `current_km` et de l'intervalle du type.
- Calcul de `next_date` à partir de l'intervalle en mois du type lorsque la date est vide.

## Duplication et impression

- Duplication d'un enregistrement générique.
- Duplication en masse depuis la sélection.
- Duplication d'une location.
- Impression des fiches contrat, facture, devis, client, véhicule et fiche générique.

## Sécurité

- QR code généré à partir du lien otpauth 2FA.
- Secret et codes de récupération conservés.

## Équipes

- Création, modification et suppression d'équipes.
- Affectation des utilisateurs.
- Routes protégées par l'administration.

## Réglement

- Libellé source confirmé : onglet « Réglement ».
- Champs : Caution `Ch.`, `Visa`, `Passeport`, montant de caution, avance, date, reste.
- Le champ Caution est ajouté au formulaire de location sans modifier les montants existants.
