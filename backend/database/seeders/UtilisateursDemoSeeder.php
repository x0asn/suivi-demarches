<?php

namespace Database\Seeders;

use App\Enums\Role;
use App\Models\Service;
use App\Models\User;
use Illuminate\Database\Seeder;

/**
 * Comptes de démonstration pour la soutenance (§22, annexe J).
 * Mot de passe commun : Demo2026
 */
class UtilisateursDemoSeeder extends Seeder
{
    public const MOT_DE_PASSE = 'Demo2026';

    public function run(): void
    {
        $comptes = [
            ['prenom' => 'Awa', 'nom' => 'Diop', 'email' => 'admin@suivi-demarches.sn', 'telephone' => '+221 77 100 00 01', 'role' => Role::Admin],
            ['prenom' => 'Ibrahima', 'nom' => 'Fall', 'email' => 'responsable@suivi-demarches.sn', 'telephone' => '+221 77 100 00 02', 'role' => Role::Responsable],
            ['prenom' => 'Mariama', 'nom' => 'Sow', 'email' => 'agent@suivi-demarches.sn', 'telephone' => '+221 77 100 00 03', 'role' => Role::Agent, 'service' => 'Mairie de Dakar-Plateau'],
            ['prenom' => 'Ousmane', 'nom' => 'Ndiaye', 'email' => 'agent2@suivi-demarches.sn', 'telephone' => '+221 77 100 00 04', 'role' => Role::Agent, 'service' => 'Tribunal de grande instance de Dakar'],
            // Un agent par service, pour que chaque dossier ait un interlocuteur (RG-006)
            ['prenom' => 'Aminata', 'nom' => 'Diallo', 'email' => 'agent.diamniadio@suivi-demarches.sn', 'telephone' => '+221 77 100 00 05', 'role' => Role::Agent, 'service' => 'Mairie de Diamniadio'],
            ['prenom' => 'Cheikh', 'nom' => 'Mbaye', 'email' => 'agent.pikine@suivi-demarches.sn', 'telephone' => '+221 77 100 00 06', 'role' => Role::Agent, 'service' => 'Mairie de Pikine'],
            ['prenom' => 'Khady', 'nom' => 'Faye', 'email' => 'agent.thies@suivi-demarches.sn', 'telephone' => '+221 77 100 00 07', 'role' => Role::Agent, 'service' => 'Mairie de Thiès'],
            ['prenom' => 'Pape', 'nom' => 'Seck', 'email' => 'agent.instance@suivi-demarches.sn', 'telephone' => '+221 77 100 00 08', 'role' => Role::Agent, 'service' => "Tribunal d'instance de Dakar"],
            ['prenom' => 'Rokhaya', 'nom' => 'Kane', 'email' => 'agent.identite@suivi-demarches.sn', 'telephone' => '+221 77 100 00 09', 'role' => Role::Agent, 'service' => "Direction de l'identification et des titres"],
            ['prenom' => 'Babacar', 'nom' => 'Thiam', 'email' => 'agent.urbanisme@suivi-demarches.sn', 'telephone' => '+221 77 100 00 10', 'role' => Role::Agent, 'service' => "Service régional de l'urbanisme"],
            ['prenom' => 'Seynabou', 'nom' => 'Cissé', 'email' => 'agent.entreprise@suivi-demarches.sn', 'telephone' => '+221 77 100 00 11', 'role' => Role::Agent, 'service' => 'Guichet unique de création d’entreprise'],
            ['prenom' => 'Lamine', 'nom' => 'Sall', 'email' => 'agent.impots@suivi-demarches.sn', 'telephone' => '+221 77 100 00 12', 'role' => Role::Agent, 'service' => 'Centre des services fiscaux'],
            ['prenom' => 'Astou', 'nom' => 'Ndour', 'email' => 'agent.bourses@suivi-demarches.sn', 'telephone' => '+221 77 100 00 13', 'role' => Role::Agent, 'service' => 'Direction des bourses — Enseignement supérieur'],
            ['prenom' => 'Fatou', 'nom' => 'Ba', 'email' => 'citoyen@suivi-demarches.sn', 'telephone' => '+221 77 200 00 01', 'role' => Role::Citoyen, 'region' => 'Dakar', 'commune' => 'Diamniadio'],
            ['prenom' => 'Moussa', 'nom' => 'Sarr', 'email' => 'citoyen2@suivi-demarches.sn', 'telephone' => '+221 77 200 00 02', 'role' => Role::Citoyen, 'region' => 'Dakar', 'commune' => 'Pikine'],
        ];

        foreach ($comptes as $c) {
            $user = User::firstOrNew(['email' => $c['email']]);
            $user->fill([
                'prenom' => $c['prenom'],
                'nom' => $c['nom'],
                'telephone' => $c['telephone'],
                'region' => $c['region'] ?? null,
                'commune' => $c['commune'] ?? null,
                'password' => self::MOT_DE_PASSE,
            ]);
            $user->role = $c['role'];
            $user->service_id = isset($c['service']) ? Service::where('nom', $c['service'])->value('id') : null;
            $user->actif = true;
            $user->email_verified_at = now();
            $user->save();
        }
    }
}
