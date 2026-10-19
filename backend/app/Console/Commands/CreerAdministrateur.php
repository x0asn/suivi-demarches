<?php

namespace App\Console\Commands;

use App\Enums\Role;
use App\Models\User;
use App\Services\Journal;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rules\Password;

/**
 * Crée le premier compte administrateur d'une installation réelle.
 * Le mot de passe est saisi sans s'afficher ; il n'est écrit dans aucun fichier.
 *
 *   php artisan admin:creer
 */
class CreerAdministrateur extends Command
{
    protected $signature = 'admin:creer';

    protected $description = 'Crée un compte administrateur (installation réelle)';

    public function handle(): int
    {
        $donnees = [
            'prenom' => $this->ask('Prénom'),
            'nom' => $this->ask('Nom'),
            'email' => $this->ask('Adresse e-mail'),
            'telephone' => $this->ask('Téléphone (facultatif)'),
            'password' => $this->secret('Mot de passe (12 caractères minimum, lettres, chiffres et symbole)'),
            'password_confirmation' => $this->secret('Confirmez le mot de passe'),
        ];

        $validation = Validator::make($donnees, [
            'prenom' => ['required', 'string', 'max:100'],
            'nom' => ['required', 'string', 'max:100'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'telephone' => ['nullable', 'string', 'max:30'],
            'password' => ['required', 'confirmed', Password::min(12)->letters()->mixedCase()->numbers()->symbols()],
        ], [], ['password' => 'mot de passe', 'email' => 'adresse e-mail']);

        if ($validation->fails()) {
            foreach ($validation->errors()->all() as $erreur) {
                $this->error($erreur);
            }

            return self::FAILURE;
        }

        $admin = new User(collect($donnees)->only(['prenom', 'nom', 'email', 'telephone'])->all());
        $admin->password = $donnees['password'];
        $admin->role = Role::Admin;
        $admin->actif = true;
        $admin->email_verified_at = now();
        $admin->save();

        Journal::enregistrer('admin.utilisateur.cree', $admin, ['role' => Role::Admin->value, 'origine' => 'console'], acteur: $admin);
        $this->info("Compte administrateur créé : {$admin->email}");

        return self::SUCCESS;
    }
}
