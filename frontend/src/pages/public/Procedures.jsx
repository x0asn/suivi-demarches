import { ArrowRight, Clock, FileText, Landmark, Search, SearchX, Wallet, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Alerte, Pagination, Squelette } from '../../components/ui'
import { api } from '../../lib/api'
import { IconeCategorie } from '../../components/ui/Icones'
import { iconeCategorie, libelleDelai } from '../../lib/icones'
import { cx } from '../../lib/utils'

function CarteProcedure({ procedure }) {
  return (
    <Link
      to={`/procedures/${procedure.slug}`}
      className="carte group flex flex-col p-6 transition duration-200 hover:-translate-y-1 hover:border-brand-200 hover:shadow-flottant"
    >
      <div className="flex items-start justify-between gap-4">
        <span className="flex size-12 items-center justify-center rounded-xl bg-brand-50 text-brand-700 ring-1 ring-brand-100 transition group-hover:bg-brand-700 group-hover:text-white">
          <IconeCategorie nom={procedure.categorie?.icone} className="size-5" />
        </span>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">{procedure.categorie?.nom}</span>
      </div>
      <h3 className="mt-5 text-lg font-semibold leading-snug text-slate-900 group-hover:text-brand-800">{procedure.titre}</h3>
      <p className="mt-2 line-clamp-2 flex-1 text-sm leading-relaxed text-slate-600">{procedure.resume}</p>

      <dl className="mt-5 grid grid-cols-3 gap-2 border-t border-slate-100 pt-4 text-xs">
        <div>
          <dt className="flex items-center gap-1 text-slate-500"><Clock className="size-3.5" aria-hidden /> Délai</dt>
          <dd className="mt-0.5 font-semibold text-slate-800">{libelleDelai(procedure.delai_jours)}</dd>
        </div>
        <div>
          <dt className="flex items-center gap-1 text-slate-500"><FileText className="size-3.5" aria-hidden /> Pièces</dt>
          <dd className="mt-0.5 font-semibold text-slate-800">{procedure.pieces_count}</dd>
        </div>
        <div className="min-w-0">
          <dt className="flex items-center gap-1 text-slate-500"><Wallet className="size-3.5" aria-hidden /> Coût</dt>
          <dd className="mt-0.5 truncate font-semibold text-slate-800" title={procedure.cout}>{procedure.cout ?? '—'}</dd>
        </div>
      </dl>
      {procedure.service && (
        <p className="mt-4 flex items-center gap-1.5 truncate text-xs text-slate-500">
          <Landmark className="size-3.5 shrink-0" aria-hidden /> {procedure.service.nom}
        </p>
      )}
    </Link>
  )
}

