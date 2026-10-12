<?php

namespace Database\Seeders;

use App\Enums\Role;
use App\Models\Service;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * Donne un agent de démonstration à chaque mairie qui n'en a pas encore (RG-006) :
 * sans agent rattaché, un dossier adressé à cette mairie ne pourrait être traité par personne.
 *
 * Adresse de connexion : agent.<commune>@suivi-demarches.sn — mot de passe commun de démonstration.
 * Les agents déjà présents ne sont pas modifiés.
 */
class AgentsMairiesSeeder extends Seeder
{
    private const PRENOMS = [
        'Awa', 'Mamadou', 'Fatou', 'Ibrahima', 'Aminata', 'Ousmane', 'Mariama', 'Cheikh', 'Khady', 'Abdoulaye',
        'Ndeye', 'Moussa', 'Aïssatou', 'Pape', 'Coumba', 'Modou', 'Rokhaya', 'Babacar', 'Seynabou', 'Lamine',
        'Astou', 'Malick', 'Adama', 'Serigne', 'Dieynaba', 'Alioune', 'Sokhna', 'Samba', 'Bineta', 'Assane',
    ];

    private const NOMS = [
        'Diop', 'Ndiaye', 'Fall', 'Sow', 'Ba', 'Diallo', 'Faye', 'Sarr', 'Gueye', 'Mbaye', 'Sy', 'Thiam',
        'Cissé', 'Kane', 'Seck', 'Ndour', 'Diatta', 'Niang', 'Wade', 'Sall', 'Camara', 'Diouf', 'Touré', 'Badji',
    ];

    public function run(): void
    {
        // Le mot de passe est haché une seule fois : il est identique pour tous les comptes de démonstration.
        $motDePasse = Hash::make(UtilisateursDemoSeeder::MOT_DE_PASSE);

        $mairies = Service::where('type', 'mairie')
            ->whereDoesntHave('agents', fn ($q) => $q->where('role', Role::Agent->value))
            ->orderBy('id')
            ->get();

        foreach ($mairies as $i => $mairie) {
            $user = new User([
                'prenom' => self::PRENOMS[$i % count(self::PRENOMS)],
                // Le pas de 7 évite que le même prénom retombe toujours sur le même nom.
                'nom' => self::NOMS[($i * 7 + 3) % count(self::NOMS)],
                'email' => $this->email($mairie),
                'region' => $mairie->region,
                'commune' => $mairie->commune,
            ]);
            $user->password = $motDePasse;
            $user->role = Role::Agent;
            $user->service_id = $mairie->id;
            $user->actif = true;
            $user->email_verified_at = now();
            $user->save();
        }
    }

    /** agent.kolda@… ; en cas d'homonymie entre deux communes, la région est ajoutée. */
    private function email(Service $mairie): string
    {
        $commune = Str::slug($mairie->commune ?: $mairie->nom);
        $email = "agent.{$commune}@suivi-demarches.sn";
        if (User::where('email', $email)->exists()) {
            $email = "agent.{$commune}.".Str::slug((string) $mairie->region).'@suivi-demarches.sn';
        }
        if (User::where('email', $email)->exists()) {
            $email = "agent.{$commune}.{$mairie->id}@suivi-demarches.sn";
        }

        return $email;
    }
}
