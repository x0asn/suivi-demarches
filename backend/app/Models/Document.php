<?php

namespace App\Models;

use App\Enums\StatutDocument;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class Document extends Model
{
    /** Stockage privé : les fichiers ne sont jamais servis directement par le serveur web. */
    public const DISQUE = 'local';

    public const FORMATS = ['pdf', 'jpg', 'jpeg', 'png'];

    public const TAILLE_MAX_KO = 5120;

    protected $fillable = ['piece_requise_id', 'nom_original', 'chemin', 'mime', 'taille'];

    protected $hidden = ['chemin'];

    protected function casts(): array
    {
        return [
            'statut' => StatutDocument::class,
            'verifie_at' => 'datetime',
            'taille' => 'integer',
        ];
    }

    protected static function booted(): void
    {
        static::deleted(fn (Document $d) => Storage::disk(self::DISQUE)->delete($d->chemin));
    }

    public function dossier(): BelongsTo
    {
        return $this->belongsTo(Dossier::class);
    }

    public function piece(): BelongsTo
    {
        return $this->belongsTo(PieceRequise::class, 'piece_requise_id');
    }

    public function verificateur(): BelongsTo
    {
        return $this->belongsTo(User::class, 'verifie_par');
    }
}
