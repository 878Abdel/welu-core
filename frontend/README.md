# Wëlu · Frontend

React 19 + Vite + TypeScript + Tailwind 4 + Framer Motion, branché sur le backend FastAPI (NVIDIA L40S).

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # site statique dans dist/ (chemins relatifs, déployable n'importe où)
npm run preview    # sert dist/ sur http://localhost:4173
```

URL du backend : `VITE_API_URL` (voir `.env.example`). Par défaut, `https://8000-rct7of4rd.gobrev.dev`.

| Route | Écran |
| --- | --- |
| `#/` | Accueil : app commerçant / console banque |
| `#/client` | App commerçant (mobile) |
| `#/banque` | Console banque (web) |

## Audit : composants ↔ API

| Composant front | Route API | Méthode | Payload | Statut |
| --- | --- | --- | --- | --- |
| `GpuBar` (console banque, bandeau haut) | `/api/health` | GET | aucun | ✅ branché, rafraîchi toutes les 5 s |
| `GpuBar` : VRAM, CUDA, SM, nœud | `/api/gpu-telemetry` | GET | aucun | ✅ branché, rafraîchi toutes les 5 s |
| `GpuBar` : latence | `/api/audit` (`latency_ms`) | POST | — | ✅ latence du dernier audit |
| Console : liste des profils | `/api/profiles` + `src/data/catalog.ts` | GET | aucun | ✅ 3 profils serveur + 11 profils de démo (signaux d'entrée seulement) ; tous audités au chargement par `/api/audit` |
| Console : Professionnels / Particuliers / Alertes fraude | `/api/audit` | POST | — | ✅ filtres ; « Alertes » = audits renvoyant une alerte |
| App : « Créer un compte » Business / Particulier | aucune (compte local) | — | nom, téléphone, quartier | ✅ compte gardé sur l'appareil, score calculé par `/api/audit` à partir de signaux vides |
| App : « Tester la simulation avec un profil existant » | `/api/profiles` + catalogue | GET | aucun | ✅ |
| Console : sélection d'un profil / « Relancer l'audit IA » | `/api/audit` | POST | `auditPayloadFor(profil)` : métriques de `/api/profiles` + paramètres par profil (`services/api.ts`) | ✅ score, décision, notation, SHAP, timeline, alerte ; collusion → console en rouge |
| App : accueil (jauge, décision, SHAP) + « Recalculer » | `/api/audit` | POST | idem, + événements et cash certifiés pendant la session | ✅ branché |
| App : « Encaisser » (onglet central) | `/api/validate-cash-qr` puis `/api/whatsapp/send` | POST | `{merchant_name, client_phone, amount}` puis `{phone, amount, receipt_id, merchant}` | ✅ fenêtre du reçu, lien WhatsApp réel, nouvel audit |
| Reçu : bouton « Reçu PDF » | `/api/receipt` | POST | `{amount, merchant, client, receipt_id}` | ⚠️ route appelée ; le PDF est généré dans le navigateur, car `/static/*.pdf` renvoie 404 sur le serveur |
| App : Kia (texte, dictée, exemples wolof) | `/api/parse-voice` | POST | `{text}` | ✅ réponse wolof + français + données extraites ; lecture vocale FR |
| App : Historique, « Photo facture » | `/api/audit-paper-receipt` | POST | `{image_url}` (photo en data URL) | ✅ branché (le backend répond `FALLBACK_SUCCESS` si la vision NIM échoue) ; nouvel audit |
| App : Historique, « Exporter en PDF » | aucune (local) | — | opérations renvoyées par l'API | ✅ relevé généré dans le navigateur |

### Retirés (aucune route backend)

- Demandes de prêt, choix du type de prêt, envoi d'offre banque
- Import de relevé Orange Money
- Graphe de flux animé et vue démo `#/demo`
- Conseils Kia précalculés
- Les anciennes données simulées (scores inventés côté front). Il ne reste que `src/data/catalog.ts` : des signaux d'entrée, notés par le vrai moteur.
