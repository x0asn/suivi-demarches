<?php

namespace App\Policies;

use App\Enums\Role;
use App\Models\Reclamation;
use App\Models\User;

class ReclamationPolicy
{
    public function view(User $user, Reclamation $reclamation): bool
    {
        return match ($user->role) {
            Role::Citoyen => $reclamation->citoyen_id === $user->id,
            Role::Agent => $this->dansPerimetre($user, $reclamation),
            Role::Admin, Role::Responsable => true,
        };
    }

    /** L'administrateur traite toutes les réclamations ; un agent, celles qui portent sur un dossier de son service. */
    public function traiter(User $user, Reclamation $reclamation): bool
    {
        return $user->role === Role::Admin
            || ($user->role === Role::Agent && $this->dansPerimetre($user, $reclamation));
    }

    private function dansPerimetre(User $user, Reclamation $reclamation): bool
    {
        return $user->service_id !== null && $reclamation->dossier?->service_id === $user->service_id;
    }
}
