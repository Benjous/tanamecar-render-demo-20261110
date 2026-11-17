# Sauvegarde et restauration

## 1. Base PostgreSQL

```bash
pg_dump -Fc -U tanamecar -d tanamecar -f tanamecar-$(date +%F).dump
```

Restauration :

```bash
createdb -U tanamecar tanamecar_restore
pg_restore -U tanamecar -d tanamecar_restore --clean --if-exists tanamecar-YYYY-MM-DD.dump
```

## 2. Médias

```bash
tar -czf tanamecar-media-$(date +%F).tar.gz storage/app/private/media
```

Les 303 fichiers sont identifiés par SHA-256 dans `storage/app/private/media/manifest-media.json` (ou l'inventaire d'audit).

## 3. Chiffrement

- AES-256-GCM ou 7-Zip AES-256.
- Clé **hors** du dossier de sauvegarde.
- Vérifier par déchiffrement + SHA-256.
- Ne jamais copier la clé avec l'archive.

## 4. Fréquence

| Élément | Fréquence | Rétention |
|---|---|---|
| Base | quotidienne | 30 jours |
| Médias | quotidienne | 30 jours |
| Hors site | hebdomadaire | 12 mois |
| Test de restauration | trimestriel | - |

## 5. Test de restauration

1. Déchiffrer dans un dossier isolé.
2. Restaurer la base dans une base de test.
3. Vérifier les volumes et sommes :
   - contrats 1 078 ; clients 2 023 ; voitures 81 ; paiements 71 ; factures 288 ;
   - contrats 2 120 609,00 MAD ; paiements 93 268,00 MAD ; factures 556 345,50 MAD.
4. Vérifier 303 médias et leurs SHA-256.
5. Documenter le test.

## 6. RPO/RTO

- RPO : 15 min (WAL) ou 24 h (dump quotidien).
- RTO : 4 h.

## 7. Sécurité

- Chiffrement au repos.
- Accès restreint.
- Journalisation des sauvegardes.
- Ne pas stocker les exports dans Git.
