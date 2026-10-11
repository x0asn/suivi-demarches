<?php

namespace App\Enums;

/**
 * Règle de compétence territoriale d'une démarche (module M08).
 *
 * L'administration la plus proche du citoyen n'est pas forcément celle qui a le droit
 * de traiter sa demande : la règle indique laquelle est compétente parmi les
 * administrations habilitées.
 */
enum RegleCompetence: string
{
    case Nationale = 'nationale';
    case LieuResidence = 'lieu_residence';
    case LieuNaissance = 'lieu_naissance';
    case LieuBien = 'lieu_bien';

    public function libelle(): string
    {
        return match ($this) {
            self::Nationale => 'Toute administration habilitée',
            self::LieuResidence => 'Administration de votre lieu de résidence',
            self::LieuNaissance => 'Administration du lieu de naissance',
            self::LieuBien => 'Administration du lieu où se situe le bien',
        };
    }

    /** Explication affichée au citoyen. */
    public function explication(): string
    {
        return match ($this) {
            self::Nationale => 'Vous pouvez vous adresser à n’importe laquelle de ces administrations, quel que soit votre lieu de résidence. La plus proche de vous est donc la plus pratique.',
            self::LieuResidence => 'Seule l’administration dont dépend votre commune de résidence peut traiter cette demande, même si une autre est plus proche de vous.',
            self::LieuNaissance => 'Seule l’administration du lieu où la naissance a été déclarée peut traiter cette demande, même si une autre est plus proche de vous.',
            self::LieuBien => 'Seule l’administration dont dépend le lieu où se situe le terrain ou le bien peut traiter cette demande, même si une autre est plus proche de vous.',
        };
    }

    /** Vrai lorsque la proximité ne suffit pas à désigner l'administration compétente. */
    public function dependDuTerritoire(): bool
    {
        return $this !== self::Nationale;
    }

    /** @return array{valeur: string, libelle: string, explication: string, depend_du_territoire: bool} */
    public function versTableau(): array
    {
        return [
            'valeur' => $this->value,
            'libelle' => $this->libelle(),
            'explication' => $this->explication(),
            'depend_du_territoire' => $this->dependDuTerritoire(),
        ];
    }

    /** @return list<array{valeur: string, libelle: string, explication: string, depend_du_territoire: bool}> */
    public static function options(): array
    {
        return array_map(fn (self $r) => $r->versTableau(), self::cases());
    }
}
