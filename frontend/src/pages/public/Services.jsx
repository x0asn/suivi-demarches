import { Clock, Mail, MapPin, Navigation, Phone, Search, SearchX } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import CarteServices from '../../components/services/CarteServices'
import { Alerte, Chargement, Selecteur, Squelette } from '../../components/ui'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../lib/api'
import { iconeService } from '../../lib/icones'
import { REGIONS } from '../../lib/regions'
import { cx } from '../../lib/utils'

/** RF-021 / M08 : rechercher un service et le localiser. */
function ContenuServices() {
  const [params, setParams] = useSearchParams()
  const selection = Number(params.get('service')) || null
  const { utilisateur } = useAuth()
  // Un citoyen connecté voit d'abord les services de sa région (sauf s'il arrive sur un service précis).
  const maRegion = utilisateur?.role === 'citoyen' && !selection ? utilisateur.region ?? '' : ''
  const [filtres, setFiltres] = useState({ q: '', type: '', region: maRegion })
  const [donnees, setDonnees] = useState({ services: [], regions: [], types: {} })
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState(null)

  useEffect(() => {
    const controleur = new AbortController()
    const minuteur = setTimeout(() => {
      api('/services', { params: filtres, signal: controleur.signal })
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
  }, [filtres])

  const filtrer = (changements) => {
    setChargement(true)
    setFiltres((f) => ({ ...f, ...changements }))
  }

  const selectionner = (id) => setParams(id ? { service: String(id) } : {}, { replace: true })

  // Le service sélectionné défile dans la liste.
  useEffect(() => {
    if (selection) document.getElementById(`service-${selection}`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [selection, donnees])

  const services = donnees.services
  const types = useMemo(() => Object.entries(donnees.types ?? {}), [donnees.types])

  return (
    <div className="conteneur py-10 sm:py-14">
      <div className="max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-700">Services & points d'accueil</p>
        <h1 className="titre-display mt-2 text-3xl font-semibold sm:text-4xl">Trouvez le service compétent près de chez vous</h1>
        <p className="mt-3 text-slate-600">Mairies, tribunaux, directions ministérielles : adresses, horaires et contacts.</p>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-[1fr_14rem]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden />
          <input
            value={filtres.q}
            onChange={(e) => filtrer({ q: e.target.value })}
            placeholder="Nom du service, commune, adresse…"
            aria-label="Rechercher un service"
            className="block w-full rounded-xl border-0 bg-white py-2.5 pl-10 pr-3.5 text-sm shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-600"
          />
        </div>
        <Selecteur value={filtres.region} onChange={(e) => filtrer({ region: e.target.value })} aria-label="Région">
          <option value="">Toutes les régions</option>
          {REGIONS.map((r) => <option key={r} value={r}>{r}{r === utilisateur?.region ? ' (ma région)' : ''}</option>)}
        </Selecteur>
      </div>

      <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Type de service">
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

      {maRegion && filtres.region === maRegion && !chargement && (
        <p className="mt-6 flex flex-wrap items-center gap-2 rounded-xl bg-brand-50 px-4 py-3 text-sm text-brand-900 ring-1 ring-brand-100">
          <Navigation className="size-4 text-brand-600" aria-hidden />
          <span>
            {services.length > 0
              ? <>Services de votre région : <b className="font-semibold">{maRegion}</b>.</>
              : <>Aucun service de la région <b className="font-semibold">{maRegion}</b> n’est encore référencé.</>}
          </span>
          <button onClick={() => filtrer({ region: '' })} className="font-semibold text-brand-700 underline underline-offset-2 hover:text-brand-800">
            Voir toutes les régions
          </button>
        </p>
      )}

      <div className="mt-6 grid overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-carte lg:h-[38rem] lg:grid-cols-[24rem_1fr]">
        <ul className="max-h-[26rem] divide-y divide-slate-100 overflow-y-auto lg:max-h-none" aria-label="Liste des services">
          {chargement && services.length === 0
            ? Array.from({ length: 5 }).map((_, i) => <li key={i} className="p-4"><Squelette className="h-16" /></li>)
            : services.length === 0
              ? (
                <li className="flex flex-col items-center px-6 py-16 text-center">
                  <SearchX className="size-6 text-slate-400" aria-hidden />
                  <p className="mt-3 font-medium text-slate-900">Aucun service trouvé</p>
                  <p className="mt-1 text-sm text-slate-500">Modifiez votre recherche ou vos filtres.</p>
                </li>
              )
              : services.map((s) => {
                  const Icone = iconeService(s.type)
                  const actif = s.id === selection
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
                          <span className="mt-0.5 flex items-center gap-1 text-sm text-slate-500"><MapPin className="size-3.5" aria-hidden /> {s.commune} · {s.region}</span>
                        </span>
                      </button>
                          {actif && (
                            <div className="space-y-1.5 px-4 pb-4 pl-[4.25rem] text-sm text-slate-600">
                              {s.adresse && <span className="flex gap-2"><MapPin className="mt-0.5 size-3.5 shrink-0 text-slate-400" aria-hidden />{s.adresse}</span>}
                              {s.horaires && <span className="flex gap-2"><Clock className="mt-0.5 size-3.5 shrink-0 text-slate-400" aria-hidden />{s.horaires}</span>}
                              {s.telephone && <span className="flex gap-2"><Phone className="mt-0.5 size-3.5 shrink-0 text-slate-400" aria-hidden />{s.telephone}</span>}
                              {s.email && <span className="flex gap-2"><Mail className="mt-0.5 size-3.5 shrink-0 text-slate-400" aria-hidden /><span className="truncate">{s.email}</span></span>}
                              {s.procedures_count > 0 && (
                                <Link
                                  to={`/procedures?service=${s.id}`}
                                  className="mt-2 inline-block font-semibold text-brand-700 hover:text-brand-800"
                                >
                                  {s.procedures_count} procédure{s.procedures_count > 1 ? 's' : ''} en ligne →
                                </Link>
                              )}
                            </div>
                          )}
                    </li>
                  )
                })}
        </ul>
        <div className="h-[24rem] border-t border-slate-200 lg:h-full lg:border-l lg:border-t-0">
          <CarteServices services={services} selection={selection} onSelection={selectionner} />
        </div>
      </div>
      <p className="mt-3 text-xs text-slate-500">Coordonnées fournies à titre indicatif pour la démonstration.</p>
    </div>
  )
}

/** On attend de savoir qui est connecté pour présélectionner la région du citoyen. */
export default function Services() {
  const { utilisateur, chargement } = useAuth()
  if (chargement) return <Chargement />
  return <ContenuServices key={utilisateur?.id ?? 'visiteur'} />
}
