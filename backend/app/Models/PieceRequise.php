<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PieceRequise extends Model
{
    protected $table = 'pieces_requises';

    protected $fillable = ['libelle', 'description', 'obligatoire', 'ordre'];

    protected function casts(): array
    {
        return ['obligatoire' => 'boolean'];
    }

    public function procedure(): BelongsTo
    {
        return $this->belongsTo(Procedure::class);
    }
}
