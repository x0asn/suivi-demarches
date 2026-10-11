# Cahier des charges

CAHIER DES CHARGES
PLATEFORME NUMÉRIQUE
de suivi des procédures administratives des citoyens
pour les collectivités territoriales et les ministères

AMBITION DU PROJET
Concevoir un guichet numérique centré sur le citoyen, permettant de comprendre une procédure, déposer une demande, suivre son avancement, recevoir des notifications et interagir avec l’administration dans un cadre sécurisé et traçable.


Élément	Informations
Équipe projet	Aida Sy Ndoye • Fatou Thior • Sokhna Cissé • Moustapha Gueye
Encadreur	Souleymane Harouna Maizaboura
Établissement	Institut supérieur d'enseignement Professionel Amadou Trawaré de Diamniadio
Filière	Développement Front-End
Promotion	Promo 6
Année académique	2025–2026
Nature du document	Cahier des charges fonctionnel et technique
Version	2.0 — Version renforcée pour soutenance
Statut	Document de référence du projet

« Du dépôt de la demande à sa résolution : rendre la procédure compréhensible, traçable et accessible. »
 
0. Gouvernance documentaire
Ce document constitue la référence fonctionnelle et technique utilisée pour cadrer la conception, le développement, les tests et la démonstration de la plateforme. Toute modification significative du périmètre ou d’une exigence doit être identifiée dans l’historique des versions.
Version	Date	Auteur(s)	Nature de la modification	Statut
1.0	2026	Équipe projet	Première structuration du cahier des charges	Archive
2.0	2026	Équipe projet	Renforcement fonctionnel, technique, qualité et soutenance	Référence

0.1 Règles de gestion du document
•	Le cahier des charges décrit les besoins et exigences ; il ne constitue pas à lui seul le code source.
•	Toute fonctionnalité non explicitement retenue dans le périmètre doit être considérée comme une évolution future.
•	Les diagrammes UML, le modèle de données, les maquettes et les résultats de tests sont des livrables associés à ce document.
•	Les exigences sont identifiées par des codes afin de permettre leur traçabilité jusqu’aux tests.
 
Sommaire

0. Gouvernance documentaire
1. Résumé exécutif
2. Contexte, justification et enjeux
3. Problématique
4. Analyse de l’existant et positionnement
5. Objectifs du projet
6. Périmètre du projet
7. Parties prenantes et acteurs
8. Exigences fonctionnelles
9. Exigences non fonctionnelles
10. Description détaillée des modules
11. Cas d’utilisation
12. Cycle de vie d’un dossier
13. Règles de gestion
14. Données et modèle conceptuel
15. Architecture fonctionnelle et technique
16. API et contrats d’échange
17. Sécurité et protection des données
18. UI/UX et accessibilité
19. Gestion des erreurs
20. Stratégie de tests
21. Matrice de traçabilité
22. Critères d’acceptation du projet
23. Planification prévisionnelle
24. Organisation et répartition des responsabilités
25. Analyse des risques
26. Indicateurs de réussite et qualité
27. MVP et stratégie d’évolution
28. Scénario de démonstration devant le jury
29. Livrables attendus
30. Déploiement et mise en service
31. Maintenance et évolutions
32. Dossier de modélisation UML à produire
33. Matrice synthétique des exigences
34. Conclusion
35. Annexes recommandées pour le dossier final
36. Glossaire
37. Checklist de préparation avant soutenance

 
1. Résumé exécutif
La transformation numérique des services publics crée une attente forte : le citoyen doit pouvoir comprendre une procédure, savoir où en est son dossier et recevoir une information fiable sans multiplier les déplacements ou les appels. Le projet proposé répond à cette attente par la conception d’une plateforme de suivi des procédures administratives destinée aux citoyens, aux agents des administrations et aux administrateurs de la plateforme.
La solution repose sur une logique de parcours de bout en bout : information sur les procédures, création d’un dossier, dépôt et contrôle des pièces, traitement par les agents, changement de statut, notification, réclamation éventuelle et clôture. L’objectif n’est donc pas uniquement de « dématérialiser un formulaire », mais de rendre le cycle de vie d’une démarche visible, structuré et traçable.
Le projet adopte une approche centrée utilisateur et prévoit une architecture Front-End / API Back-End / Base de données. La sécurité, la gestion des rôles, la traçabilité, la qualité des données, l’accessibilité et la maintenabilité sont considérées dès la conception.
VISION
Faire de la plateforme un point de contact numérique simple et fiable entre le citoyen et l’administration, capable de transformer une démarche souvent opaque en parcours guidé et suivi.

