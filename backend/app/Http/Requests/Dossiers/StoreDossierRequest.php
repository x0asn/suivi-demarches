<?php

namespace App\Http\Requests\Dossiers;

use App\Enums\Role;
use Illuminate\Foundation\Http\FormRequest;

/** RF-006 : création d'un dossier par un citoyen. */
class StoreDossierRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->role === Role::Citoyen;
    }

    public function rules(): array
    {
        return [
            'procedure' => ['required', 'string'],
            'motif' => ['nullable', 'string', 'max:2000'],
            'precisions' => ['nullable', 'string', 'max:2000'],
        ];
    }

    public function attributes(): array
    {
        return ['procedure' => 'procédure', 'motif' => 'objet de la demande'];
    }
}
