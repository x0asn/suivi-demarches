<?php

namespace App\Models;

use App\Enums\RegleCompetence;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Procedure extends Model
{
    use HasFactory;

    public const STATUTS = ['brouillon', 'publiee', 'desactivee'];

    protected $fillable = [
        'categorie_id', 'service_id', 'regle_competence', 'titre', 'slug', 'resume', 'description', 'conditions',
        'public_concerne', 'delai_jours', 'cout',
    ];

    /** Sans précision, une démarche peut être traitée par toute administration habilitée. */
    protected $attributes = [
        'regle_competence' => 'nationale',
    ];

    protected function casts(): array
    {
        return [
            'delai_jours' => 'integer',
            'publiee_at' => 'datetime',
            'regle_competence' => RegleCompetence::class,
        ];
    }

    protected static function booted(): void
    {
        // Le service de référence fait toujours partie des administrations habilitées.
        static::saved(function (self $procedure) {
            if ($procedure->service_id) {
                $procedure->services()->syncWithoutDetaching([$procedure->service_id]);
            }
        });
    }

    public function categorie(): BelongsTo
    {
        return $this->belongsTo(Categorie::class);
    }

    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class);
    }

    /** Administrations habilitées à traiter cette démarche (M08). */
    public function services(): BelongsToMany
    {
        return $this->belongsToMany(Service::class);
    }

    public function pieces(): HasMany
    {
        return $this->hasMany(PieceRequise::class)->orderBy('ordre');
    }

    public function etapes(): HasMany
    {
        return $this->hasMany(EtapeProcedure::class)->orderBy('ordre');
    }

    public function dossiers(): HasMany
    {
        return $this->hasMany(Dossier::class);
    }

    public function scopePubliees(Builder $q): Builder
    {
        return $q->where('statut', 'publiee');
    }

    /** RF-005 : recherche plein texte simple sur le titre, le résumé et la catégorie. */
    public function scopeRecherche(Builder $q, ?string $terme): Builder
    {
        if (! $terme = trim((string) $terme)) {
            return $q;
        }

        $mots = array_filter(preg_split('/\s+/', $terme), fn ($m) => mb_strlen($m) > 1);

        return $q->where(function (Builder $q) use ($mots) {
            foreach ($mots as $mot) {
                $q->where(fn (Builder $q) => $q
                    ->where('titre', 'like', "%{$mot}%")
                    ->orWhere('resume', 'like', "%{$mot}%")
                    ->orWhere('description', 'like', "%{$mot}%")
                    ->orWhereHas('categorie', fn ($c) => $c->where('nom', 'like', "%{$mot}%")));
            }
        });
    }
}
