<?php

namespace App\Http\Requests\Dossiers;

use App\Models\Paiement;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/** Le citoyen règle les frais de son dossier, avant de l'envoyer, avec l'opérateur de son choix. */
class DemarrerPaiementRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('update', $this->route('dossier'));
    }

    public function rules(): array
    {
        return ['operateur' => ['required', Rule::in(array_keys(Paiement::OPERATEURS))]];
    }

    public function attributes(): array
    {
        return ['operateur' => 'moyen de paiement'];
    }
}
