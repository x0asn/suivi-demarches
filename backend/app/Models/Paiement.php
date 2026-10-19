<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** Paiement des frais d'un dossier, confirmé par le prestataire de paiement. */
class Paiement extends Model
{
    public const EN_ATTENTE = 'en_attente';

    public const PAYE = 'paye';

    public const ANNULE = 'annule';

    public const ECHEC = 'echec';

    /** Opérateurs proposés au citoyen, et leur code chez PayDunya. */
    public const OPERATEURS = [
        'wave' => ['libelle' => 'Wave', 'canal' => 'wave-senegal'],
        'orange_money' => ['libelle' => 'Orange Money', 'canal' => 'orange-money-senegal'],
    ];

    public const LIBELLES = [
        self::EN_ATTENTE => 'En attente de confirmation',
        self::PAYE => 'Payé',
        self::ANNULE => 'Annulé',
        self::ECHEC => 'Échoué',
    ];

    protected $fillable = ['montant', 'operateur'];

    protected function casts(): array
    {
        return [
            'montant' => 'integer',
            'paye_at' => 'datetime',
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

    public function estPaye(): bool
    {
        return $this->statut === self::PAYE;
    }

    /** @return array<string, mixed> */
    public function versTableau(): array
    {
        return [
            'id' => $this->id,
            'montant' => $this->montant,
            'operateur' => $this->operateur,
            'operateur_libelle' => self::OPERATEURS[$this->operateur]['libelle'] ?? $this->operateur,
            'statut' => $this->statut,
            'statut_libelle' => self::LIBELLES[$this->statut] ?? $this->statut,
            'mode' => $this->mode,
            'url_recu' => $this->url_recu,
            'paye_at' => $this->paye_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
