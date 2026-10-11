<?php

namespace App\Http\Controllers\Api;

use App\Enums\StatutDossier;
use App\Http\Controllers\Controller;
use App\Models\Dossier;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Suivi d'un dossier sans compte (RF-009) : la référence et le code de suivi figurant sur
 * l'accusé de réception suffisent. Aucune donnée personnelle n'est renvoyée : ni nom,
 * ni pièces, ni commentaires — seulement l'avancement.
 */
class SuiviController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $donnees = $request->validate([
            'reference' => ['required', 'string', 'max:30'],
            'code' => ['required', 'string', 'max:12'],
        ], [], ['reference' => 'référence', 'code' => 'code de suivi']);

        $dossier = Dossier::with(['procedure', 'service', 'historique'])
            ->where('reference', mb_strtoupper(trim($donnees['reference'])))
            ->where('statut', '!=', StatutDossier::Brouillon->value)
            ->first();

        // Même réponse que la référence ou le code soit faux : on ne révèle pas qu'un dossier existe.
        if (! $dossier || ! $dossier->code_suivi || ! hash_equals($dossier->code_suivi, mb_strtoupper(trim($donnees['code'])))) {
            return $this->erreur('Référence ou code de suivi incorrect. Vérifiez votre accusé de réception.', 404);
        }

        return $this->succes([
            'reference' => $dossier->reference,
            'demarche' => $dossier->procedure->titre,
            'administration' => $dossier->service ? [
                'nom' => $dossier->service->nom,
                'commune' => $dossier->service->commune,
                'telephone' => $dossier->service->telephone,
            ] : null,
            'statut' => $dossier->statut->value,
            'statut_libelle' => $dossier->statut->libelle(),
            'action_requise' => $dossier->statut === StatutDossier::CorrectionDemandee,
            'soumis_at' => $dossier->soumis_at?->toIso8601String(),
            'delai_jours' => $dossier->procedure->delai_jours,
            'en_retard' => $dossier->estEnRetard(),
            'updated_at' => $dossier->updated_at?->toIso8601String(),
            // Étapes franchies, sans les commentaires ni le nom des agents.
            'historique' => $dossier->historique
                ->reject(fn ($h) => $h->nouveau_statut === StatutDossier::Brouillon)
                ->map(fn ($h) => [
                    'statut' => $h->nouveau_statut->value,
                    'libelle' => $h->nouveau_statut->libelle(),
                    'date' => $h->created_at?->toIso8601String(),
                ])->values(),
        ]);
    }
}
