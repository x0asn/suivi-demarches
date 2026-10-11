<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

/** RF-020 : texte et activation d'un modèle de notification. */
class ModeleNotificationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'titre' => ['required', 'string', 'max:255'],
            'message' => ['required', 'string', 'max:1000'],
            'actif' => ['required', 'boolean'],
            'email' => ['required', 'boolean'],
        ];
    }
}
