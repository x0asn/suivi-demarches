# Évolutions à reporter dans le cahier des charges

L'application a évolué au-delà de la version 2.0 du cahier des charges. Cette page liste, section par
section, ce qu'il faut modifier dans le document Word pour qu'il corresponde à ce qui sera montré au jury.
Le cahier impose de tracer chaque modification (§0.1) : ces changements forment la **version 2.1**.

## §0 — Historique des versions

Ajouter la ligne :

| Version | Date | Auteur(s) | Nature de la modification | Statut |
|---|---|---|---|---|
| 2.1 | Octobre 2026 | Équipe projet | Retrait du document avec code personnel, compétence des administrations, mairies des 14 régions, suivi sans compte, accusé de réception, assistant d'orientation | Référence |

La version 2.0 passe au statut « Archive ».

## §6.1 — Inclus dans le périmètre

Ajouter :

- Suivi d'un dossier sans compte, avec sa référence et un code de suivi.
- Accusé de réception en PDF, avec QR code de suivi.
- Retrait du document sur place, contrôlé par un code de retrait personnel.
- Assistant d'orientation (réponses guidées à partir du catalogue des procédures).

Préciser le périmètre réel : la démonstration porte sur les **mairies** (548 communes, 14 régions) ;
les autres administrations (tribunaux, ministères) restent présentes dans le référentiel.

## §6.3 — Évolutions futures

« Assistant conversationnel pour orienter le citoyen » : préciser qu'un premier assistant, sans
intelligence artificielle, est livré ; le branchement sur une IA est prévu et déjà préparé dans le code.

## §10 — Modules

Remplacer la description de M08 :

> **M08 — Géolocalisation et compétence.** Position du citoyen (avec son accord), administrations
> classées par distance, itinéraire. Pour chaque démarche, administrations habilitées et règle de
> compétence : l'administration la plus proche n'est pas forcément celle qui peut traiter la demande.

## §12 — Cycle de vie d'un dossier

Remplacer le schéma :

```
BROUILLON → SOUMIS → EN VÉRIFICATION → EN TRAITEMENT → VALIDÉ → PRÊT À RETIRER → TERMINÉ
                         ↘ CORRECTION DEMANDÉE → SOUMIS
                         ↘ REJETÉ → CLÔTURÉ
```

Modifier et ajouter dans le tableau des statuts :

| Statut | Signification | Acteur autorisé à déclencher |
|---|---|---|
| VALIDÉ | Demande approuvée. Le document officiel n'est pas encore établi. | Agent habilité |
| PRÊT À RETIRER | Le document est réellement établi et disponible au guichet. Le citoyen est notifié et reçoit son code de retrait. | Agent habilité |
| TERMINÉ | Document remis au demandeur, après vérification de son code de retrait et de son identité. | Agent habilité |

## §13 — Règles de gestion

Ajouter :

| ID | Règle |
|---|---|
| RG-013 | Une demande ne peut être validée que si toutes les pièces obligatoires ont été acceptées. |
| RG-014 | La validation d'une demande ne vaut pas remise du document : le dossier passe par « prêt à retirer » avant d'être terminé. |
| RG-015 | Le code de retrait est personnel : il n'est visible que du citoyen, jamais de l'agent ni sur le suivi public. |
| RG-016 | La remise du document n'est enregistrée que si l'agent saisit le bon code de retrait et confirme avoir vérifié l'identité du demandeur. |
| RG-017 | Un dossier ne peut être adressé qu'à une administration habilitée à traiter la démarche ; la règle de compétence (lieu de résidence, lieu de naissance, lieu du bien, ou toute administration) désigne celle qui est compétente. |
| RG-018 | Le suivi sans compte exige la référence du dossier et son code de suivi, et n'affiche que l'avancement, sans donnée personnelle. |

## §14 — Données

Ajouter à l'entité **Dossier** : code de suivi, code de retrait, date « prêt à retirer », date de remise.
Ajouter à l'entité **Procédure** : règle de compétence.
Ajouter l'association **Procédure — Service** (« est traitée par ») : plusieurs à plusieurs.

## §16 — API

Ajouter :

| Méthode | Endpoint | Rôle | Objectif |
|---|---|---|---|
| GET | /api/suivi | Public | Suivre un dossier sans compte |
| GET | /api/dossiers/{id}/accuse | Citoyen/Agent | Télécharger l'accusé de réception (PDF) |
| PATCH | /api/dossiers/{id}/remise | Agent | Enregistrer la remise du document |
| POST | /api/assistant | Public | Poser une question à l'assistant |

## §22 — Critères d'acceptation et §28 — Scénario de démonstration

Ajouter après « Changer le statut du dossier » :

- L'agent déclare le document prêt à retirer ; le citoyen reçoit la notification et son code de retrait.
- L'agent enregistre la remise en saisissant le code présenté par le citoyen.
