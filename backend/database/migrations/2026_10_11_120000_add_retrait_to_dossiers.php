<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Retrait du document : valider une demande ne signifie pas que le document officiel a été
 * remis. Le dossier passe par « prêt à retirer » quand le document est réellement préparé,
 * puis par « terminé » quand il est remis au demandeur contre son code de retrait.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('dossiers', function (Blueprint $table) {
            // Code personnel présenté au guichet ; jamais affiché à l'agent ni sur le suivi public.
            $table->string('code_retrait', 12)->nullable()->after('code_suivi');
            $table->timestamp('pret_at')->nullable()->after('decision_at');
            $table->timestamp('retire_at')->nullable()->after('pret_at');
        });

        // Modèle de notification du nouveau statut, et textes des deux étapes qui l'encadrent
        // (mis à jour seulement si l'administrateur ne les a pas personnalisés).
        $maintenant = now();
        DB::table('modeles_notification')->updateOrInsert(['evenement' => 'dossier.pret_a_retirer'], [
            'libelle' => 'Document prêt à retirer',
            'titre' => 'Votre document est prêt',
            'message' => 'Votre demande {reference} ({procedure}) a été traitée : votre document est prêt. Vous pouvez le récupérer auprès de : {administration}. Présentez votre code de retrait, affiché dans votre espace, et une pièce d’identité.',
            'email' => true,
            'actif' => true,
            'created_at' => $maintenant,
            'updated_at' => $maintenant,
        ]);

        $textes = [
            'dossier.valide' => [
                'Votre demande {reference} ({procedure}) a reçu une décision favorable.',
                'Votre demande {reference} ({procedure}) a reçu une décision favorable. Votre document est en cours de préparation : vous serez prévenu dès qu’il sera prêt à retirer.',
            ],
            'dossier.termine' => [
                'La démarche {reference} est terminée. Merci d’avoir utilisé Suivi Démarches.',
                'Votre document vous a été remis : la démarche {reference} est terminée. Merci d’avoir utilisé Suivi Démarches.',
            ],
        ];
        foreach ($textes as $evenement => [$ancien, $nouveau]) {
            DB::table('modeles_notification')->where('evenement', $evenement)->where('message', $ancien)
                ->update(['message' => $nouveau, 'updated_at' => $maintenant]);
        }
    }

    public function down(): void
    {
        DB::table('modeles_notification')->where('evenement', 'dossier.pret_a_retirer')->delete();
        Schema::table('dossiers', function (Blueprint $table) {
            $table->dropColumn(['code_retrait', 'pret_at', 'retire_at']);
        });
    }
};
