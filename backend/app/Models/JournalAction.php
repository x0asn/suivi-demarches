<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class JournalAction extends Model
{
    public const UPDATED_AT = null;

    protected $table = 'journal_actions';

    protected $fillable = [
        'user_id',
        'action',
        'objet_type',
        'objet_id',
        'resultat',
        'details',
        'ip',
    ];

    protected function casts(): array
    {
        return [
            'details' => 'array',
            'created_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
