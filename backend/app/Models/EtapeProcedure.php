<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EtapeProcedure extends Model
{
    protected $table = 'etapes_procedure';

    protected $fillable = ['titre', 'description', 'ordre'];

    public function procedure(): BelongsTo
    {
        return $this->belongsTo(Procedure::class);
    }
}
