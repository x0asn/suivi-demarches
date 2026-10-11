<?php

namespace Database\Seeders;

use App\Enums\Role;
use App\Enums\StatutDocument;
use App\Enums\StatutDossier;
use App\Models\Document;
use App\Models\Dossier;
use App\Models\Procedure;
use App\Models\User;
use App\Notifications\NotificationPlateforme;
use App\Services\Notifieur;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Dossiers de démonstration (§28) : un historique crédible sur six mois pour que
 * l'espace citoyen, la file des agents et les statistiques soient parlants devant le jury.
 */
class DossiersDemoSeeder extends Seeder
{
    private const PRENOMS = ['Aminata', 'Moussa', 'Awa', 'Cheikh', 'Ndeye', 'Ibrahima', 'Khady', 'Mamadou', 'Rokhaya', 'Souleymane', 'Adja', 'Babacar', 'Coumba', 'Djibril', 'Seynabou', 'Abdoulaye', 'Astou', 'Lamine', 'Mame Diarra', 'Modou'];

    private const NOMS = ['Diop', 'Ndiaye', 'Fall', 'Sow', 'Ba', 'Sarr', 'Gueye', 'Faye', 'Diallo', 'Mbaye', 'Cissé', 'Sy', 'Diouf', 'Kane', 'Thiam', 'Sall', 'Ndour', 'Seck', 'Camara', 'Niang'];

    private const MOTIFS = [
        'Constitution d’un dossier de concours de la fonction publique.',
        'Ouverture d’un compte bancaire.',
        'Inscription à l’université.',
        'Demande de visa d’études.',
        'Dossier de recrutement dans une entreprise privée.',
        'Renouvellement de mes papiers d’identité.',
        'Constitution d’un dossier de mariage.',
        'Démarche demandée par mon employeur.',
    ];

    /** Région et commune des citoyens de démonstration (Dakar plus représentée, comme en réalité). */
    private const LOCALITES = [
        ['Dakar', 'Dakar-Plateau'], ['Dakar', 'Guédiawaye'], ['Thiès', 'Thiès'], ['Dakar', 'Rufisque'],
        ['Diourbel', 'Touba'], ['Dakar', 'Parcelles Assainies'], ['Saint-Louis', 'Saint-Louis'], ['Thiès', 'Mbour'],
        ['Kaolack', 'Kaolack'], ['Dakar', 'Pikine'], ['Ziguinchor', 'Ziguinchor'], ['Louga', 'Louga'],
        ['Dakar', 'Diamniadio'], ['Fatick', 'Fatick'], ['Thiès', 'Tivaouane'], ['Tambacounda', 'Tambacounda'],
        ['Dakar', 'Yoff'], ['Kolda', 'Kolda'],
    ];

    /** Chemin de statuts pour atteindre chaque statut cible. */
    private const CHEMINS = [
        'brouillon' => ['brouillon'],
        'soumis' => ['brouillon', 'soumis'],
        'en_verification' => ['brouillon', 'soumis', 'en_verification'],
        'en_traitement' => ['brouillon', 'soumis', 'en_verification', 'en_traitement'],
        'correction_demandee' => ['brouillon', 'soumis', 'en_verification', 'correction_demandee'],
        'valide' => ['brouillon', 'soumis', 'en_verification', 'en_traitement', 'valide'],
        'termine' => ['brouillon', 'soumis', 'en_verification', 'en_traitement', 'valide', 'termine'],
        'rejete' => ['brouillon', 'soumis', 'en_verification', 'rejete'],
        'cloture' => ['brouillon', 'soumis', 'en_verification', 'rejete', 'cloture'],
    ];

    private array $citoyens = [];

