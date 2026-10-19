<?php

namespace App\Policies;

use App\Enums\Role;
use App\Enums\StatutDossier;
use App\Models\Dossier;
use App\Models\User;

/**
 * Contrôles d'accès aux dossiers, appliqués côté serveur (§17).
 * RG-008 : un citoyen ne consulte que ses propres dossiers.
 * RG-006 : un agent ne traite que les dossiers de son périmètre (son service).
 */
class DossierPolicy
{
    public function view(User $user, Dossier $dossier): bool
    {
        return match ($user->role) {
            Role::Citoyen => $dossier->citoyen_id === $user->id,
            Role::Agent => $this->dansPerimetre($user, $dossier),
            Role::Admin, Role::Responsable => $dossier->statut !== StatutDossier::Brouillon,
        };
    }

    /** Le citoyen modifie son dossier tant qu'il est en brouillon ou en correction. */
    public function update(User $user, Dossier $dossier): bool
    {
        return $user->role === Role::Citoyen
            && $dossier->citoyen_id === $user->id
            && $dossier->statut->modifiableParCitoyen();
    }

    public function delete(User $user, Dossier $dossier): bool
    {
        // Un brouillon dont les frais sont payés est conservé : le paiement doit rester traçable.
        return $user->role === Role::Citoyen
            && $dossier->citoyen_id === $user->id
            && $dossier->statut === StatutDossier::Brouillon
            && ! $dossier->estPaye();
    }

    /** Actions de traitement : changer le statut, contrôler une pièce. */
    public function traiter(User $user, Dossier $dossier): bool
    {
        return $user->role === Role::Agent && $this->dansPerimetre($user, $dossier);
    }

    /** Écrire une observation : le citoyen propriétaire ou un agent du périmètre. */
    public function commenter(User $user, Dossier $dossier): bool
    {
        if ($dossier->statut === StatutDossier::Brouillon) {
            return false;
        }

        return ($user->role === Role::Citoyen && $dossier->citoyen_id === $user->id)
            || $this->traiter($user, $dossier);
    }

    private function dansPerimetre(User $user, Dossier $dossier): bool
    {
        return $user->service_id !== null
            && $dossier->service_id === $user->service_id
            && $dossier->statut !== StatutDossier::Brouillon;
    }
}
