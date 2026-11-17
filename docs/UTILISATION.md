# Guide utilisateur

## Connexion

- URL locale : `http://127.0.0.1:8000/login`
- Email + mot de passe.
- 5 tentatives échouées / 15 min.
- « Mot de passe oublié » envoie un lien dans le journal local (`MAIL_MAILER=log`), aucun email réel.

## Tableau de bord

Affiche :
- contrats en location, retours dépassés, voitures disponibles ;
- chiffre d'affaires facturé, paiements encaissés, montant des contrats ;
- dernières locations et retours à venir ;
- répartition des voitures.

Les compteurs sont calculés en temps réel (vue `v_dashboard_counters`).

## Locations

1. **Locations → Nouvelle location**.
2. Choisir client et voiture (le voiture peut rester vide : contrat incomplet).
3. Renseigner dates, lieux, kilométrages.
4. Tarif : prix/jour × nombre de jours ; le total se calcule automatiquement.
5. Première tranche : crée un paiement si le montant est > 0.
6. Enregistrer : la référence est générée, le voiture passe en **En location**.

### Retour

Ouvrir la location → **Enregistrer le retour** → saisir le km → **Réceptionner**.
Le voiture passe en **Disponible** et son km est mis à jour.

### Payé / Reste

La fiche affiche :
- **Payé calculé** = somme des paiements « Payé » ;
- **Payé enregistré** = valeur source ;
- **Reste calculé** et **Reste enregistré**.
Un écart est signalé sans modifier les valeurs enregistrées.

### PDF

Bouton **PDF contrat** : génère un PDF, l'enregistre et l'ajoute aux documents.

## Clients

- Création particulier/entreprise.
- Coordonnées, pièce d'identité, permis.
- Upload de documents (JPG, PNG, PDF, DOC, DOCX).
- Statut : actif, inactif, blacklisté, débiteur.
- Les doublons potentiels sont signalés, jamais fusionnés automatiquement.

## Voitures

- Fiche technique, statut, mode, tarif.
- Financement : maison de crédit, avance, traite, échéance.
- Les locations liées sont visibles.

## Paiements

- Sélection du contrat, montant, mode, statut.
- Les paiements à 0 sont conservés et visibles.

## Factures

- Liste avec totaux TTC/HT/TVA.
- Création avec lignes, TVA et totaux.
- PDF facture.
- Les factures source sont conservées avec leurs lignes.

## Devis

- Liste, création avec lignes, PDF.
- Module conservé : aucune donnée source.

## Réservations, maintenance, crédits, communication, WhatsApp, suivi, configurations

Ces modules sont accessibles via le menu ou les URLs `/data/{entité}`.
Ils sont conservés à l'identique ; les entités vides affichent un état explicite, sans données inventées.

## Recherche

Barre supérieure : contrats, clients, voitures, factures.

## Réglages

- **Utilisateurs** : création, rôle, activation/désactivation.
- **Rôles** : nom et permissions JSON.
- **Société** : nom, devise, fuseau, format de date, couleurs.

## Exports

Bouton **Exporter CSV** sur Locations, Clients, Voitures, Paiements, Factures. L'export reprend les filtres actifs et contient la totalité des lignes filtrées.

## Recherche dynamique des clients

Dans le formulaire de location, le champ client n'affiche plus les 2 023 clients. Saisissez au moins un caractère ; les 20 premiers résultats correspondants apparaissent après 250 ms. Sélectionnez le client pour renseigner la relation.

## Notifications

La cloche de la barre supérieure affiche les événements internes : création de location, retour, paiement, facture. Le centre de notifications permet de marquer un élément ou tout comme lu.

## Import CSV

**Réglages > Import** : choisissez Clients ou Voitures, sélectionnez un fichier CSV, lancez la prévisualisation, vérifiez les lignes importables/doublons/erreurs, puis confirmez. Aucun enregistrement existant n'est écrasé.

## Historique

La fiche location contient un onglet **Historique** listant les événements réellement enregistrés (création, modification, retour, suppression), avec utilisateur et date, sans adresse IP ni détail technique. Aucun événement n'est inventé.



## Double authentification

Dans Reglages > Securite, activez la 2FA, ajoutez le secret dans votre application d'authentification, confirmez avec un code, puis conservez les codes de recuperation.


## Menu utilisateur

Cliquez sur votre nom dans la barre supérieure pour ouvrir **Mon profil**, **Ajouter un utilisateur** (si vous êtes administrateur), **Sécurité (2FA)** et **Déconnexion**.

## Listes complètes et lignes cliquables

Les listes affichent tous les enregistrements, sans pagination. Le total est visible, les filtres sont instantanés, le tri par colonne est disponible et la liste utilise un défilement virtualisé. Cliquez n'importe où sur une ligne pour ouvrir la fiche ; les boutons d'action internes restent indépendants.

## Ajouter un utilisateur

Le formulaire demande le nom, l'e-mail, le rôle et le mot de passe. Le rôle administrateur est proposé par défaut. Le mot de passe peut être généré et reste affiché une seule fois. Le compte peut se connecter immédiatement ; la 2FA reste optionnelle.

## Menu Finance

Le groupe **Finance** de la barre latérale regroupe Devis, Factures, Paiements, Maintenance et Crédits voitures. Le libellé du groupe a été renommé ; l entité de données Suivi reste inchangée.

## Compteurs Locations et Voitures

- **Aujourd hui**, **Demain**, **Après-demain** : contrats non réceptionnés dont la date de retour tombe dans la journée correspondante, fuseau Africa/Casablanca. Les dates absentes et les contrats réceptionnés sont exclus.
- **Retours dépassés** : contrats non réceptionnés dont la date de retour est antérieure au début de la journée locale. Les dates absentes sont exclues.
- **En location** : contrats non réceptionnés.
- **Sous-location** : voitures dont le mode d exploitation est sous_location.
- **Disponibles** : voitures au statut disponible.
- **Locations** : voitures dont le mode d exploitation est location.

Chaque carte ouvre la liste filtrée correspondante et le compteur utilise la même portée de requête que la liste.

## Navigation supérieure et retours du mois

Les sections sont regroupées dans une barre supérieure avec menus déroulants. Le groupe Exploitation contient Locations, Réservations, Clients et Voitures. Le groupe Finance contient Devis, Factures, Paiements, Maintenance et Crédits voitures.

La page Locations affiche Retour dépassé, Retours du mois et En location. Retours du mois couvre du premier au dernier jour du mois en cours, en Africa/Casablanca, et ouvre la liste filtrée correspondante.

La liste Clients affiche l adresse de résidence. Les adresses et téléphones disponibles sont repris des fiches existantes, sans valeur inventée.

## Traites, amortissement, recapitulatif et rapport

- Finance > Traites : liste des echeances, fiche, syntheses historique, filtres, export CSV. Les valeurs enregistrees restent separees des valeurs modifiees.
- Finance > Amortissement : 49 fiches historique, valeurs enregistrees et modifiables, solde calcule, ecarts visibles.
- Recapitulatif a gauche : traites et retours, orange si proche, rouge si depasse, rafraichi toutes les 60 secondes.
- Finance > Rapport : operations avec utilisateur et date, sans adresse IP.
- Nouvelle location : selection explicite du client, affichage de son telephone et de son adresse, sans fusion automatique.
