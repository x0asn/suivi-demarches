<?php

namespace App\Http\Requests\Dossiers;

use Illuminate\Foundation\Http\FormRequest;

/** Remise du document au demandeur : code de retrait et identité vérifiés par l'agent. */
class RemiseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('traiter', $this->route('dossier'));
    }

    public function rules(): array
    {
        return [
            'code_retrait' => ['required', 'string', 'max:12'],
            'identite_verifiee' => ['accepted'],
        ];
    }

    public function messages(): array
    {
        return ['identite_verifiee.accepted' => 'Confirmez que vous avez vérifié l’identité du demandeur.'];
    }

    public function attributes(): array
    {
        return ['code_retrait' => 'code de retrait'];
    }
}
