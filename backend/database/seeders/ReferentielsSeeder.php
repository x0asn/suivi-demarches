<?php

namespace Database\Seeders;

use App\Enums\RegleCompetence;
use App\Models\Categorie;
use App\Models\Procedure;
use App\Models\Service;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

/**
 * Jeu de données de démonstration : catégories, services et procédures.
 *
 * IMPORTANT (cahier des charges §4, principe de rigueur) : ces contenus sont illustratifs.
 * Les pièces, délais, coûts et coordonnées doivent être vérifiés auprès des administrations
 * concernées avant toute utilisation réelle.
 */
class ReferentielsSeeder extends Seeder
{
    public function run(): void
    {
        $categories = $this->categories();
        $services = $this->services();
        $competences = $this->competences();

        foreach ($this->procedures() as $p) {
            $procedure = Procedure::updateOrCreate(
                ['slug' => Str::slug($p['titre'])],
                [
                    'titre' => $p['titre'],
                    'categorie_id' => $categories[$p['categorie']]->id,
                    'service_id' => $services[$p['service']]->id,
                    'resume' => $p['resume'],
                    'description' => $p['description'],
                    'conditions' => $p['conditions'],
                    'public_concerne' => $p['public'],
                    'delai_jours' => $p['delai'],
                    'cout' => $p['cout'],
                ]
            );
            $procedure->statut = $p['statut'] ?? 'publiee';
            $procedure->publiee_at = $procedure->statut === 'publiee' ? now()->subDays(rand(20, 120)) : null;
            [$regle, $habilites] = $competences[$p['titre']] ?? [RegleCompetence::Nationale, [$p['service']]];
            $procedure->regle_competence = $regle;
            $procedure->save();
            $procedure->services()->sync(array_map(fn (string $cle) => $services[$cle]->id, array_unique([$p['service'], ...$habilites])));

            $procedure->pieces()->delete();
            foreach ($p['pieces'] as $i => $piece) {
                [$libelle, $description, $obligatoire] = array_pad((array) $piece, 3, null);
                $procedure->pieces()->create([
                    'libelle' => $libelle,
                    'description' => $description,
                    'obligatoire' => $obligatoire ?? true,
                    'ordre' => $i,
                ]);
            }

            $procedure->etapes()->delete();
            foreach ($p['etapes'] as $i => [$titre, $description]) {
                $procedure->etapes()->create(['titre' => $titre, 'description' => $description, 'ordre' => $i]);
            }
        }
    }

    /** @return array<string, Categorie> */
    private function categories(): array
    {
        $liste = [
            'etat-civil' => ['État civil', 'Naissance, mariage, décès, résidence', 'baby'],
            'justice' => ['Justice', 'Casier judiciaire, nationalité, légalisation', 'scale'],
            'identite' => ['Identité & voyage', "Carte d'identité, passeport", 'id-card'],
            'urbanisme' => ['Urbanisme & foncier', 'Construire, aménager, régulariser', 'building'],
            'entreprise' => ['Entreprise & fiscalité', 'Créer et déclarer son activité', 'briefcase'],
            'education' => ['Éducation', 'Bourses, diplômes, équivalences', 'graduation-cap'],
        ];

        $resultat = [];
        $ordre = 0;
        foreach ($liste as $slug => [$nom, $description, $icone]) {
            $resultat[$slug] = Categorie::updateOrCreate(['slug' => $slug], [
                'nom' => $nom, 'description' => $description, 'icone' => $icone, 'ordre' => $ordre++,
            ]);
        }

        return $resultat;
    }

