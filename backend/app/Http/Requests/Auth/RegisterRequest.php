<?php

namespace App\Http\Requests\Auth;

use App\Support\Regions;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

/** RF-001 : création d'un compte citoyen. */
class RegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'email' => mb_strtolower(trim((string) $this->email)),
            'nom' => trim((string) $this->nom),
            'prenom' => trim((string) $this->prenom),
        ]);
    }

    public function rules(): array
    {
        return [
            'prenom' => ['required', 'string', 'max:100'],
            'nom' => ['required', 'string', 'max:100'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'telephone' => ['nullable', 'string', 'regex:/^\+?[0-9 ]{9,20}$/'],
            'region' => ['required', Rule::in(Regions::LISTE)],
            'commune' => ['nullable', 'string', 'max:100'],
            'password' => ['required', 'confirmed', Password::min(8)->letters()->numbers()],
        ];
    }
}
