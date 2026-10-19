<?php

namespace App\Http\Requests\Admin;

use App\Enums\RegleCompetence;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/** RF-017 : création / modification d'une procédure, avec ses pièces et ses étapes. */
class ProcedureRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'titre' => ['required', 'string', 'max:255'],
            'categorie_id' => ['required', 'integer', 'exists:categories,id'],
            'service_id' => ['nullable', 'integer', 'exists:services,id'],
            // M08 : administrations habilitées et règle qui désigne celle qui est compétente.
            'regle_competence' => ['sometimes', 'required', Rule::enum(RegleCompetence::class)],
            'service_ids' => ['sometimes', 'array', 'max:200'],
            'service_ids.*' => ['integer', 'distinct', 'exists:services,id'],
            'resume' => ['required', 'string', 'max:500'],
            'description' => ['nullable', 'string', 'max:5000'],
            'conditions' => ['nullable', 'string', 'max:5000'],
            'public_concerne' => ['nullable', 'string', 'max:255'],
            'delai_jours' => ['nullable', 'integer', 'min:0', 'max:365'],
            'cout' => ['nullable', 'string', 'max:100'],
            // Montant payé en ligne au dépôt (francs CFA) ; 0 pour une démarche gratuite.
            'frais' => ['sometimes', 'integer', 'min:0', 'max:1000000'],

            'pieces' => ['array', 'max:30'],
            'pieces.*.libelle' => ['required', 'string', 'max:255'],
            'pieces.*.description' => ['nullable', 'string', 'max:255'],
            'pieces.*.obligatoire' => ['boolean'],

            'etapes' => ['array', 'max:20'],
            'etapes.*.titre' => ['required', 'string', 'max:255'],
            'etapes.*.description' => ['nullable', 'string', 'max:255'],
        ];
    }

    public function attributes(): array
    {
        return [
            'categorie_id' => 'catégorie',
            'service_id' => 'service de référence',
            'regle_competence' => 'règle de compétence',
            'service_ids' => 'administrations habilitées',
            'resume' => 'résumé',
            'delai_jours' => 'délai',
            'cout' => 'coût',
            'frais' => 'frais à payer en ligne',
            'pieces.*.libelle' => 'libellé de la pièce',
            'etapes.*.titre' => 'titre de l\'étape',
        ];
    }
}
