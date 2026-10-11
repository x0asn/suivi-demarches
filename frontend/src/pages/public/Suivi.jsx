import { AlertTriangle, ArrowRight, CalendarDays, Hash, KeyRound, Landmark, Phone, QrCode, Search, ShieldCheck, Timer } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { BadgeStatut, Frise } from '../../components/dossiers'
import { Alerte, Bouton, Champ } from '../../components/ui'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../lib/api'
import { STATUTS_DOSSIER } from '../../lib/dossiers'
import { libelleDelai } from '../../lib/icones'
import { cx, dates } from '../../lib/utils'

/** Résultat du suivi : uniquement l'avancement, jamais de donnée personnelle. */
function Resultat({ suivi }) {
  return (
    <div className="carte overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 bg-gradient-to-r from-brand-50/80 to-white p-6">
        <div className="min-w-0">
          <span className="rounded-lg bg-slate-900 px-2.5 py-1 font-mono text-xs font-semibold tracking-wide text-white">{suivi.reference}</span>
          <h2 className="titre-display mt-3 text-2xl font-semibold">{suivi.demarche}</h2>
        </div>
        <BadgeStatut statut={suivi.statut} className="text-sm" />
      </div>

      <div className="p-6">
        <Frise statut={suivi.statut} />

        {suivi.action_requise && (
          <Alerte type="alerte" titre="Une action de votre part est attendue" className="mt-6">
            L’administration vous demande de corriger ou de compléter votre dossier.{' '}
            <Link to="/connexion" state={{ depuis: '/espace/dossiers' }} className="font-semibold underline underline-offset-2">Connectez-vous</Link> pour voir le détail.
          </Alerte>
        )}
        {suivi.en_retard && (
          <p className="mt-6 flex items-start gap-2 rounded-xl bg-or-50 px-4 py-3 text-sm text-slate-700 ring-1 ring-or-200">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-or-600" aria-hidden />
            Le délai indicatif est dépassé. Vous pouvez contacter l’administration ou déposer une réclamation depuis votre espace.
          </p>
        )}

        <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-2">
          {suivi.administration && (
            <div className="flex gap-3">
              <Landmark className="mt-0.5 size-4 shrink-0 text-slate-400" aria-hidden />
              <div>
                <dt className="text-slate-500">Administration</dt>
                <dd className="font-medium text-slate-900">{suivi.administration.nom}</dd>
                {suivi.administration.telephone && (
                  <dd className="mt-0.5 flex items-center gap-1 text-slate-600"><Phone className="size-3.5" aria-hidden /> {suivi.administration.telephone}</dd>
                )}
              </div>
            </div>
          )}
          <div className="flex gap-3">
            <CalendarDays className="mt-0.5 size-4 shrink-0 text-slate-400" aria-hidden />
            <div><dt className="text-slate-500">Déposé le</dt><dd className="font-medium text-slate-900">{dates.heure(suivi.soumis_at)}</dd></div>
          </div>
          <div className="flex gap-3">
            <Timer className="mt-0.5 size-4 shrink-0 text-slate-400" aria-hidden />
            <div><dt className="text-slate-500">Délai indicatif</dt><dd className="font-medium text-slate-900">{libelleDelai(suivi.delai_jours)}</dd></div>
          </div>
        </dl>

        <h3 className="mt-8 text-xs font-semibold uppercase tracking-wide text-slate-500">Étapes franchies</h3>
        <ol className="mt-4 space-y-4">
          {[...suivi.historique].reverse().map((h, i) => (
            <li key={`${h.statut}-${h.date}`} className="flex gap-3">
              <span className={cx('mt-1 size-3 shrink-0 rounded-full ring-4 ring-white', STATUTS_DOSSIER[h.statut]?.point)} aria-hidden />
              <div className="flex min-w-0 flex-1 flex-wrap items-baseline justify-between gap-x-3">
                <p className={cx('text-sm text-slate-900', i === 0 && 'font-semibold')}>{h.libelle}</p>
                <time className="text-xs text-slate-500" dateTime={h.date}>{dates.heure(h.date)}</time>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}

/** RF-009 : suivre un dossier sans compte, avec la référence et le code de l'accusé de réception. */
export default function Suivi() {
  const [params, setParams] = useSearchParams()
  const { utilisateur } = useAuth()
  const initiale = params.get('ref') && params.get('code') ? { reference: params.get('ref'), code: params.get('code') } : null
  const [champs, setChamps] = useState({ reference: params.get('ref') ?? '', code: params.get('code') ?? '' })
  // Recherche en cours : lancée par le formulaire, ou dès l'ouverture depuis le QR code de l'accusé.
  const [demande, setDemande] = useState(initiale)
  const [suivi, setSuivi] = useState(null)
  const [erreur, setErreur] = useState(null)
  const [envoi, setEnvoi] = useState(Boolean(initiale))

  useEffect(() => {
    if (!demande) return
    const controleur = new AbortController()
    api('/suivi', { params: demande, signal: controleur.signal })
      .then((r) => {
        setSuivi(r.data)
        setErreur(null)
      })
      .catch((e) => {
        if (e.name === 'AbortError') return
        setSuivi(null)
        setErreur(e)
      })
      .finally(() => !controleur.signal.aborted && setEnvoi(false))
    return () => controleur.abort()
  }, [demande])

  const soumettre = (e) => {
    e.preventDefault()
    const reference = champs.reference.trim().toUpperCase()
    const code = champs.code.trim().toUpperCase()
    setParams({ ref: reference, code }, { replace: true })
    setEnvoi(true)
    setDemande({ reference, code })
  }

  const modifier = (e) => setChamps((c) => ({ ...c, [e.target.name]: e.target.value }))

  return (
    <div className="conteneur py-10 sm:py-14">
      <div className="mx-auto max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-700">Suivre un dossier</p>
        <h1 className="titre-display mt-2 text-3xl font-semibold sm:text-4xl">Où en est ma demande ?</h1>
        <p className="mt-3 text-slate-600">
          Saisissez la référence et le code de suivi qui figurent sur votre accusé de réception, ou scannez son QR code. Aucun compte n’est nécessaire.
        </p>

        <form onSubmit={soumettre} className="carte mt-8 grid gap-4 p-6 sm:grid-cols-[1fr_1fr_auto] sm:items-end" noValidate>
          <Champ
            label="Référence du dossier"
            name="reference"
            icone={Hash}
            value={champs.reference}
            onChange={modifier}
            placeholder="DEM-2026-00042"
            autoComplete="off"
            autoCapitalize="characters"
            erreur={erreur?.champ?.('reference')}
            obligatoire
          />
          <Champ
            label="Code de suivi"
            name="code"
            icone={KeyRound}
            value={champs.code}
            onChange={modifier}
            placeholder="8 caractères"
            autoComplete="off"
            autoCapitalize="characters"
            maxLength={12}
            erreur={erreur?.champ?.('code')}
            obligatoire
          />
          <Bouton type="submit" chargement={envoi} icone={Search} disabled={!champs.reference.trim() || !champs.code.trim()}>Suivre</Bouton>
        </form>

        {erreur && erreur.status !== 422 && (
          <Alerte type="erreur" className="mt-6">
            {erreur.status === 429 ? 'Trop d’essais. Merci de patienter une minute avant de réessayer.' : erreur.message}
          </Alerte>
        )}

        {suivi && <div className="mt-6"><Resultat suivi={suivi} /></div>}

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            { icone: QrCode, titre: 'Avec le QR code', texte: 'Scannez le QR code de votre accusé de réception avec votre téléphone.' },
            { icone: KeyRound, titre: 'Où trouver le code ?', texte: 'Sur votre accusé de réception et dans votre espace, sur la page du dossier.' },
            { icone: ShieldCheck, titre: 'Confidentiel', texte: 'Seul l’avancement est affiché : ni votre nom, ni vos pièces.' },
          ].map(({ icone: Icone, titre, texte }) => (
            <div key={titre} className="rounded-2xl bg-white p-4 text-sm ring-1 ring-slate-200">
              <Icone className="size-5 text-brand-700" aria-hidden />
              <p className="mt-2 font-semibold text-slate-900">{titre}</p>
              <p className="mt-1 text-slate-600">{texte}</p>
            </div>
          ))}
        </div>

        <p className="mt-8 text-sm text-slate-600">
          Pour voir vos pièces, échanger avec l’administration ou corriger votre dossier :{' '}
          <Link
            to={utilisateur ? '/espace' : '/connexion'}
            state={utilisateur ? undefined : { depuis: '/espace' }}
            className="inline-flex items-center gap-1 font-semibold text-brand-700 hover:text-brand-800"
          >
            {utilisateur ? 'ouvrir mon espace' : 'connectez-vous à votre espace'} <ArrowRight className="size-4" aria-hidden />
          </Link>
        </p>
      </div>
    </div>
  )
}