    public function run(): void
    {
        mt_srand(2026); // jeu de données reproductible

        $this->citoyens = $this->creerCitoyens();
        $fatou = User::where('email', 'citoyen@suivi-demarches.sn')->first();
        $moussa = User::where('email', 'citoyen2@suivi-demarches.sn')->first();

        // --- Le parcours de Fatou Ba, citoyenne de démonstration ---
        $this->creer($fatou, "extrait-dacte-de-naissance", 'termine', 58, 'Inscription de mon fils à l’école primaire.');
        $this->creer($fatou, 'bulletin-n3-du-casier-judiciaire', 'en_traitement', 3, 'Dossier de recrutement à la fonction publique.');
        $this->creer($fatou, 'certificat-de-vie-et-dentretien', 'correction_demandee', 6, 'Allocations familiales.', 'Votre pièce d’identité est illisible : merci d’en joindre une copie nette, recto et verso.');
        $this->creer($fatou, 'passeport-ordinaire', 'brouillon', 1, null);
        $this->creer($moussa, 'certificat-de-residence', 'valide', 12, 'Ouverture d’un compte bancaire.');
        $this->creer($moussa, 'creation-dentreprise-individuelle', 'soumis', 1, 'Création de mon atelier de couture à Pikine.');

        // --- Activité des autres citoyens, répartie sur six mois ---
        $repartition = [
            // [procédure, statut, jours depuis la soumission]
            ...$this->serie("extrait-dacte-de-naissance", ['soumis' => [0, 1, 2], 'en_verification' => [2, 4], 'en_traitement' => [3, 6], 'termine' => [15, 33, 47, 70, 96, 128, 150, 176], 'rejete' => [40], 'cloture' => [88]]),
            ...$this->serie('certificat-de-residence', ['soumis' => [1], 'en_verification' => [2], 'termine' => [20, 52, 77, 110, 140], 'valide' => [5], 'cloture' => [60]]),
            ...$this->serie('certificat-de-vie-et-dentretien', ['soumis' => [2], 'en_traitement' => [4], 'termine' => [25, 81, 133]]),
            ...$this->serie('bulletin-n3-du-casier-judiciaire', ['soumis' => [1], 'en_verification' => [7], 'termine' => [18, 44, 66, 99, 121, 160, 171], 'rejete' => [35]]),
            ...$this->serie('certificat-de-nationalite-senegalaise', ['en_traitement' => [9], 'termine' => [38, 90, 145]]),
            ...$this->serie('legalisation-de-signature', ['termine' => [8, 29, 55, 102, 135, 179], 'soumis' => [0]]),
            ...$this->serie('carte-nationale-didentite-biometrique-cedeao', ['en_traitement' => [12, 19], 'termine' => [45, 74, 118, 155], 'correction_demandee' => [5]]),
            ...$this->serie('passeport-ordinaire', ['en_verification' => [24], 'termine' => [62, 115], 'rejete' => [83]]),
            ...$this->serie('autorisation-de-construire', ['en_traitement' => [21], 'termine' => [95], 'cloture' => [130]]),
            ...$this->serie('creation-dentreprise-individuelle', ['termine' => [10, 48, 87, 125], 'soumis' => [3]]),
            ...$this->serie('attestation-de-situation-fiscale', ['termine' => [16, 70], 'en_verification' => [2]]),
            ...$this->serie('demande-de-bourse-detudes-superieures', ['en_traitement' => [30], 'valide' => [50], 'rejete' => [56]]),
        ];

        foreach ($repartition as [$slug, $statut, $jours]) {
            $this->creer($this->citoyens[array_rand($this->citoyens)], $slug, $statut, $jours, self::MOTIFS[array_rand(self::MOTIFS)]);
        }

        $this->reclamations($fatou);
    }

