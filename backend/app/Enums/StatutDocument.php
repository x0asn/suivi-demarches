<?php

namespace App\Enums;

/** RF-014 : chaque pièce peut être acceptée, refusée ou marquée à corriger. */
enum StatutDocument: string
{
    case EnAttente = 'en_attente';
    case Accepte = 'accepte';
    case Refuse = 'refuse';
    case ACorriger = 'a_corriger';

    public function libelle(): string
    {
        return match ($this) {
            self::EnAttente => 'En attente de vérification',
            self::Accepte => 'Acceptée',
            self::Refuse => 'Refusée',
            self::ACorriger => 'À corriger',
        };
    }

    /** Une pièce refusée ou à corriger ne compte plus pour la complétude du dossier. */
    public function estValable(): bool
    {
        return in_array($this, [self::EnAttente, self::Accepte], true);
    }
}
