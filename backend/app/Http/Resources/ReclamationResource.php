<?php

namespace App\Http\Resources;

use App\Models\Reclamation;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Reclamation */
class ReclamationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'reference' => $this->reference,
            'motif' => $this->motif,
            'motif_libelle' => Reclamation::MOTIFS[$this->motif] ?? $this->motif,
            'sujet' => $this->sujet,
            'description' => $this->description,
            'statut' => $this->statut,
            'statut_libelle' => Reclamation::STATUTS[$this->statut] ?? $this->statut,
            'reponse' => $this->reponse,
            'traitee_at' => $this->traitee_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
            'citoyen' => $this->whenLoaded('citoyen', fn () => ['id' => $this->citoyen->id, 'nom_complet' => $this->citoyen->nom_complet]),
            'traitant' => $this->whenLoaded('traitant', fn () => $this->traitant ? ['nom_complet' => $this->traitant->nom_complet] : null),
            'dossier' => $this->whenLoaded('dossier', fn () => $this->dossier ? [
                'id' => $this->dossier->id,
                'reference' => $this->dossier->reference,
                'procedure' => $this->dossier->procedure?->titre,
            ] : null),
            'peut_traiter' => $request->user()?->can('traiter', $this->resource) ?? false,
        ];
    }
}
