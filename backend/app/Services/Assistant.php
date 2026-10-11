<?php

namespace App\Services;

use Anthropic\Beta\Messages\BetaRawContentBlockDeltaEvent;
use Anthropic\Beta\Messages\BetaTextDelta;
use Anthropic\Client;
use App\Enums\Role;
use App\Enums\StatutDossier;
use App\Models\Dossier;
use App\Models\Procedure;
use App\Models\Service;
use App\Models\User;
use Generator;

/**
 * Assistant IA de la plateforme : il explique les démarches en langage simple et oriente
 * le citoyen. Il s'appuie uniquement sur le catalogue des procédures (transmis dans ses
 * consignes) et, pour un citoyen connecté, sur l'état de ses propres dossiers.
 *
 * Il informe et oriente ; il ne décide jamais à la place d'un agent (cahier des charges §6.2).
 */
class Assistant
{
    public static function disponible(): bool
    {
        return filled(config('assistant.cle'));
    }

    /**
     * Pose la discussion à l'IA et renvoie la réponse morceau par morceau, à mesure qu'elle s'écrit.
     *
     * @param  list<array{role: string, content: string}>  $messages
     * @return Generator<int, string>
     */
    public static function repondre(array $messages, ?User $user): Generator
    {
        $client = new Client(apiKey: config('assistant.cle'));

        // Les consignes et le catalogue sont identiques d'une question à l'autre : ils sont mis en
        // cache chez le fournisseur (réponses plus rapides et moins chères). Ce qui change selon
        // la personne connectée vient après, pour ne pas invalider ce cache.
        $systeme = [
            ['type' => 'text', 'text' => self::consignes(), 'cacheControl' => ['type' => 'ephemeral']],
        ];
        if ($contexte = self::contexteUtilisateur($user)) {
            $systeme[] = ['type' => 'text', 'text' => $contexte];
        }

        // Si le modèle décline une question pour une raison de sécurité, le fournisseur la confie
        // de lui-même à un autre modèle (« fallbacks ») : le citoyen reçoit toujours une réponse.
        $flux = $client->beta->messages->createStream(
            model: config('assistant.modele'),
            maxTokens: config('assistant.max_tokens'),
            system: $systeme,
            messages: array_slice($messages, -config('assistant.historique_max')),
            outputConfig: ['effort' => config('assistant.effort')],
            fallbacks: 'default',
            betas: ['server-side-fallback-2026-07-01'],
        );

        foreach ($flux as $evenement) {
            if ($evenement instanceof BetaRawContentBlockDeltaEvent && $evenement->delta instanceof BetaTextDelta) {
                yield $evenement->delta->text;
            }
        }
    }

