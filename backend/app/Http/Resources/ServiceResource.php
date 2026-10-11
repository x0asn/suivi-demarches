<?php

namespace App\Http\Resources;

use App\Models\Service;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Service */
class ServiceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'nom' => $this->nom,
            'type' => $this->type,
            'type_libelle' => Service::TYPES[$this->type] ?? $this->type,
            'adresse' => $this->adresse,
            'commune' => $this->commune,
            'region' => $this->region,
            'telephone' => $this->telephone,
            'email' => $this->email,
            'horaires' => $this->horaires,
            'latitude' => $this->latitude,
            'longitude' => $this->longitude,
            'actif' => $this->actif,
            'procedures_count' => $this->whenCounted('procedures'),
            // Démarches traitées par ce service, avec leur règle de compétence (M08).
            'demarches' => $this->whenLoaded('procedures', fn () => $this->procedures->map(fn ($p) => [
                'id' => $p->id,
                'titre' => $p->titre,
                'slug' => $p->slug,
                'regle' => $p->regle_competence?->value,
            ])->values()),
        ];
    }
}
