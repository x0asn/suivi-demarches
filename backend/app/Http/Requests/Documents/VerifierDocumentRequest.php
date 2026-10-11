<?php

namespace App\Http\Requests\Documents;

use App\Enums\StatutDocument;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/** RF-014 : contrôle d'une pièce (RG-007 : motif obligatoire si elle n'est pas acceptée). */
class VerifierDocumentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('traiter', $this->route('document')->dossier);
    }

    public function rules(): array
    {
        return [
            'statut' => ['required', Rule::in([StatutDocument::Accepte->value, StatutDocument::Refuse->value, StatutDocument::ACorriger->value])],
            'motif' => ['nullable', 'string', 'max:1000', Rule::requiredIf($this->statut !== StatutDocument::Accepte->value)],
        ];
    }

    public function messages(): array
    {
        return ['motif.required' => 'Indiquez le motif : il sera communiqué au citoyen.'];
    }

    public function attributes(): array
    {
        return ['motif' => 'motif'];
    }
}
