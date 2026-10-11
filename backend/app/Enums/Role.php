<?php

namespace App\Enums;

enum Role: string
{
    case Citoyen = 'citoyen';
    case Agent = 'agent';
    case Admin = 'admin';
    case Responsable = 'responsable';

    public function libelle(): string
    {
        return match ($this) {
            self::Citoyen => 'Citoyen',
            self::Agent => 'Agent',
            self::Admin => 'Administrateur',
            self::Responsable => 'Responsable',
        };
    }

    /** @return list<string> */
    public static function valeurs(): array
    {
        return array_column(self::cases(), 'value');
    }
}
