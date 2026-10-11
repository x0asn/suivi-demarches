<?php

namespace App\Http\Requests\Reclamations;

use App\Enums\Role;
use App\Models\Reclamation;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/** RF-012 : dépôt d'une réclamation par un citoyen. */
class StoreReclamationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->role === Role::Citoyen;
    }

    public function rules(): array
    {
        return [
            'motif' => ['required', Rule::in(array_keys(Reclamation::MOTIFS))],
            'sujet' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string', 'min:20', 'max:3000'],
            // RG-008 : la réclamation ne peut viser qu'un dossier du citoyen lui-même.
            'dossier_id' => [
                'nullable', 'integer',
                Rule::exists('dossiers', 'id')->where('citoyen_id', $this->user()->id),
            ],
        ];
    }

    public function messages(): array
    {
        return ['description.min' => 'Décrivez votre réclamation en quelques phrases (20 caractères minimum).'];
    }

    public function attributes(): array
    {
        return ['motif' => 'motif', 'sujet' => 'sujet', 'description' => 'description', 'dossier_id' => 'dossier'];
    }
}