    /** Module M07 : quelques réclamations à différents stades. */
    private function reclamations(User $fatou): void
    {
        $admin = User::where('role', Role::Admin->value)->first();
        $termine = Dossier::where('citoyen_id', $fatou->id)->where('statut', 'termine')->first();
        $exemples = [
            [$fatou, $termine, 'accueil', 'Retrait de l’extrait au guichet', 'Lors du retrait de mon extrait, on m’a demandé de revenir le lendemain alors que la notification indiquait que le document était prêt.', 'resolue', 'Nous vous présentons nos excuses. Les agents du guichet ont été informés afin que les documents notifiés comme prêts soient remis immédiatement.', 40],
            [$this->citoyens[2], Dossier::where('statut', 'rejete')->first(), 'decision', 'Contestation du rejet de ma demande', 'Je conteste le rejet de ma demande : je réside bien dans la commune depuis trois ans et je peux fournir un bail à mon nom.', 'en_cours', null, 4],
            [$this->citoyens[5], Dossier::where('statut', 'en_traitement')->latest('soumis_at')->first(), 'retard', 'Délai de traitement dépassé', 'Mon dossier est en traitement depuis plus longtemps que le délai indiqué sur la fiche de la procédure. Pouvez-vous me donner une date ?', 'ouverte', null, 1],
            [$this->citoyens[8], null, 'technique', 'Impossible d’ajouter une photo depuis mon téléphone', 'Lorsque j’essaie d’ajouter une photo prise avec mon téléphone, le fichier est refusé. Quelle taille faut-il respecter ?', 'resolue', 'Les photos doivent faire moins de 5 Mo. Les téléphones récents produisent des images plus lourdes : réduisez la qualité de l’appareil photo ou envoyez une capture d’écran.', 15],
        ];

        foreach ($exemples as [$citoyen, $dossier, $motif, $sujet, $description, $statut, $reponse, $jours]) {
            $r = new \App\Models\Reclamation(['dossier_id' => $dossier?->id, 'motif' => $motif, 'sujet' => $sujet, 'description' => $description]);
            $r->citoyen_id = $dossier?->citoyen_id ?? $citoyen->id;
            $r->statut = $statut;
            $r->reponse = $reponse;
            $r->created_at = now()->subDays($jours);
            if ($statut !== 'ouverte') {
                $r->traitee_par = $admin->id;
                $r->traitee_at = in_array($statut, ['resolue', 'rejetee']) ? now()->subDays(max(0, $jours - 2)) : null;
            }
            $r->save();
        }
    }

    private function serie(string $slug, array $statuts): array
    {
        $lignes = [];
        foreach ($statuts as $statut => $jours) {
            foreach ($jours as $j) {
                $lignes[] = [$slug, $statut, $j];
            }
        }

        return $lignes;
    }

    private function creerCitoyens(): array
    {
        $liste = [];
        foreach (range(1, 18) as $i) {
            $prenom = self::PRENOMS[($i * 7) % count(self::PRENOMS)];
            $nom = self::NOMS[($i * 3) % count(self::NOMS)];
            $user = User::firstOrNew(['email' => Str::slug("{$prenom}.{$nom}", '.')."{$i}@exemple.sn"]);
            $user->fill([
                'prenom' => $prenom,
                'nom' => $nom,
                'telephone' => sprintf('+221 7%d %03d %02d %02d', [7, 8, 6, 0][$i % 4], mt_rand(100, 999), mt_rand(10, 99), mt_rand(10, 99)),
                'region' => self::LOCALITES[$i % count(self::LOCALITES)][0],
                'commune' => self::LOCALITES[$i % count(self::LOCALITES)][1],
                'password' => UtilisateursDemoSeeder::MOT_DE_PASSE,
            ]);
            $user->role = Role::Citoyen;
            $user->created_at = now()->subDays(mt_rand(60, 200));
            $user->save();
            $liste[] = $user;
        }

        return $liste;
    }

