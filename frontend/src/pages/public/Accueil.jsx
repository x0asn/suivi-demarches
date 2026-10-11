import {
  ArrowRight,
  Check,
  Clock,
  FileCheck2,
  FileSearch,
  ListChecks,
  Loader2,
  MapPin,
  Search,
  SearchX,
  ShieldCheck,
  Upload,
  UsersRound,
} from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import citoyenne from '../../assets/images/citoyenne-en-ligne.jpg'
import dakar from '../../assets/images/dakar-cote.jpg'
import { IconeCategorie } from '../../components/ui/Icones'
import { Apparition, Bouton, DrapeauSenegal, EtoileSenegal, FiletSenegal, Squelette } from '../../components/ui'
import { useAuth } from '../../context/AuthContext'
import { useLienSuivi } from '../../hooks/useLienSuivi'
import { api } from '../../lib/api'
import { libelleDelai } from '../../lib/icones'
import { REGIONS } from '../../lib/regions'
import { COULEURS_SENEGAL } from '../../lib/senegal'
import { cx, nombre } from '../../lib/utils'

/** Procédures classées selon le nombre réel de dossiers déposés (partagé par deux sections). */
function usePopulaires() {
  const [etat, setEtat] = useState({ liste: null, total: 0, erreur: false })
  useEffect(() => {
    const controleur = new AbortController()
    api('/procedures', { params: { tri: 'populaires', par_page: 4 }, signal: controleur.signal })
      .then((r) => setEtat({ liste: r.data, total: r.meta?.total ?? r.data.length, erreur: false }))
      .catch((e) => e.name !== 'AbortError' && setEtat({ liste: [], total: 0, erreur: true }))
    return () => controleur.abort()
  }, [])
  return etat
}

