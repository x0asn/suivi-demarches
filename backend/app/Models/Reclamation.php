<?php

namespace App\Models;

use App\Enums\Role;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Reclamation extends Model
{
    public const MOTIFS = [
        'retard' => 'Délai de traitement trop long',
        'decision' => 'Contestation d’une décision',
        'piece' => 'Pièce refusée à tort',
        'accueil' => 'Accueil ou comportement',
        'technique' => 'Problème technique sur la plateforme',
        'autre' => 'Autre motif',
    ];

    public const STATUTS = [
        'ouverte' => 'Ouverte',
        'en_cours' => 'En cours d’examen',
        'resolue' => 'Résolue',
        'rejetee' => 'Non fondée',
    ];

    protected $fillable = ['dossier_id', 'motif', 'sujet', 'description'];

    protected function casts(): array
    {
        return ['traitee_at' => 'datetime'];
    }

    protected static function booted(): void
    {
        static::created(function (Reclamation $r) {
            $r->reference = sprintf('REC-%s-%04d', $r->created_at->format('Y'), $r->id);
            $r->saveQuietly();
        });
    }

    public function citoyen(): BelongsTo
    {
        return $this->belongsTo(User::class, 'citoyen_id');
    }

    public function dossier(): BelongsTo
    {
        return $this->belongsTo(Dossier::class);
    }

    public function traitant(): BelongsTo
    {
        return $this->belongsTo(User::class, 'traitee_par');
    }

    /** Réclamations visibles : les siennes (citoyen), son périmètre (agent), toutes (admin, responsable). */
    public function scopeVisiblesPar(Builder $q, User $user): Builder
    {
        return match ($user->role) {
            Role::Citoyen => $q->where('citoyen_id', $user->id),
            Role::Agent => $q->whereHas('dossier', fn ($d) => $d->where('service_id', $user->service_id ?? 0)),
            Role::Admin, Role::Responsable => $q,
        };
    }

    public function estClose(): bool
    {
        return in_array($this->statut, ['resolue', 'rejetee'], true);
    }
}
