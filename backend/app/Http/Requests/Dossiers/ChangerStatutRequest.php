<?php

namespace App\Http\Requests\Dossiers;

use App\Enums\StatutDossier;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/** RF-015 : changement de statut par un agent habilité sur ce dossier (RG-006). */
class ChangerStatutRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('traiter', $this->route('dossier'));
    }

    public function rules(): array
    {
        return [
            'statut' => ['required', Rule::in(StatutDossier::valeurs())],
            'commentaire' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
