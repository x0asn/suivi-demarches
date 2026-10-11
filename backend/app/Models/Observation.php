<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Observation extends Model
{
    public const UPDATED_AT = null;

    protected $fillable = ['user_id', 'contenu', 'interne'];

    protected function casts(): array
    {
        return [
            'interne' => 'boolean',
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
