<?php

namespace App\Services;

use App\Models\JournalAction;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;

/**
 * Point d'entrée unique pour tracer les actions sensibles (RF-022).
 */
class Journal
{
    public static function enregistrer(
        string $action,
        ?Model $objet = null,
        array $details = [],
        string $resultat = 'succes',
        ?User $acteur = null,
    ): JournalAction {
        $acteur ??= auth()->user();

        return JournalAction::create([
            'user_id' => $acteur?->id,
            'action' => $action,
            'objet_type' => $objet ? class_basename($objet) : null,
            'objet_id' => $objet?->getKey(),
            'resultat' => $resultat,
            'details' => $details ?: null,
            'ip' => request()?->ip(),
        ]);
    }
}
