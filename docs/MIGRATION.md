# Migration des données

## 1. Principe

- Source jamais modifiée.
- Import dans PostgreSQL local.
- Identifiants source conservés (`id`).
- `legacy_uid` et `legacy_payload` conservés.
- Upsert idempotent par `id`.
- Lots d'import (`import_batches`).
- Aucune correction silencieuse.

## 2. Préparation

Les exports doivent être présents dans :

```
database/import/exports/*.json
database/import/entities.json
database/import/account.json
database/import/permissions.json
database/import/users.json
database/import/media-manifest.json
storage/app/private/media/*
```

## 3. Exécution

```bash
php artisan migrate --force
node scripts/import.mjs
```

L'import :
1. crée l'organisation, les rôles, les utilisateurs, les permissions ;
2. importe les référentiels ;
3. importe clients, voitures, contrats, paiements, factures, lignes ;
4. importe les modèles, médias et documents ;
5. calcule les flags de qualité ;
6. crée les groupes de doublons potentiels ;
7. initialise les séquences.

## 4. Règles de conservation

| Anomalie | Traitement |
|---|---|
| 304 contrats sans voiture | `vehicle_id = null`, `data_quality_status = incomplete_vehicle`, flag |
| 18 paiements à 0 | `amount = 0`, flag |
| 8 écarts Payé/Reste | `paid_amount_recorded` source, calcul en vue |
| Doublons clients | groupes potentiels, aucune fusion |
| Références 4/6 | `reference` + `reference_format`, aucune renumérotation |
| Média `+` | chemin corrigé, SHA-256 |
| 7 entités vides | tables conservées |

## 5. Contrôles

```sql
select count(*) from contracts;      -- 1078
select count(*) from clients;        -- 2023
select count(*) from vehicles;       -- 81
select count(*) from payments;       -- 71
select count(*) from invoices;       -- 288
select sum(total_amount) from contracts; -- 2120609.00
select sum(amount) from payments;        -- 93268.00
select sum(total) from invoices;         -- 556345.50
select count(*) from contracts where vehicle_id is null; -- 304
select count(*) from payments where amount = 0;          -- 18
select count(*) from v_contract_financials where has_mismatch; -- 8
```

## 6. Migration finale (non exécutée)

1. Snapshot T0.
2. Import complet.
3. Réconciliation.
4. Delta par `updated_at`/`created_at`.
5. Gel court de la source.
6. Dernier delta + contrôles.
7. Bascule.
8. Rollback : source intacte, cible restaurable.

## 7. Retour arrière

- La source n'est jamais modifiée.
- La cible peut être détruite et recréée depuis les exports.
- Conserver les lots et les manifestes.
