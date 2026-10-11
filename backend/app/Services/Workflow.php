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
    public static function changerStatut(Dossier $dossier, StatutDossier $cible, User $acteur, ?string $commentaire = null): Dossier
    {
        $actuel = $dossier->statut;
        $role = $acteur->role === Role::Citoyen ? 'citoyen' : 'agent';

        if (! $actuel->peutAller($cible, $role)) {
            throw ValidationException::withMessages([
                'statut' => "Le dossier ne peut pas passer de « {$actuel->libelle()} » à « {$cible->libelle()} ».",
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
                StatutDossier::Termine, StatutDossier::Cloture => $dossier->cloture_at = now(),
                default => null,
            };

            if ($cible === StatutDossier::Rejete) {
                $dossier->motif_decision = $commentaire;
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
        $dossier->loadMissing(['procedure', 'citoyen', 'agent']);
        $variables = [
            'reference' => $dossier->reference,
            'procedure' => $dossier->procedure->titre,
            'statut' => $apres->libelle(),
            'commentaire' => $commentaire,
            'citoyen' => $dossier->citoyen->nom_complet,
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
