# Wëlu — frontend

React + Vite + TypeScript + Tailwind 4 + Framer Motion.

```bash
npm install
npm run dev        # http://localhost:5173
npm run build
```

## Écrans

| Route | Écran |
|---|---|
| `#/` | Accueil : choix de l'espace (`1` client, `2` banque) |
| `#/client` | App client mobile : score, maison, prêt, conseil IA, historique, QR (afficher / scanner) |
| `#/banque` | Console web de la banque : clients probables, solvabilité, analyse des flux |
| `#/demo` | Vue démo côte à côte : téléphone et console reliés par l'impulsion |

Les maquettes statiques validées restent dans `maquettes/` pour référence.

## Vue démo (raccourcis)

| Touche | Action |
|---|---|
| `Espace` | Le commerçant enregistre une vente → impulsion → recalcul |
| `X` | Décomposition XAI du score |
| `F` | Analyse des flux (cycle de fraude sur le profil 2) |
| `R` | Rejouer la matérialisation |
| `1` / `2` | Changer de profil |

`?reduced=1` force le mode mouvement réduit ; le bouton en pied de page le bascule aussi.

## Données

- `src/data/profiles.ts` : profils **fictifs**. L'interface affiche « Données simulées » et `sim.` à côté des valeurs concernées.
- `src/services/scoringSource.ts` : interface `ScoringSource`. Si `VITE_API_URL` est défini (voir `.env.example`), l'API est utilisée :
  - `GET /profiles`, `GET /profiles/{id}`
  - `POST /profiles/{id}/transactions` → `SaleResult`
  - `POST /profiles/{id}/fraud-analysis` → `FraudAnalysis`
- Les types de `src/data/types.ts` sont le contrat à reproduire en Pydantic.

## Motion

Toutes les durées sont dans `src/motion/timeline.ts`, les courbes dans `easings.ts`, les springs dans `springs.ts`.
Seuls `transform` et `opacity` sont animés.
