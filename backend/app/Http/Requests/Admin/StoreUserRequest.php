<?php

namespace App\Http\Requests\Admin;

use App\Enums\Role;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

/** RF-018 : l'administrateur crée des comptes (agents, responsables, administrateurs). */
class StoreUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->merge(['email' => mb_strtolower(trim((string) $this->email))]);
    }

    public function rules(): array
    {
        return [
            'prenom' => ['required', 'string', 'max:100'],
            'nom' => ['required', 'string', 'max:100'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'telephone' => ['nullable', 'string', 'regex:/^\+?[0-9 ]{9,20}$/'],
            'role' => ['required', Rule::enum(Role::class)],
            'service_id' => ['nullable', 'integer', 'exists:services,id'],
            'password' => ['required', Password::min(8)->letters()->numbers()],
        ];
    }
}
