<?php

namespace App\Services;

use App\Enums\Role;
use App\Enums\StatutDossier;
use App\Models\Dossier;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Moteur du cycle de vie des dossiers (§12).
 * Toute modification de statut passe par ici : contrôle de la transition (RF-015),
 * historisation (RG-005), journalisation (RF-022) et notification (RG-011).
 */
class Workflow
{
    /**
     * Remise du document au demandeur (PRÊT À RETIRER → TERMINÉ).
     * L'agent saisit le code de retrait que lui présente le citoyen : sans le bon code,
     * le dossier ne peut pas être clôturé.
     */
    public static function remettre(Dossier $dossier, User $agent, string $code): Dossier
    {
        if ($dossier->statut !== StatutDossier::PretARetirer) {
            throw ValidationException::withMessages([
                'code_retrait' => 'Ce dossier n’est pas en attente de retrait.',
            ]);
        }

        $code = preg_replace('/\D/', '', $code);
        if (! $dossier->code_retrait || ! hash_equals($dossier->code_retrait, $code)) {
            Journal::enregistrer('dossier.retrait_refuse', $dossier, ['reference' => $dossier->reference], 'echec', $agent);

            throw ValidationException::withMessages([
                'code_retrait' => 'Code de retrait incorrect. Demandez au citoyen le code affiché dans son espace.',
            ]);
        }

        return self::changerStatut(
            $dossier,
            StatutDossier::Termine,
            $agent,
            'Document remis au demandeur après vérification de son code de retrait et de son identité.',
            remiseVerifiee: true,
        );
    }

    public static function changerStatut(Dossier $dossier, StatutDossier $cible, User $acteur, ?string $commentaire = null, bool $remiseVerifiee = false): Dossier
    {
        $actuel = $dossier->statut;
        $role = $acteur->role === Role::Citoyen ? 'citoyen' : 'agent';

        if (! $actuel->peutAller($cible, $role)) {
            throw ValidationException::withMessages([
                'statut' => "Le dossier ne peut pas passer de « {$actuel->libelle()} » à « {$cible->libelle()} ».",
            ]);
        }

        // Le document ne peut être déclaré remis qu'après vérification du code de retrait (voir remettre()).
        if ($actuel === StatutDossier::PretARetirer && $cible === StatutDossier::Termine && ! $remiseVerifiee) {
            throw ValidationException::withMessages([
                'statut' => 'Saisissez le code de retrait du citoyen pour enregistrer la remise du document.',
            ]);
        }

        // RG-007 / §12 : une demande de correction ou un rejet doit être motivé.
        if ($cible->exigeCommentaire() && blank($commentaire)) {
            throw ValidationException::withMessages([
                'commentaire' => $cible === StatutDossier::Rejete
                    ? 'Indiquez le motif du rejet : il sera communiqué au citoyen.'
                    : 'Expliquez au citoyen ce qu’il doit corriger.',
            ]);
        }

        // RF-014 : une demande ne peut être validée que si chaque pièce obligatoire a été acceptée.
        if ($cible === StatutDossier::Valide) {
            $dossier->unsetRelation('documents');
            $nonAcceptees = $dossier->piecesNonAcceptees();
            if ($nonAcceptees->isNotEmpty()) {
                throw ValidationException::withMessages([
                    'statut' => 'Acceptez d’abord les pièces obligatoires avant de valider la demande : '.$nonAcceptees->pluck('libelle')->implode(', ').'.',
                ]);
            }
        }

        // RG-004 : une demande ne peut être soumise si les éléments obligatoires manquent.
        if ($cible === StatutDossier::Soumis) {
            $erreurs = [];
            if (blank($dossier->motif)) {
                $erreurs['motif'] = 'Précisez l’objet de votre demande avant de la soumettre.';
            }
            $manquantes = $dossier->piecesManquantes();
            if ($manquantes->isNotEmpty()) {
                $erreurs['pieces'] = 'Pièces obligatoires manquantes : '.$manquantes->pluck('libelle')->implode(', ').'.';
            }
            if ($erreurs) {
                throw ValidationException::withMessages($erreurs);
            }
        }

        DB::transaction(function () use ($dossier, $actuel, $cible, $acteur, $commentaire) {
            $dossier->statut = $cible;

            match ($cible) {
                StatutDossier::Soumis => $dossier->soumis_at ??= now(),
                StatutDossier::Valide, StatutDossier::Rejete => $dossier->decision_at = now(),
                StatutDossier::PretARetirer => $dossier->pret_at = now(),
                StatutDossier::Termine, StatutDossier::Cloture => $dossier->cloture_at = now(),
                default => null,
            };

            if ($cible === StatutDossier::Rejete) {
                $dossier->motif_decision = $commentaire;
            }
            if ($cible === StatutDossier::Termine) {
                $dossier->retire_at = now();
            }

            // Le premier agent qui agit sur le dossier en devient le responsable.
            if ($acteur->role === Role::Agent && ! $dossier->agent_id) {
                $dossier->agent_id = $acteur->id;
            }

            $dossier->save();

            $dossier->historique()->create([
                'user_id' => $acteur->id,
                'ancien_statut' => $actuel->value,
                'nouveau_statut' => $cible->value,
                'commentaire' => $commentaire,
            ]);

            Journal::enregistrer('dossier.statut', $dossier, [
                'avant' => ['statut' => $actuel->value],
                'apres' => ['statut' => $cible->value],
            ], acteur: $acteur);
        });

        self::notifier($dossier, $actuel, $cible, $commentaire);

        return $dossier;
    }

    private static function notifier(Dossier $dossier, StatutDossier $avant, StatutDossier $apres, ?string $commentaire): void
    {
        $dossier->loadMissing(['procedure', 'citoyen', 'agent', 'service']);
        $variables = [
            'reference' => $dossier->reference,
            'procedure' => $dossier->procedure->titre,
            'statut' => $apres->libelle(),
            'commentaire' => $commentaire,
            'citoyen' => $dossier->citoyen->nom_complet,
            // Lieu de retrait du document (notification « prêt à retirer »).
            'administration' => $dossier->service
                ? implode(', ', array_filter([$dossier->service->nom, $dossier->service->adresse, $dossier->service->commune]))
                : 'l’administration indiquée dans votre espace',
        ];
        $contexte = ['dossier_id' => $dossier->id, 'reference' => $dossier->reference, 'statut' => $apres->value];

        // Citoyen : à chaque changement de statut.
        Notifieur::envoyer("dossier.{$apres->value}", $dossier->citoyen, $variables, "/espace/dossiers/{$dossier->id}", $contexte);

        // Agents du service : nouveau dossier, ou dossier corrigé.
        if ($apres === StatutDossier::Soumis) {
            $destinataires = $avant === StatutDossier::CorrectionDemandee && $dossier->agent
                ? collect([$dossier->agent])
                : User::where('role', Role::Agent->value)->where('service_id', $dossier->service_id)->where('actif', true)->get();

            Notifieur::envoyer(
                $avant === StatutDossier::CorrectionDemandee ? 'agent.dossier_resoumis' : 'agent.dossier_nouveau',
                $destinataires,
                $variables,
                "/espace/traitement/{$dossier->id}",
                $contexte,
            );
        }
    }
}
