<?php

namespace App\Http\Requests\Assistant;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

/** Question posée à l'assistant, avec les messages précédents de la discussion. */
class QuestionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'messages' => ['required', 'array', 'min:1', 'max:40'],
            'messages.*.role' => ['required', 'in:user,assistant'],
            'messages.*.content' => ['required', 'string', 'max:6000'],
        ];
    }

    public function after(): array
    {
        return [
            function (Validator $validator) {
                $messages = $this->input('messages', []);
                $dernier = is_array($messages) ? end($messages) : null;
                if (! is_array($dernier) || ($dernier['role'] ?? null) !== 'user') {
                    $validator->errors()->add('messages', 'La discussion doit se terminer par une question.');
                } elseif (mb_strlen((string) ($dernier['content'] ?? '')) > 1000) {
                    $validator->errors()->add('messages', 'Votre question est trop longue (1000 caractères maximum).');
                }
            },
        ];
    }

    /**
     * Messages prêts à être transmis à l'IA : uniquement le rôle et le texte.
     *
     * @return list<array{role: string, content: string}>
     */
    public function discussion(): array
    {
        return array_map(
            fn (array $m) => ['role' => $m['role'], 'content' => trim($m['content'])],
            array_values($this->validated('messages'))
        );
    }
}
