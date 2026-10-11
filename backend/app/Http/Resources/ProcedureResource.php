<?php

namespace App\Http\Resources;

use App\Models\Procedure;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Procedure */
class ProcedureResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'titre' => $this->titre,
            'slug' => $this->slug,
            'resume' => $this->resume,
            'description' => $this->description,
            'conditions' => $this->conditions,
            'public_concerne' => $this->public_concerne,
            'delai_jours' => $this->delai_jours,
            'cout' => $this->cout,
            'statut' => $this->statut,
            'publiee_at' => $this->publiee_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
            'categorie' => new CategorieResource($this->whenLoaded('categorie')),
            'service' => new ServiceResource($this->whenLoaded('service')),
            // M08 : règle de compétence et administrations habilitées à traiter la démarche.
            'competence' => $this->regle_competence?->versTableau(),
            'services' => ServiceResource::collection($this->whenLoaded('services')),
            'pieces_count' => $this->whenCounted('pieces'),
            'dossiers_count' => $this->whenCounted('dossiers'),
            'pieces' => $this->whenLoaded('pieces', fn () => $this->pieces->map(fn ($p) => [
                'id' => $p->id,
                'libelle' => $p->libelle,
                'description' => $p->description,
                'obligatoire' => $p->obligatoire,
            ])),
            'etapes' => $this->whenLoaded('etapes', fn () => $this->etapes->map(fn ($e) => [
                'id' => $e->id,
                'titre' => $e->titre,
                'description' => $e->description,
            ])),
        ];
    }
}
