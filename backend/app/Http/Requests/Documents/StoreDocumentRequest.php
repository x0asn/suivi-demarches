<?php

namespace App\Http\Requests\Documents;

use App\Models\Document;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/** RF-008 : le fichier respecte les règles de format et de taille. */
class StoreDocumentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('update', $this->route('dossier'));
    }

    public function rules(): array
    {
        return [
            'fichier' => ['required', 'file', 'mimes:'.implode(',', Document::FORMATS), 'max:'.Document::TAILLE_MAX_KO],
            // La pièce doit faire partie de celles demandées par la procédure du dossier.
            'piece_requise_id' => [
                'required', 'integer',
                Rule::exists('pieces_requises', 'id')->where('procedure_id', $this->route('dossier')->procedure_id),
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'fichier.mimes' => 'Format non accepté. Formats autorisés : PDF, JPG ou PNG.',
            'fichier.max' => 'Le fichier dépasse la taille maximale de 5 Mo.',
            'fichier.uploaded' => 'Le fichier n’a pas pu être envoyé. Vérifiez qu’il ne dépasse pas 5 Mo.',
        ];
    }

    public function attributes(): array
    {
        return ['fichier' => 'fichier', 'piece_requise_id' => 'pièce'];
    }
}