2. Contexte, justification et enjeux
2.1 Contexte
Les démarches administratives peuvent impliquer plusieurs étapes, pièces justificatives, services et délais. Pour un citoyen, la difficulté ne réside pas uniquement dans le dépôt de la demande : elle réside aussi dans la compréhension de la procédure, la connaissance des pièces requises, l’identification du service compétent et le suivi de l’avancement.
Dans ce contexte, une plateforme numérique peut centraliser l’information et offrir une visibilité sur le dossier. Pour l’administration, elle peut contribuer à structurer les flux, limiter les pertes d’information, faciliter la répartition des dossiers et produire des indicateurs de pilotage.
2.2 Justification
•	Réduire les déplacements inutiles liés à la recherche d’informations ou au suivi d’un dossier.
•	Améliorer la visibilité du citoyen sur l’état réel de sa demande.
•	Centraliser les procédures, documents, notifications et historiques.
•	Faciliter le travail des agents grâce à un espace de traitement structuré.
•	Renforcer la traçabilité des actions et des changements de statut.
•	Créer une base évolutive pour intégrer progressivement de nouvelles procédures.
2.3 Enjeux
Enjeu	Réponse attendue par la plateforme
Accessibilité	Accéder aux informations et au suivi depuis un navigateur, sur ordinateur ou mobile.
Transparence	Afficher clairement le statut, les étapes et les informations utiles.
Efficacité	Structurer le traitement et réduire les opérations manuelles répétitives.
Traçabilité	Conserver un historique des actions importantes sur les dossiers.
Sécurité	Contrôler les accès et protéger les comptes et documents.
Pilotage	Fournir des statistiques utiles aux responsables.

3. Problématique
QUESTION CENTRALE
Comment concevoir une plateforme numérique permettant aux citoyens de suivre simplement et de manière transparente leurs procédures administratives, tout en donnant aux agents et responsables les outils nécessaires pour traiter, contrôler et piloter ces dossiers ?

3.1 Problèmes identifiés
•	Manque de visibilité sur l’avancement d’une démarche.
•	Difficulté à connaître les pièces nécessaires avant le dépôt.
•	Multiplication des canaux d’échange et risque de perte d’information.
•	Difficulté à identifier le service ou le lieu compétent.
•	Absence d’un historique facilement consultable par le citoyen.
•	Manque d’indicateurs consolidés pour le pilotage administratif.
3.2 Conséquences
•	Déplacements ou prises de contact répétées.
•	Temps perdu pour les citoyens et les agents.
•	Insatisfaction liée au manque d’information.
•	Risque d’erreur ou de dossier incomplet.
•	Difficulté à mesurer les délais et volumes de traitement.
4. Analyse de l’existant et positionnement
L’étude de l’existant doit être conduite comme une analyse comparative et non comme une simple liste de plateformes. Pour la soutenance, l’équipe présentera les solutions ou canaux réellement observés dans le contexte ciblé, puis identifiera précisément les écarts avec les besoins du projet.
Axe de comparaison	Constat à vérifier	Opportunité pour le projet
Information	La procédure est-elle expliquée de façon claire et centralisée ?	Créer des fiches de procédures guidées.
Dépôt	Le dépôt est-il entièrement numérique ?	Permettre un dépôt structuré et contrôlé.
Suivi	Le citoyen voit-il un statut détaillé ?	Proposer une timeline de suivi.
Notifications	Le citoyen est-il informé automatiquement ?	Ajouter notifications selon événements.
Documents	Les pièces sont-elles centralisées ?	Associer les documents au dossier.
Localisation	Le service compétent est-il facilement identifiable ?	Ajouter une carte et/ou une recherche géographique.
Réclamation	Existe-t-il un canal de remontée formalisé ?	Créer un module de réclamation traçable.
Pilotage	Les responsables disposent-ils d’indicateurs ?	Créer tableaux de bord et statistiques.

PRINCIPE DE RIGUEUR
Les fonctionnalités de solutions externes seront vérifiées avant toute comparaison nominative dans le rapport final. Aucune caractéristique ne doit être affirmée sans source ou observation.

5. Objectifs du projet
5.1 Objectif général
Concevoir et développer une plateforme web permettant de centraliser, suivre et piloter les procédures administratives des citoyens auprès des collectivités territoriales et des ministères.
5.2 Objectifs spécifiques
1.	Permettre au citoyen de créer et gérer son compte.
2.	Présenter les procédures disponibles avec leurs conditions, pièces et étapes.
3.	Permettre la création et le dépôt d’une demande.
4.	Permettre le dépôt et le suivi des documents justificatifs.
5.	Afficher l’état d’avancement du dossier sous forme compréhensible.
6.	Notifier le citoyen lors des événements importants.
7.	Permettre aux agents de consulter, contrôler et traiter les dossiers.
8.	Permettre aux administrateurs de gérer les référentiels et les utilisateurs.
9.	Offrir des outils de recherche, filtrage et statistiques.
10.	Assurer la sécurité et la traçabilité des opérations sensibles.
6. Périmètre du projet
6.1 Inclus dans le périmètre
•	Application web responsive.
•	Gestion des comptes et authentification.
•	Gestion des rôles Citoyen / Agent / Administrateur.
•	Catalogue des procédures.
•	Création et suivi des dossiers.
•	Gestion des pièces justificatives.
•	Historique des statuts.
•	Notifications.
•	Réclamations et signalements.
•	Recherche et géolocalisation des services.
•	Tableaux de bord et statistiques.
•	API de communication entre Front-End et Back-End.
•	Journalisation des actions importantes.
6.2 Hors périmètre initial
•	Paiement en ligne réel, sauf si un périmètre spécifique est validé.
•	Signature électronique qualifiée réelle.
•	Interconnexion directe avec les systèmes gouvernementaux existants.
•	Application mobile native Android/iOS.
•	Automatisation décisionnelle par intelligence artificielle.
•	Déploiement national à grande échelle.
6.3 Évolutions futures
•	Application mobile native.
•	Paiement sécurisé intégré.
•	Signature électronique.
•	Interopérabilité avec des systèmes administratifs partenaires.
•	Assistant conversationnel pour orienter le citoyen.
•	Analyse prédictive des volumes et délais.
•	Support multilingue élargi.
7. Parties prenantes et acteurs
Acteur	Objectif	Principales actions
Citoyen	Réaliser et suivre une démarche	Créer compte, consulter procédure, déposer, suivre, recevoir notifications, réclamer.
Agent	Traiter les dossiers	Consulter, vérifier, demander correction, changer statut, ajouter commentaire.
Administrateur	Administrer la plateforme	Gérer utilisateurs, procédures, services, droits, référentiels, statistiques.
Responsable	Piloter l’activité	Consulter indicateurs, volumes, délais et tendances.
Équipe projet	Concevoir et livrer la solution	Analyse, conception, développement, tests, documentation.
Encadreur / jury	Évaluer le projet	Vérifier cohérence, qualité, conformité et démonstration.

