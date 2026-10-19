<?php

namespace App\Services;

use App\Enums\Role;
use App\Models\Dossier;
use App\Models\Procedure;
use App\Models\User;
use Illuminate\Support\Str;

/**
 * Réponses guidées de l'assistant, sans intelligence artificielle.
 * Utilisé quand l'IA n'est pas configurée ou injoignable (pas d'internet le jour de la
 * démonstration, par exemple) : la question est rapprochée du catalogue par mots-clés.
 */
class AssistantSecours
{
    /** Mots trop courants pour aider à reconnaître une démarche. */
    private const MOTS_VIDES = [
        'comment', 'quelle', 'quelles', 'quel', 'quels', 'pour', 'faire', 'avoir', 'obtenir', 'dois', 'faut', 'veux',
        'voudrais', 'besoin', 'est', 'sont', 'les', 'des', 'une', 'mon', 'mes', 'que', 'qui', 'quoi', 'ou', 'dans',
        'avec', 'sur', 'pieces', 'piece', 'documents', 'document', 'combien', 'temps', 'delai', 'cout', 'prix',
        'demande', 'demander', 'demarche', 'bonjour', 'salut', 'merci', 'svp', 'the', 'acte', 'certificat',
        'comprends', 'comprend', 'compris', 'pas', 'rien', 'explique', 'expliquer', 'simple', 'simplement', 'clair', 'plus',
        'perdu', 'perdue', 'suis',
    ];

    /** Façons de dire « je ne comprends pas » ou « expliquez-moi plus simplement ». */
    private const INCOMPREHENSION = [
        'comprends pas', 'comprend pas', 'comprends rien', 'compris', 'pas clair', 'plus simple', 'simplement', 'explique',
        'expliquer', 'c est quoi', 'ca veut dire', 'perdu', 'complique', 'je ne sais pas', 'comment ca',
    ];

    /**
     * @param  list<array{role: string, content: string}>  $discussion  Messages précédents, pour savoir de quoi on parlait.
     */
    public static function repondre(string $question, ?User $user, array $discussion = []): string
    {
        $mots = self::motsCles($question);
        $texte = self::normaliser($question);

        // « Je ne comprends pas » : on reprend plus simplement la démarche dont on parlait.
        if (Str::contains(str_replace("'", ' ', $texte), self::INCOMPREHENSION)) {
            $procedure = self::procedureLaPlusProche($mots) ?? self::procedureDeLaDiscussion($discussion);

            return $procedure ? self::explicationSimple($procedure) : self::presentationSimple();
        }

        if ($user?->role === Role::Citoyen && Str::contains($texte, ['mon dossier', 'mes dossiers', 'ma demande', 'mes demandes', 'ou en est', 'ou en sont', 'avancement'])) {
            return self::dossiers($user);
        }

        if ($procedure = self::procedureLaPlusProche($mots)) {
            return self::fiche($procedure);
        }

        if (Str::contains($texte, ['suivre', 'suivi', 'ou en est', 'avancement', 'accuse', 'qr'])) {
            return "Pour suivre une demande sans vous connecter, ouvrez la page [Suivre un dossier](/suivi) et saisissez la **référence** et le **code de suivi** inscrits sur votre accusé de réception. Vous pouvez aussi scanner son QR code.\n\nDepuis votre espace, la page de chaque dossier montre les étapes franchies, vos pièces et vos échanges avec l'administration.";
        }

        if (Str::contains($texte, ['proche', 'proximite', 'adresse', 'ou aller', 'itineraire', 'carte', 'mairie', 'tribunal'])) {
            return "La page [Administrations à proximité](/services) affiche les administrations autour de vous, la distance et l'itinéraire.\n\nAttention : la plus proche n'est pas toujours celle qui peut traiter votre demande. Choisissez d'abord votre démarche, la plateforme vous montre alors les administrations habilitées.";
        }

        $exemples = Procedure::publiees()->orderBy('titre')->limit(6)->get()
            ->map(fn (Procedure $p) => "- [{$p->titre}](/procedures/{$p->slug})")->implode("\n");

        return "Je n'ai pas trouvé de démarche correspondant à votre question. Essayez avec le nom du document recherché, par exemple « extrait de naissance » ou « passeport ».\n\nQuelques démarches disponibles :\n{$exemples}\n\nVous pouvez aussi parcourir [toutes les procédures](/procedures).";
    }

    /** La démarche reprise pas à pas, avec des mots de tous les jours. */
    private static function explicationSimple(Procedure $p): string
    {
        $p->loadMissing(['pieces', 'services']);
        $papiers = $p->pieces->where('obligatoire', true)->pluck('libelle');

        $etapes = [];
        $etapes[] = $papiers->isEmpty()
            ? 'Vous n’avez aucun papier obligatoire à préparer.'
            : 'Préparez '.($papiers->count() > 1 ? 'ces papiers' : 'ce papier').' en photo ou en scan : **'.$papiers->implode('**, **').'**.';
        $etapes[] = 'Ouvrez votre compte sur la plateforme. Si vous n’en avez pas, [créez-le ici](/inscription), c’est gratuit.';
        $etapes[] = "Ouvrez la page de la démarche et cliquez sur **Commencer ma démarche** : [{$p->titre}](/procedures/{$p->slug}).";
        if ($p->services->count() > 1) {
            $etapes[] = "Choisissez l’administration qui recevra votre demande : {$p->regle_competence->enBref()}.";
        }
        $etapes[] = 'Ajoutez vos papiers, puis cliquez sur **Soumettre ma demande**. Vous recevez un reçu avec un numéro de dossier.';
        $etapes[] = 'Attendez la réponse'.($p->delai_jours ? " : comptez environ **{$p->delai_jours} jour".($p->delai_jours > 1 ? 's' : '').'**' : '').'. La plateforme vous prévient à chaque étape.';

        $lignes = ['Pas de souci, je reprends plus simplement.', '', "**{$p->titre}** : {$p->resume}", '', 'Voici quoi faire, une étape après l’autre :'];
        foreach ($etapes as $i => $etape) {
            $lignes[] = ($i + 1).'. '.$etape;
        }
        $lignes[] = '';
        $lignes[] = 'Quelle étape n’est pas claire pour vous ? Dites-moi son numéro.';

        return implode("\n", $lignes);
    }

