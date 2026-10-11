import { ArrowLeft, ArrowRight, Clock, FileCheck2, Landmark, MapPin, Scale, Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { IconeCategorie } from '../../../components/ui/Icones'
import { Alerte, Bouton, Chargement, ZoneTexte } from '../../../components/ui'
import { useAuth } from '../../../context/AuthContext'
import { useToast } from '../../../context/ToastContext'
import { api } from '../../../lib/api'
import { libelleDelai } from '../../../lib/icones'
import { cx, sansAccents } from '../../../lib/utils'
import AccesRefuse from '../../erreurs/AccesRefuse'
import NonTrouve from '../../erreurs/NonTrouve'

/** Au-delà de ce nombre, les administrations se choisissent par recherche plutôt que dans une liste. */
const LISTE_COURTE = 8

const memeCommune = (a, b) => a && b && a.trim().toLowerCase() === b.trim().toLowerCase()

/**
 * Administration proposée par défaut (M08) : celle choisie sur la carte, la seule habilitée,
 * ou celle de la commune du citoyen quand la règle est « lieu de résidence ».
 */
function administrationParDefaut(procedure, demandee, utilisateur) {
  const services = procedure.services ?? []
  if (services.some((s) => s.id === demandee)) return demandee
  if (services.length === 1) return services[0].id
  if (procedure.competence?.valeur === 'lieu_residence') {
    return services.find((s) => memeCommune(s.commune, utilisateur.commune))?.id ?? null
  }
  return null
}

/** RF-006 / UC-03 : démarrer une démarche (étape 1 du parcours de dépôt). */
export default function NouveauDossier() {
  const { slug } = useParams()
  const [params] = useSearchParams()
  const serviceDemande = Number(params.get('service')) || null
  const { utilisateur } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const [procedure, setProcedure] = useState(null)
  const [introuvable, setIntrouvable] = useState(false)
  const [champs, setChamps] = useState({ motif: '', precisions: '' })
  const [serviceId, setServiceId] = useState(null)
  const [recherche, setRecherche] = useState('')
  const [erreur, setErreur] = useState(null)
  const [envoi, setEnvoi] = useState(false)

  useEffect(() => {
    api(`/procedures/${slug}`)
      .then((r) => {
        setProcedure(r.data)
        setServiceId(administrationParDefaut(r.data, serviceDemande, utilisateur))
      })
      .catch(() => setIntrouvable(true))
    // Le choix par défaut n'est calculé qu'au chargement de la procédure.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug])

  if (utilisateur.role !== 'citoyen') return <AccesRefuse />
  if (introuvable) return <NonTrouve integre titre="Procédure introuvable" retour="/procedures" libelleRetour="Voir le catalogue" />
  if (!procedure) return <Chargement />

  const commencer = async (e) => {
    e.preventDefault()
    setErreur(null)
    setEnvoi(true)
    try {
      const r = await api('/dossiers', { method: 'POST', body: { procedure: slug, service_id: serviceId, ...champs } })
      toast.succes('Ajoutez maintenant vos pièces justificatives.', `Dossier ${r.data.reference} créé`)
      navigate(`/espace/dossiers/${r.data.id}`, { replace: true })
    } catch (err) {
      setErreur(err)
      setEnvoi(false)
    }
  }

  const obligatoires = procedure.pieces.filter((p) => p.obligatoire).length
  const administrations = procedure.services ?? []
  const administration = administrations.find((s) => s.id === serviceId) ?? (administrations.length === 0 ? procedure.service : null)

  // Liste proposée : celle déjà choisie d'abord, puis celles qui correspondent à la recherche.
  const longue = administrations.length > LISTE_COURTE
  const termes = sansAccents(recherche).split(/\s+/).filter(Boolean)
  // La commune qui porte le nom cherché passe avant celles dont seule la région correspond.
  const pertinence = (s) => {
    const commune = sansAccents(s.commune)
    return termes.some((t) => commune.startsWith(t)) ? 0 : termes.some((t) => commune.includes(t)) ? 1 : 2
  }
  const trouvees = administrations
    .filter((s) => {
      const texte = sansAccents(`${s.nom} ${s.commune} ${s.region}`)
      return termes.every((t) => texte.includes(t))
    })
    .sort((x, y) => pertinence(x) - pertinence(y))
  const proposees = longue
    ? [...(administration ? [administration] : []), ...trouvees.filter((s) => s.id !== serviceId)].slice(0, termes.length > 0 ? LISTE_COURTE : administration ? 1 : 0)
    : administrations

  return (
    <div className="mx-auto max-w-3xl">
      <Link to={`/procedures/${slug}`} className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800">
        <ArrowLeft className="size-4" aria-hidden /> Retour à la fiche
      </Link>

      {/* Étapes du dépôt */}
      <ol className="mb-8 grid grid-cols-3 gap-2 text-sm" aria-label="Étapes du dépôt">
        {['Votre demande', 'Pièces justificatives', 'Vérification et envoi'].map((e, i) => (
          <li key={e} className={i === 0 ? 'border-t-4 border-brand-600 pt-3 font-semibold text-brand-800' : 'border-t-4 border-slate-200 pt-3 text-slate-500'}>
            <span className="block text-xs">Étape {i + 1}</span>
            {e}
          </li>
        ))}
      </ol>

      <div className="carte overflow-hidden">
        <div className="flex items-start gap-4 border-b border-slate-100 bg-gradient-to-r from-brand-50/80 to-white p-6">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-brand-800 text-white">
            <IconeCategorie nom={procedure.categorie?.icone} className="size-5" />
          </span>
          <div>
            <p className="text-sm text-brand-700">Nouvelle démarche</p>
            <h1 className="titre-display text-2xl font-semibold">{procedure.titre}</h1>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-600">
              <span className="flex items-center gap-1.5"><Clock className="size-4 text-slate-400" aria-hidden /> {libelleDelai(procedure.delai_jours)}</span>
              <span className="flex items-center gap-1.5"><FileCheck2 className="size-4 text-slate-400" aria-hidden /> {obligatoires} pièce{obligatoires > 1 ? 's' : ''} obligatoire{obligatoires > 1 ? 's' : ''}</span>
              {administration && <span className="flex items-center gap-1.5"><Landmark className="size-4 text-slate-400" aria-hidden /> {administration.nom}</span>}
            </div>
          </div>
        </div>

        <form onSubmit={commencer} className="space-y-5 p-6" noValidate>
          {erreur && erreur.status !== 422 && <Alerte type="erreur">{erreur.message}</Alerte>}

          {administrations.length > 1 && (
            <fieldset>
              <legend className="text-sm font-medium text-slate-900">À quelle administration adressez-vous votre demande ?</legend>
              {procedure.competence && (
                <p className={cx('mt-2 flex gap-2 rounded-xl p-3 text-sm ring-1', procedure.competence.depend_du_territoire ? 'bg-or-50 text-slate-700 ring-or-200' : 'bg-brand-50 text-brand-900 ring-brand-100')}>
                  <Scale className="mt-0.5 size-4 shrink-0" aria-hidden />
                  <span><b className="font-semibold">{procedure.competence.libelle}.</b> {procedure.competence.explication}</span>
                </p>
              )}
              {longue && (
                <div className="relative mt-3">
                  <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden />
                  <input
                    type="search"
                    value={recherche}
                    onChange={(e) => setRecherche(e.target.value)}
                    placeholder="Tapez le nom de la commune : Thiès, Kolda, Podor…"
                    aria-label="Rechercher une administration par commune"
                    className="block w-full rounded-xl border-0 bg-white py-2.5 pl-10 pr-3.5 text-sm shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-600"
                  />
                  <p className="mt-1.5 text-xs text-slate-500" aria-live="polite">
                    {termes.length === 0
                      ? `${administrations.length} administrations peuvent traiter cette démarche. Cherchez la vôtre par le nom de sa commune.`
                      : trouvees.length === 0
                        ? 'Aucune administration ne correspond. Vérifiez l’orthographe de la commune.'
                        : `${trouvees.length} résultat${trouvees.length > 1 ? 's' : ''}${trouvees.length > LISTE_COURTE ? ` — les ${LISTE_COURTE} premiers sont affichés, précisez votre recherche` : ''}.`}
                  </p>
                </div>
              )}
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {proposees.map((s) => {
                  const choisie = s.id === serviceId
                  return (
                    <label key={s.id} className={cx('flex cursor-pointer items-start gap-2.5 rounded-xl px-3 py-2.5 text-sm ring-1 transition', choisie ? 'bg-brand-50 ring-2 ring-brand-600' : 'ring-slate-200 hover:ring-brand-300')}>
                      <input type="radio" name="service_id" className="mt-1 size-4 accent-brand-700" checked={choisie} onChange={() => setServiceId(s.id)} />
                      <span className="min-w-0">
                        <span className="block font-medium text-slate-900">{s.nom}</span>
                        <span className="flex items-center gap-1 text-slate-500"><MapPin className="size-3.5 shrink-0" aria-hidden /> {s.commune} · {s.region}</span>
                        {procedure.competence?.valeur === 'lieu_residence' && memeCommune(s.commune, utilisateur.commune) && <span className="mt-1 inline-block rounded-full bg-brand-700 px-2 py-0.5 text-xs font-semibold text-white">Votre commune</span>}
                      </span>
                    </label>
                  )
                })}
              </div>
              {erreur?.champ('service_id') && <p className="mt-2 text-sm text-red-600" role="alert">{erreur.champ('service_id')}</p>}
              <Link to={`/services?demarche=${slug}`} className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-800">
                Voir ces administrations sur la carte, avec la distance <ArrowRight className="size-4" aria-hidden />
              </Link>
            </fieldset>
          )}
          <ZoneTexte
            label="Objet de votre demande"
            rows={3}
            value={champs.motif}
            onChange={(e) => setChamps((c) => ({ ...c, motif: e.target.value }))}
            erreur={erreur?.champ('motif')}
            placeholder="Ex. : constitution d’un dossier de concours de la fonction publique."
            aide="Expliquez en une phrase pourquoi vous faites cette demande. Vous pourrez le modifier avant l’envoi."
            maxLength={2000}
          />
          <ZoneTexte
            label="Précisions (facultatif)"
            rows={3}
            value={champs.precisions}
            onChange={(e) => setChamps((c) => ({ ...c, precisions: e.target.value }))}
            placeholder="Toute information utile à l’agent : urgence, numéro d’acte connu…"
            maxLength={2000}
          />
          <Alerte type="info">
            Votre dossier sera enregistré en <b>brouillon</b> : rien n’est transmis à l’administration tant que vous ne l’avez pas soumis.
          </Alerte>
          <div className="flex justify-end">
            <Bouton type="submit" taille="lg" chargement={envoi} iconeDroite={ArrowRight}>Créer mon dossier</Bouton>
          </div>
        </form>
      </div>
    </div>
  )
}