8. Exigences fonctionnelles
Les exigences fonctionnelles définissent ce que le système doit permettre de faire. Elles sont identifiées par un code unique afin de faciliter la traçabilité.
ID	Exigence	Acteur	Priorité	Critère d’acceptation
RF-001	Créer un compte citoyen	Citoyen	Haute	Le système valide les champs obligatoires et crée un compte unique.
RF-002	Se connecter / se déconnecter	Tous	Haute	Un utilisateur authentifié accède uniquement à son espace autorisé.
RF-003	Gérer son profil	Citoyen/Agent	Moyenne	Les informations modifiables sont enregistrées après validation.
RF-004	Consulter le catalogue des procédures	Citoyen	Haute	Une procédure affiche conditions, pièces, étapes et informations utiles.
RF-005	Rechercher une procédure	Citoyen	Haute	La recherche retourne les procédures correspondant aux critères.
RF-006	Créer un dossier	Citoyen	Haute	Un dossier reçoit un identifiant unique et un statut initial.
RF-007	Déposer une demande	Citoyen	Haute	Une demande soumise est horodatée et enregistrée.
RF-008	Ajouter une pièce justificative	Citoyen	Haute	Le fichier respecte les règles de format et taille définies.
RF-009	Consulter le statut d’un dossier	Citoyen	Haute	Le statut courant et l’historique sont visibles.
RF-010	Recevoir une notification	Citoyen	Haute	Un événement configuré génère une notification.
RF-011	Consulter ses dossiers	Citoyen	Haute	La liste personnelle est filtrable par statut.
RF-012	Soumettre une réclamation	Citoyen	Moyenne	Une réclamation est créée avec référence et statut.
RF-013	Consulter les dossiers à traiter	Agent	Haute	L’agent voit uniquement les dossiers relevant de son périmètre.
RF-014	Contrôler les pièces	Agent	Haute	Chaque pièce peut être acceptée, refusée ou marquée à corriger.
RF-015	Changer le statut d’un dossier	Agent	Haute	Le changement est enregistré dans l’historique.
RF-016	Ajouter une observation	Agent	Haute	Une observation est liée au dossier et horodatée.
RF-017	Gérer les procédures	Administrateur	Haute	L’administrateur peut créer, modifier, publier ou désactiver une procédure.
RF-018	Gérer les utilisateurs et rôles	Administrateur	Haute	Les droits sont attribués selon le rôle.
RF-019	Consulter les statistiques	Responsable/Admin	Moyenne	Les indicateurs peuvent être filtrés par période et statut.
RF-020	Gérer les notifications	Administrateur	Moyenne	Les modèles ou règles de notification sont configurables.
RF-021	Rechercher un service	Citoyen	Moyenne	Les services sont recherchables selon localisation ou catégorie.
RF-022	Journaliser les actions sensibles	Système	Haute	Les actions critiques produisent une trace exploitable.

9. Exigences non fonctionnelles
ID	Domaine	Exigence
RNF-001	Sécurité	Contrôle d’accès par rôle, mots de passe protégés, validation des entrées.
RNF-002	Confidentialité	Un utilisateur ne peut accéder qu’aux données autorisées.
RNF-003	Traçabilité	Les actions sensibles sont historisées avec date et acteur.
RNF-004	Performance	Les écrans courants doivent rester fluides dans les conditions normales de démonstration.
RNF-005	Disponibilité	L’application doit pouvoir être redémarrée et restaurée selon une procédure documentée.
RNF-006	Maintenabilité	Le code est structuré par responsabilités et documenté.
RNF-007	Évolutivité	L’architecture permet l’ajout de procédures et fonctionnalités sans refonte complète.
RNF-008	Compatibilité	L’application doit fonctionner sur les navigateurs modernes courants.
RNF-009	Responsive	Les interfaces principales doivent être utilisables sur desktop, tablette et mobile.
RNF-010	Accessibilité	Contrastes, labels, navigation claire et messages d’erreur compréhensibles.
RNF-011	Intégrité	Les statuts et documents doivent rester cohérents avec le dossier concerné.
RNF-012	Sauvegarde	Une stratégie de sauvegarde de la base et des fichiers doit être définie pour le déploiement.

