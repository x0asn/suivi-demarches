<?php

namespace Tests\Feature\Assistant;

use App\Enums\RegleCompetence;
use App\Enums\StatutDossier;
use App\Models\Categorie;
use App\Models\Dossier;
use App\Models\Procedure;
use App\Models\Service;
use App\Models\User;
use App\Services\Assistant;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Assistant de la plateforme. Les tests n'appellent jamais l'IA : sans clé d'API,
 * l'assistant répond en mode guidé, et ce sont ses consignes et ce mode qui sont vérifiés.
 */
class AssistantTest extends TestCase
{
    use RefreshDatabase;

    private Procedure $extrait;

    protected function setUp(): void
    {
        parent::setUp();
        config(['assistant.cle' => null]);

        $mairie = Service::create(['nom' => 'Mairie de Thiès', 'type' => 'mairie', 'commune' => 'Thiès', 'region' => 'Thiès']);
        $categorie = Categorie::create(['nom' => 'État civil', 'slug' => 'etat-civil']);
        $this->extrait = new Procedure([
            'titre' => "Extrait d'acte de naissance", 'slug' => 'extrait-naissance', 'resume' => 'Obtenir une copie de son acte de naissance.',
            'categorie_id' => $categorie->id, 'service_id' => $mairie->id, 'delai_jours' => 3, 'cout' => 'Gratuit',
            'regle_competence' => RegleCompetence::LieuNaissance,
        ]);
        $this->extrait->statut = 'publiee';
        $this->extrait->save();
        $this->extrait->pieces()->create(['libelle' => "Pièce d'identité du demandeur", 'obligatoire' => true]);

        $brouillon = new Procedure(['titre' => 'Procédure secrète en préparation', 'slug' => 'secrete', 'resume' => 'r', 'categorie_id' => $categorie->id]);
        $brouillon->statut = 'brouillon';
        $brouillon->save();
    }

    /** Texte complet de la réponse, reconstitué à partir des événements envoyés. */
    private function reponse(string $question): array
    {
        $contenu = $this->postJson('/api/assistant', ['messages' => [['role' => 'user', 'content' => $question]]])
            ->assertOk()
            ->streamedContent();

        $evenements = collect(explode("\n\n", trim($contenu)))->map(fn ($e) => json_decode(substr($e, 6), true));

        return [
            'texte' => $evenements->where('type', 'texte')->pluck('texte')->implode(''),
            'mode' => $evenements->firstWhere('type', 'fin')['mode'] ?? null,
        ];
    }

    public function test_sans_cle_l_assistant_repond_en_mode_guide_a_partir_du_catalogue(): void
    {
        $reponse = $this->reponse('Quelles pièces pour un extrait de naissance ?');

        $this->assertSame('secours', $reponse['mode']);
        $this->assertStringContainsString("Pièce d'identité du demandeur", $reponse['texte']);
        $this->assertStringContainsString('/procedures/extrait-naissance', $reponse['texte']);
        $this->assertStringContainsString('lieu où la naissance a été déclarée', $reponse['texte']);
    }

    public function test_je_ne_comprends_pas_reprend_la_demarche_de_la_discussion_etape_par_etape(): void
    {
        $contenu = $this->postJson('/api/assistant', ['messages' => [
            ['role' => 'user', 'content' => 'Quelles pièces pour un extrait de naissance ?'],
            ['role' => 'assistant', 'content' => 'Voici les pièces…'],
            ['role' => 'user', 'content' => 'Je ne comprends pas'],
        ]])->assertOk()->streamedContent();

        $this->assertStringContainsString('je reprends plus simplement', $contenu);
        $this->assertStringContainsString("Extrait d'acte de naissance", $contenu);
        $this->assertStringContainsString('1. Préparez', $contenu);
        $this->assertStringContainsString('Quelle étape', $contenu);
    }

    public function test_je_ne_comprends_pas_sans_demarche_explique_la_plateforme(): void
    {
        $reponse = $this->reponse('Je suis perdue, je ne comprends rien');

        $this->assertStringContainsString('De quel papier avez-vous besoin', $reponse['texte']);
    }

    public function test_les_consignes_de_l_ia_prevoient_de_reexpliquer_autrement(): void
    {
        $this->assertStringContainsString('Quand la personne ne comprend pas', Assistant::consignes());
    }

    public function test_une_question_sans_rapport_propose_les_demarches_disponibles(): void
    {
        $reponse = $this->reponse('zzz qqq');

        $this->assertStringContainsString('/procedures', $reponse['texte']);
        $this->assertStringNotContainsString('secrète', $reponse['texte']);
    }

    public function test_un_citoyen_connecte_retrouve_l_etat_de_ses_dossiers(): void
    {
        $citoyen = User::factory()->create();
        $dossier = new Dossier;
        $dossier->procedure_id = $this->extrait->id;
        $dossier->citoyen_id = $citoyen->id;
        $dossier->statut = StatutDossier::EnTraitement;
        $dossier->save();

        Sanctum::actingAs($citoyen);
        $reponse = $this->reponse('Où en sont mes dossiers ?');

        $this->assertStringContainsString($dossier->fresh()->reference, $reponse['texte']);
        $this->assertStringContainsString('En traitement', $reponse['texte']);
    }

    public function test_les_consignes_ne_contiennent_que_les_procedures_publiees(): void
    {
        $consignes = Assistant::consignes();

        $this->assertStringContainsString("Extrait d'acte de naissance", $consignes);
        $this->assertStringContainsString('Mairie de Thiès', $consignes);
        $this->assertStringNotContainsString('Procédure secrète', $consignes);
        // Texte stable d'un appel à l'autre : condition pour que le cache de l'IA fonctionne.
        $this->assertSame($consignes, Assistant::consignes());
    }

    public function test_rnf002_l_ia_ne_recoit_que_les_dossiers_de_la_personne_connectee(): void
    {
        $moi = User::factory()->create();
        $autre = User::factory()->create();
        foreach ([$moi, $autre] as $proprietaire) {
            $d = new Dossier;
            $d->procedure_id = $this->extrait->id;
            $d->citoyen_id = $proprietaire->id;
            $d->statut = StatutDossier::Soumis;
            $d->save();
        }
        $mien = Dossier::where('citoyen_id', $moi->id)->first();
        $sien = Dossier::where('citoyen_id', $autre->id)->first();

        $contexte = Assistant::contexteUtilisateur($moi);

        $this->assertStringContainsString($mien->reference, $contexte);
        $this->assertStringNotContainsString($sien->reference, $contexte);
        $this->assertStringContainsString("n'est pas connectée", Assistant::contexteUtilisateur(null));
    }

    public function test_la_discussion_doit_se_terminer_par_une_question(): void
    {
        $this->postJson('/api/assistant', ['messages' => [['role' => 'assistant', 'content' => 'Bonjour']]])
            ->assertStatus(422)
            ->assertJsonValidationErrors('messages');

        $this->postJson('/api/assistant', ['messages' => []])->assertStatus(422);
    }
}