    /** @return array<string, Service> Coordonnées approximatives, à vérifier. */
    private function services(): array
    {
        $liste = [
            'mairie-plateau' => ['Mairie de Dakar-Plateau', 'mairie', 'Avenue Léopold Sédar Senghor', 'Dakar-Plateau', 'Dakar', '+221 33 800 10 10', 'Lun–Ven 8h–16h', 14.6681, -17.4372],
            'mairie-diamniadio' => ['Mairie de Diamniadio', 'mairie', 'Route nationale 1', 'Diamniadio', 'Dakar', '+221 33 800 10 20', 'Lun–Ven 8h–16h', 14.7252, -17.1838],
            'mairie-pikine' => ['Mairie de Pikine', 'mairie', 'Route de Pikine', 'Pikine', 'Dakar', '+221 33 800 10 30', 'Lun–Ven 8h–16h', 14.7546, -17.3934],
            'mairie-thies' => ['Mairie de Thiès', 'mairie', 'Place de France', 'Thiès', 'Thiès', '+221 33 800 20 10', 'Lun–Ven 8h–16h', 14.7887, -16.9260],
            'mairie-saint-louis' => ['Mairie de Saint-Louis', 'mairie', 'Île de Saint-Louis', 'Saint-Louis', 'Saint-Louis', '+221 33 800 30 10', 'Lun–Ven 8h–16h', 16.0244, -16.5043],
            'mairie-ziguinchor' => ['Mairie de Ziguinchor', 'mairie', 'Centre-ville', 'Ziguinchor', 'Ziguinchor', '+221 33 800 40 10', 'Lun–Ven 8h–16h', 12.5657, -16.2719],
            'tribunal-dakar' => ['Tribunal de grande instance de Dakar', 'tribunal', 'Boulevard Djily Mbaye', 'Dakar-Plateau', 'Dakar', '+221 33 800 50 10', 'Lun–Ven 8h–15h', 14.6702, -17.4325],
            'tribunal-thies' => ['Tribunal de grande instance de Thiès', 'tribunal', 'Avenue Lamine Guèye', 'Thiès', 'Thiès', '+221 33 800 50 30', 'Lun–Ven 8h–15h', 14.7910, -16.9359],
            'tribunal-saint-louis' => ['Tribunal de grande instance de Saint-Louis', 'tribunal', 'Île de Saint-Louis', 'Saint-Louis', 'Saint-Louis', '+221 33 800 50 40', 'Lun–Ven 8h–15h', 16.0290, -16.5050],
            'tribunal-instance-dakar' => ["Tribunal d'instance de Dakar", 'tribunal', 'Centre-ville', 'Dakar-Plateau', 'Dakar', '+221 33 800 50 20', 'Lun–Ven 8h–15h', 14.6728, -17.4360],
            'police-identite' => ["Direction de l'identification et des titres", 'police', 'Dieuppeul', 'Dakar', 'Dakar', '+221 33 800 60 10', 'Lun–Sam 8h–17h', 14.7213, -17.4598],
            'urbanisme' => ["Service régional de l'urbanisme", 'ministere', 'Sphère ministérielle', 'Diamniadio', 'Dakar', '+221 33 800 70 10', 'Lun–Ven 8h–16h', 14.7212, -17.1925],
            'guichet-entreprise' => ['Guichet unique de création d’entreprise', 'agence', 'Rue Mohamed V', 'Dakar-Plateau', 'Dakar', '+221 33 800 80 10', 'Lun–Ven 8h–17h', 14.6695, -17.4393],
            'impots' => ['Centre des services fiscaux', 'ministere', 'Rue Abdoulaye Fadiga', 'Dakar-Plateau', 'Dakar', '+221 33 800 80 20', 'Lun–Ven 8h–16h', 14.6713, -17.4352],
            'enseignement-sup' => ['Direction des bourses — Enseignement supérieur', 'ministere', 'Sphère ministérielle', 'Diamniadio', 'Dakar', '+221 33 800 90 10', 'Lun–Ven 8h–16h', 14.7224, -17.1951],
        ];

        $resultat = [];
        foreach ($liste as $cle => [$nom, $type, $adresse, $commune, $region, $tel, $horaires, $lat, $lng]) {
            $resultat[$cle] = Service::updateOrCreate(['nom' => $nom], [
                'type' => $type, 'adresse' => $adresse, 'commune' => $commune, 'region' => $region,
                'telephone' => $tel, 'email' => 'contact@'.Str::slug($nom).'.sn', 'horaires' => $horaires,
                'latitude' => $lat, 'longitude' => $lng, 'actif' => true,
            ]);
        }

        return $resultat;
    }