10. Description détaillée des modules
Module	Description
M01 — Authentification	Inscription, connexion, déconnexion, récupération d’accès, gestion de session.
M02 — Procédures	Catalogue, recherche, fiche détaillée, conditions, pièces, étapes, service compétent.
M03 — Dossiers	Création, brouillon, soumission, consultation, historique, clôture.
M04 — Documents	Ajout, téléchargement autorisé, validation, refus, demande de correction.
M05 — Traitement agent	File de travail, filtres, consultation dossier, actions de traitement, commentaires.
M06 — Notifications	Notifications liées aux changements de statut, documents et messages importants.
M07 — Réclamations	Création, suivi, traitement et clôture des réclamations.
M08 — Géolocalisation	Recherche de services et affichage de points d’accueil lorsque les coordonnées sont disponibles.
M09 — Statistiques	Volumes, statuts, délais, tendances et indicateurs de suivi.
M10 — Administration	Utilisateurs, rôles, procédures, services, paramètres et journaux.

11. Cas d’utilisation
ID	Cas d’utilisation	Acteur principal	Précondition	Résultat attendu
UC-01	S’inscrire	Citoyen	Aucun compte existant	Compte créé.
UC-02	Consulter une procédure	Citoyen	Accès à la plateforme	Informations affichées.
UC-03	Déposer une demande	Citoyen	Compte authentifié	Dossier créé et soumis.
UC-04	Suivre un dossier	Citoyen	Dossier existant	Statut et historique affichés.
UC-05	Compléter un dossier	Citoyen	Correction demandée	Pièce ou information mise à jour.
UC-06	Traiter un dossier	Agent	Agent authentifié et habilité	Dossier traité ou transmis à l’étape suivante.
UC-07	Gérer les procédures	Administrateur	Droits administrateur	Référentiel à jour.
UC-08	Consulter les statistiques	Responsable	Droits de consultation	Indicateurs affichés.
UC-09	Déposer une réclamation	Citoyen	Compte authentifié	Réclamation enregistrée.
UC-10	Administrer les utilisateurs	Administrateur	Droits administrateur	Utilisateur/rôle géré.

12. Cycle de vie d’un dossier
Le workflow ci-dessous sert de référence fonctionnelle. Les transitions doivent être contrôlées par le système afin d’éviter des changements de statut incohérents.
WORKFLOW CIBLE
BROUILLON → SOUMIS → EN VÉRIFICATION → EN TRAITEMENT → VALIDÉ → TERMINÉ
                         ↘ CORRECTION DEMANDÉE → SOUMIS
                         ↘ REJETÉ → CLÔTURÉ

Statut	Signification	Acteur autorisé à déclencher
BROUILLON	Dossier commencé mais non soumis.	Citoyen
SOUMIS	Demande transmise à l’administration.	Citoyen
EN VÉRIFICATION	Contrôle des informations et pièces.	Agent
CORRECTION DEMANDÉE	Une action est nécessaire du côté citoyen.	Agent
EN TRAITEMENT	Dossier recevable en cours de traitement.	Agent
VALIDÉ	Décision favorable enregistrée.	Agent habilité
REJETÉ	Décision défavorable enregistrée avec motif.	Agent habilité
TERMINÉ	Processus administratif achevé.	Système/Agent

13. Règles de gestion
ID	Règle
RG-001	Chaque utilisateur possède un identifiant unique.
RG-002	Chaque dossier possède une référence unique.
RG-003	Un dossier est associé à une seule procédure à un instant donné.
RG-004	Une demande ne peut être soumise si les éléments obligatoires ne sont pas renseignés.
RG-005	Les changements de statut importants sont historisés.
RG-006	Un agent ne peut traiter que les dossiers relevant de son périmètre d’habilitation.
RG-007	Une pièce refusée doit être accompagnée d’un motif ou d’une indication de correction.
RG-008	Un citoyen ne peut consulter que ses propres dossiers.
RG-009	Un utilisateur désactivé ne peut plus ouvrir une nouvelle session.
RG-010	Les actions administratives sensibles doivent être journalisées.
RG-011	Une notification est déclenchée lorsqu’un événement configuré survient.
RG-012	Les données affichées dans les statistiques doivent être cohérentes avec les données enregistrées.

