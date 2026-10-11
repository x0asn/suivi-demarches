<?php

namespace App\Http\Requests\Admin;

use App\Enums\Role;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'prenom' => ['sometimes', 'required', 'string', 'max:100'],
            'nom' => ['sometimes', 'required', 'string', 'max:100'],
            'telephone' => ['nullable', 'string', 'regex:/^\+?[0-9 ]{9,20}$/'],
            'role' => ['sometimes', 'required', Rule::enum(Role::class)],
            'service_id' => ['nullable', 'integer', 'exists:services,id'],
            'actif' => ['sometimes', 'required', 'boolean'],
        ];
    }
}
