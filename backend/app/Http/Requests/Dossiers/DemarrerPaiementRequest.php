<?php

namespace App\Http\Requests\Dossiers;

use App\Models\Paiement;
use App\Services\PayDunya;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/** Le citoyen règle les frais de son dossier, avant de l'envoyer, avec l'opérateur et le numéro de son choix. */
class DemarrerPaiementRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('update', $this->route('dossier'));
    }

    protected function prepareForValidation(): void
    {
        if (is_string($this->telephone)) {
            $this->merge(['telephone' => PayDunya::numero($this->telephone)]);
        }
    }

    public function rules(): array
    {
        return [
            'operateur' => ['required', Rule::in(array_keys(Paiement::OPERATEURS))],
            // Numéro mobile sénégalais : 70, 75, 76, 77 ou 78 suivi de 7 chiffres.
            'telephone' => ['required', 'string', 'regex:/^7[05678]\d{7}$/'],
        ];
    }

    public function attributes(): array
    {
        return ['operateur' => 'moyen de paiement', 'telephone' => 'numéro de téléphone'];
    }

    public function messages(): array
    {
        return ['telephone.regex' => 'Entrez un numéro mobile sénégalais à 9 chiffres, par exemple 77 123 45 67.'];
    }
}
