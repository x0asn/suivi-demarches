<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ModeleNotification extends Model
{
    protected $table = 'modeles_notification';

    protected $fillable = ['evenement', 'libelle', 'titre', 'message', 'actif', 'email'];

    protected function casts(): array
    {
        return ['actif' => 'boolean', 'email' => 'boolean'];
    }

    /** Remplace les variables {reference}, {procedure}… par leur valeur. */
    public function rendre(string $texte, array $variables): string
    {
        return preg_replace_callback('/\{(\w+)\}/', fn ($m) => (string) ($variables[$m[1]] ?? $m[0]), $texte);
    }
}
