<?php

namespace App\Http\Requests\Dossiers;

use Illuminate\Foundation\Http\FormRequest;

/** Modification d'un brouillon ou d'un dossier à corriger (RG-008 : par son seul propriétaire). */
class UpdateDossierRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('update', $this->route('dossier'));
    }

    public function rules(): array
    {
        return [
            'motif' => ['nullable', 'string', 'max:2000'],
            'precisions' => ['nullable', 'string', 'max:2000'],
        ];
    }

    public function attributes(): array
    {
        return ['motif' => 'objet de la demande'];
    }
}
