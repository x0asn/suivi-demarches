import {
  ArrowRight,
  BadgeCheck,
  Clock,
  LocateFixed,
  Mail,
  MapPin,
  Navigation,
  Phone,
  Scale,
  Search,
  SearchX,
  ShieldCheck,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import CarteServices from '../../components/services/CarteServices'
import { Alerte, Bouton, Chargement, Selecteur, Squelette } from '../../components/ui'
import { useAuth } from '../../context/AuthContext'
import { usePosition } from '../../hooks/usePosition'
import { api } from '../../lib/api'
import { libelleDistance, lienItineraire, trierParDistance } from '../../lib/geo'
import { iconeService } from '../../lib/icones'
import { REGIONS } from '../../lib/regions'
import { cx } from '../../lib/utils'

const memeCommune = (a, b) => a && b && a.trim().toLowerCase() === b.trim().toLowerCase()

/**
 * Désigne, quand c'est possible, l'administration à conseiller au citoyen.
 * La plus proche n'est conseillée que si la démarche peut se faire partout (règle « nationale ») ;
 * sinon c'est la règle de compétence qui décide.
 */
function conseiller(competence, services, position, utilisateur, filtree) {
  if (!competence || services.length === 0) return null
  if (services.length === 1 && !filtree) return { id: services[0].id, libelle: 'Seule administration habilitée' }
  if (competence.valeur === 'nationale') {
    return position && services[0].distance != null ? { id: services[0].id, libelle: 'La plus proche de vous' } : null
  }
  if (competence.valeur === 'lieu_residence' && utilisateur?.commune) {
    const service = services.find((s) => memeCommune(s.commune, utilisateur.commune))
    return service ? { id: service.id, libelle: `Compétente pour ${utilisateur.commune}` } : null
  }
  return null
}

/** Encadré de géolocalisation : la position n'est demandée qu'après un clic. */
function BlocPosition({ gps, onLocaliser }) {
  if (gps.etat === 'active') {
    return (
      <div className="flex items-start gap-3 rounded-2xl bg-blue-50 p-4 ring-1 ring-blue-100">
        <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white"><LocateFixed className="size-4" aria-hidden /></span>
        <div className="min-w-0 flex-1 text-sm">
          <p className="font-semibold text-blue-950">Position activée</p>
          <p className="mt-0.5 text-blue-900/80">Les administrations sont classées de la plus proche à la plus éloignée.</p>
        </div>
        <button onClick={gps.oublier} className="shrink-0 text-sm font-medium text-blue-800 underline underline-offset-2 hover:text-blue-950">Désactiver</button>
      </div>
    )
  }
  return (
    <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700"><LocateFixed className="size-4" aria-hidden /></span>
        <div className="min-w-0 flex-1 text-sm">
          <p className="font-semibold text-slate-900">Autour de moi</p>
          <p className="mt-0.5 text-slate-600">Autorisez l’accès à votre position pour voir les distances. Elle reste sur votre appareil.</p>
        </div>
      </div>
      <Bouton onClick={onLocaliser} chargement={gps.etat === 'recherche'} icone={LocateFixed} className="mt-3 w-full">
        {gps.etat === 'recherche' ? 'Localisation en cours…' : 'Utiliser ma position'}
      </Bouton>
      {gps.message && <p className="mt-3 text-sm text-or-700" role="alert">{gps.message}</p>}
    </div>
  )
}

/** Règle de compétence de la démarche choisie : la plus proche n'est pas forcément la bonne. */
function BandeauCompetence({ competence, conseil, service, utilisateur, nombre }) {
  const territoire = competence.depend_du_territoire
  return (
    <div className={cx('mt-6 rounded-2xl p-5 ring-1', territoire ? 'bg-or-50 ring-or-200' : 'bg-brand-50 ring-brand-100')}>
      <div className="flex items-start gap-3">
        <span className={cx('mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full', territoire ? 'bg-or-400 text-brand-950' : 'bg-brand-700 text-white')}>
          <Scale className="size-4" aria-hidden />
        </span>
        <div className="min-w-0 text-sm">
          <p className="font-semibold text-slate-900">
            {competence.demarche.titre} : {nombre} administration{nombre > 1 ? 's' : ''} habilitée{nombre > 1 ? 's' : ''}
          </p>
          <p className="mt-1 text-slate-700"><b className="font-semibold">Règle : {competence.libelle.toLowerCase()}.</b> {competence.explication}</p>
          {conseil && service && (
            <p className="mt-2 flex items-center gap-1.5 font-semibold text-brand-800">
              <BadgeCheck className="size-4 shrink-0" aria-hidden /> {conseil.libelle} : {service.nom}
            </p>
          )}
          {!conseil && competence.valeur === 'lieu_residence' && !utilisateur?.commune && (
            <p className="mt-2 text-slate-600">
              <Link to="/connexion" state={{ depuis: `/services?demarche=${competence.demarche.slug}` }} className="font-semibold text-brand-700 underline underline-offset-2">Connectez-vous</Link>{' '}
              pour que l’administration de votre commune soit repérée automatiquement.
            </p>
          )}
          {!conseil && competence.valeur === 'lieu_residence' && utilisateur?.commune && (
            <p className="mt-2 text-slate-600">Aucune administration de votre commune ({utilisateur.commune}) n’est encore référencée pour cette démarche.</p>
          )}
        </div>
      </div>
    </div>
  )
}

/** RF-021 / M08 : trouver l'administration compétente, voir la distance et obtenir l'itinéraire. */
function ContenuServices() {
  const [params, setParams] = useSearchParams()
  const selection = Number(params.get('service')) || null
  const demarche = params.get('demarche') ?? ''
  const { utilisateur } = useAuth()
  const gps = usePosition()
  // Un citoyen connecté voit d'abord les services de sa région (sauf s'il arrive avec un service ou une démarche).
  const maRegion = utilisateur?.role === 'citoyen' && !selection && !demarche ? utilisateur.region ?? '' : ''
  const [filtres, setFiltres] = useState({ q: '', type: '', region: maRegion })
  const [donnees, setDonnees] = useState({ services: [], regions: [], types: {}, demarches: [], competence: null })
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState(null)

  useEffect(() => {
    const controleur = new AbortController()
    const minuteur = setTimeout(() => {
      api('/services', { params: { ...filtres, demarche }, signal: controleur.signal })
        .then((r) => {
          setDonnees(r.data)
          setErreur(null)
        })
        .catch((e) => e.name !== 'AbortError' && setErreur(e))
        .finally(() => !controleur.signal.aborted && setChargement(false))
    }, 200)
    return () => {
      clearTimeout(minuteur)
      controleur.abort()
    }
  }, [filtres, demarche])

  const filtrer = (changements) => {
    setChargement(true)
    setFiltres((f) => ({ ...f, ...changements }))
  }

  const majParams = (changements) => {
    const suivants = { service: selection ? String(selection) : '', demarche, ...changements }
    setParams(Object.fromEntries(Object.entries(suivants).filter(([, v]) => v)), { replace: true })
  }
  const selectionner = (id) => majParams({ service: id ? String(id) : '' })
  const choisirDemarche = (slug) => {
    setChargement(true)
    // La compétence prime sur la région : on montre toutes les administrations habilitées.
    setFiltres((f) => ({ ...f, region: '' }))
    majParams({ demarche: slug, service: '' })
  }

  const localiser = () => {
    // Avec la position, le classement par distance remplace le filtre par région.
    if (filtres.region) filtrer({ region: '' })
    gps.localiser()
  }

  const classes = useMemo(() => trierParDistance(donnees.services, gps.position), [donnees.services, gps.position])
  const competence = demarche ? donnees.competence : null
  const conseil = useMemo(
    () => conseiller(competence, classes, gps.position, utilisateur, Boolean(filtres.q || filtres.type || filtres.region)),
    [competence, classes, gps.position, utilisateur, filtres],
  )
  // L'administration conseillée passe en tête de liste, même si une autre est plus proche.
  const services = useMemo(
    () => (conseil ? [...classes].sort((a, b) => (b.id === conseil.id) - (a.id === conseil.id)) : classes),
    [classes, conseil],
  )
  const types = useMemo(() => Object.entries(donnees.types ?? {}), [donnees.types])

  // Le service sélectionné défile dans la liste.
  useEffect(() => {
    if (selection) document.getElementById(`service-${selection}`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [selection, services])

  const lienDemarche = (service) => `/espace/dossiers/nouveau/${competence.demarche.slug}?service=${service.id}`

  return (
    <div className="conteneur py-10 sm:py-14">
      <div className="max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-700">Administrations à proximité</p>
        <h1 className="titre-display mt-2 text-3xl font-semibold sm:text-4xl">Trouvez l’administration compétente pour votre démarche</h1>
        <p className="mt-3 text-slate-600">
          La plus proche n’est pas toujours celle qui peut traiter votre demande. Indiquez votre démarche : la plateforme vous montre les administrations habilitées, la distance et l’itinéraire.
        </p>
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-[1fr_22rem]">
        <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
          <Selecteur
            label="Quelle démarche voulez-vous faire ?"
            value={demarche}
            onChange={(e) => choisirDemarche(e.target.value)}
            aide="Seules les administrations habilitées à traiter cette démarche seront affichées."
          >
            <option value="">Toutes les démarches — voir toutes les administrations</option>
            {donnees.demarches.map((d) => <option key={d.slug} value={d.slug}>{d.titre}</option>)}
          </Selecteur>
          <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_13rem]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden />
              <input
                value={filtres.q}
                onChange={(e) => filtrer({ q: e.target.value })}
                placeholder="Nom, commune, adresse…"
                aria-label="Rechercher une administration"
                className="block w-full rounded-xl border-0 bg-white py-2.5 pl-10 pr-3.5 text-sm shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-600"
              />
            </div>
            <Selecteur value={filtres.region} onChange={(e) => filtrer({ region: e.target.value })} aria-label="Région">
              <option value="">Toutes les régions</option>
              {REGIONS.map((r) => <option key={r} value={r}>{r}{r === utilisateur?.region ? ' (ma région)' : ''}</option>)}
            </Selecteur>
          </div>
        </div>
        <BlocPosition gps={gps} onLocaliser={localiser} />
      </div>

      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Type d’administration">
        {[['', 'Tous'], ...types].map(([valeur, libelle]) => {
          const Icone = valeur ? iconeService(valeur) : null
          const actif = filtres.type === valeur
          return (
            <button
              key={valeur || 'tous'}
              onClick={() => filtrer({ type: valeur })}
              aria-pressed={actif}
              className={cx(
                'inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium ring-1 transition',
                actif ? 'bg-brand-800 text-white ring-brand-800' : 'bg-white text-slate-700 ring-slate-200 hover:ring-brand-300',
              )}
            >
              {Icone && <Icone className="size-3.5" aria-hidden />} {libelle}
            </button>
          )
        })}
      </div>

      {erreur && <Alerte type="erreur" className="mt-6">{erreur.message}</Alerte>}

      {competence && !chargement && (
        <BandeauCompetence
          competence={competence}
          conseil={conseil}
          service={services.find((s) => s.id === conseil?.id)}
          utilisateur={utilisateur}
          nombre={services.length}
        />
      )}

      {!competence && gps.etat === 'active' && !chargement && (
        <p className="mt-6 flex items-start gap-2 rounded-xl bg-or-50 px-4 py-3 text-sm text-slate-700 ring-1 ring-or-200">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-or-600" aria-hidden />
          <span>L’administration la plus proche n’est pas forcément compétente pour votre demande : <b className="font-semibold">choisissez votre démarche</b> ci-dessus pour voir celles qui peuvent la traiter.</span>
        </p>
      )}

      {maRegion && filtres.region === maRegion && !chargement && !competence && gps.etat !== 'active' && (
        <p className="mt-6 flex flex-wrap items-center gap-2 rounded-xl bg-brand-50 px-4 py-3 text-sm text-brand-900 ring-1 ring-brand-100">
          <Navigation className="size-4 text-brand-600" aria-hidden />
          <span>
            {services.length > 0
              ? <>Administrations de votre région : <b className="font-semibold">{maRegion}</b>.</>
              : <>Aucune administration de la région <b className="font-semibold">{maRegion}</b> n’est encore référencée.</>}
          </span>
          <button onClick={() => filtrer({ region: '' })} className="font-semibold text-brand-700 underline underline-offset-2 hover:text-brand-800">
            Voir toutes les régions
          </button>
        </p>
      )}

      <div className="mt-6 grid overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-carte lg:h-[40rem] lg:grid-cols-[26rem_1fr]">
        <ul className="max-h-[30rem] divide-y divide-slate-100 overflow-y-auto lg:max-h-none" aria-label="Liste des administrations">
          {chargement && services.length === 0
            ? Array.from({ length: 5 }).map((_, i) => <li key={i} className="p-4"><Squelette className="h-16" /></li>)
            : services.length === 0
              ? (
                <li className="flex flex-col items-center px-6 py-16 text-center">
                  <SearchX className="size-6 text-slate-400" aria-hidden />
                  <p className="mt-3 font-medium text-slate-900">Aucune administration trouvée</p>
                  <p className="mt-1 text-sm text-slate-500">Modifiez votre recherche ou vos filtres.</p>
                </li>
              )
              : services.map((s) => {
                  const Icone = iconeService(s.type)
                  const actif = s.id === selection
                  const conseille = s.id === conseil?.id
                  const distance = libelleDistance(s.distance)
                  return (
                    <li key={s.id} id={`service-${s.id}`} className={actif ? 'bg-brand-50/70' : undefined}>
                      <button
                        onClick={() => selectionner(actif ? null : s.id)}
                        className={cx('flex w-full gap-3 p-4 text-left transition', !actif && 'hover:bg-slate-50')}
                        aria-expanded={actif}
                      >
                        <span className={cx('flex size-10 shrink-0 items-center justify-center rounded-xl', actif ? 'bg-or-400 text-brand-950' : 'bg-brand-50 text-brand-700')}>
                          <Icone className="size-5" aria-hidden />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block font-semibold text-slate-900">{s.nom}</span>
                          <span className="mt-0.5 flex items-center gap-1 text-sm text-slate-500"><MapPin className="size-3.5 shrink-0" aria-hidden /> {s.commune} · {s.region}</span>
                          {conseille && (
                            <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-brand-700 px-2 py-0.5 text-xs font-semibold text-white">
                              <BadgeCheck className="size-3.5" aria-hidden /> {conseil.libelle}
                            </span>
                          )}
                        </span>
                        {distance && <span className="shrink-0 self-start rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-800 ring-1 ring-blue-100">{distance}</span>}
                      </button>
                      {actif && (
                        <div className="space-y-1.5 px-4 pb-4 pl-[4.25rem] text-sm text-slate-600">
                          {s.adresse && <span className="flex gap-2"><MapPin className="mt-0.5 size-3.5 shrink-0 text-slate-400" aria-hidden />{s.adresse}</span>}
                          {s.horaires && <span className="flex gap-2"><Clock className="mt-0.5 size-3.5 shrink-0 text-slate-400" aria-hidden />{s.horaires}</span>}
                          {s.telephone && <span className="flex gap-2"><Phone className="mt-0.5 size-3.5 shrink-0 text-slate-400" aria-hidden /><a href={`tel:${s.telephone.replace(/\s/g, '')}`} className="hover:text-brand-700">{s.telephone}</a></span>}
                          {s.email && <span className="flex gap-2"><Mail className="mt-0.5 size-3.5 shrink-0 text-slate-400" aria-hidden /><span className="truncate">{s.email}</span></span>}

                          <div className="pt-2">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Démarches traitées</p>
                            {s.demarches.length === 0 ? (
                              <p className="mt-1 text-slate-500">Aucune démarche en ligne pour le moment.</p>
                            ) : (
                              <ul className="mt-1.5 flex flex-wrap gap-1.5">
                                {s.demarches.map((d) => (
                                  <li key={d.slug}>
                                    <Link
                                      to={`/procedures/${d.slug}`}
                                      className={cx(
                                        'inline-block rounded-full px-2.5 py-1 text-xs font-medium ring-1 transition hover:ring-brand-400',
                                        d.slug === demarche ? 'bg-brand-700 text-white ring-brand-700' : 'bg-white text-slate-700 ring-slate-200',
                                      )}
                                    >
                                      {d.titre}
                                    </Link>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-2 pt-3">
                            {s.latitude && s.longitude && (
                              <a
                                href={lienItineraire(s, gps.position)}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
                              >
                                <Navigation className="size-4" aria-hidden /> Itinéraire
                              </a>
                            )}
                            {competence && (!utilisateur || utilisateur.role === 'citoyen') && (
                              <Bouton
                                vers={utilisateur ? lienDemarche(s) : '/connexion'}
                                state={utilisateur ? undefined : { depuis: lienDemarche(s) }}
                                iconeDroite={ArrowRight}
                              >
                                Faire ma démarche ici
                              </Bouton>
                            )}
                          </div>
                        </div>
                      )}
                    </li>
                  )
                })}
        </ul>
        <div className="h-[24rem] border-t border-slate-200 lg:h-full lg:border-l lg:border-t-0">
          <CarteServices services={services} selection={selection} onSelection={selectionner} position={gps.position} recommande={conseil?.id ?? null} />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
        <p>Distances à vol d’oiseau, données à titre indicatif. L’itinéraire s’ouvre dans Google Maps.</p>
        {demarche && (
          <button onClick={() => choisirDemarche('')} className="inline-flex items-center gap-1 font-medium text-brand-700 hover:text-brand-800">
            <X className="size-3.5" aria-hidden /> Voir toutes les administrations
          </button>
        )}
      </div>
    </div>
  )
}

/** On attend de savoir qui est connecté pour présélectionner la région du citoyen. */
export default function Services() {
  const { utilisateur, chargement } = useAuth()
  if (chargement) return <Chargement />
  return <ContenuServices key={utilisateur?.id ?? 'visiteur'} />
}