/* ------------------------------------------------------------------ */
/* Recherche avec suggestions issues du catalogue réel                  */
/* ------------------------------------------------------------------ */
function Recherche() {
  const navigate = useNavigate()
  const idListe = useId()
  const zone = useRef(null)
  const [terme, setTerme] = useState('')
  const [resultats, setResultats] = useState(null)
  const [chargement, setChargement] = useState(false)
  const [actif, setActif] = useState(-1)
  const recherche = terme.trim()
  const ouvert = recherche.length >= 2 && resultats !== null

  useEffect(() => {
    if (recherche.length < 2) return
    const controleur = new AbortController()
    const minuteur = setTimeout(() => {
      setChargement(true)
      api('/procedures', { params: { q: recherche, par_page: 5 }, signal: controleur.signal })
        .then((r) => {
          setResultats({ liste: r.data, total: r.meta?.total ?? r.data.length })
          setActif(-1)
        })
        .catch((e) => e.name !== 'AbortError' && setResultats({ liste: [], total: 0, erreur: true }))
        .finally(() => !controleur.signal.aborted && setChargement(false))
    }, 250)
    return () => {
      clearTimeout(minuteur)
      controleur.abort()
    }
  }, [recherche])

  useEffect(() => {
    const surClic = (e) => !zone.current?.contains(e.target) && setResultats(null)
    document.addEventListener('mousedown', surClic)
    return () => document.removeEventListener('mousedown', surClic)
  }, [])

  const voirTout = () => navigate(recherche ? `/procedures?q=${encodeURIComponent(recherche)}` : '/procedures')

  const surTouche = (e) => {
    const liste = resultats?.liste ?? []
    if (e.key === 'ArrowDown' && liste.length) {
      e.preventDefault()
      setActif((a) => (a + 1) % liste.length)
    } else if (e.key === 'ArrowUp' && liste.length) {
      e.preventDefault()
      setActif((a) => (a <= 0 ? liste.length - 1 : a - 1))
    } else if (e.key === 'Escape') {
      setResultats(null)
    }
  }

  const soumettre = (e) => {
    e.preventDefault()
    const choisi = resultats?.liste?.[actif]
    if (choisi) navigate(`/procedures/${choisi.slug}`)
    else voirTout()
  }

  return (
    <div ref={zone} className="relative">
      <form onSubmit={soumettre} role="search">
        <label htmlFor="recherche-accueil" className="sr-only">Rechercher une procédure administrative</label>
        <div className="flex items-center gap-2 rounded-2xl bg-white p-2 shadow-flottant ring-1 ring-slate-200 transition focus-within:ring-2 focus-within:ring-brand-600">
          <Search className="ml-2.5 size-5 shrink-0 text-slate-400" aria-hidden />
          <input
            id="recherche-accueil"
            type="search"
            autoComplete="off"
            value={terme}
            onChange={(e) => {
              setTerme(e.target.value)
              if (e.target.value.trim().length < 2) setResultats(null)
            }}
            onKeyDown={surTouche}
            placeholder="Quelle démarche cherchez-vous ?"
            className="min-w-0 flex-1 bg-transparent py-2.5 text-base text-slate-900 placeholder:text-slate-400 focus:outline-none"
            role="combobox"
            aria-expanded={ouvert}
            aria-controls={idListe}
            aria-autocomplete="list"
            aria-activedescendant={actif >= 0 ? `${idListe}-${actif}` : undefined}
          />
          {chargement && <Loader2 className="size-4 animate-spin text-slate-400" aria-hidden />}
          <button
            type="submit"
            className="flex h-11 shrink-0 items-center justify-center rounded-xl bg-brand-700 px-3.5 text-sm font-semibold text-white transition-colors hover:bg-brand-800 sm:px-5"
            aria-label="Rechercher"
          >
            <Search className="size-5 sm:hidden" aria-hidden />
            <span className="hidden sm:inline">Rechercher</span>
          </button>
        </div>
      </form>

      {ouvert && (
        <div className="absolute inset-x-0 top-full z-30 mt-2 overflow-hidden rounded-2xl bg-white shadow-flottant ring-1 ring-slate-200" aria-live="polite">
          {resultats.liste.length === 0 ? (
            <div className="flex items-start gap-3 px-4 py-5 text-sm">
              <SearchX className="mt-0.5 size-5 shrink-0 text-slate-400" aria-hidden />
              <div>
                <p className="font-medium text-slate-900">
                  {resultats.erreur ? 'La recherche est momentanément indisponible.' : <>Aucune procédure ne correspond à « {recherche} ».</>}
                </p>
                <p className="mt-0.5 text-slate-500">
                  Essayez un autre mot-clé ou <Link to="/procedures" className="font-semibold text-brand-700 hover:text-brand-800">parcourez toutes les procédures</Link>.
                </p>
              </div>
            </div>
          ) : (
            <>
              <ul id={idListe} role="listbox" aria-label="Procédures correspondantes" className="py-1.5">
                {resultats.liste.map((p, i) => (
                  <li key={p.id} id={`${idListe}-${i}`} role="option" aria-selected={actif === i}>
                    <Link to={`/procedures/${p.slug}`} onMouseEnter={() => setActif(i)} className={cx('flex items-center gap-3 px-4 py-2.5', actif === i && 'bg-brand-50/70')}>
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                        <IconeCategorie nom={p.categorie?.icone} className="size-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-slate-900">{p.titre}</span>
                        <span className="block text-xs text-slate-500">{p.categorie?.nom}</span>
                      </span>
                      <ArrowRight className="size-4 shrink-0 text-slate-300" aria-hidden />
                    </Link>
                  </li>
                ))}
              </ul>
              <button type="button" onClick={voirTout} className="w-full border-t border-slate-100 px-4 py-3 text-left text-sm font-semibold text-brand-700 hover:bg-slate-50">
                Voir les {resultats.total} résultat{resultats.total > 1 ? 's' : ''} dans le catalogue
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* 1. Section principale                                                */
/* ------------------------------------------------------------------ */
function Presentation({ populaires }) {
  const suivi = useLienSuivi()

  return (
    <section className="relative isolate overflow-hidden">
      {/* Fond : halos discrets, dont un aux tons de l'or du drapeau */}
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
        <div className="absolute inset-0 bg-gradient-to-b from-brand-50/80 via-white to-white" />
        <div className="motif-senegal-clair absolute inset-0 [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" />
        <div className="absolute -right-32 -top-40 size-[34rem] rounded-full opacity-20 blur-3xl" style={{ background: COULEURS_SENEGAL.or }} />
        <div className="absolute -left-40 top-40 size-[26rem] rounded-full bg-brand-200/50 blur-3xl" />
      </div>

      <div className="conteneur grid grid-cols-1 items-center gap-14 pb-10 pt-10 sm:pt-12 lg:grid-cols-[1.08fr_1fr] lg:pb-14 lg:pt-14">
        <div className="relative z-20 min-w-0 animate-apparition">
          <p className="inline-flex items-center gap-2.5 rounded-full bg-white px-3.5 py-1.5 text-sm font-medium text-slate-700 shadow-sm ring-1 ring-slate-200">
            <DrapeauSenegal className="h-3.5 w-[1.3rem]" />
            <span><b className="font-semibold text-brand-800" title="« Bienvenue » en wolof">Dalal ak jàmm</b> · au service des citoyens du Sénégal</span>
          </p>
          <h1 className="titre-display mt-6 text-[2.5rem] font-semibold leading-[1.08] sm:text-5xl lg:text-[3.5rem]">
            Vos démarches administratives, <span className="text-brand-700">plus simplement.</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-slate-600">
            Trouvez la procédure qui vous concerne, déposez votre demande en ligne et suivez votre dossier à chaque étape.
          </p>

          <div className="mt-8 max-w-xl">
            <Recherche />
            {populaires.liste?.length > 0 && (
              <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
                <span className="text-slate-500">Les plus demandées :</span>
                {populaires.liste.slice(0, 3).map((p) => (
                  <Link
                    key={p.id}
                    to={`/procedures/${p.slug}`}
                    className="rounded-full bg-white px-3 py-1 font-medium text-slate-700 ring-1 ring-slate-200 transition hover:text-brand-800 hover:ring-brand-300"
                  >
                    {p.titre}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Bouton vers="/procedures" taille="lg" iconeDroite={ArrowRight}>Consulter les procédures</Bouton>
            <Bouton vers={suivi.vers} state={suivi.state} variante="secondaire" taille="lg">Suivre mon dossier</Bouton>
          </div>
        </div>

        {/* Visuel : une citoyenne en ligne et les étapes réelles d'un dossier */}
        <div className="relative mx-auto w-full max-w-md animate-apparition pb-6 [animation-delay:150ms] sm:pb-8 lg:max-w-none">
          {/* Cadre aux couleurs nationales, légèrement décalé derrière la photo */}
          <div className="absolute -right-3 -top-3 bottom-9 left-6 rounded-[2rem] sm:bottom-11" style={{ background: `linear-gradient(135deg, ${COULEURS_SENEGAL.vert}, ${COULEURS_SENEGAL.or} 55%, ${COULEURS_SENEGAL.rouge})`, opacity: 0.85 }} aria-hidden />
          <div className="relative aspect-[4/3.6] overflow-hidden rounded-[2rem] bg-slate-100 shadow-flottant">
            <img src={citoyenne} alt="Une citoyenne effectue sa démarche en ligne" className="size-full object-cover object-[65%_center] transition-transform duration-[1200ms] ease-out hover:scale-[1.03]" />
          </div>

          <div className="absolute bottom-0 right-4 w-64 animate-flotte rounded-2xl bg-white p-4 shadow-flottant ring-1 ring-slate-200/70 sm:right-6 sm:w-72" aria-hidden>
            <p className="text-xs font-medium text-slate-500">Votre dossier, étape par étape</p>
            <ol className="mt-3 flex items-center">
              {['Soumis', 'Vérification', 'Traitement', 'Décision'].map((etape, i) => (
                <li key={etape} className="relative flex flex-1 flex-col items-center text-center">
                  {i > 0 && <span className={cx('absolute right-1/2 top-2.5 h-0.5 w-full', i < 3 ? 'bg-brand-500' : 'bg-slate-200')} />}
                  <span
                    className={cx(
                      'relative z-10 flex size-5 items-center justify-center rounded-full ring-4 ring-white',
                      i < 2 && 'bg-brand-600 text-white',
                      i === 2 && 'border-2 border-brand-600 bg-white',
                      i === 3 && 'bg-slate-200',
                    )}
                  >
                    {i < 2 && <Check className="size-3" />}
                    {i === 2 && <span className="size-2 rounded-full bg-brand-600" />}
                  </span>
                  <span className={cx('mt-1.5 text-[0.65rem] font-medium', i === 3 ? 'text-slate-400' : 'text-slate-700')}>{etape}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* 2. Les démarches les plus demandées (classement réel)               */
/* ------------------------------------------------------------------ */
function Procedures({ populaires }) {
  if (populaires.liste && populaires.liste.length === 0 && !populaires.erreur) return null

  return (
    <section className="conteneur pb-16 pt-10 sm:pb-20 sm:pt-12" aria-labelledby="titre-procedures">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id="titre-procedures" className="titre-display text-2xl font-semibold sm:text-3xl">Les démarches les plus demandées</h2>
          <p className="mt-2 text-slate-600">Classées selon le nombre de dossiers déposés sur la plateforme.</p>
        </div>
        {populaires.total > 0 && (
          <Link to="/procedures" className="group inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-800">
            Voir les {populaires.total} procédures <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
          </Link>
        )}
      </div>

      {populaires.erreur ? (
        <p className="mt-8 rounded-xl bg-slate-50 px-5 py-4 text-sm text-slate-600">
          Les procédures n’ont pas pu être chargées. <Link to="/procedures" className="font-semibold text-brand-700">Ouvrir le catalogue</Link>
        </p>
      ) : (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {!populaires.liste
            ? Array.from({ length: 4 }).map((_, i) => <li key={i}><Squelette className="h-48 rounded-2xl" /></li>)
            : populaires.liste.map((p, i) => (
                <Apparition as="li" key={p.id} delai={i * 90}>
                  <Link
                    to={`/procedures/${p.slug}`}
                    className="carte-vivante group relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 hover:border-brand-300"
                  >
                    {/* Un trait aux couleurs du drapeau se déploie au survol */}
                    <span className="absolute inset-x-0 top-0 h-1 origin-left scale-x-0 transition-transform duration-500 ease-out group-hover:scale-x-100" style={{ background: `linear-gradient(90deg, ${COULEURS_SENEGAL.vert} 33%, ${COULEURS_SENEGAL.or} 33% 66%, ${COULEURS_SENEGAL.rouge} 66%)` }} aria-hidden />
                    <div className="flex items-start justify-between">
                      <span className="flex size-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700 transition-colors group-hover:bg-brand-700 group-hover:text-white">
                        <IconeCategorie nom={p.categorie?.icone} className="size-5" />
                      </span>
                      <span className="font-display text-sm font-semibold text-slate-300">0{i + 1}</span>
                    </div>
                    <span className="mt-4 text-xs font-medium text-slate-500">{p.categorie?.nom}</span>
                    <span className="mt-1 flex-1 font-semibold leading-snug text-slate-900 group-hover:text-brand-800">{p.titre}</span>
                    <span className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-slate-100 pt-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1"><Clock className="size-3.5" aria-hidden /> {libelleDelai(p.delai_jours)}</span>
                      <span className="flex items-center gap-1"><FileCheck2 className="size-3.5" aria-hidden /> {p.pieces_count} pièce{p.pieces_count > 1 ? 's' : ''}</span>
                      {p.dossiers_count > 0 && (
                        <span className="flex items-center gap-1"><UsersRound className="size-3.5" aria-hidden /> {nombre(p.dossiers_count)} dossier{p.dossiers_count > 1 ? 's' : ''}</span>
                      )}
                    </span>
                  </Link>
                </Apparition>
              ))}
        </ul>
      )}
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* 3. Fonctionnement                                                    */
/* ------------------------------------------------------------------ */
function Fonctionnement() {
  const etapes = [
    { icone: FileSearch, titre: 'Trouvez votre procédure', texte: 'Consultez les conditions et les pièces à fournir.' },
    { icone: Upload, titre: 'Déposez votre dossier', texte: 'Remplissez votre demande et joignez vos pièces en ligne.' },
    { icone: ListChecks, titre: 'Suivez son avancement', texte: 'Chaque étape s’affiche et vous êtes notifié.' },
  ]

  return (
    <section id="fonctionnement" className="scroll-mt-20 border-y border-slate-100 bg-slate-50/70 py-16 sm:py-20" aria-labelledby="titre-fonctionnement">
      <div className="conteneur">
        <h2 id="titre-fonctionnement" className="titre-display text-center text-2xl font-semibold sm:text-3xl">Comment ça marche</h2>
        <FiletSenegal className="mt-4" />
        <ol className="mx-auto mt-12 grid max-w-5xl gap-10 md:grid-cols-3 md:gap-8">
          {etapes.map(({ icone: Icone, titre, texte }, i) => (
            <Apparition as="li" key={titre} delai={i * 140} className="group relative flex gap-4 md:flex-col md:items-center md:text-center">
              {i < etapes.length - 1 && <span className="absolute left-[calc(50%+2.5rem)] top-6 hidden h-px w-[calc(100%-3rem)] bg-brand-200 md:block" aria-hidden />}
              <span className="relative flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white text-brand-700 shadow-carte ring-1 ring-slate-200/70 transition duration-300 ease-out group-hover:-translate-y-1 group-hover:bg-brand-700 group-hover:text-white">
                <Icone className="size-5" aria-hidden />
                <span className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-brand-700 text-[0.65rem] font-bold text-white">{i + 1}</span>
              </span>
              <div className="md:mt-5">
                <h3 className="font-semibold text-slate-900">{titre}</h3>
                <p className="mt-1 text-sm leading-relaxed text-slate-600">{texte}</p>
              </div>
            </Apparition>
          ))}
        </ol>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* 4. Partout au Sénégal : services et régions (données réelles)        */
/* ------------------------------------------------------------------ */
function PartoutAuSenegal() {
  const [services, setServices] = useState(null)

  useEffect(() => {
    api('/services').then((r) => setServices(r.data)).catch(() => setServices(null))
  }, [])

  return (
    <section className="relative isolate overflow-hidden bg-brand-950" aria-labelledby="titre-senegal">
      <img src={dakar} alt="" className="absolute inset-0 -z-20 size-full object-cover opacity-40" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-brand-950 via-brand-950/90 to-brand-950/40" />
      <div className="motif-senegal absolute inset-0 -z-10 opacity-60" aria-hidden />

      <div className="conteneur grid gap-10 py-16 sm:py-20 lg:grid-cols-[1.1fr_1fr] lg:items-center">
        <Apparition>
          <p className="flex items-center gap-2.5 text-sm font-medium text-or-200">
            <DrapeauSenegal className="h-3.5 w-[1.3rem]" /> Partout au Sénégal
            <EtoileSenegal className="size-3.5" couleur="#d4a12f" />
            <span className="text-brand-100/80" title="L’hospitalité, en wolof">l’esprit de la Teranga</span>
          </p>
          <h2 id="titre-senegal" className="mt-4 font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Un service public proche de vous.
          </h2>
          <p className="mt-4 max-w-lg text-brand-100/85">
            Où que vous habitiez, déposez vos demandes en ligne. Si vous devez vous déplacer, trouvez le point d’accueil compétent, ses horaires et son adresse.
          </p>
          {services && (
            <dl className="mt-8 flex gap-10 text-white">
              <div>
                <dt className="text-sm text-brand-200/80">Points d’accueil référencés</dt>
                <dd className="mt-1 font-display text-3xl font-semibold">{nombre(services.services.length)}</dd>
              </div>
              <div>
                <dt className="text-sm text-brand-200/80">Régions couvertes</dt>
                <dd className="mt-1 font-display text-3xl font-semibold">{services.regions.length}</dd>
              </div>
            </dl>
          )}
          <Bouton vers="/services" variante="or" taille="lg" className="mt-8" iconeDroite={ArrowRight}>Trouver l’administration compétente</Bouton>
        </Apparition>

        <Apparition delai={150} className="rounded-3xl bg-white/[0.06] p-6 ring-1 ring-white/10 backdrop-blur-sm sm:p-7">
          <p className="text-sm font-medium text-white">Les 14 régions du Sénégal</p>
          <p className="mt-1 text-xs text-brand-200/80">Chaque citoyen indique sa région à l’inscription.</p>
          <ul className="mt-5 flex flex-wrap gap-2">
            {REGIONS.map((r) => {
              const couverte = services?.regions.includes(r)
              return (
                <li key={r} className={cx('flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition duration-300 hover:-translate-y-0.5', couverte ? 'bg-white text-brand-900 hover:bg-or-100' : 'bg-white/10 text-brand-100')}>
                  {couverte && <MapPin className="size-3.5 text-brand-700" aria-hidden />}
                  {r}
                </li>
              )
            })}
          </ul>
          {services && (
            <p className="mt-4 flex items-center gap-2 text-xs text-brand-200/80">
              <span className="inline-flex size-4 items-center justify-center rounded-full bg-white"><MapPin className="size-2.5 text-brand-700" aria-hidden /></span>
              Régions où au moins un point d’accueil est référencé
            </p>
          )}
        </Apparition>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* 5. Pour les agents et l'administration                               */
/* ------------------------------------------------------------------ */
function Administrations() {
  const { utilisateur } = useAuth()
  if (utilisateur) return null

  return (
    <section className="conteneur py-12">
      <Apparition className="flex flex-col gap-5 rounded-2xl border border-slate-200 bg-white p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
        <div className="flex gap-4">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700"><ShieldCheck className="size-5" aria-hidden /></span>
          <div>
            <h2 className="font-semibold text-slate-900">Vous êtes agent ou responsable d’une administration ?</h2>
            <p className="mt-1 text-sm text-slate-600">Traitez les dossiers de votre service et suivez vos indicateurs depuis votre espace sécurisé.</p>
          </div>
        </div>
        <Bouton vers="/connexion" variante="secondaire" iconeDroite={ArrowRight} className="self-start sm:self-auto">Accéder à mon espace</Bouton>
      </Apparition>
    </section>
  )
}

export default function Accueil() {
  const populaires = usePopulaires()
  return (
    <>
      <Presentation populaires={populaires} />
      <Procedures populaires={populaires} />
      <Fonctionnement />
      <PartoutAuSenegal />
      <Administrations />
    </>
  )
}