14. Données et modèle conceptuel
Le modèle de données doit refléter le cycle de vie complet d’une démarche. Les noms exacts des tables et attributs seront arrêtés lors de la conception MCD/MLD.
Entité	Rôle	Exemples d’informations
Utilisateur	Identité et accès	nom, prénom, email, téléphone, mot de passe protégé, rôle, statut
Rôle	Habilitation	citoyen, agent, administrateur, responsable
Procédure	Référentiel administratif	nom, description, conditions, délai indicatif, pièces
Service	Point administratif	nom, adresse, téléphone, coordonnées
Dossier	Instance d’une démarche	référence, procédure, citoyen, statut, dates
Document	Pièce d’un dossier	type, nom, chemin sécurisé, statut de validation
HistoriqueStatut	Traçabilité	ancien statut, nouveau statut, acteur, date, commentaire
Notification	Information utilisateur	type, contenu, date, lu/non lu
Réclamation	Remontée citoyenne	référence, dossier, motif, statut, réponse
JournalAction	Audit	acteur, action, objet, date, résultat

MODÉLISATION ATTENDUE
Le MCD devra notamment faire apparaître les cardinalités entre Utilisateur, Dossier, Procédure, Document, Historique, Notification, Réclamation et Service. Le MLD devra ensuite traduire ces relations en tables, clés primaires et clés étrangères.

15. Architecture fonctionnelle et technique
15.1 Architecture fonctionnelle
CHAÎNE FONCTIONNELLE
CITOYEN → INTERFACE WEB → API → SERVICES MÉTIER → BASE DE DONNÉES
                         ↘ stockage sécurisé des documents
                         ↘ service de notifications
                         ↘ journalisation / statistiques

15.2 Architecture technique cible
Couche	Responsabilité	Principes
Présentation	Interfaces citoyen, agent, administration	Composants réutilisables, responsive, validation côté client.
API	Entrées/sorties et authentification	Endpoints structurés, validation, réponses cohérentes.
Métier	Règles de gestion	Séparer les règles métier de la présentation.
Persistance	Accès aux données	Modèles, migrations, relations, contraintes d’intégrité.
Fichiers	Documents justificatifs	Stockage sécurisé, noms non prévisibles, contrôle des types.
Notifications	Information des utilisateurs	Événements métier et modèles de notification.
Journalisation	Audit	Traçabilité des actions sensibles.

15.3 Technologies envisagées
•	Front-End : React + Vite.
•	Back-End : Laravel / PHP.
•	API : API REST.
•	Base de données : MySQL.
•	Versionnement : Git / GitHub.
•	Outils de conception : Figma et outils UML.
•	Tests API : Postman et/ou outil équivalent.
•	Environnement local : VS Code, serveur PHP/Laravel et Node.js.
CHOIX TECHNOLOGIQUE
Les technologies sont proposées en fonction des compétences de l’équipe et des besoins du projet. Toute technologie retenue définitivement devra être cohérente avec l’environnement de développement, la documentation disponible et les contraintes du projet.

16. API et contrats d’échange
Le Front-End communique avec le Back-End au moyen d’une API. Les endpoints seront documentés avec méthode HTTP, URL, paramètres, authentification, corps de requête, réponse et codes d’erreur.
Méthode	Endpoint indicatif	Rôle	Objectif
POST	/api/auth/register	Public	Créer un compte
POST	/api/auth/login	Public	Authentifier un utilisateur
GET	/api/procedures	Citoyen	Lister les procédures
GET	/api/procedures/{id}	Citoyen	Détail d’une procédure
POST	/api/dossiers	Citoyen	Créer un dossier
GET	/api/dossiers	Citoyen	Lister ses dossiers
GET	/api/dossiers/{id}	Citoyen/Agent	Consulter un dossier autorisé
POST	/api/dossiers/{id}/documents	Citoyen	Ajouter une pièce
PATCH	/api/dossiers/{id}/status	Agent	Modifier le statut
GET	/api/notifications	Utilisateur	Lister les notifications
POST	/api/reclamations	Citoyen	Créer une réclamation
GET	/api/statistics	Admin/Responsable	Consulter les indicateurs

16.1 Format de réponse recommandé
Les réponses API doivent adopter une structure cohérente : succès ou erreur, message, données éventuelles, erreurs de validation et métadonnées de pagination lorsque nécessaire.
17. Sécurité et protection des données
La plateforme manipule des données personnelles et potentiellement des documents justificatifs. La sécurité doit donc être intégrée dès la conception et vérifiée lors des tests.
Mesure	Exigence
Authentification	Les mots de passe ne sont jamais stockés en clair.
Autorisation	Les permissions sont contrôlées côté serveur et pas uniquement dans l’interface.
Validation	Les entrées utilisateur sont validées et nettoyées selon leur contexte.
Fichiers	Type, taille et accès aux documents sont contrôlés.
Sessions	Les sessions et jetons d’authentification doivent être protégés.
Audit	Les actions sensibles sont enregistrées.
Secrets	Les clés et mots de passe techniques ne sont pas commités dans Git.
Sauvegarde	Les données critiques disposent d’une stratégie de sauvegarde pour le déploiement.
Confidentialité	Les informations ne sont visibles que par les acteurs habilités.

