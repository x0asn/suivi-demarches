import {
  AlarmClock,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  FilePlus2,
  FileText,
  FolderOpen,
  Hourglass,
  Inbox,
  PenLine,
  ScrollText,
  ShieldCheck,
  UserCheck,
  Users,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import goree from '../../assets/images/goree.jpg'
import { BadgeStatut, Frise } from '../../components/dossiers'
import { IconeCategorie } from '../../components/ui/Icones'
import { Avatar, Bouton, Squelette } from '../../components/ui'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../lib/api'
import { libelleDelai } from '../../lib/icones'
import { ROLES } from '../../lib/roles'
import { cx, dates, nombre, salutation } from '../../lib/utils'

function Bandeau({ message, action }) {
  const { utilisateur } = useAuth()
  return (
    <section className="relative isolate overflow-hidden rounded-3xl bg-brand-900 px-6 py-9 text-white sm:px-10">
      <img src={goree} alt="" className="absolute inset-0 -z-20 size-full object-cover opacity-35" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-brand-950 via-brand-900/90 to-brand-900/30" />
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="flex items-center gap-2 text-sm text-brand-200">
            <CalendarDays className="size-4" aria-hidden />
            {dates.longue(new Date().toISOString())}
          </p>
          <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            {salutation()}, {utilisateur.prenom}.
          </h1>
          <p className="mt-2 max-w-xl text-brand-100/85">{message}</p>
          <span className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium ring-1 ring-white/20 backdrop-blur">
            <ShieldCheck className="size-3.5 text-or-300" aria-hidden /> Espace {ROLES[utilisateur.role]?.libelle.toLowerCase()}
            {utilisateur.service && ` · ${utilisateur.service.nom}`}
          </span>
        </div>
        {action}
      </div>
    </section>
  )
}

function Tuile({ icone: Icone, libelle, valeur, aide, ton = 'brand', vers }) {
  const tons = {
    brand: 'bg-brand-50 text-brand-700 ring-brand-100',
    or: 'bg-or-50 text-or-600 ring-or-100',
    orange: 'bg-orange-50 text-orange-600 ring-orange-100',
    sky: 'bg-sky-50 text-sky-600 ring-sky-100',
    red: 'bg-red-50 text-red-600 ring-red-100',
    slate: 'bg-slate-100 text-slate-600 ring-slate-200',
    indigo: 'bg-indigo-50 text-indigo-600 ring-indigo-100',
  }
  const contenu = (
    <>
      <div className="flex items-center justify-between">
        <span className={cx('flex size-10 items-center justify-center rounded-xl ring-1', tons[ton])}><Icone className="size-5" aria-hidden /></span>
        {vers && <ArrowRight className="size-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-brand-600" aria-hidden />}
      </div>
      <p className="mt-4 font-display text-3xl font-semibold text-slate-900">{valeur ?? '—'}</p>
      <p className="mt-1 text-sm font-medium text-slate-700">{libelle}</p>
      {aide && <p className="text-xs text-slate-500">{aide}</p>}
    </>
  )
  return vers ? (
    <Link to={vers} className="carte group p-5 transition hover:-translate-y-0.5 hover:shadow-flottant">{contenu}</Link>
  ) : (
    <div className="carte p-5">{contenu}</div>
  )
}

/* ------------------------------------------------------------------ */
/* Citoyen                                                              */
/* ------------------------------------------------------------------ */
function TableauCitoyen() {
  const [resume, setResume] = useState(null)
  const [populaires, setPopulaires] = useState([])

  useEffect(() => {
    api('/dossiers/resume').then((r) => setResume(r.data)).catch(() => {})
    api('/procedures', { params: { par_page: 4 } }).then((r) => setPopulaires(r.data)).catch(() => {})
  }, [])

  const actionRequise = resume?.recents.find((d) => d.statut === 'correction_demandee')

  return (
    <div className="space-y-8">
      <Bandeau
        message="Retrouvez ici vos démarches, leur avancement et vos notifications."
        action={<Bouton vers="/procedures" variante="or" taille="lg" icone={FilePlus2}>Nouvelle démarche</Bouton>}
      />

      {resume?.action_requise > 0 && (
        <Link
          to={actionRequise ? `/espace/dossiers/${actionRequise.id}` : '/espace/dossiers?statut=correction_demandee'}
          className="flex items-center gap-4 rounded-2xl bg-orange-50 p-5 ring-1 ring-orange-200 transition hover:bg-orange-100/70"
        >
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-orange-500 text-white"><AlertTriangle className="size-5" aria-hidden /></span>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-orange-950">{resume.action_requise === 1 ? 'Un dossier attend votre action' : `${resume.action_requise} dossiers attendent votre action`}</p>
            <p className="text-sm text-orange-800">L’administration vous demande de compléter votre dossier pour poursuivre son traitement.</p>
          </div>
          <ArrowRight className="size-5 text-orange-700" aria-hidden />
        </Link>
      )}

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Tuile icone={Hourglass} ton="sky" libelle="En cours" aide="Chez l’administration" valeur={resume?.en_cours} vers="/espace/dossiers" />
        <Tuile icone={AlertTriangle} ton="orange" libelle="Action requise" aide="Correction demandée" valeur={resume?.action_requise} vers="/espace/dossiers" />
        <Tuile icone={CheckCircle2} ton="brand" libelle="Abouties" aide="Validées ou terminées" valeur={resume?.aboutis} vers="/espace/dossiers" />
        <Tuile icone={PenLine} ton="slate" libelle="Brouillons" aide="Pas encore envoyés" valeur={resume?.brouillons} vers="/espace/dossiers" />
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <section className="carte">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <h2 className="font-semibold text-slate-900">Mes dossiers récents</h2>
            <Link to="/espace/dossiers" className="text-sm font-semibold text-brand-700 hover:text-brand-800">Tout voir</Link>
          </div>
          {!resume ? (
            <div className="space-y-3 p-6">{[0, 1, 2].map((i) => <Squelette key={i} className="h-16" />)}</div>
          ) : resume.recents.length === 0 ? (
            <div className="flex flex-col items-center px-6 py-12 text-center">
              <FolderOpen className="size-8 text-slate-300" aria-hidden />
              <p className="mt-3 font-medium text-slate-900">Aucune démarche pour l’instant</p>
              <p className="mt-1 text-sm text-slate-500">Choisissez une procédure pour déposer votre première demande.</p>
              <Bouton vers="/procedures" className="mt-5" icone={FilePlus2}>Commencer</Bouton>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {resume.recents.map((d) => (
                <li key={d.id}>
                  <Link to={`/espace/dossiers/${d.id}`} className="flex flex-col gap-4 px-6 py-4 transition hover:bg-slate-50 sm:flex-row sm:items-center">
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700"><IconeCategorie nom={d.procedure?.categorie?.icone} className="size-[1.1rem]" /></span>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-slate-900">{d.procedure?.titre}</p>
                        <p className="text-xs text-slate-500"><span className="font-mono">{d.reference}</span> · {dates.relative(d.updated_at)}</p>
                      </div>
                    </div>
                    <div className="sm:w-56">{d.statut === 'brouillon' ? <BadgeStatut statut="brouillon" /> : <Frise statut={d.statut} compacte />}</div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="carte p-6">
          <h2 className="font-semibold text-slate-900">Démarches disponibles</h2>
          <p className="mt-1 text-sm text-slate-500">Quelques procédures accessibles en ligne.</p>
          <ul className="mt-5 space-y-3">
            {populaires.map((p) => (
              <li key={p.id}>
                <Link to={`/procedures/${p.slug}`} className="group flex items-center gap-3 rounded-xl p-2 -mx-2 hover:bg-slate-50">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600 group-hover:bg-brand-700 group-hover:text-white"><IconeCategorie nom={p.categorie?.icone} className="size-4" /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-slate-800">{p.titre}</span>
                    <span className="block text-xs text-slate-500">{libelleDelai(p.delai_jours)} · {p.cout}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <Bouton vers="/procedures" variante="secondaire" className="mt-5 w-full" iconeDroite={ArrowRight}>Tout le catalogue</Bouton>
        </section>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Agent                                                                */
/* ------------------------------------------------------------------ */
function TableauAgent() {
  const [resume, setResume] = useState(null)
  const [prioritaires, setPrioritaires] = useState(null)

  useEffect(() => {
    api('/traitement/resume').then((r) => setResume(r.data)).catch(() => {})
    api('/traitement/dossiers', { params: { statut: 'a_traiter' } }).then((r) => setPrioritaires(r.data.slice(0, 6))).catch(() => setPrioritaires([]))
  }, [])

  return (
    <div className="space-y-8">
      <Bandeau
        message="Voici l’activité de votre service. Les dossiers les plus anciens sont à traiter en priorité."
        action={<Bouton vers="/espace/traitement" variante="or" taille="lg" icone={ClipboardList}>Ouvrir ma file</Bouton>}
      />

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <Tuile icone={Inbox} ton="indigo" libelle="Nouveaux" aide="À prendre en charge" valeur={resume?.nouveaux} vers="/espace/traitement" />
        <Tuile icone={ClipboardList} ton="or" libelle="En vérification" valeur={resume?.en_verification} vers="/espace/traitement" />
        <Tuile icone={Hourglass} ton="sky" libelle="En traitement" valeur={resume?.en_traitement} vers="/espace/traitement" />
        <Tuile icone={AlarmClock} ton="red" libelle="En retard" aide="Délai dépassé" valeur={resume?.en_retard} vers="/espace/traitement" />
        <Tuile icone={UserCheck} ton="brand" libelle="Mes dossiers" aide="Dont je suis responsable" valeur={resume?.mes_dossiers} vers="/espace/traitement" />
        <Tuile icone={CheckCircle2} ton="slate" libelle="Décisions" aide="Rendues ce mois-ci" valeur={resume?.traites_ce_mois} />
      </section>

      <section className="carte">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="font-semibold text-slate-900">À traiter en priorité</h2>
          <Link to="/espace/traitement" className="text-sm font-semibold text-brand-700 hover:text-brand-800">Toute la file</Link>
        </div>
        {!prioritaires ? (
          <div className="space-y-3 p-6">{[0, 1, 2].map((i) => <Squelette key={i} className="h-14" />)}</div>
        ) : prioritaires.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-12 text-center">
            <CheckCircle2 className="size-8 text-brand-500" aria-hidden />
            <p className="mt-3 font-medium text-slate-900">Aucun dossier en attente</p>
            <p className="mt-1 text-sm text-slate-500">Votre file de travail est à jour.</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {prioritaires.map((d) => (
              <li key={d.id}>
                <Link to={`/espace/traitement/${d.id}`} className="flex flex-wrap items-center gap-4 px-6 py-4 transition hover:bg-slate-50">
                  <Avatar prenom={d.citoyen?.prenom} nom={d.citoyen?.nom} taille="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-slate-900">{d.procedure?.titre}</p>
                    <p className="text-xs text-slate-500"><span className="font-mono">{d.reference}</span> · {d.citoyen?.nom_complet}</p>
                  </div>
                  <BadgeStatut statut={d.statut} />
                  <span className={cx('w-28 text-right text-sm', d.en_retard ? 'font-semibold text-red-600' : 'text-slate-500')}>
                    {d.en_retard && <AlarmClock className="mr-1 inline size-3.5" aria-hidden />}
                    {dates.relative(d.soumis_at)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Administrateur & responsable                                         */
/* ------------------------------------------------------------------ */
function TableauPilotage() {
  const { utilisateur } = useAuth()
  const [resume, setResume] = useState(null)

  useEffect(() => {
    api('/traitement/resume').then((r) => setResume(r.data)).catch(() => {})
  }, [])

  const raccourcis = [
    { vers: '/espace/statistiques', titre: 'Statistiques', texte: 'Volumes, délais, taux de validation.', icone: BarChart3 },
    { vers: '/espace/traitement', titre: 'Tous les dossiers', texte: 'Vue d’ensemble des dossiers transmis.', icone: FolderOpen },
    ...(utilisateur.role === 'admin'
      ? [
          { vers: '/espace/admin/utilisateurs', titre: 'Utilisateurs', texte: 'Comptes, rôles et services de rattachement.', icone: Users },
          { vers: '/espace/admin/procedures', titre: 'Procédures', texte: 'Rédiger, publier, désactiver.', icone: FileText },
          { vers: '/espace/admin/journal', titre: "Journal d'audit", texte: 'Traçabilité des actions sensibles.', icone: ScrollText },
        ]
      : []),
  ]

  const enCours = resume ? resume.nouveaux + resume.en_verification + resume.en_traitement : null

  return (
    <div className="space-y-8">
      <Bandeau
        message={utilisateur.role === 'admin' ? 'Pilotez la plateforme : utilisateurs, référentiels et traçabilité.' : 'Suivez l’activité et les indicateurs de traitement des services.'}
        action={<Bouton vers="/espace/statistiques" variante="or" taille="lg" icone={BarChart3}>Voir les statistiques</Bouton>}
      />

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Tuile icone={Hourglass} ton="sky" libelle="Dossiers en cours" valeur={enCours !== null ? nombre(enCours) : null} vers="/espace/traitement" />
        <Tuile icone={Inbox} ton="indigo" libelle="Nouveaux" aide="Non encore pris en charge" valeur={resume?.nouveaux} />
        <Tuile icone={AlarmClock} ton="red" libelle="En retard" aide="Délai indicatif dépassé" valeur={resume?.en_retard} />
        <Tuile icone={CheckCircle2} ton="brand" libelle="Décisions ce mois" valeur={resume?.traites_ce_mois} />
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Accès rapides</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {raccourcis.map(({ vers, titre, texte, icone: Icone }) => (
            <Link key={vers} to={vers} className="carte group flex flex-col p-6 transition hover:-translate-y-0.5 hover:shadow-flottant">
              <span className="flex size-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700 ring-1 ring-brand-100"><Icone className="size-5" aria-hidden /></span>
              <h3 className="mt-4 font-semibold text-slate-900">{titre}</h3>
              <p className="mt-1 flex-1 text-sm text-slate-500">{texte}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-700">Ouvrir <ArrowRight className="size-4 transition group-hover:translate-x-0.5" aria-hidden /></span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}

export default function TableauDeBord() {
  const { utilisateur } = useAuth()
  if (utilisateur.role === 'citoyen') return <TableauCitoyen />
  if (utilisateur.role === 'agent') return <TableauAgent />
  return <TableauPilotage />
}