    /** Quand on ne sait pas de quelle démarche il s'agit : la plateforme en trois phrases. */
    private static function presentationSimple(): string
    {
        return "Pas de souci, je vous explique simplement.\n\nCette plateforme sert à demander un papier à la mairie ou à une autre administration **sans vous déplacer pour rien** :\n1. Vous choisissez le papier dont vous avez besoin, par exemple un extrait de naissance.\n2. La plateforme vous dit quels papiers fournir et à quelle administration vous adresser.\n3. Vous envoyez votre demande, puis vous suivez son avancement depuis votre téléphone.\n\nDe quel papier avez-vous besoin ? Écrivez simplement son nom, par exemple « extrait de naissance » ou « certificat de résidence ».";
    }

    /**
     * Dernière démarche évoquée dans la discussion (questions du citoyen, de la plus récente à la plus ancienne).
     *
     * @param  list<array{role: string, content: string}>  $discussion
     */
    private static function procedureDeLaDiscussion(array $discussion): ?Procedure
    {
        foreach (array_reverse($discussion) as $message) {
            if ($message['role'] === 'user' && ($procedure = self::procedureLaPlusProche(self::motsCles($message['content'])))) {
                return $procedure;
            }
        }

        return null;
    }

    private static function fiche(Procedure $p): string
    {
        $p->loadMissing(['pieces', 'services']);
        $lignes = ["**{$p->titre}**", $p->resume, ''];

        $obligatoires = $p->pieces->where('obligatoire', true);
        if ($obligatoires->isNotEmpty()) {
            $lignes[] = 'Pièces à fournir :';
            foreach ($obligatoires as $piece) {
                $lignes[] = "- {$piece->libelle}";
            }
            $lignes[] = '';
        }

        if ($p->delai_jours) {
            $lignes[] = "Délai indicatif : **{$p->delai_jours} jour".($p->delai_jours > 1 ? 's' : '').'**.';
        }
        if ($cout = $p->coutAffiche()) {
            $lignes[] = "Coût : **{$cout}**.";
        }
        if ($p->services->isNotEmpty()) {
            $lignes[] = '';
            $lignes[] = "Où la faire : {$p->regle_competence->explication()}";
            $lignes[] = "[Voir les administrations habilitées sur la carte](/services?demarche={$p->slug})";
        }
        $lignes[] = '';
        $lignes[] = "[Ouvrir la fiche complète](/procedures/{$p->slug})";
        $lignes[] = '';
        $lignes[] = 'Si ce n’est pas clair, écrivez « je ne comprends pas » : je vous l’explique étape par étape.';

        return implode("\n", $lignes);
    }

    private static function dossiers(User $user): string
    {
        $dossiers = Dossier::with('procedure')->where('citoyen_id', $user->id)->latest('updated_at')->limit(5)->get();
        if ($dossiers->isEmpty()) {
            return "Vous n'avez pas encore de dossier. Parcourez les [procédures](/procedures) pour commencer une démarche.";
        }

        $lignes = ['Voici vos dossiers les plus récents :'];
        foreach ($dossiers as $d) {
            $lignes[] = "- [{$d->reference}](/espace/dossiers/{$d->id}) — {$d->procedure->titre} : **{$d->statut->libelle()}**";
        }

        return implode("\n", $lignes);
    }

    /** @param list<string> $mots */
    private static function procedureLaPlusProche(array $mots): ?Procedure
    {
        if ($mots === []) {
            return null;
        }

        $meilleure = null;
        $meilleurScore = 0;
        foreach (Procedure::publiees()->with('categorie')->get() as $procedure) {
            $titre = self::normaliser($procedure->titre);
            $reste = self::normaliser($procedure->resume.' '.$procedure->categorie?->nom);
            $score = 0;
            foreach ($mots as $mot) {
                // Le début du mot suffit : « naissances » retrouve « naissance ».
                $racine = mb_substr($mot, 0, max(4, mb_strlen($mot) - 2));
                $score += str_contains($titre, $racine) ? 3 : (str_contains($reste, $racine) ? 1 : 0);
            }
            if ($score > $meilleurScore) {
                [$meilleure, $meilleurScore] = [$procedure, $score];
            }
        }

        return $meilleurScore >= 3 ? $meilleure : null;
    }

    /** @return list<string> */
    private static function motsCles(string $question): array
    {
        $mots = preg_split('/[^a-z0-9]+/', self::normaliser($question), -1, PREG_SPLIT_NO_EMPTY);

        return array_values(array_filter($mots, fn (string $m) => mb_strlen($m) > 2 && ! in_array($m, self::MOTS_VIDES, true)));
    }

    /** Minuscules sans accents, pour comparer des mots écrits différemment. */
    private static function normaliser(string $texte): string
    {
        return Str::lower(Str::ascii($texte));
    }
}
