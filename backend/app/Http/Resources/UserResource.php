<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\User */
class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'prenom' => $this->prenom,
            'nom' => $this->nom,
            'nom_complet' => $this->nom_complet,
            'email' => $this->email,
            'telephone' => $this->telephone,
            'region' => $this->region,
            'commune' => $this->commune,
            'role' => $this->role->value,
            'role_libelle' => $this->role->libelle(),
            'actif' => $this->actif,
            'service_id' => $this->service_id,
            'service' => $this->whenLoaded('service', fn () => $this->service ? ['id' => $this->service->id, 'nom' => $this->service->nom] : null),
            'derniere_connexion_at' => $this->derniere_connexion_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
