<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

/**
 * Règle l'adresse publique de l'interface (FRONTEND_URL dans .env), utilisée par le QR code
 * de l'accusé de réception et par les liens des notifications.
 *
 *   php artisan demo:adresse --reseau   → adresse de l'ordinateur sur le wifi (téléphones du jury)
 *   php artisan demo:adresse            → retour à http://localhost:5173 (usage normal)
 */
class AdresseDemo extends Command
{
    protected $signature = 'demo:adresse {--reseau : Utiliser l\'adresse de l\'ordinateur sur le réseau local}';

    protected $description = 'Règle l\'adresse de l\'interface utilisée par le QR code (localhost ou réseau local)';

    public function handle(): int
    {
        $adresse = 'http://localhost:5173';

        if ($this->option('reseau')) {
            $ip = $this->ipLocale();
            if (! $ip) {
                $this->error('Adresse réseau introuvable : l\'ordinateur est-il connecté au wifi ?');

                return self::FAILURE;
            }
            $adresse = "http://{$ip}:5173";
        }

        $chemin = base_path('.env');
        $contenu = file_get_contents($chemin);
        $ligne = "FRONTEND_URL={$adresse}";
        $contenu = preg_match('/^FRONTEND_URL=.*$/m', $contenu)
            ? preg_replace('/^FRONTEND_URL=.*$/m', $ligne, $contenu)
            : rtrim($contenu)."\n{$ligne}\n";
        file_put_contents($chemin, $contenu);

        $this->info("Adresse de l'interface : {$adresse}");
        if ($this->option('reseau')) {
            $this->line('Les téléphones connectés au même wifi peuvent ouvrir cette adresse et scanner les QR codes.');
        }

        return self::SUCCESS;
    }

    /** Adresse IPv4 de l'ordinateur sur le réseau local (192.168.x.x, 10.x.x.x ou 172.16–31.x.x). */
    private function ipLocale(): ?string
    {
        $candidates = array_filter(array_unique([
            gethostbyname((string) gethostname()),
            ...(gethostbynamel((string) gethostname()) ?: []),
        ]));

        foreach ($candidates as $ip) {
            if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4)
                && ! filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE)
                && ! str_starts_with($ip, '127.')) {
                return $ip;
            }
        }

        return null;
    }
}
