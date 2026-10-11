<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="utf-8">
    <title>Accusé de réception {{ $dossier->reference }}</title>
    <style>
        @page { margin: 0; }
        body { margin: 0; font-family: DejaVu Sans, sans-serif; font-size: 11px; color: #0f172a; }
        table { border-collapse: collapse; width: 100%; }
        .lisere td { height: 6px; padding: 0; }
        .page { padding: 34px 44px 0; }
        .marque { font-size: 18px; font-weight: bold; color: #154e38; }
        .sous-marque { font-size: 8px; letter-spacing: 2px; color: #1d7a52; text-transform: uppercase; }
        .titre { font-size: 20px; font-weight: bold; margin: 26px 0 4px; }
        .intro { color: #475569; margin: 0 0 20px; line-height: 1.5; }
        .reference { background: #154e38; color: #fff; }
        .reference td { padding: 14px 18px; }
        .reference .libelle { font-size: 8px; letter-spacing: 1.5px; text-transform: uppercase; color: #a7d7bf; }
        .reference .valeur { font-size: 20px; font-weight: bold; letter-spacing: 1px; }
        h2 { font-size: 9px; letter-spacing: 1.5px; text-transform: uppercase; color: #1d7a52; margin: 22px 0 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; }
        .infos td { padding: 4px 0; vertical-align: top; }
        .infos td.cle { width: 165px; color: #64748b; }
        .infos td.val { font-weight: bold; }
        .pieces td { padding: 6px 8px; border-bottom: 1px solid #e2e8f0; }
        .pieces th { padding: 6px 8px; text-align: left; font-size: 8px; letter-spacing: 1px; text-transform: uppercase; color: #64748b; background: #f1f5f9; }
        .suivi { margin-top: 24px; border: 1px solid #cbd5e1; }
        .suivi td { padding: 14px 16px; vertical-align: middle; }
        .code { font-size: 18px; font-weight: bold; letter-spacing: 4px; color: #154e38; }
        .petit { font-size: 9px; color: #64748b; line-height: 1.5; }
        .mention { margin-top: 20px; padding: 10px 12px; background: #fdf6e3; border-left: 3px solid #d4a12f; font-size: 9.5px; line-height: 1.5; color: #334155; }
        .pied { position: fixed; bottom: 22px; left: 44px; right: 44px; font-size: 8px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 8px; }
    </style>
</head>
<body>
    <table class="lisere"><tr>
        <td style="background:#00853F"></td><td style="background:#FDEF42"></td><td style="background:#E31B23"></td>
    </tr></table>

    <div class="page">
        <table><tr>
            <td>
                <div class="marque">Suivi Démarches</div>
                <div class="sous-marque">Guichet numérique</div>
            </td>
            <td style="text-align:right" class="petit">
                Document généré le {{ now()->translatedFormat('d/m/Y à H:i') }}
            </td>
        </tr></table>

        <div class="titre">Accusé de réception</div>
        <p class="intro">
            Ce document atteste que la demande ci-dessous a bien été déposée sur la plateforme
            et transmise à l'administration compétente.
        </p>

        <table class="reference"><tr>
            <td>
                <div class="libelle">Référence du dossier</div>
                <div class="valeur">{{ $dossier->reference }}</div>
            </td>
            <td style="text-align:right">
                <div class="libelle">Déposé le</div>
                <div class="valeur" style="font-size:14px">{{ $dossier->soumis_at->translatedFormat('d/m/Y à H:i') }}</div>
            </td>
        </tr></table>

        <h2>Votre demande</h2>
        <table class="infos">
            <tr><td class="cle">Démarche</td><td class="val">{{ $dossier->procedure->titre }}</td></tr>
            <tr><td class="cle">Demandeur</td><td class="val">{{ $dossier->citoyen->nom_complet }}</td></tr>
            @if ($dossier->motif)
                <tr><td class="cle">Objet de la demande</td><td>{{ \Illuminate\Support\Str::limit($dossier->motif, 260) }}</td></tr>
            @endif
            @if ($dossier->procedure->delai_jours)
                <tr><td class="cle">Délai indicatif</td><td>{{ $dossier->procedure->delai_jours }} jour{{ $dossier->procedure->delai_jours > 1 ? 's' : '' }} à compter du dépôt</td></tr>
            @endif
        </table>

        @if ($dossier->service)
            <h2>Administration destinataire</h2>
            <table class="infos">
                <tr><td class="cle">Administration</td><td class="val">{{ $dossier->service->nom }}</td></tr>
                @if ($dossier->service->adresse)
                    <tr><td class="cle">Adresse</td><td>{{ $dossier->service->adresse }}{{ $dossier->service->commune ? ', '.$dossier->service->commune : '' }}</td></tr>
                @endif
                @if ($dossier->service->horaires)
                    <tr><td class="cle">Horaires</td><td>{{ $dossier->service->horaires }}</td></tr>
                @endif
                @if ($dossier->service->telephone)
                    <tr><td class="cle">Téléphone</td><td>{{ $dossier->service->telephone }}</td></tr>
                @endif
            </table>
        @endif

        <h2>Pièces déposées</h2>
        <table class="pieces">
            <tr><th>Pièce</th><th>Fichier</th><th style="width:90px">Déposée le</th></tr>
            @forelse ($dossier->documents->sortBy('created_at') as $document)
                <tr>
                    <td>{{ $document->piece?->libelle ?? 'Pièce complémentaire' }}</td>
                    <td>{{ \Illuminate\Support\Str::limit($document->nom_original, 44) }}</td>
                    <td>{{ $document->created_at->format('d/m/Y') }}</td>
                </tr>
            @empty
                <tr><td colspan="3" style="color:#64748b">Aucune pièce jointe.</td></tr>
            @endforelse
        </table>

        <table class="suivi"><tr>
            <td style="width:120px; text-align:center">
                <img src="{{ $qrCode }}" width="110" height="110" alt="QR code de suivi">
            </td>
            <td>
                <div style="font-size:12px; font-weight:bold">Suivez votre dossier sans vous connecter</div>
                <p class="petit" style="margin:5px 0 10px">
                    Scannez ce QR code avec votre téléphone, ou rendez-vous sur la page « Suivre un dossier »
                    et saisissez votre référence et le code ci-dessous.
                </p>
                <div class="petit">Code de suivi</div>
                <div class="code">{{ $dossier->code_suivi }}</div>
            </td>
        </tr></table>

        <div class="mention">
            <b>À conserver.</b> Cet accusé de réception atteste du dépôt de votre demande ; il ne vaut ni acceptation
            ni décision de l'administration. Ne communiquez votre code de suivi qu'aux personnes autorisées
            à consulter l'avancement de votre dossier.
        </div>
    </div>

    <div class="pied">
        Suivi Démarches — plateforme de suivi des procédures administratives · {{ $lienSuivi }}
    </div>
</body>
</html>
