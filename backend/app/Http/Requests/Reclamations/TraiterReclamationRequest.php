<?php

namespace App\Http\Requests\Reclamations;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/** Traitement d'une réclamation : prise en charge, réponse et clôture. */
class TraiterReclamationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('traiter', $this->route('reclamation'));
    }

    public function rules(): array
    {
        return [
            'statut' => ['required', Rule::in(['en_cours', 'resolue', 'rejetee'])],
            'reponse' => ['nullable', 'string', 'max:3000', Rule::requiredIf(in_array($this->statut, ['resolue', 'rejetee'], true))],
        ];
    }

    public function messages(): array
    {
        return ['reponse.required' => 'Rédigez la réponse qui sera adressée au citoyen.'];
    }

    public function attributes(): array
    {
        return ['reponse' => 'réponse'];
    }
}