    /**
     * Compétence des administrations (M08) : pour chaque démarche, la règle applicable et
     * les administrations habilitées. Illustratif, à vérifier auprès des administrations.
     *
     * @return array<string, array{0: RegleCompetence, 1: list<string>}>
     */
    private function competences(): array
    {
        $mairies = ['mairie-plateau', 'mairie-diamniadio', 'mairie-pikine', 'mairie-thies', 'mairie-saint-louis', 'mairie-ziguinchor'];
        $tribunaux = ['tribunal-dakar', 'tribunal-thies', 'tribunal-saint-louis'];

        return [
            "Extrait d'acte de naissance" => [RegleCompetence::LieuNaissance, $mairies],
            'Certificat de résidence' => [RegleCompetence::LieuResidence, $mairies],
            'Certificat de vie et d’entretien' => [RegleCompetence::LieuResidence, $mairies],
            'Légalisation de signature' => [RegleCompetence::Nationale, $mairies],
            'Bulletin n°3 du casier judiciaire' => [RegleCompetence::LieuNaissance, $tribunaux],
            'Certificat de nationalité sénégalaise' => [RegleCompetence::LieuResidence, ['tribunal-instance-dakar']],
            'Autorisation de construire' => [RegleCompetence::LieuBien, ['urbanisme']],
        ];
    }

