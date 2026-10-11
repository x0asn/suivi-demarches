<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Service extends Model
{
    use HasFactory;

    public const TYPES = [
        'mairie' => 'Mairie',
        'tribunal' => 'Tribunal',
        'ministere' => 'Ministère',
        'prefecture' => 'Préfecture',
        'police' => 'Police',
        'agence' => 'Agence publique',
    ];

    protected $fillable = [
        'nom', 'type', 'adresse', 'commune', 'region', 'telephone', 'email', 'horaires', 'latitude', 'longitude', 'actif',
    ];

    protected function casts(): array
    {
        return [
            'latitude' => 'float',
            'longitude' => 'float',
            'actif' => 'boolean',
        ];
    }

    /** Démarches que ce service est habilité à traiter (M08). */
    public function procedures(): BelongsToMany
    {
        return $this->belongsToMany(Procedure::class);
    }

    public function agents(): HasMany
    {
        return $this->hasMany(User::class);
    }
}
