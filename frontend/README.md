# Suivi Démarches — Interface

Interface web de la plateforme, écrite avec React 19, Vite et Tailwind CSS. Elle affiche les
écrans du citoyen, de l'agent et de l'administrateur, et échange avec l'API de
[../backend](../backend).

## Commandes

```bash
npm install      # installer les dépendances
npm run dev      # lancer l'interface sur http://localhost:5173
npm run build    # produire la version de production dans dist/
npm run lint     # vérifier le code
```

En développement, les appels à `/api` sont redirigés vers l'API Laravel (port 8000) : elle doit
être lancée en même temps.

## Où trouver quoi

| Dossier de `src/` | Contenu |
|---|---|
| `pages/` | Un fichier par écran : `public`, `auth`, `espace` (`citoyen`, `agent`, `admin`), `erreurs` |
| `layouts/` | Cadres de page : site public, connexion, espace connecté |
| `components/ui/` | Briques de base : bouton, champ, modale, badge, pagination |
| `components/dossiers/` | Frise d'avancement, historique, pièces, fil d'échanges |
| `components/` (autres) | `auth`, `notifications`, `statistiques`, `services` |
| `context/` | Utilisateur connecté, messages de confirmation |
| `hooks/` | Logique réutilisable |
| `lib/` | Appels à l'API, libellés des statuts et des rôles, utilitaires |

Le détail est dans [../docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md).