    /** Consignes de l'assistant, suivies du catalogue des procédures publiées. */
    public static function consignes(): string
    {
        $regles = <<<'TXT'
        Tu es l'assistant de « Suivi Démarches », une plateforme sénégalaise où les citoyens déposent et suivent leurs démarches administratives auprès des mairies, tribunaux et ministères. Les personnes qui t'écrivent sont souvent perdues face à l'administration : ton rôle est de leur expliquer simplement quoi faire.

        Comment répondre
        - Réponds dans la langue de la personne (français par défaut ; si elle écrit en wolof ou en anglais, réponds dans cette langue).
        - Sois bref et concret : des phrases courtes, des mots de tous les jours, pas de jargon administratif. Une réponse tient en général en quelques lignes ; utilise une liste à puces pour les pièces à fournir ou les étapes.
        - Commence par la réponse, sans formule d'introduction.
        - Pour mettre en forme, n'utilise que le gras (**texte**), les listes à puces et les liens [texte](adresse). Pas de titres ni de tableaux : la réponse s'affiche dans une petite fenêtre de discussion.

        Quand la personne ne comprend pas
        - Si elle dit qu'elle ne comprend pas, qu'elle est perdue, ou repose la même question, ne répète pas ta réponse : c'est ta formulation qui n'a pas marché. Reprends autrement, plus simplement, comme tu l'expliquerais à un proche qui n'a jamais fait de démarche.
        - Découpe en petites étapes numérotées, une seule action par étape, en disant concrètement où cliquer ou quoi apporter. Remplace chaque mot administratif par ce qu'il veut dire (« pièce justificative » devient « un papier qui prouve… », « légalisation » devient « faire certifier que la signature est bien la vôtre »).
        - Donne un exemple concret tiré de sa situation quand cela aide.
        - Si tu ne sais pas ce qui bloque, demande-lui quelle partie n'est pas claire plutôt que de tout réexpliquer.
        - Reste patient et chaleureux : ne lui fais jamais sentir que la question est bête.

        Ce sur quoi tu t'appuies
        - Le catalogue ci-dessous est ta seule source sur les démarches : pièces, délais, coûts, conditions, administrations habilitées. Ne complète pas avec ce que tu sais par ailleurs sur l'administration sénégalaise, car une pièce ou un délai inexact ferait déplacer quelqu'un pour rien. Si une information n'y figure pas, dis-le simplement et conseille de contacter l'administration concernée.
        - Les délais et coûts du catalogue sont indicatifs : présente-les comme tels.
        - Si la question porte sur une démarche absente du catalogue, dis qu'elle n'est pas encore proposée en ligne et suggère, s'il y en a une, la démarche la plus proche.
        - Tu peux répondre brièvement à une question générale sans rapport avec les démarches, puis proposer ton aide sur la plateforme.

        Compétence des administrations
        - L'administration la plus proche n'est pas toujours celle qui peut traiter la demande. Chaque démarche a une règle de compétence (indiquée dans le catalogue) : explique-la quand la personne demande où aller, et ne désigne une administration précise que si la règle et les informations données par la personne le permettent.

        Liens utiles à proposer quand ils aident (adresses internes à écrire telles quelles)
        - Fiche d'une démarche : /procedures/{slug}
        - Administrations habilitées sur la carte, avec distance et itinéraire : /services?demarche={slug}
        - Commencer une démarche (compte citoyen requis) : /espace/dossiers/nouveau/{slug}
        - Suivre un dossier sans compte, avec la référence et le code de suivi de l'accusé de réception : /suivi
        - Créer un compte : /inscription

        Tes limites
        - Tu informes et tu orientes. Tu ne peux ni déposer, ni modifier, ni accepter ou refuser un dossier, et tu ne peux pas prédire la décision d'un agent : si on te le demande, explique que seule l'administration décide et indique comment la contacter depuis le dossier.
        - Statuts d'un dossier : « Validé » veut dire que la demande est approuvée mais que le document n'est pas encore prêt ; « Prêt à retirer » veut dire que le document attend à l'administration ; « Terminé » veut dire qu'il a été remis.
        - Tu ne vois que les dossiers de la personne connectée, quand ils te sont fournis plus bas. Pour quelqu'un qui n'est pas connecté, renvoie vers /suivi.
        TXT;

        return $regles."\n\n".self::catalogue();
    }