17.1 Menaces à considérer
•	Tentatives de connexion non autorisées.
•	Accès direct à un dossier d’un autre citoyen.
•	Upload d’un fichier non autorisé.
•	Injection SQL ou requêtes malveillantes.
•	XSS et contenu non échappé.
•	Fuite de clés API ou variables d’environnement.
•	Modification frauduleuse d’un statut.
18. UI/UX et accessibilité
L’interface doit inspirer confiance et réduire la charge cognitive. Une démarche administrative doit être présentée comme un parcours guidé plutôt que comme une succession d’écrans techniques.
•	Navigation simple et cohérente.
•	Statut du dossier visible rapidement.
•	Timeline des étapes de traitement.
•	Messages d’erreur compréhensibles et actionnables.
•	Formulaires découpés en étapes lorsque nécessaire.
•	Confirmation avant les actions irréversibles.
•	Responsive design.
•	Contrastes et tailles de texte lisibles.
•	Icônes accompagnées de libellés lorsque leur signification n’est pas évidente.
•	États visuels : chargement, succès, erreur, vide, accès refusé.
18.1 Écrans attendus
Écran	Contenu principal
Accueil	Présentation, recherche de procédure, accès connexion/inscription.
Catalogue	Liste, recherche, filtres, catégories.
Détail procédure	Description, conditions, pièces, étapes, service compétent.
Tableau de bord citoyen	Résumé des dossiers, statuts, notifications.
Détail dossier	Référence, timeline, pièces, messages, historique.
Espace agent	File de dossiers, filtres, détail et actions.
Administration	Utilisateurs, procédures, services, statistiques, journaux.
Notifications	Liste des événements et état lu/non lu.
Réclamations	Création et suivi des réclamations.

19. Gestion des erreurs
Situation	Comportement attendu
Identifiants invalides	Message générique et non révélateur d’informations sensibles.
Formulaire incomplet	Afficher les champs concernés et expliquer la correction.
Fichier trop volumineux	Indiquer la limite et les formats acceptés.
Accès interdit	Afficher une page d’autorisation insuffisante sans divulguer la ressource.
Dossier inexistant	Afficher une réponse claire et ne pas exposer de données.
Erreur serveur	Message utilisateur simple + journalisation technique côté serveur.
Réseau indisponible	Indiquer que l’action n’a pas été confirmée et éviter les doublons.

20. Stratégie de tests
La qualité ne doit pas être évaluée uniquement lors de la démonstration finale. Les tests sont liés aux exigences afin de vérifier que chaque fonctionnalité attendue est réellement couverte.
Type	Objectif	Exemples
Tests unitaires	Vérifier les fonctions ou règles isolées.	Validation d’un statut, calcul d’un indicateur.
Tests d’intégration	Vérifier les interactions entre composants.	API + base de données.
Tests API	Vérifier les contrats HTTP.	Authentification, CRUD, erreurs.
Tests fonctionnels	Vérifier les parcours utilisateur.	Dépôt complet d’un dossier.
Tests sécurité	Chercher des accès non autorisés.	Accès à un dossier tiers.
Tests responsive	Vérifier l’interface selon les tailles.	Desktop, tablette, mobile.
Tests de régression	Vérifier qu’une modification n’a pas cassé l’existant.	Après évolution d’un module.
Tests d’acceptation	Vérifier les critères de validation du projet.	Scénarios de démonstration.

21. Matrice de traçabilité
Exigence	Fonction	Cas d’utilisation	Test	Preuve attendue
RF-001	Inscription	UC-01	Test fonctionnel	Compte créé
RF-004	Catalogue procédures	UC-02	Test fonctionnel	Procédure visible
RF-007	Dépôt demande	UC-03	Test intégration	Dossier enregistré
RF-009	Suivi dossier	UC-04	Test fonctionnel	Statut + historique
RF-014	Contrôle pièces	UC-06	Test fonctionnel	Pièce validée/refusée
RF-015	Changement statut	UC-06	Test sécurité + fonctionnel	Transition autorisée
RF-017	Gestion procédures	UC-07	Test admin	CRUD contrôlé
RF-019	Statistiques	UC-08	Test fonctionnel	Indicateurs cohérents
RF-022	Journalisation	UC-06/07	Test audit	Trace créée

22. Critères d’acceptation du projet
LE PROJET EST CONSIDÉRÉ DÉMONTRABLE LORSQUE
un citoyen peut réaliser une démarche de bout en bout, un agent peut la traiter selon un workflow contrôlé, le citoyen voit les changements de statut et les notifications, et l’administrateur peut piloter les référentiels et consulter des indicateurs.

