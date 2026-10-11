# Organisation du code

Ce document explique où se trouve chaque chose dans le projet et pourquoi. Il sert de guide à
l'équipe et de support pour présenter l'architecture (§15 du cahier des charges, exigence RNF-006).

## Vue d'ensemble

```
plateforme-procedures/
├── backend/      API Laravel : règles métier, sécurité, base de données
├── frontend/     Interface React : ce que voient le citoyen, l'agent et l'administrateur
├── docs/         Documentation et livrables de conception
├── demarrer.bat             Lance l'API et l'interface
└── reinitialiser-demo.bat   Remet les données de démonstration à zéro
```

Le navigateur ne parle jamais directement à la base de données : l'interface appelle l'API
(`/api/...`), et c'est l'API qui vérifie les droits avant de lire ou d'écrire.

```
Interface React  →  API Laravel  →  MySQL
                         ├→ stockage privé des pièces justificatives
                         ├→ notifications
                         └→ journal d'audit
```

## Backend (`backend/`)

Une requête traverse toujours les mêmes couches, dans cet ordre :

| Étape | Dossier | Rôle |
|---|---|---|
| 1. Route | `routes/api.php` | Associe une adresse (`POST /api/dossiers`) à un contrôleur |
| 2. Filtre | `app/Http/Middleware/` | Refuse les comptes désactivés et les rôles non autorisés |
| 3. Validation | `app/Http/Requests/` | Vérifie les données envoyées et le droit d'agir sur la ressource |
| 4. Contrôleur | `app/Http/Controllers/Api/` | Orchestre : appelle les services, renvoie la réponse |
| 5. Règles métier | `app/Services/` | `Workflow` (cycle de vie du dossier), `Notifieur`, `Journal`, `Assistant` et `AssistantSecours` |
| 6. Données | `app/Models/` | Tables et relations (Dossier, Document, Procédure…) |
| 7. Réponse | `app/Http/Resources/` | Met en forme le JSON renvoyé à l'interface |

Autres dossiers :

| Dossier | Contenu |
|---|---|
| `app/Enums/` | Listes fermées : rôles, statuts de dossier, statuts de document, règles de compétence. Les transitions autorisées du workflow sont dans `StatutDossier` |
| `app/Policies/` | Qui a le droit de voir ou de traiter un dossier, une réclamation (RG-006, RG-008) |
| `app/Http/Controllers/Api/Admin/` | Contrôleurs réservés à l'administrateur |
| `database/migrations/` | Structure des tables |
| `database/seeders/` | Jeu de données de démonstration |
| `storage/app/private/` | Pièces déposées, hors du dossier public |
| `tests/Unit/` | Règles isolées, sans base de données (transitions de statut) |
| `tests/Feature/` | Parcours complets à travers l'API, rangés par domaine |

Conventions :

- **Validation.** Toute écriture (création, modification, changement de statut) a sa classe dans
  `Requests/`, rangée par domaine (`Auth`, `Dossiers`, `Documents`, `Reclamations`, `Admin`, `Profile`).
  Seuls les filtres de recherche des listes sont validés directement dans le contrôleur.
- **Autorisation.** Le droit d'agir sur un dossier est vérifié par la classe `Requests` (méthode
  `authorize`), qui interroge la `Policy`. Il est donc contrôlé avant même la lecture des données.
- **Changement de statut.** Il passe toujours par `Services/Workflow`, qui contrôle la transition,
  écrit l'historique, journalise et notifie.
- **Format de réponse.** Toutes les réponses ont la même forme (`success`, `message`, `data`, `meta`),
  produite par `Controller::succes()` et `Controller::erreur()`.
- **Compétence des administrations.** Une démarche est reliée à toutes les administrations habilitées à la
  traiter (table `procedure_service`) et porte une règle (`Enums/RegleCompetence`) : toute administration,
  lieu de résidence, lieu de naissance ou lieu du bien. Le citoyen choisit l'administration au dépôt, et
  l'API refuse une administration non habilitée.
- **Suivi sans compte.** Chaque dossier a un code de suivi aléatoire. La page publique exige la référence
  et ce code, et ne renvoie que l'avancement. L'accusé de réception (PDF, vue `resources/views/pdf/`) porte
  un QR code qui ouvre cette page.
- **Assistant IA.** `Services/Assistant` transmet à l'IA ses consignes et le catalogue des procédures
  publiées, plus les dossiers de la personne connectée. Sans clé d'API ou sans internet,
  `Services/AssistantSecours` répond par mots-clés à partir du même catalogue. L'assistant informe et
  oriente : il n'a aucun moyen d'agir sur un dossier.
- **Style.** `vendor/bin/pint` applique le style de code Laravel.

## Frontend (`frontend/src/`)

| Dossier | Contenu |
|---|---|
| `pages/` | Un fichier par écran, rangé par espace |
| `layouts/` | Cadres de page : site public, pages de connexion, espace connecté |
| `components/` | Éléments réutilisés par plusieurs écrans |
| `context/` | État partagé : utilisateur connecté, messages de confirmation |
| `hooks/` | Logique réutilisable (listes paginées, lien de suivi) |
| `lib/` | Appels à l'API, libellés des statuts et des rôles, fonctions utilitaires |
| `assets/` | Images |

Les écrans :

| Dossier | Écrans |
|---|---|
| `pages/public/` | Accueil, catalogue, fiche procédure, services et carte |
| `pages/auth/` | Connexion, inscription, mot de passe oublié |
| `pages/espace/` | Écrans communs aux rôles : tableau de bord, notifications, profil, réclamations, statistiques |
| `pages/espace/citoyen/` | Mes dossiers, nouvelle démarche, suivi d'un dossier |
| `pages/espace/agent/` | File de travail, traitement d'un dossier |
| `pages/espace/admin/` | Utilisateurs, procédures, services, modèles de notification, journal |
| `pages/erreurs/` | Accès refusé, page introuvable |

Les composants, un fichier par composant :

| Dossier | Composants |
|---|---|
| `components/ui/` | Briques de base sans lien avec le métier : bouton, champ, modale, badge, pagination, logo… |
| `components/dossiers/` | Frise d'avancement, historique, badge de statut, dépôt et aperçu d'une pièce, fil d'échanges |
| `components/auth/` | Garde d'accès par rôle, indicateur de force du mot de passe |
| `components/notifications/` | Cloche de notifications |
| `components/statistiques/` | Graphiques |
| `components/services/` | Carte des services |
| `components/assistant/` | Bulle de discussion de l'assistant |

Conventions :

- Un écran importe ses composants depuis le dossier (`components/ui`, `components/dossiers`), dont
  le fichier `index.js` liste ce qui est disponible.
- Aucun écran n'appelle `fetch` directement : tous les échanges passent par `lib/api.js`, qui ajoute
  le jeton de connexion et uniformise les erreurs.
- Les libellés et couleurs des statuts sont définis une seule fois, dans `lib/dossiers.js`.
- La position GPS du citoyen reste dans son navigateur : les distances sont calculées dans `lib/geo.js`
  et rien n'est envoyé au serveur.

## Documentation (`docs/`)

| Fichier | Contenu |
|---|---|
| `ARCHITECTURE.md` | Ce document |
| `API.md` | Contrats de l'API REST |
| `TRACABILITE.md` | Exigences → écrans → tests |
| `conception/` | Diagrammes UML, MCD et MLD |
| `maquettes/` | Maquettes UI/UX et captures d'écran |
