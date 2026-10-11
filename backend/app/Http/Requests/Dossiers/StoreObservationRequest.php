<?php

namespace App\Http\Requests\Dossiers;

use Illuminate\Foundation\Http\FormRequest;

/** RF-016 : observation ou message lié à un dossier. */
class StoreObservationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('commenter', $this->route('dossier'));
    }

    public function rules(): array
    {
        return [
            'contenu' => ['required', 'string', 'max:2000'],
            'interne' => ['boolean'],
        ];
    }

    public function attributes(): array
    {
        return ['contenu' => 'message'];
    }
}