    private function creer(User $citoyen, string $slug, string $cible, int $joursDepuisSoumission, ?string $motif, ?string $commentaireCorrection = null): void
    {
        $procedure = Procedure::with('pieces')->where('slug', $slug)->first();
        if (! $procedure) {
            return;
        }

        $agent = User::where('role', Role::Agent->value)->where('service_id', $procedure->service_id)->first();
        $chemin = self::CHEMINS[$cible];

        // Dates : création quelques heures avant la soumission, puis étapes espacées.
        $soumission = now()->subDays($joursDepuisSoumission)->setTime(mt_rand(8, 16), mt_rand(0, 59));
        $creation = (clone $soumission)->subHours(mt_rand(1, 20));
        $dates = [$creation];
        $courante = clone $soumission;
        $rythme = mt_rand(50, 170) / 100;
        foreach (array_slice($chemin, 1) as $i => $_) {
            if ($i > 0) {
                // Certains dossiers dépassent le délai indicatif, comme dans la réalité.
                $pas = max(1, (int) round(($procedure->delai_jours ?? 5) * 24 * $rythme / 2.5));
                $courante = (clone $courante)->addHours(mt_rand((int) ($pas * 0.4), $pas));
                if ($courante->isFuture()) {
                    $courante = now()->subMinutes(mt_rand(30, 600));
                }
            }
            $dates[] = clone $courante;
        }

        DB::transaction(function () use ($citoyen, $procedure, $agent, $cible, $chemin, $dates, $motif, $commentaireCorrection) {
            $dossier = new Dossier(['motif' => $motif]);
            $dossier->procedure_id = $procedure->id;
            $dossier->service_id = $procedure->service_id;
            $dossier->citoyen_id = $citoyen->id;
            $dossier->statut = StatutDossier::from($cible);
            $dossier->created_at = $dates[0];
            $dossier->save();

            $statutsAgent = array_slice($chemin, 2);
            $dossier->agent_id = $statutsAgent ? $agent?->id : null;
            $dossier->soumis_at = count($chemin) > 1 ? $dates[1] : null;
            if (in_array('valide', $chemin) || in_array('rejete', $chemin)) {
                $dossier->decision_at = $dates[array_search(in_array('valide', $chemin) ? 'valide' : 'rejete', $chemin)];
            }
            if (in_array($cible, ['termine', 'cloture'])) {
                $dossier->cloture_at = end($dates);
            }
            if (in_array('rejete', $chemin)) {
                $dossier->motif_decision = 'Les pièces fournies ne permettent pas d’établir que les conditions de la procédure sont remplies.';
            }
            $dossier->updated_at = end($dates);
            $dossier->timestamps = false;
            $dossier->saveQuietly();
            $dossier->timestamps = true;

            // Historique (RG-005)
            $precedent = null;
            foreach ($chemin as $i => $statut) {
                $parAgent = $i >= 2;
                $dossier->historique()->create([
                    'user_id' => $parAgent ? $agent?->id : $citoyen->id,
                    'ancien_statut' => $precedent,
                    'nouveau_statut' => $statut,
                    'commentaire' => match ($statut) {
                        'correction_demandee' => $commentaireCorrection ?? 'Une pièce est illisible : merci d’en joindre une nouvelle copie.',
                        'rejete' => $dossier->motif_decision,
                        'valide' => 'Dossier complet et conforme.',
                        default => null,
                    },
                ])->forceFill(['created_at' => $dates[$i]])->saveQuietly();
                $precedent = $statut;
            }

            // Pièces justificatives
            $verifiees = in_array('en_traitement', $chemin) || in_array('rejete', $chemin);
            foreach ($procedure->pieces as $k => $piece) {
                if (! $piece->obligatoire && mt_rand(0, 2) > 0) {
                    continue;
                }
                $estPdf = $k % 3 !== 1;
                $chemin_fichier = "dossiers/{$dossier->id}/".Str::random(40).($estPdf ? '.pdf' : '.png');
                Storage::disk(Document::DISQUE)->put($chemin_fichier, $estPdf ? $this->pdf($piece->libelle, $citoyen) : $this->png());

                $document = new Document([
                    'piece_requise_id' => $piece->id,
                    'nom_original' => Str::slug($piece->libelle).($estPdf ? '.pdf' : '.jpg'),
                    'chemin' => $chemin_fichier,
                    'mime' => $estPdf ? 'application/pdf' : 'image/png',
                    'taille' => mt_rand(80_000, 1_800_000),
                ]);
                $document->statut = StatutDocument::EnAttente;
                if ($cible === 'correction_demandee' && $k === 0) {
                    $document->statut = StatutDocument::ACorriger;
                    $document->motif = $commentaireCorrection ?? 'Document illisible.';
                } elseif ($verifiees || ($cible === 'correction_demandee')) {
                    $document->statut = StatutDocument::Accepte;
                }
                if ($document->statut !== StatutDocument::EnAttente) {
                    $document->verifie_par = $agent?->id;
                    $document->verifie_at = $dates[min(2, count($dates) - 1)];
                }
                $document->created_at = $dates[0];
                $dossier->documents()->save($document);
            }

            if ($cible !== 'brouillon' && $dossier->agent_id && mt_rand(0, 2) === 0) {
                $dossier->observations()->create([
                    'user_id' => $agent->id,
                    'contenu' => 'Bonjour, votre dossier a bien été reçu et est en cours d’examen.',
                    'interne' => false,
                ])->forceFill(['created_at' => $dates[min(2, count($dates) - 1)]])->saveQuietly();
            }

            $this->notifier($dossier, $chemin, $dates, $agent);
        });
    }