11.	Créer un compte de démonstration.
12.	Se connecter avec un rôle citoyen.
13.	Consulter une procédure.
14.	Créer un dossier et ajouter les pièces demandées.
15.	Soumettre le dossier.
16.	Se connecter en agent et retrouver le dossier.
17.	Contrôler une pièce ou demander une correction.
18.	Changer le statut du dossier.
19.	Vérifier la notification côté citoyen.
20.	Consulter l’historique du dossier.
21.	Se connecter en administrateur et consulter les indicateurs.
23. Planification prévisionnelle
Phase	Activités	Livrables
S1 — Cadrage	Sujet, objectifs, périmètre, acteurs	Cahier des charges v2
S2 — Analyse	Besoins, existant, règles métier	Spécifications + exigences
S3 — Conception	UML, MCD/MLD, architecture	Dossiers de conception
S4 — UX/UI	Wireframes, maquettes, design system	Maquettes validées
S5–S6 — Back-End	Base, migrations, API, auth, règles	API fonctionnelle
S5–S6 — Front-End	Pages, composants, navigation, formulaires	Interface fonctionnelle
S7 — Intégration	Connexion Front/Back, corrections	Version intégrée
S8 — Tests	Tests fonctionnels, sécurité, responsive	PV de tests
S9 — Documentation	README, API, rapport, captures	Dossier final
S10 — Soutenance	Scénario, répétition, démonstration	Présentation finale

24. Organisation et répartition des responsabilités
Membre	Responsabilités proposées	Livrables principaux
Aida Sy Ndoye	Coordination / Front-End / intégration	Interfaces, intégration, suivi qualité
Fatou Thior	Front-End / UX/UI	Écrans, composants, responsive
Sokhna Cissé	Back-End / données	API, base, règles métier
Moustapha Gueye	Tests / documentation / intégration	Tests, API doc, rapport, préparation démo

La répartition pourra évoluer. L’objectif est que chaque membre puisse expliquer une partie du système pendant la soutenance et que les décisions techniques soient connues collectivement.
25. Analyse des risques
Risque	Probabilité	Impact	Prévention	Plan de réponse
Retard de développement	Moyenne	Fort	Prioriser le MVP et suivre les tâches.	Réduire les fonctionnalités secondaires.
Erreurs d’intégration Front/Back	Moyenne	Fort	Définir les contrats API tôt.	Tester chaque endpoint indépendamment.
Perte de données	Faible	Très fort	Sauvegardes + Git.	Restaurer depuis une sauvegarde.
Faille d’autorisation	Moyenne	Très fort	Tests par rôle.	Bloquer l’accès et corriger côté serveur.
Périmètre trop large	Forte	Fort	MVP explicite.	Reporter les évolutions futures.
Problème lors de la démo	Moyenne	Fort	Répétitions + données de démonstration.	Prévoir un scénario de secours.
Dépendance à un service externe	Moyenne	Moyen	Limiter les dépendances critiques.	Prévoir un mode dégradé.

26. Indicateurs de réussite et qualité
Indicateur	Cible projet
Exigences fonctionnelles critiques couvertes	100 % des exigences MVP
Parcours principal citoyen	Réalisable de bout en bout
Contrôle des rôles	Testé pour chaque rôle
API documentée	Endpoints principaux documentés
Tests critiques	Tous exécutés avant soutenance
Responsive	Écrans principaux vérifiés sur plusieurs tailles
Données de démonstration	Jeu de données cohérent et réaliste
Documentation	README + API + rapport + cahier des charges disponibles
Traçabilité	Actions et statuts importants historisés

27. MVP et stratégie d’évolution
Niveau	Fonctionnalités
MVP — indispensable	Auth, rôles, procédures, dossiers, documents, workflow, suivi, notifications, espace agent, administration de base.
V2 — amélioration	Géolocalisation enrichie, statistiques avancées, réclamations avancées, meilleure personnalisation.
V3 — évolution	Application mobile, paiement, signature électronique, interopérabilité, assistant intelligent.

28. Scénario de démonstration devant le jury
La démonstration doit raconter une histoire utilisateur et non présenter une succession de pages. Le scénario recommandé suit un dossier fictif de bout en bout.
Étape	Démonstration	Message à faire passer
1	Accueil → recherche d’une procédure	La plateforme oriente le citoyen.
2	Fiche procédure	Le citoyen connaît conditions et pièces.
3	Création du dossier	La demande reçoit une référence.
4	Ajout des pièces	Les justificatifs sont centralisés.
5	Soumission	Le dossier entre dans le workflow.
6	Vue agent	L’administration retrouve et traite le dossier.
7	Changement de statut	Chaque étape est traçable.
8	Notification	Le citoyen est informé.
9	Vue citoyen	Le suivi est transparent.
10	Vue admin	Le responsable pilote grâce aux statistiques.

29. Livrables attendus
•	Cahier des charges final.
•	Maquettes UI/UX.
•	Diagramme de cas d’utilisation.
•	Diagrammes de séquence principaux.
•	Diagramme de classes.
•	MCD et MLD.
•	Code source Front-End.
•	Code source Back-End.
•	Base de données, migrations et seeders.
•	Documentation API.
•	README d’installation et de lancement.
•	Plan et rapport de tests.
•	Rapport technique.
•	Présentation de soutenance.
•	Jeu de données de démonstration.
30. Déploiement et mise en service
22.	Préparer l’environnement serveur et les variables de configuration.
23.	Installer les dépendances Front-End et Back-End.
24.	Configurer la base de données.
25.	Exécuter les migrations et seeders nécessaires.
26.	Configurer le stockage des documents.
27.	Configurer les mécanismes d’authentification et de notification.
28.	Effectuer les tests de fumée après déploiement.
29.	Créer les comptes de démonstration.
30.	Documenter la procédure de démarrage et de restauration.
PRINCIPE
Les secrets, mots de passe et clés techniques ne doivent jamais être intégrés au dépôt Git. Les paramètres d’environnement doivent être documentés sans exposer leurs valeurs sensibles.

