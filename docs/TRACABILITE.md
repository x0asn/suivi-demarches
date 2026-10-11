# Matrice de traçabilité — exigences → réalisation → preuve

Les tests se trouvent dans `backend/tests/` (`Feature/` pour les parcours, `Unit/` pour les règles du workflow). Commande : `php artisan test` (98 tests, tous réussis).

## Exigences fonctionnelles

| Exigence | Réalisation (écran / API) | Test automatisé (preuve) |
|---|---|---|
| RF-001 Créer un compte citoyen | Page *Inscription* · `POST /auth/register` | `AuthentificationTest::test_rf001_*`, `test_rg001_l_email_est_unique` |
| RF-002 Se connecter / déconnecter | Page *Connexion*, menu utilisateur · `/auth/login`, `/auth/logout` | `test_rf002_*`, `test_rg009_*` |
| RF-003 Gérer son profil | Page *Mon profil* · `PATCH /profile` | `ProfilTest::test_rf003_*` |
| RF-004 Consulter le catalogue | Pages *Procédures* et fiche procédure | `CatalogueTest::test_rf004_*` |
| RF-005 Rechercher une procédure | Recherche (accueil, catalogue), filtres par catégorie | `test_rf005_la_recherche_retourne_les_procedures_correspondantes` |
| RF-006 Créer un dossier | *Nouvelle démarche*, avec choix de l'administration compétente · `POST /dossiers` | `ParcoursDossierTest::test_rf006_*`, `CompetenceTest::test_rf006_*` |
| RF-007 Déposer une demande | Bouton *Soumettre ma demande* ; accusé de réception PDF avec QR code | `test_rf007_soumission_horodatee_et_notifications`, `SuiviPublicTest::test_rf007_accuse_de_reception_en_pdf_pour_un_dossier_soumis` |
| RF-008 Ajouter une pièce | Dépôt par glisser-déposer avec progression | `test_rf008_format_et_taille_des_pieces_controles`, `test_rf008_les_fichiers_sont_stockes_avec_un_nom_non_previsible` |
| RF-009 Consulter le statut | Frise d'avancement + historique du dossier ; page *Suivre un dossier* sans compte (référence + code de suivi, ou QR code) | `test_parcours_complet_jusqu_a_la_validation`, `SuiviPublicTest::test_rf009_*`, `test_rnf002_le_suivi_public_ne_revele_aucune_donnee_personnelle` |
| RF-010 Recevoir une notification | Cloche, page *Notifications* | `test_rf010_notifications_consultables_et_marquees_lues` |
| RF-011 Consulter ses dossiers | *Mes dossiers* avec onglets par statut | `test_rg008_un_citoyen_ne_voit_pas_le_dossier_d_un_autre` |
| RF-012 Soumettre une réclamation | Page *Réclamations* | `ReclamationsStatistiquesTest::test_rf012_*` |
| RF-013 Dossiers à traiter (agent) | *File de travail* | `test_rg006_un_agent_ne_voit_que_les_dossiers_de_son_service` |
| RF-014 Contrôler les pièces | Accepter / À corriger / Refuser, aperçu PDF et image | `test_uc05_correction_demandee_puis_dossier_complete` |
| RF-015 Changer le statut | Boutons d'action de l'agent | `test_rf015_transition_incoherente_refusee`, `test_parcours_complet_*`, `StatutDossierTest` (unitaire) |
| RF-016 Ajouter une observation | Fil d'échanges, notes internes | `test_rf016_observation_et_note_interne` |
| RF-017 Gérer les procédures | *Administration > Procédures* (éditeur, publication) | `CatalogueTest::test_rf017_*` |
| RF-018 Gérer utilisateurs et rôles | *Administration > Utilisateurs* | `GestionUtilisateursTest::test_rf018_*`, `test_rnf001_*` |
| RF-019 Consulter les statistiques | *Statistiques* (filtres période, service, statut ; export CSV) | `test_rf019_*`, `test_rg012_indicateurs_coherents_avec_les_donnees` |
| RF-020 Gérer les notifications | *Administration > Modèles de notification* | `test_rf020_un_modele_desactive_ne_produit_pas_de_notification` |
| RF-021 Rechercher un service | *Administrations à proximité* : position GPS, distance, démarches traitées, règle de compétence, itinéraire | `CatalogueTest::test_rf021_recherche_de_services_par_commune`, `CompetenceTest::test_rf021_*`, `MairiesSenegalTest` (les mairies des 14 régions) |
| RF-022 Journaliser les actions sensibles | *Journal d'audit* | `test_rf022_l_admin_consulte_le_journal`, assertions `journal_actions` dans chaque module |

## Règles de gestion

| Règle | Mise en œuvre | Preuve |
|---|---|---|
| RG-001 Identifiant unique | Contrainte `unique` sur l'e-mail | `test_rg001_l_email_est_unique` |
| RG-002 Référence unique du dossier | `DEM-AAAA-NNNNN` dérivée de l'identifiant | `test_rf006_un_dossier_recoit_une_reference_unique_et_un_statut_initial` |
| RG-003 Une procédure par dossier | Clé étrangère `procedure_id` | Schéma de la table `dossiers` |
| RG-004 Pas de soumission incomplète | Contrôle des pièces obligatoires et de l'objet (`Workflow`) | `test_rg004_soumission_refusee_si_pieces_obligatoires_manquantes` |
| RG-005 Historique des statuts | Table `historique_statuts` | `test_parcours_complet_jusqu_a_la_validation` |
| RG-006 Périmètre de l'agent | Agent rattaché à un service (`DossierPolicy`) | `test_rg006_*` |
| RG-007 Refus motivé | Motif obligatoire pour refuser ou faire corriger | `test_uc05_*` |
| RG-008 Citoyen : ses dossiers uniquement | `DossierPolicy::view` | `test_rg008_*` |
| RG-009 Compte désactivé | Connexion refusée, jetons révoqués | `test_rg009_*` |
| RG-010 Actions administratives journalisées | Service `Journal` | `test_rf018_l_admin_change_un_role_et_l_action_est_journalisee` |
| RG-011 Notification sur événement | Service `Notifieur` appelé par le circuit | `test_rf007_*`, `test_uc05_*` |
| RG-012 Statistiques cohérentes | Calcul direct à partir des dossiers | `test_rg012_indicateurs_coherents_avec_les_donnees` |

## Exigences non fonctionnelles

| Exigence | Mise en œuvre |
|---|---|
| RNF-001 Sécurité | Rôles vérifiés côté serveur, mots de passe hachés, validation des entrées, limitation des tentatives |
| RNF-002 Confidentialité | Politiques d'accès sur dossiers, documents et réclamations ; notes internes invisibles du citoyen |
| RNF-003 Traçabilité | Journal d'audit (acteur, action, objet, IP, résultat) et historique des statuts |
| RNF-006 Maintenabilité | Code organisé par module : contrôleurs, politiques, services métier (`Workflow`, `Notifieur`, `Journal`) |
| RNF-007 Évolutivité | Nouvelles procédures et pièces ajoutées sans code, depuis l'administration |
| RNF-008 Compatibilité | Testé sur Chrome 96 et Edge récent ; cible de compilation Chrome 96+ |
| RNF-009 Responsive | Toutes les pages vérifiées à 390 px (mobile) et 1440 px (ordinateur) |
| RNF-010 Accessibilité | Libellés de formulaires, contrastes, navigation au clavier, messages d'erreur explicites, statut jamais indiqué par la couleur seule |
| RNF-011 Intégrité | Transactions sur les changements de statut, transitions contrôlées |
