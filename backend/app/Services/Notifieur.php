<?php

namespace App\Services;

use App\Models\ModeleNotification;
use App\Models\User;
use App\Notifications\NotificationPlateforme;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;

/**
 * RG-011 : une notification est déclenchée lorsqu'un événement configuré survient.
 * RF-020 : le texte de chaque notification provient d'un modèle modifiable par l'administrateur.
 */
class Notifieur
{
    /**
     * Modèles par défaut (aussi utilisés pour initialiser la base).
     * Variables disponibles : {reference}, {procedure}, {statut}, {commentaire}, {piece}, {citoyen}, {agent}.
     */
    public const MODELES = [
        // --- Citoyen ---
        'dossier.soumis' => ['Demande transmise (citoyen)', 'Demande transmise', 'Votre demande {reference} ({procedure}) a bien été transmise à l’administration. Vous serez informé de chaque étape.', true],
        'dossier.en_verification' => ['Prise en charge', 'Dossier pris en charge', 'Votre dossier {reference} est en cours de vérification par un agent.', false],
        'dossier.correction_demandee' => ['Correction demandée', 'Action requise sur votre dossier', 'Une correction est nécessaire sur votre dossier {reference} : {commentaire}', true],
        'dossier.en_traitement' => ['Dossier recevable', 'Dossier recevable', 'Votre dossier {reference} est complet et en cours de traitement.', false],
        'dossier.valide' => ['Décision favorable', 'Bonne nouvelle : demande validée', 'Votre demande {reference} ({procedure}) a reçu une décision favorable. Votre document est en cours de préparation : vous serez prévenu dès qu’il sera prêt à retirer.', true],
        'dossier.pret_a_retirer' => ['Document prêt à retirer', 'Votre document est prêt', 'Votre demande {reference} ({procedure}) a été traitée : votre document est prêt. Vous pouvez le récupérer auprès de : {administration}. Présentez votre code de retrait, affiché dans votre espace, et une pièce d’identité.', true],
        'dossier.rejete' => ['Décision défavorable', 'Décision sur votre demande', 'Votre demande {reference} n’a pas pu aboutir. Motif : {commentaire}', true],
        'dossier.termine' => ['Démarche terminée', 'Démarche terminée', 'Votre document vous a été remis : la démarche {reference} est terminée. Merci d’avoir utilisé Suivi Démarches.', false],
        'dossier.cloture' => ['Dossier clôturé', 'Dossier clôturé', 'Le dossier {reference} a été clôturé.', false],
        'document.accepte' => ['Pièce acceptée', 'Pièce validée', 'Votre pièce « {piece} » a été acceptée (dossier {reference}).', false],
        'document.refuse' => ['Pièce refusée', 'Pièce refusée', 'Votre pièce « {piece} » a été refusée (dossier {reference}). Motif : {commentaire}', false],
        'document.a_corriger' => ['Pièce à corriger', 'Pièce à corriger', 'Votre pièce « {piece} » doit être corrigée (dossier {reference}) : {commentaire}', false],
        'observation.agent' => ['Message de l’administration', 'Nouveau message', 'L’administration a laissé un message sur votre dossier {reference}.', false],
        'reclamation.reponse' => ['Réponse à une réclamation', 'Réponse à votre réclamation', 'Votre réclamation {reference} a reçu une réponse.', true],
        // --- Agents ---
        'agent.dossier_nouveau' => ['Nouveau dossier (agents)', 'Nouveau dossier à traiter', '{citoyen} a déposé le dossier {reference} ({procedure}).', false],
        'agent.dossier_resoumis' => ['Dossier corrigé (agents)', 'Dossier corrigé', '{citoyen} a complété le dossier {reference} suite à votre demande de correction.', false],
        'agent.observation_citoyen' => ['Message du citoyen (agents)', 'Nouveau message', '{citoyen} a écrit sur le dossier {reference}.', false],
        'admin.reclamation_nouvelle' => ['Nouvelle réclamation (administration)', 'Nouvelle réclamation', '{citoyen} a déposé la réclamation {reference}.', false],
    ];

    /**
     * @param  User|Collection<int, User>|iterable<User>  $destinataires
     */
    public static function envoyer(string $evenement, $destinataires, array $variables = [], ?string $lien = null, array $contexte = []): void
    {
        $modele = ModeleNotification::firstWhere('evenement', $evenement);
        if ($modele && ! $modele->actif) {
            return;
        }

        [, $titreDefaut, $messageDefaut, $emailDefaut] = self::MODELES[$evenement] ?? [null, $evenement, '', false];
        $titre = $modele?->titre ?? $titreDefaut;
        $message = $modele?->message ?? $messageDefaut;
        $email = $modele?->email ?? $emailDefaut;

        $remplacer = fn (string $t) => preg_replace_callback('/\{(\w+)\}/', fn ($m) => (string) ($variables[$m[1]] ?? ''), $t);

        $notification = new NotificationPlateforme(
            $evenement,
            $remplacer($titre),
            trim($remplacer($message)),
            $lien,
            $contexte,
            $email,
        );

        foreach (collect($destinataires instanceof User ? [$destinataires] : $destinataires)->filter() as $user) {
            try {
                $user->notify($notification);
            } catch (\Throwable $e) {
                // Une panne d'envoi d'e-mail ne doit jamais bloquer le traitement du dossier.
                Log::warning("Notification {$evenement} non envoyée à l'utilisateur {$user->id} : {$e->getMessage()}");
            }
        }
    }
}