/** RF-004 / RF-005 : catalogue et recherche des procédures. */
export default function Procedures() {
  const [params, setParams] = useSearchParams()
  const q = params.get('q') ?? ''
  const categorie = params.get('categorie') ?? ''
  const page = Number(params.get('page') ?? 1)
  const service = params.get('service') ?? ''

  const [saisie, setSaisie] = useState(q)
  const [categories, setCategories] = useState([])
  const [resultat, setResultat] = useState({ data: [], meta: null })
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState(null)

  useEffect(() => {
    api('/categories').then((r) => setCategories(r.data)).catch(() => {})
  }, [])

  useEffect(() => {
    const controleur = new AbortController()
    api('/procedures', { params: { q, categorie, service, page }, signal: controleur.signal })
      .then((r) => {
        setResultat({ data: r.data, meta: r.meta })
        setErreur(null)
      })
      .catch((e) => e.name !== 'AbortError' && setErreur(e))
      .finally(() => !controleur.signal.aborted && setChargement(false))
    return () => controleur.abort()
  }, [q, categorie, service, page])

  const majParams = (changements) => {
    setChargement(true)
    const suivant = new URLSearchParams(params)
    Object.entries({ page: '', ...changements }).forEach(([k, v]) => (v ? suivant.set(k, v) : suivant.delete(k)))
    setParams(suivant)
  }

  const rechercher = (e) => {
    e.preventDefault()
    majParams({ q: saisie.trim() })
  }

  const total = categories.reduce((s, c) => s + (c.procedures_count ?? 0), 0)

  return (
    <>
      {/* En-tête */}
      <section className="relative overflow-hidden bg-brand-950 text-white">
        <div className="motif-points absolute inset-0 opacity-60" aria-hidden />
        <div className="absolute -top-24 right-0 size-96 rounded-full bg-brand-700/40 blur-3xl" aria-hidden />
        <div className="conteneur relative py-16 sm:py-20">
          <p className="text-sm font-semibold uppercase tracking-wide text-or-300">Catalogue</p>
          <h1 className="mt-3 max-w-2xl font-display text-4xl font-semibold tracking-tight sm:text-5xl">Toutes les procédures, expliquées simplement.</h1>
          <p className="mt-4 max-w-xl text-lg text-brand-100/80">
            Conditions, pièces à fournir, étapes et service compétent : préparez votre démarche avant de la commencer.
          </p>

          <form onSubmit={rechercher} role="search" className="mt-9 max-w-2xl">
            <label htmlFor="recherche-catalogue" className="sr-only">Rechercher une procédure</label>
            <div className="flex items-center gap-2 rounded-2xl bg-white p-2 shadow-flottant">
              <Search className="ml-3 size-5 shrink-0 text-slate-400" aria-hidden />
              <input
                id="recherche-catalogue"
                value={saisie}
                onChange={(e) => setSaisie(e.target.value)}
                placeholder="Ex. : casier judiciaire, passeport, résidence…"
                className="min-w-0 flex-1 bg-transparent py-2.5 text-base text-slate-900 placeholder:text-slate-400 focus:outline-none"
              />
              {saisie && (
                <button
                  type="button"
                  onClick={() => {
                    setSaisie('')
                    majParams({ q: '' })
                  }}
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                  aria-label="Effacer la recherche"
                >
                  <X className="size-4" />
                </button>
              )}
              <button type="submit" className="h-11 rounded-xl bg-brand-700 px-5 text-sm font-semibold text-white hover:bg-brand-800">
                Rechercher
              </button>
            </div>
          </form>
        </div>
      </section>

      <section className="conteneur py-12">
        {/* Filtres par catégorie */}
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:flex-wrap sm:px-0" role="group" aria-label="Filtrer par catégorie">
          <button
            onClick={() => majParams({ categorie: '' })}
            className={cx(
              'inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-medium ring-1 transition',
              !categorie ? 'bg-brand-800 text-white ring-brand-800' : 'bg-white text-slate-700 ring-slate-200 hover:ring-brand-300',
            )}
            aria-pressed={!categorie}
          >
            Toutes <span className={cx('rounded-full px-1.5 text-xs', !categorie ? 'bg-white/20' : 'bg-slate-100')}>{total}</span>
          </button>
          {categories.map((c) => {
            const Icone = iconeCategorie(c.icone)
            const actif = categorie === c.slug
            return (
              <button
                key={c.slug}
                onClick={() => majParams({ categorie: actif ? '' : c.slug })}
                className={cx(
                  'inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-medium ring-1 transition',
                  actif ? 'bg-brand-800 text-white ring-brand-800' : 'bg-white text-slate-700 ring-slate-200 hover:ring-brand-300',
                )}
                aria-pressed={actif}
              >
                <Icone className="size-4" aria-hidden /> {c.nom}
                <span className={cx('rounded-full px-1.5 text-xs', actif ? 'bg-white/20' : 'bg-slate-100')}>{c.procedures_count}</span>
              </button>
            )
          })}
        </div>

        {/* Résumé de la recherche */}
        <div className="mt-8 flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-sm text-slate-600" aria-live="polite">
            {chargement ? 'Recherche en cours…' : (
              <>
                <b className="font-semibold text-slate-900">{resultat.meta?.total ?? 0}</b> procédure{(resultat.meta?.total ?? 0) > 1 ? 's' : ''}
                {q && <> pour « <b className="font-semibold text-slate-900">{q}</b> »</>}
                {service && resultat.data[0]?.service && <> au service <b className="font-semibold text-slate-900">{resultat.data[0].service.nom}</b></>}
              </>
            )}
          </p>
          {service && (
            <button onClick={() => majParams({ service: '' })} className="inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:text-brand-800">
              <X className="size-3.5" aria-hidden /> Retirer le filtre de service
            </button>
          )}
        </div>

        {erreur ? (
          <Alerte type="erreur" className="mt-6" titre="Le catalogue n'a pas pu être chargé">{erreur.message}</Alerte>
        ) : chargement ? (
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => <Squelette key={i} className="h-72 rounded-2xl" />)}
          </div>
        ) : resultat.data.length === 0 ? (
          <div className="carte mt-6 flex flex-col items-center px-6 py-16 text-center">
            <span className="flex size-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500"><SearchX className="size-6" aria-hidden /></span>
            <h2 className="mt-4 font-semibold text-slate-900">Aucune procédure ne correspond à votre recherche</h2>
            <p className="mt-1.5 max-w-sm text-sm text-slate-500">Essayez avec d'autres mots-clés, ou parcourez les catégories ci-dessus.</p>
            <button
              onClick={() => {
                setSaisie('')
                majParams({ q: '', categorie: '' })
              }}
              className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-800"
            >
              Voir toutes les procédures <ArrowRight className="size-4" aria-hidden />
            </button>
          </div>
        ) : (
          <>
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {resultat.data.map((p) => <CarteProcedure key={p.id} procedure={p} />)}
            </div>
            <div className="carte mt-8 overflow-hidden empty:hidden">
              <Pagination meta={resultat.meta} onPage={(p) => majParams({ q, categorie, service, page: String(p) })} />
            </div>
          </>
        )}
      </section>
    </>
  )
}