    /**
     * Catalogue des procédures publiées, sous forme de texte.
     * L'ordre est fixe (par titre) pour que le texte reste identique d'un appel à l'autre.
     */
    public static function catalogue(): string
    {
        $procedures = Procedure::publiees()
            ->with(['categorie', 'pieces', 'etapes', 'services' => fn ($q) => $q->where('actif', true)->orderBy('nom')])
            ->orderBy('titre')
            ->get();

        $fiches = $procedures->map(function (Procedure $p) {
            $lignes = [
                "## {$p->titre}",
                "slug : {$p->slug}",
                'Catégorie : '.($p->categorie?->nom ?? '—'),
                "Résumé : {$p->resume}",
            ];
            if ($p->description) {
                $lignes[] = "Description : {$p->description}";
            }
            if ($p->conditions) {
                $lignes[] = "Conditions : {$p->conditions}";
            }
            if ($p->public_concerne) {
                $lignes[] = "Public concerné : {$p->public_concerne}";
            }
            $lignes[] = 'Délai indicatif : '.($p->delai_jours ? "{$p->delai_jours} jour(s)" : 'non précisé');
            $lignes[] = 'Coût : '.($p->cout ?: 'non précisé');

            $lignes[] = 'Pièces à fournir :';
            foreach ($p->pieces as $piece) {
                $lignes[] = '- '.$piece->libelle
                    .($piece->obligatoire ? ' (obligatoire)' : ' (facultative)')
                    .($piece->description ? " — {$piece->description}" : '');
            }

            $lignes[] = 'Étapes :';
            foreach ($p->etapes as $i => $etape) {
                $lignes[] = ($i + 1).". {$etape->titre}".($etape->description ? " — {$etape->description}" : '');
            }

            $lignes[] = "Règle de compétence : {$p->regle_competence->libelle()}. {$p->regle_competence->explication()}";
            $lignes[] = 'Administrations habilitées : '.self::administrations($p);

            return implode("\n", $lignes);
        });

        return "# Catalogue des démarches proposées en ligne\n\n".$fiches->implode("\n\n");
    }

    /**
     * Administrations habilitées pour une démarche. Au-delà d'une douzaine (toutes les mairies
     * du pays, par exemple), elles sont résumées : le citoyen trouve la sienne sur la carte.
     */
    private static function administrations(Procedure $p): string
    {
        if ($p->services->count() <= 12) {
            return $p->services
                ->map(fn ($s) => "{$s->nom} ({$s->commune}, région de {$s->region})")
                ->implode(' ; ');
        }

        $types = $p->services->groupBy('type')
            ->map(fn ($groupe, $type) => $groupe->count().' × '.(Service::TYPES[$type] ?? $type))
            ->implode(', ');

        return "{$p->services->count()} administrations dans les {$p->services->pluck('region')->unique()->count()} régions du pays ({$types}). "
            ."Il y en a une par commune : pour trouver celle d'une commune précise, renvoie vers /services?demarche={$p->slug}.";
    }

    /** Ce que l'assistant sait de la personne connectée : sa commune et l'état de ses dossiers. */
    public static function contexteUtilisateur(?User $user): ?string
    {
        if (! $user) {
            return "La personne n'est pas connectée : tu ne connais ni son identité ni ses dossiers.";
        }
        if ($user->role !== Role::Citoyen) {
            return null;
        }

        $lignes = [
            '# Personne connectée',
            "Prénom : {$user->prenom}",
            'Commune de résidence : '.($user->commune ?: 'non renseignée').($user->region ? " (région de {$user->region})" : ''),
        ];

        $dossiers = Dossier::with(['procedure', 'service'])
            ->where('citoyen_id', $user->id)
            ->latest('updated_at')
            ->limit(10)
            ->get();

        if ($dossiers->isEmpty()) {
            $lignes[] = "Elle n'a encore déposé aucun dossier.";
        } else {
            $lignes[] = 'Ses dossiers (du plus récent au plus ancien) :';
            foreach ($dossiers as $d) {
                $lignes[] = "- {$d->reference} — {$d->procedure->titre} — statut : {$d->statut->libelle()}"
                    .($d->service ? " — administration : {$d->service->nom}" : '')
                    .($d->soumis_at ? " — déposé le {$d->soumis_at->format('d/m/Y')}" : ' — pas encore soumis')
                    .($d->statut === StatutDossier::PretARetirer ? ' — document prêt : à retirer sur place avec le code de retrait affiché sur la page du dossier et une pièce d’identité' : '')
                    .($d->estEnRetard() ? ' — délai indicatif dépassé' : '')
                    ." — page du dossier : /espace/dossiers/{$d->id}";
            }
        }

        return implode("\n", $lignes);
    }
}
