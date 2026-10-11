<?php

namespace App\Http\Requests\Admin;

use App\Models\Procedure;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/** RF-017 : publier, repasser en brouillon ou désactiver une procédure. */
class StatutProcedureRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return ['statut' => ['required', Rule::in(Procedure::STATUTS)]];
    }
}
