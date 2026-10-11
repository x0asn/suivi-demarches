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
    ];

    public static function repondre(string $question, ?User $user): string
    {
        $mots = self::motsCles($question);
        $texte = self::normaliser($question);

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
        if ($p->cout) {
            $lignes[] = "Coût : **{$p->cout}**.";
        }
        if ($p->services->isNotEmpty()) {
            $lignes[] = '';
            $lignes[] = "Où la faire : {$p->regle_competence->explication()}";
            $lignes[] = "[Voir les administrations habilitées sur la carte](/services?demarche={$p->slug})";
        }
        $lignes[] = '';
        $lignes[] = "[Ouvrir la fiche complète](/procedures/{$p->slug})";

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