    private function procedures(): array
    {
        $etapesClassiques = fn (string $instruction, string $delivrance) => [
            ['Dépôt en ligne', 'Vous remplissez le formulaire et joignez les pièces demandées.'],
            ['Vérification des pièces', 'Un agent contrôle la conformité de votre dossier et peut demander une correction.'],
            ['Instruction', $instruction],
            ['Décision et délivrance', $delivrance],
        ];

        return [
            [
                'titre' => "Extrait d'acte de naissance",
                'categorie' => 'etat-civil', 'service' => 'mairie-plateau', 'delai' => 3, 'cout' => 'Gratuit',
                'public' => 'Toute personne née ou déclarée dans la commune',
                'resume' => 'Obtenir une copie certifiée de son acte de naissance, indispensable pour la plupart des démarches.',
                'description' => "L'extrait d'acte de naissance est délivré par le centre d'état civil où la naissance a été enregistrée. Il est demandé pour l'établissement d'une pièce d'identité, une inscription scolaire, un mariage ou un concours.",
                'conditions' => "La naissance doit avoir été déclarée dans la commune. La demande peut être faite par l'intéressé, ses parents ou un mandataire muni d'une procuration.",
                'pieces' => [
                    ["Pièce d'identité du demandeur", 'CNI, passeport ou carte consulaire en cours de validité'],
                    ['Références de l’acte', 'Numéro et année du registre, si connus', false],
                    ['Procuration', 'Uniquement si la demande est faite pour un tiers', false],
                ],
                'etapes' => $etapesClassiques("L'officier d'état civil recherche l'acte dans les registres.", "L'extrait signé est disponible au guichet ou envoyé en version numérique."),
            ],
            [
                'titre' => 'Certificat de résidence',
                'categorie' => 'etat-civil', 'service' => 'mairie-diamniadio', 'delai' => 2, 'cout' => 'Timbre communal',
                'public' => 'Résidents de la commune',
                'resume' => 'Attester officiellement de votre lieu de résidence dans la commune.',
                'description' => "Le certificat de résidence est exigé pour l'ouverture d'un compte bancaire, une demande de passeport, un dossier de bourse ou un emploi.",
                'conditions' => 'Résider effectivement dans la commune. Une vérification par le délégué de quartier peut être demandée.',
                'pieces' => [
                    ["Pièce d'identité", 'CNI en cours de validité'],
                    ['Justificatif de domicile', 'Facture d’eau ou d’électricité de moins de 3 mois, ou contrat de bail'],
                    ['Attestation du délégué de quartier', 'Si le justificatif n’est pas à votre nom', false],
                ],
                'etapes' => $etapesClassiques('Le service vérifie votre adresse auprès du délégué de quartier si nécessaire.', 'Le certificat signé par le maire est délivré.'),
            ],
            [
                'titre' => 'Certificat de vie et d’entretien',
                'categorie' => 'etat-civil', 'service' => 'mairie-pikine', 'delai' => 3, 'cout' => 'Timbre communal',
                'public' => 'Parents ou tuteurs ayant des enfants à charge',
                'resume' => 'Prouver que vous avez des enfants à charge, pour les allocations familiales ou un dossier administratif.',
                'description' => 'Ce certificat atteste que les enfants désignés sont en vie et à la charge du demandeur.',
                'conditions' => 'Les enfants doivent être déclarés à l’état civil.',
                'pieces' => [
                    ["Pièce d'identité du parent", null],
                    ['Extraits de naissance des enfants', 'Un extrait par enfant'],
                    ['Certificat de scolarité', 'Pour les enfants scolarisés', false],
                ],
                'etapes' => $etapesClassiques('Le service d’état civil vérifie les liens de filiation.', 'Le certificat est signé et délivré.'),
            ],
            [
                'titre' => 'Bulletin n°3 du casier judiciaire',
                'categorie' => 'justice', 'service' => 'tribunal-dakar', 'delai' => 5, 'cout' => 'Timbre fiscal',
                'public' => 'Toute personne majeure',
                'resume' => 'Justifier de l’absence de condamnation, souvent demandé pour un emploi ou un concours.',
                'description' => 'Le bulletin n°3 est le seul extrait du casier judiciaire délivré directement à la personne concernée. Il mentionne uniquement les condamnations les plus graves.',
                'conditions' => 'La demande ne peut être faite que par la personne concernée.',
                'pieces' => [
                    ["Pièce d'identité", 'CNI ou passeport en cours de validité'],
                    ['Extrait d’acte de naissance', 'De moins de 3 mois'],
                ],
                'etapes' => $etapesClassiques('Le greffe consulte le casier judiciaire national.', 'Le bulletin est délivré au guichet du greffe.'),
            ],
            [
                'titre' => 'Certificat de nationalité sénégalaise',
                'categorie' => 'justice', 'service' => 'tribunal-instance-dakar', 'delai' => 10, 'cout' => 'Timbre fiscal',
                'public' => 'Personnes de nationalité sénégalaise',
                'resume' => 'Prouver votre nationalité sénégalaise pour un passeport, un concours ou un emploi public.',
                'description' => 'Le certificat de nationalité est délivré par le président du tribunal d’instance du lieu de naissance ou de résidence.',
                'conditions' => 'Être né au Sénégal ou de parent sénégalais, ou avoir acquis la nationalité.',
                'pieces' => [
                    ['Extrait d’acte de naissance', null],
                    ['Certificat de nationalité d’un parent', 'Ou acte de naissance d’un parent', false],
                    ["Pièce d'identité", null],
                ],
                'etapes' => $etapesClassiques('Le greffe vérifie la filiation et les pièces justificatives.', 'Le certificat est signé par le juge et délivré.'),
            ],
            [
                'titre' => 'Légalisation de signature',
                'categorie' => 'justice', 'service' => 'mairie-thies', 'delai' => 1, 'cout' => 'Timbre communal',
                'public' => 'Toute personne',
                'resume' => 'Faire authentifier votre signature sur un document (procuration, attestation, engagement).',
                'description' => 'La légalisation certifie l’authenticité de la signature apposée sur un acte sous seing privé.',
                'conditions' => 'Le signataire doit se présenter en personne pour la remise du document légalisé.',
                'pieces' => [
                    ['Document à légaliser', 'Non signé : la signature se fait devant l’agent'],
                    ["Pièce d'identité du signataire", null],
                ],
                'etapes' => $etapesClassiques('L’agent vérifie l’identité du signataire.', 'Le document légalisé est remis au signataire.'),
            ],
            [
                'titre' => "Carte nationale d'identité biométrique CEDEAO",
                'categorie' => 'identite', 'service' => 'police-identite', 'delai' => 15, 'cout' => 'Gratuit (première demande)',
                'public' => 'Citoyens sénégalais âgés de 15 ans et plus',
                'resume' => 'Première demande ou renouvellement de la carte d’identité biométrique, valable aussi comme carte d’électeur.',
                'description' => 'La carte nationale d’identité biométrique CEDEAO permet de justifier de son identité et de circuler dans l’espace CEDEAO. La prise d’empreintes et de photo se fait sur rendez-vous.',
                'conditions' => 'Être de nationalité sénégalaise et âgé d’au moins 15 ans.',
                'pieces' => [
                    ['Extrait d’acte de naissance', 'De moins de 6 mois'],
                    ['Certificat de résidence', null],
                    ['Ancienne carte d’identité', 'En cas de renouvellement', false],
                    ['Déclaration de perte', 'En cas de perte ou de vol', false],
                ],
                'etapes' => [
                    ['Pré-demande en ligne', 'Vous déposez vos pièces justificatives.'],
                    ['Vérification', 'Les pièces sont contrôlées par un agent.'],
                    ['Enrôlement biométrique', 'Prise d’empreintes et de photo sur rendez-vous.'],
                    ['Production et retrait', 'Vous êtes notifié dès que la carte est disponible.'],
                ],
            ],
            [
                'titre' => 'Passeport ordinaire',
                'categorie' => 'identite', 'service' => 'police-identite', 'delai' => 21, 'cout' => 'Timbre fiscal',
                'public' => 'Citoyens sénégalais',
                'resume' => 'Obtenir ou renouveler votre passeport pour voyager à l’étranger.',
                'description' => 'Le passeport ordinaire biométrique est délivré aux citoyens sénégalais. La présence du demandeur est obligatoire pour la prise des données biométriques.',
                'conditions' => 'Posséder une carte nationale d’identité en cours de validité.',
                'pieces' => [
                    ["Carte nationale d'identité", 'En cours de validité'],
                    ['Extrait d’acte de naissance', null],
                    ['Certificat de nationalité', null],
                    ['Quittance du timbre', 'Preuve de paiement des droits'],
                    ['Ancien passeport', 'En cas de renouvellement', false],
                ],
                'etapes' => [
                    ['Dépôt en ligne', 'Vous joignez les pièces demandées.'],
                    ['Vérification', 'Un agent contrôle la complétude du dossier.'],
                    ['Enrôlement biométrique', 'Rendez-vous pour la prise d’empreintes.'],
                    ['Délivrance', 'Retrait du passeport sur notification.'],
                ],
            ],
            [
                'titre' => 'Autorisation de construire',
                'categorie' => 'urbanisme', 'service' => 'urbanisme', 'delai' => 30, 'cout' => 'Selon la surface',
                'public' => 'Propriétaires ou titulaires d’un droit sur le terrain',
                'resume' => 'Obtenir l’autorisation obligatoire avant tout projet de construction ou d’extension.',
                'description' => 'L’autorisation de construire garantit que le projet respecte les règles d’urbanisme. Le dossier est examiné par une commission technique.',
                'conditions' => 'Disposer d’un titre foncier, d’un bail ou d’une délibération d’affectation du terrain.',
                'pieces' => [
                    ['Justificatif foncier', 'Titre foncier, bail ou délibération'],
                    ['Plans du projet', 'Plans de masse, de situation et de façades signés par un architecte'],
                    ['Devis descriptif', null],
                    ["Pièce d'identité du demandeur", null],
                    ['Étude d’impact', 'Pour les projets de plus de 3 niveaux', false],
                ],
                'etapes' => [
                    ['Dépôt du dossier', 'Vous déposez plans et justificatifs.'],
                    ['Recevabilité', 'Le service vérifie que le dossier est complet.'],
                    ['Examen technique', 'La commission examine la conformité du projet.'],
                    ['Visite de terrain', 'Un agent peut se rendre sur le site.'],
                    ['Décision', 'L’autorisation est délivrée ou refusée avec motif.'],
                ],
            ],
            [
                'titre' => 'Création d’entreprise individuelle',
                'categorie' => 'entreprise', 'service' => 'guichet-entreprise', 'delai' => 2, 'cout' => 'Frais d’immatriculation',
                'public' => 'Entrepreneurs, commerçants, artisans',
                'resume' => 'Immatriculer votre activité au registre du commerce et obtenir vos identifiants.',
                'description' => 'Le guichet unique centralise l’immatriculation au registre du commerce et du crédit mobilier (RCCM) et l’attribution du numéro d’identification fiscale.',
                'conditions' => 'Être majeur et ne pas faire l’objet d’une interdiction d’exercer.',
                'pieces' => [
                    ["Pièce d'identité", null],
                    ['Extrait de casier judiciaire', 'De moins de 3 mois, ou déclaration sur l’honneur'],
                    ['Certificat de résidence', null],
                    ['Justificatif du local', 'Bail ou attestation d’hébergement', false],
                ],
                'etapes' => $etapesClassiques('Le guichet procède à l’immatriculation au RCCM.', 'Vous recevez votre RCCM et votre numéro fiscal.'),
            ],
            [
                'titre' => 'Attestation de situation fiscale',
                'categorie' => 'entreprise', 'service' => 'impots', 'delai' => 5, 'cout' => 'Gratuit',
                'public' => 'Entreprises et contribuables immatriculés',
                'resume' => 'Prouver que vous êtes à jour de vos obligations fiscales, notamment pour les marchés publics.',
                'description' => 'L’attestation de situation fiscale certifie que le contribuable a déposé ses déclarations et réglé ses impôts exigibles.',
                'conditions' => 'Être immatriculé et à jour de ses déclarations.',
                'pieces' => [
                    ['Numéro d’identification fiscale', 'NINEA'],
                    ['Registre du commerce', 'RCCM'],
                    ['Dernières déclarations fiscales', null],
                ],
                'etapes' => $etapesClassiques('Le centre fiscal vérifie votre situation.', 'L’attestation est délivrée.'),
            ],
            [
                'titre' => 'Demande de bourse d’études supérieures',
                'categorie' => 'education', 'service' => 'enseignement-sup', 'delai' => 45, 'cout' => 'Gratuit',
                'public' => 'Bacheliers et étudiants inscrits dans un établissement public',
                'resume' => 'Solliciter une bourse nationale pour financer vos études supérieures.',
                'description' => 'La bourse est attribuée selon des critères de mérite et de situation sociale, dans la limite des quotas annuels.',
                'conditions' => 'Être de nationalité sénégalaise et régulièrement inscrit dans un établissement d’enseignement supérieur.',
                'pieces' => [
                    ['Attestation d’inscription', 'Pour l’année en cours'],
                    ['Relevé de notes du baccalauréat ou de l’année précédente', null],
                    ['Extrait d’acte de naissance', null],
                    ['Certificat de résidence', null],
                    ['Enquête sociale', 'Si vous demandez une bourse sociale', false],
                ],
                'etapes' => [
                    ['Dépôt en ligne', 'Vous déposez votre dossier pendant la campagne.'],
                    ['Vérification', 'Les pièces sont contrôlées.'],
                    ['Commission d’attribution', 'Les dossiers sont classés selon les critères.'],
                    ['Publication des résultats', 'Vous êtes notifié de la décision.'],
                ],
            ],
            [
                'titre' => 'Équivalence de diplôme étranger',
                'categorie' => 'education', 'service' => 'enseignement-sup', 'delai' => 60, 'cout' => 'Frais de dossier',
                'public' => 'Titulaires d’un diplôme obtenu à l’étranger',
                'resume' => 'Faire reconnaître un diplôme étranger pour poursuivre des études ou postuler à un emploi.',
                'description' => 'La commission nationale examine le niveau et le contenu de la formation pour établir une équivalence.',
                'conditions' => 'Le diplôme doit être délivré par un établissement reconnu dans son pays.',
                'pieces' => [
                    ['Copie certifiée du diplôme', null],
                    ['Relevés de notes', 'De toutes les années de formation'],
                    ['Programme de la formation', null],
                    ['Traduction certifiée', 'Si les documents ne sont pas en français', false],
                ],
                'etapes' => $etapesClassiques('La commission nationale des équivalences examine le dossier.', 'L’arrêté d’équivalence est délivré.'),
                'statut' => 'brouillon',
            ],
        ];
    }
}
