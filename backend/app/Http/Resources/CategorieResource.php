<?php

namespace App\Http\Resources;

use App\Models\Categorie;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Categorie */
class CategorieResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'nom' => $this->nom,
            'slug' => $this->slug,
            'description' => $this->description,
            'icone' => $this->icone,
            'procedures_count' => $this->whenCounted('procedures'),
        ];
    }
}
