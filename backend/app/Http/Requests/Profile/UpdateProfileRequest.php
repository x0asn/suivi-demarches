<?php

namespace App\Http\Requests\Profile;

use App\Enums\Role;
use App\Support\Regions;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/** RF-003 : gestion du profil. */
class UpdateProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('email')) {
            $this->merge(['email' => mb_strtolower(trim((string) $this->email))]);
        }
    }

    public function rules(): array
    {
        return [
            'prenom' => ['sometimes', 'required', 'string', 'max:100'],
            'nom' => ['sometimes', 'required', 'string', 'max:100'],
            'email' => ['sometimes', 'required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($this->user()->id)],
            'telephone' => ['nullable', 'string', 'regex:/^\+?[0-9 ]{9,20}$/'],
            // La région reste obligatoire pour un citoyen : elle ne peut pas être effacée.
            'region' => [$this->user()->role === Role::Citoyen ? 'required' : 'nullable', 'sometimes', Rule::in(Regions::LISTE)],
            'commune' => ['nullable', 'string', 'max:100'],
        ];
    }
}
