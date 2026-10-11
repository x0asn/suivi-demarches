# API REST — Suivi Démarches

Base : `http://localhost:8000/api` · Format : JSON · Authentification : en-tête `Authorization: Bearer <jeton>`
(jeton obtenu à la connexion ou à l'inscription).

## Format des réponses (§16.1)

Succès :

```json
{ "success": true, "message": "OK", "data": { … }, "meta": { "page": 1, "par_page": 15, "total": 42, "derniere_page": 3 } }
```

`meta` n'apparaît que pour les listes paginées.

Erreur :

```json
{ "success": false, "message": "Certains champs sont invalides. Merci de les corriger.", "errors": { "email": ["Un compte existe déjà avec cette adresse e-mail."] } }
```

| Code | Signification |
|---|---|
| 401 | Non connecté (jeton absent, expiré ou révoqué) |
| 403 | Connecté mais droits insuffisants, ou compte désactivé |
| 404 | Ressource introuvable (ou non autorisée, sans divulgation) |
| 422 | Données invalides (`errors` détaille chaque champ) ou transition de statut refusée |
| 429 | Trop de tentatives |

## Authentification — M01

| Méthode | Endpoint | Accès | Corps / paramètres | Rôle |
|---|---|---|---|---|
| POST | `/auth/register` | Public | prenom, nom, email, telephone?, password, password_confirmation | Créer un compte citoyen (RF-001) |
| POST | `/auth/login` | Public | email, password | Obtenir un jeton (RF-002) |
| POST | `/auth/logout` | Connecté | — | Révoquer le jeton |
| GET | `/auth/me` | Connecté | — | Profil courant |
| POST | `/auth/forgot-password` | Public | email | Envoyer un lien de réinitialisation |
| POST | `/auth/reset-password` | Public | token, email, password, password_confirmation | Choisir un nouveau mot de passe |
| PATCH | `/profile` | Connecté | prenom?, nom?, email?, telephone? | Modifier son profil (RF-003) |
| PUT | `/profile/password` | Connecté | current_password, password, password_confirmation | Changer de mot de passe |

Les routes publiques d'authentification sont limitées à 10 requêtes par minute.

## Procédures et services — M02 / M08

| Méthode | Endpoint | Accès | Paramètres | Rôle |
|---|---|---|---|---|
| GET | `/procedures` | Public | q, categorie (slug), service, par_page | Catalogue paginé, procédures publiées (RF-004, RF-005) |
| GET | `/procedures/{slug}` | Public | — | Fiche : conditions, pièces, étapes, service |
| GET | `/categories` | Public | — | Catégories et nombre de procédures |
| GET | `/services` | Public | q, type, region | Services, régions, types (RF-021) |
| GET | `/services/{id}` | Public | — | Service et ses procédures |

## Dossiers — M03

| Méthode | Endpoint | Accès | Corps / paramètres | Rôle |
|---|---|---|---|---|
| GET | `/dossiers` | Connecté | statut (`en_cours`, `termines` ou un statut), q | Mes dossiers (RF-011) |
| GET | `/dossiers/resume` | Citoyen | — | Compteurs du tableau de bord |
| POST | `/dossiers` | Citoyen | procedure (slug), motif?, precisions? | Créer un brouillon (RF-006) |
| GET | `/dossiers/{id}` | Autorisé | — | Dossier complet : pièces, historique, échanges, permissions (RF-009) |
| PATCH | `/dossiers/{id}` | Propriétaire, brouillon ou correction | motif?, precisions? | Modifier |
| DELETE | `/dossiers/{id}` | Propriétaire, brouillon | — | Supprimer le brouillon |
| POST | `/dossiers/{id}/soumettre` | Propriétaire | — | Soumettre (RF-007, RG-004) |
| PATCH | `/dossiers/{id}/status` | Agent du service | statut, commentaire? | Changer le statut (RF-015) |
| POST | `/dossiers/{id}/observations` | Citoyen ou agent | contenu, interne? | Message ou note interne (RF-016) |

**Cycle de vie (§12)** — transitions acceptées par le serveur, toutes les autres sont refusées (422) :

```
brouillon ─citoyen→ soumis ─agent→ en_verification ─agent→ en_traitement ─agent→ valide ─agent→ termine
                       ↑               ├─agent→ correction_demandee ─citoyen→ soumis
                       │               └─agent→ rejete ─agent→ cloture
                       └── (en_traitement peut aussi aller vers correction_demandee ou rejete)
```

`correction_demandee` et `rejete` exigent un `commentaire`.

## Documents — M04

| Méthode | Endpoint | Accès | Corps | Rôle |
|---|---|---|---|---|
| POST | `/dossiers/{id}/documents` | Propriétaire | `multipart/form-data` : fichier (PDF/JPG/PNG, 5 Mo max), piece_requise_id | Ajouter ou remplacer une pièce (RF-008) |
| DELETE | `/documents/{id}` | Propriétaire | — | Retirer une pièce non acceptée |
| GET | `/documents/{id}/fichier` | Autorisé à voir le dossier | — | Télécharger (flux protégé) |
| PATCH | `/documents/{id}/verification` | Agent du service | statut (accepte, refuse, a_corriger), motif | Contrôler une pièce (RF-014, RG-007) |

## Traitement — M05

| Méthode | Endpoint | Accès | Paramètres | Rôle |
|---|---|---|---|---|
| GET | `/traitement/dossiers` | Agent, admin, responsable | statut (`a_traiter`, `tous` ou un statut), q, procedure, retard, mes_dossiers | File de travail (RF-013) |
| GET | `/traitement/resume` | Agent, admin, responsable | — | Compteurs : nouveaux, en retard… |

## Notifications — M06

| Méthode | Endpoint | Accès | Rôle |
|---|---|---|---|
| GET | `/notifications?non_lues=1` | Connecté | Liste paginée (RF-010) |
| GET | `/notifications/apercu` | Connecté | Nombre de non lues + 6 dernières |
| PATCH | `/notifications/{id}/lire` | Connecté | Marquer comme lue |
| PATCH | `/notifications/tout-lire` | Connecté | Tout marquer comme lu |

## Réclamations — M07

| Méthode | Endpoint | Accès | Corps / paramètres | Rôle |
|---|---|---|---|---|
| GET | `/reclamations` | Connecté | statut, q | Liste selon le rôle |
| GET | `/reclamations/options` | Connecté | — | Motifs, statuts, dossiers du citoyen |
| POST | `/reclamations` | Citoyen | motif, sujet, description, dossier_id? | Créer (RF-012) |
| GET | `/reclamations/{id}` | Autorisé | — | Détail |
| PATCH | `/reclamations/{id}` | Admin, ou agent du service | statut (en_cours, resolue, rejetee), reponse | Traiter et clôturer |

## Statistiques — M09

| Méthode | Endpoint | Accès | Paramètres | Rôle |
|---|---|---|---|---|
| GET | `/statistics` | Admin, responsable | du, au, service, statut | Indicateurs, évolution mensuelle, répartition par statut, procédure et service (RF-019) |

## Administration — M10

| Méthode | Endpoint | Rôle |
|---|---|---|
| GET, POST | `/admin/users` | Lister / créer des comptes (RF-018) |
| GET, PATCH | `/admin/users/{id}` | Consulter / modifier rôle, service, statut actif |
| GET, POST | `/admin/procedures` | Lister / créer une procédure (RF-017) |
| GET, PUT | `/admin/procedures/{id}` | Consulter / modifier (pièces et étapes incluses) |
| PATCH | `/admin/procedures/{id}/statut` | Publier, dépublier, désactiver |
| GET, POST | `/admin/services` | Référentiel des services |
| PUT | `/admin/services/{id}` | Modifier un service |
| GET | `/admin/modeles-notification` | Modèles de notification (RF-020) |
| PUT | `/admin/modeles-notification/{id}` | Modifier titre, message, activation, envoi par e-mail |
| GET | `/admin/journal` | Journal d'audit, filtrable (RF-022) |

Toutes les routes `/admin/*` sont réservées au rôle administrateur.
