<?php

namespace App\Console\Commands;

use App\Enums\Role;
use App\Models\Procedure;
use App\Models\User;
use App\Services\PayDunya;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Throwable;

/**
 * Contrôle, avant la mise en ligne, que le serveur est réglé pour un usage réel.
 *
 *   php artisan production:verifier
 *
 * ✔ réglé · ⚠ à vérifier (n'empêche pas la mise en ligne) · ✘ bloquant
 */
class VerifierProduction extends Command
{
    protected $signature = 'production:verifier';

    protected $description = 'Vérifie les réglages de sécurité et de fonctionnement avant la mise en ligne';

    private int $bloquants = 0;

    private int $avertissements = 0;

    public function handle(): int
    {
        $this->line('');
        $this->line('<options=bold>Vérification avant mise en ligne — '.config('app.name').'</>');

        $this->titre('Application');
        $this->controle(app()->isProduction(), 'Mode production (APP_ENV=production)', 'APP_ENV vaut « '.app()->environment().' » : mettez APP_ENV=production.');
        $this->controle(! config('app.debug'), 'Messages d’erreur techniques masqués (APP_DEBUG=false)', 'APP_DEBUG=true affiche le code et les secrets en cas d’erreur : mettez APP_DEBUG=false.');
        $this->controle(filled(config('app.key')), 'Clé de chiffrement présente (APP_KEY)', 'Lancez : php artisan key:generate');
        $this->controle($this->https(config('app.url')), 'Adresse de l’API en HTTPS (APP_URL)', 'APP_URL doit commencer par https:// et être l’adresse publique du serveur.');
        $this->controle($this->https(config('app.frontend_url')), 'Adresse du site en HTTPS (FRONTEND_URL)', 'FRONTEND_URL doit être l’adresse publique du site, en https:// (utilisée par les QR codes, les e-mails et le paiement).');
        $this->controle(config('logging.channels.single.level') !== 'debug', 'Journal technique sans détails superflus (LOG_LEVEL)', 'Mettez LOG_LEVEL=warning.', bloquant: false);
        $this->controle(filled(config('sanctum.expiration')), 'Durée de connexion limitée (SANCTUM_EXPIRATION)', 'Les connexions n’expirent jamais : mettez SANCTUM_EXPIRATION=10080 (7 jours).', bloquant: false);
        $this->controle(is_writable(storage_path('app/private')) && is_writable(storage_path('logs')), 'Dossiers de stockage accessibles en écriture', 'Le serveur web doit pouvoir écrire dans backend/storage (pièces justificatives, journaux).');

        $this->titre('Base de données');
        try {
            DB::connection()->getPdo();
            $this->controle(true, 'Connexion à la base ('.config('database.default').')');
        } catch (Throwable $e) {
            $this->controle(false, 'Connexion à la base', 'Connexion impossible : vérifiez DB_HOST, DB_DATABASE, DB_USERNAME et DB_PASSWORD.');
            $this->resume();

            return self::FAILURE;
        }
        $migrator = app('migrator');
        $enAttente = $migrator->repositoryExists()
            ? array_diff(array_keys($migrator->getMigrationFiles(database_path('migrations'))), $migrator->getRepository()->getRan())
            : ['toutes'];
        $this->controle($enAttente === [], 'Tables à jour', 'Des migrations n’ont pas été appliquées : php artisan migrate --force');

        $this->titre('Comptes');
        $admins = User::where('role', Role::Admin)->where('actif', true)->count();
        $this->controle($admins > 0, "Administrateur actif ({$admins})", 'Aucun administrateur : php artisan admin:creer');
        $demo = User::where('email', 'like', '%@suivi-demarches.sn')->get();
        $demoMotDePasse = $demo->filter(fn (User $u) => Hash::check('Demo2026', $u->password))->count();
        $this->controle($demoMotDePasse === 0, 'Aucun compte de démonstration', "{$demoMotDePasse} compte(s) de démonstration au mot de passe connu de tous : installez une base propre (ProductionSeeder).");

        $this->titre('Contenus');
        $publiees = Procedure::where('statut', 'publiee')->count();
        $this->controle($publiees > 0, "Démarches publiées ({$publiees})", 'Aucune démarche publiée : vérifiez-les (pièces, délais, frais) dans Administration > Procédures, puis publiez-les.', bloquant: false);

        $this->titre('Services externes');
        $mail = config('mail.default');
        $this->controle(! in_array($mail, ['log', 'array'], true), "Envoi d’e-mails ({$mail})", 'Les e-mails ne partent pas (MAIL_MAILER=log) : réglez un serveur SMTP pour le « mot de passe oublié ».', bloquant: false);
        if (! PayDunya::configure()) {
            $this->controle(false, 'Paiement en ligne', 'Clés PayDunya absentes : les frais se régleront au guichet.', bloquant: false);
        } else {
            $this->controle(PayDunya::mode() === 'live', 'Paiement en ligne en mode réel (PAYDUNYA_MODE=live)', 'PayDunya est en mode test : aucun argent n’est encaissé. Mettez PAYDUNYA_MODE=live et les clés de production.', bloquant: false);
        }

        $this->resume();

        return $this->bloquants > 0 ? self::FAILURE : self::SUCCESS;
    }

    private function https(?string $adresse): bool
    {
        return is_string($adresse) && str_starts_with($adresse, 'https://')
            && ! preg_match('#^https://(localhost|127\.|192\.168\.|10\.)#', $adresse);
    }

    private function titre(string $titre): void
    {
        $this->line('');
        $this->line("<fg=cyan>{$titre}</>");
    }

    private function controle(bool $ok, string $libelle, string $conseil = '', bool $bloquant = true): void
    {
        if ($ok) {
            $this->line("  <fg=green>✔</> {$libelle}");

            return;
        }
        $bloquant ? $this->bloquants++ : $this->avertissements++;
        $this->line($bloquant ? "  <fg=red>✘ {$libelle}</>" : "  <fg=yellow>⚠ {$libelle}</>");
        $this->line("      {$conseil}");
    }

    private function resume(): void
    {
        $this->line('');
        if ($this->bloquants === 0) {
            $this->info('Prêt pour la mise en ligne'.($this->avertissements ? " ({$this->avertissements} point(s) à vérifier)." : '.'));
        } else {
            $this->error("{$this->bloquants} point(s) bloquant(s) à corriger avant la mise en ligne.");
        }
    }
}
