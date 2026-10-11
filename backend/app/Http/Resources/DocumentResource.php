<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Document */
class DocumentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'piece_requise_id' => $this->piece_requise_id,
            'nom_original' => $this->nom_original,
            'mime' => $this->mime,
            'taille' => $this->taille,
            'statut' => $this->statut->value,
            'statut_libelle' => $this->statut->libelle(),
            'motif' => $this->motif,
            'verifie_at' => $this->verifie_at?->toIso8601String(),
            'verificateur' => $this->whenLoaded('verificateur', fn () => $this->verificateur?->nom_complet),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
