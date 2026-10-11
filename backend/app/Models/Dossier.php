<?php

namespace App\Models;

use App\Enums\Role;
use App\Enums\StatutDocument;
use App\Enums\StatutDossier;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Collection;

class Dossier extends Model
{
    use HasFactory;

    protected $fillable = ['motif', 'precisions'];

    protected function casts(): array
    {
        return [
            'statut' => StatutDossier::class,
            'soumis_at' => 'datetime',
            'decision_at' => 'datetime',
            'cloture_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        // RG-002 : la référence est dérivée de l'identifiant, donc unique par construction.
        static::created(function (Dossier $dossier) {
            $dossier->reference = sprintf('DEM-%s-%05d', $dossier->created_at->format('Y'), $dossier->id);
            $dossier->saveQuietly();
        });
    }

    public function procedure(): BelongsTo
    {
        return $this->belongsTo(Procedure::class);
    }

    public function citoyen(): BelongsTo
    {
        return $this->belongsTo(User::class, 'citoyen_id');
    }

    public function agent(): BelongsTo
    {
        return $this->belongsTo(User::class, 'agent_id');
    }

    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class);
    }

    public function documents(): HasMany
    {
        return $this->hasMany(Document::class)->latest();
    }

    public function historique(): HasMany
    {
        return $this->hasMany(HistoriqueStatut::class)->orderBy('created_at')->orderBy('id');
    }

    public function observations(): HasMany
    {
        return $this->hasMany(Observation::class)->orderBy('created_at')->orderBy('id');
    }

    /** RG-006 / RG-008 : dossiers visibles par un utilisateur donné. */
    public function scopeVisiblesPar(Builder $q, User $user): Builder
    {
        return match ($user->role) {
            Role::Citoyen => $q->where('citoyen_id', $user->id),
            Role::Agent => $q->where('service_id', $user->service_id ?? 0)->where('statut', '!=', StatutDossier::Brouillon->value),
            Role::Admin, Role::Responsable => $q->where('statut', '!=', StatutDossier::Brouillon->value),
        };
    }

    /**
     * RG-004 : pièces obligatoires sans document valable (en attente ou accepté).
     *
     * @return Collection<int, PieceRequise>
     */
    public function piecesManquantes()
    {
        $this->loadMissing(['procedure.pieces', 'documents']);

        return $this->procedure->pieces
            ->where('obligatoire', true)
            ->reject(fn (PieceRequise $piece) => $this->documents->contains(
                fn (Document $d) => $d->piece_requise_id === $piece->id && $d->statut->estValable()
            ))
            ->values();
    }

    /** Délai écoulé depuis la soumission, en jours. */
    public function joursDepuisSoumission(): ?int
    {
        return $this->soumis_at ? (int) $this->soumis_at->diffInDays(now()) : null;
    }

    public function estEnRetard(): bool
    {
        $delai = $this->procedure?->delai_jours;

        return $delai !== null
            && $this->statut->enCoursAdministration()
            && $this->joursDepuisSoumission() > $delai;
    }

    public function documentsAVerifier(): int
    {
        return $this->documents->where('statut', StatutDocument::EnAttente)->count();
    }
}