    /** Notifications passées, horodatées comme les étapes, pour un centre de notifications vivant. */
    private function notifier(Dossier $dossier, array $chemin, array $dates, ?User $agent): void
    {
        $dossier->load(['procedure', 'citoyen']);
        foreach (array_slice($chemin, 1) as $i => $statut) {
            $evenement = "dossier.{$statut}";
            [, $titre, $message] = Notifieur::MODELES[$evenement];
            $variables = [
                '{reference}' => $dossier->reference,
                '{procedure}' => $dossier->procedure->titre,
                '{commentaire}' => $dossier->historique()->where('nouveau_statut', $statut)->value('commentaire') ?? '',
            ];
            $notification = new NotificationPlateforme($evenement, strtr($titre, $variables), strtr($message, $variables), "/espace/dossiers/{$dossier->id}", [
                'dossier_id' => $dossier->id, 'reference' => $dossier->reference, 'statut' => $statut,
            ]);
            $dossier->citoyen->notify($notification);
            $date = $dates[$i + 1];
            $dossier->citoyen->notifications()->latest()->first()?->forceFill([
                'created_at' => $date,
                'updated_at' => $date,
                // Les notifications anciennes sont lues ; les plus récentes ne le sont pas.
                'read_at' => Carbon::parse($date)->lt(now()->subDays(3)) ? $date : null,
            ])->save();
        }
    }

    private function pdf(string $titre, User $citoyen): string
    {
        $texte = fn ($t) => str_replace(['\\', '(', ')'], ['\\\\', '\\(', '\\)'], iconv('UTF-8', 'Windows-1252//TRANSLIT', $t));
        $contenu = "BT /F1 20 Tf 60 760 Td (".$texte($titre).") Tj ET\n"
            ."BT /F1 12 Tf 60 730 Td (".$texte("Titulaire : {$citoyen->nom_complet}").") Tj ET\n"
            ."BT /F1 10 Tf 60 700 Td (".$texte('Document fictif généré pour la démonstration de Suivi Démarches.').") Tj ET";

        $objets = [
            '<< /Type /Catalog /Pages 2 0 R >>',
            '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
            '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
            "<< /Length ".strlen($contenu)." >>\nstream\n{$contenu}\nendstream",
            '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
        ];
        $pdf = "%PDF-1.4\n";
        $positions = [];
        foreach ($objets as $i => $objet) {
            $positions[] = strlen($pdf);
            $pdf .= ($i + 1)." 0 obj\n{$objet}\nendobj\n";
        }
        $xref = strlen($pdf);
        $pdf .= "xref\n0 ".(count($objets) + 1)."\n0000000000 65535 f \n";
        foreach ($positions as $p) {
            $pdf .= sprintf("%010d 00000 n \n", $p);
        }

        return $pdf."trailer\n<< /Size ".(count($objets) + 1)." /Root 1 0 R >>\nstartxref\n{$xref}\n%%EOF";
    }

    /** Petite image PNG (aplat vert) générée sans extension GD. */
    private function png(): string
    {
        $largeur = 120;
        $hauteur = 80;
        $ligne = "\0".str_repeat("\x18\x62\x44", $largeur);
        $donnees = gzcompress(str_repeat($ligne, $hauteur));
        $chunk = fn ($type, $data) => pack('N', strlen($data)).$type.$data.pack('N', crc32($type.$data));

        return "\x89PNG\r\n\x1a\n"
            .$chunk('IHDR', pack('NNCCCCC', $largeur, $hauteur, 8, 2, 0, 0, 0))
            .$chunk('IDAT', $donnees)
            .$chunk('IEND', '');
    }
}
