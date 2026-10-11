<?php

namespace App\Enums;

/**
 * Cycle de vie d'un dossier (cahier des charges §12).
 *
 * BROUILLON → SOUMIS → EN VÉRIFICATION → EN TRAITEMENT → VALIDÉ → TERMINÉ
 *                          ↘ CORRECTION DEMANDÉE → SOUMIS
 *                          ↘ REJETÉ → CLÔTURÉ
 */
enum StatutDossier: string
{
    case Brouillon = 'brouillon';
    case Soumis = 'soumis';
    case EnVerification = 'en_verification';
    case CorrectionDemandee = 'correction_demandee';
    case EnTraitement = 'en_traitement';
    case Valide = 'valide';
    case Rejete = 'rejete';
    case Termine = 'termine';
    case Cloture = 'cloture';

    public function libelle(): string
    {
        return match ($this) {
            self::Brouillon => 'Brouillon',
            self::Soumis => 'Soumis',
            self::EnVerification => 'En vérification',
            self::CorrectionDemandee => 'Correction demandée',
            self::EnTraitement => 'En traitement',
            self::Valide => 'Validé',
            self::Rejete => 'Rejeté',
            self::Termine => 'Terminé',
            self::Cloture => 'Clôturé',
        };
    }

    /**
     * Transitions autorisées et acteur habilité à les déclencher.
     * C'est ici que le système empêche les changements de statut incohérents.
     *
     * @return array<string, 'citoyen'|'agent'>
     */
    public function transitions(): array
    {
        return match ($this) {
            self::Brouillon => [self::Soumis->value => 'citoyen'],
            self::Soumis => [self::EnVerification->value => 'agent'],
            self::EnVerification => [
                self::EnTraitement->value => 'agent',
                self::CorrectionDemandee->value => 'agent',
                self::Rejete->value => 'agent',
            ],
            self::CorrectionDemandee => [self::Soumis->value => 'citoyen'],
            self::EnTraitement => [
                self::Valide->value => 'agent',
                self::Rejete->value => 'agent',
                self::CorrectionDemandee->value => 'agent',
            ],
            self::Valide => [self::Termine->value => 'agent'],
            self::Rejete => [self::Cloture->value => 'agent'],
            self::Termine, self::Cloture => [],
        };
    }

    public function peutAller(self $cible, string $acteur): bool
    {
        return ($this->transitions()[$cible->value] ?? null) === $acteur;
    }

    /** Le citoyen peut modifier son dossier et ses pièces. */
    public function modifiableParCitoyen(): bool
    {
        return in_array($this, [self::Brouillon, self::CorrectionDemandee], true);
    }

    /** Le dossier est entre les mains de l'administration. */
    public function enCoursAdministration(): bool
    {
        return in_array($this, [self::Soumis, self::EnVerification, self::EnTraitement], true);
    }

    public function estFinal(): bool
    {
        return in_array($this, [self::Termine, self::Cloture], true);
    }

    /** Statuts qui exigent un commentaire de l'agent. */
    public function exigeCommentaire(): bool
    {
        return in_array($this, [self::CorrectionDemandee, self::Rejete], true);
    }

    /** @return list<string> */
    public static function valeurs(): array
    {
        return array_column(self::cases(), 'value');
    }
}
