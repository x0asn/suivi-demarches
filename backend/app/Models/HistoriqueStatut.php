<?php

namespace App\Models;

use App\Enums\StatutDossier;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HistoriqueStatut extends Model
{
    public const UPDATED_AT = null;

    protected $table = 'historique_statuts';

    protected $fillable = ['user_id', 'ancien_statut', 'nouveau_statut', 'commentaire'];

    protected function casts(): array
    {
        return [
            'ancien_statut' => StatutDossier::class,
            'nouveau_statut' => StatutDossier::class,
            'created_at' => 'datetime',
        ];
    }

    public function dossier(): BelongsTo
    {
        return $this->belongsTo(Dossier::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