31. Maintenance et évolutions
Type	Objectif	Exemple
Corrective	Corriger un défaut.	Erreur lors de l’upload d’une pièce.
Préventive	Réduire les risques futurs.	Mise à jour des dépendances.
Évolutive	Ajouter une fonctionnalité.	Nouvelle procédure administrative.
Adaptative	Adapter la solution à son environnement.	Évolution d’une API ou d’un serveur.

32. Dossier de modélisation UML à produire
Diagramme	Contenu minimum attendu	Objectif
Cas d’utilisation	Citoyen, Agent, Administrateur, Responsable	Délimiter les interactions.
Séquence — dépôt	Citoyen → Front → API → service → DB	Montrer le traitement d’une demande.
Séquence — traitement	Agent → API → dossier → historique → notification	Montrer le changement de statut.
Classes	Utilisateur, Dossier, Procédure, Document, etc.	Structurer le modèle objet.
Activité	Workflow du dossier	Visualiser les décisions et transitions.
Architecture	Front / API / DB / services	Expliquer la solution technique.

33. Matrice synthétique des exigences
Catégorie	Codes	Priorité dominante	Responsable de validation
Authentification	RF-001 à RF-003	Haute	Équipe + encadreur
Procédures	RF-004 à RF-005, RF-017	Haute	Équipe + encadreur
Dossiers	RF-006 à RF-009, RF-011	Haute	Équipe + encadreur
Documents	RF-008, RF-014	Haute	Équipe
Notifications	RF-010, RF-020	Haute/Moyenne	Équipe
Administration	RF-017, RF-018, RF-022	Haute	Équipe
Pilotage	RF-019	Moyenne	Équipe + encadreur
Réclamations	RF-012	Moyenne	Équipe
Géolocalisation	RF-021	Moyenne	Équipe
Qualité	RNF-001 à RNF-012	Haute	Équipe + encadreur

34. Conclusion
Ce cahier des charges définit une vision complète de la plateforme : le problème à résoudre, les utilisateurs concernés, le périmètre, les exigences, les règles métier, le workflow, les données, l’architecture, la sécurité, les tests, la planification et les critères d’acceptation.
La valeur du projet réside dans sa capacité à rapprocher l’administration du citoyen par un parcours numérique clair et traçable. La plateforme doit être pensée comme un véritable produit de service public numérique : utile, compréhensible, sécurisé, évolutif et mesurable.
MESSAGE FINAL POUR LA SOUTENANCE
Notre objectif n’est pas simplement de développer une application. Nous concevons une expérience administrative numérique qui donne au citoyen de la visibilité et à l’administration des outils de traitement et de pilotage.

35. Annexes recommandées pour le dossier final
•	Annexe A — Diagramme de cas d’utilisation.
•	Annexe B — Diagrammes de séquence.
•	Annexe C — Diagramme de classes.
•	Annexe D — MCD / MLD.
•	Annexe E — Architecture technique.
•	Annexe F — Maquettes UI/UX.
•	Annexe G — Captures d’écran de l’application.
•	Annexe H — Documentation API.
•	Annexe I — Plan et résultats des tests.
•	Annexe J — Jeu de données / comptes de démonstration.
•	Annexe K — Glossaire.
36. Glossaire
Terme	Définition
Citoyen	Utilisateur réalisant une démarche administrative.
Agent	Utilisateur habilité à instruire ou traiter des dossiers.
Administrateur	Utilisateur responsable de la configuration et de l’administration de la plateforme.
Dossier	Ensemble des informations et pièces liées à une demande.
Procédure	Processus administratif décrit par des étapes, conditions et pièces.
API	Interface permettant aux applications d’échanger des données.
MCD	Modèle conceptuel de données.
MLD	Modèle logique de données.
MVP	Version minimale permettant de démontrer la valeur principale du produit.
Traçabilité	Capacité à retrouver les actions et événements importants liés à une donnée.

37. Checklist de préparation avant soutenance
Contrôle	OK à vérifier
Cahier des charges relu et validé	☐
Sommaire mis à jour dans Word	☐
UML terminés	☐
MCD/MLD terminés	☐
Maquettes cohérentes avec l’application	☐
Base de données propre + seeders	☐
Comptes de démonstration fonctionnels	☐
Parcours citoyen testé	☐
Parcours agent testé	☐
Parcours administrateur testé	☐
API documentée	☐
Tests critiques exécutés	☐
Captures d’écran prêtes	☐
Présentation préparée	☐
Scénario de secours prévu	☐

---

## Choix faits avec Claude

Your questions have been answered: "Comment voulez-vous qu'on avance ?"="Module par module (Recommandé)", "Quel nom et quelle identité visuelle pour la plateforme ?"="« Suivi Démarches » sobre (Recommandé)". You can now continue with these answers in mind.
