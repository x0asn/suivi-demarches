import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileCheck2,
  Info,
  Mail,
  MapPin,
  Phone,
  Printer,
  Timer,
  UsersRound,
  Wallet,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Bouton, Chargement } from '../../components/ui'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../lib/api'
import { IconeCategorie, IconeService } from '../../components/Icones'
import { libelleDelai } from '../../lib/icones'
import NonTrouve from '../erreurs/NonTrouve'

function Section({ titre, icone: Icone, children, id }) {
  return (
    <section id={id} className="carte scroll-mt-24 p-6 sm:p-8">
      <h2 className="flex items-center gap-3 text-lg font-semibold text-slate-900">
        <span className="flex size-9 items-center justify-center rounded-lg bg-brand-50 text-brand-700"><Icone className="size-[1.1rem]" aria-hidden /></span>
        {titre}
      </h2>
      <div className="mt-5">{children}</div>
    </section>
  )
}

/** RF-004 : fiche détaillée d'une procédure. */
export default function ProcedureDetail() {
  const { slug } = useParams()
  const { utilisateur } = useAuth()
  const [etat, setEtat] = useState({ procedure: null, chargement: true, introuvable: false })

  useEffect(() => {
    const controleur = new AbortController()
    api(`/procedures/${slug}`, { signal: controleur.signal })
      .then((r) => setEtat({ procedure: r.data, chargement: false, introuvable: false }))
      .catch((e) => e.name !== 'AbortError' && setEtat({ procedure: null, chargement: false, introuvable: true }))
    return () => controleur.abort()
  }, [slug])

  const { procedure, chargement, introuvable } = etat
  if (chargement) return <Chargement texte="Chargement de la procédure…" />
  if (introuvable) {
    return (
      <NonTrouve
        integre
        titre="Procédure introuvable"
        message="Cette procédure n'existe pas ou n'est plus proposée en ligne. Consultez le catalogue pour trouver la démarche qui vous concerne."
        retour="/procedures"
        libelleRetour="Voir le catalogue"
      />
    )
  }

  const obligatoires = procedure.pieces.filter((p) => p.obligatoire)
  const facultatives = procedure.pieces.filter((p) => !p.obligatoire)

  const lienDemarche = `/espace/dossiers/nouveau/${procedure.slug}`
  const peutDeposer = !utilisateur || utilisateur.role === 'citoyen'

  return (
    <>
      {/* En-tête */}
      <section className="relative overflow-hidden border-b border-slate-200/70 bg-gradient-to-b from-brand-50/70 to-white">
        <div className="pointer-events-none absolute -right-32 -top-32 size-96 rounded-full bg-brand-100/60 blur-3xl" aria-hidden />
        <div className="conteneur relative py-10 sm:py-14">
          <nav aria-label="Fil d'Ariane" className="flex flex-wrap items-center gap-1.5 text-sm text-slate-500">
            <Link to="/" className="hover:text-slate-800">Accueil</Link>
            <ChevronRight className="size-4" aria-hidden />
            <Link to="/procedures" className="hover:text-slate-800">Procédures</Link>
            <ChevronRight className="size-4" aria-hidden />
            <Link to={`/procedures?categorie=${procedure.categorie.slug}`} className="hover:text-slate-800">{procedure.categorie.nom}</Link>
          </nav>

          <div className="mt-6 flex items-start gap-5">
            <span className="hidden size-16 shrink-0 items-center justify-center rounded-2xl bg-brand-800 text-white shadow-flottant sm:flex">
              <IconeCategorie nom={procedure.categorie?.icone} className="size-7" />
            </span>
            <div className="min-w-0">
              <h1 className="titre-display text-3xl font-semibold sm:text-[2.6rem] sm:leading-tight">{procedure.titre}</h1>
              <p className="mt-3 max-w-3xl text-lg text-slate-600">{procedure.resume}</p>
            </div>
          </div>

          <dl className="mt-8 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { icone: Timer, libelle: 'Délai indicatif', valeur: libelleDelai(procedure.delai_jours) },
              { icone: Wallet, libelle: 'Coût', valeur: procedure.cout ?? '—' },
              { icone: FileCheck2, libelle: 'Pièces', valeur: `${obligatoires.length} obligatoire${obligatoires.length > 1 ? 's' : ''}` },
              { icone: Clock, libelle: 'Étapes', valeur: procedure.etapes.length },
            ].map(({ icone: Icone, libelle, valeur }) => (
              <div key={libelle} className="rounded-xl bg-white p-3.5 ring-1 ring-slate-200/80">
                <dt className="flex items-center gap-1.5 text-xs text-slate-500"><Icone className="size-3.5" aria-hidden /> {libelle}</dt>
                <dd className="mt-1 font-semibold text-slate-900">{valeur}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <div className="conteneur grid gap-8 py-12 lg:grid-cols-[1fr_22rem]">
        <div className="min-w-0 space-y-6">
          {(procedure.description || procedure.public_concerne) && (
            <Section titre="À propos de cette démarche" icone={Info}>
              {procedure.description && <p className="leading-relaxed text-slate-700">{procedure.description}</p>}
              {procedure.public_concerne && (
                <p className="mt-4 flex items-start gap-2.5 rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
                  <UsersRound className="mt-0.5 size-4 shrink-0 text-brand-600" aria-hidden />
                  <span><b className="font-semibold">Public concerné :</b> {procedure.public_concerne}</span>
                </p>
              )}
            </Section>
          )}

          {procedure.conditions && (
            <Section titre="Conditions" icone={CheckCircle2}>
              <p className="rounded-xl border-l-4 border-or-400 bg-or-50/60 p-4 leading-relaxed text-slate-700">{procedure.conditions}</p>
            </Section>
          )}

          <Section titre="Pièces à fournir" icone={FileCheck2} id="pieces">
            <ul className="divide-y divide-slate-100 rounded-xl ring-1 ring-slate-200/80">
              {[...obligatoires, ...facultatives].map((piece) => (
                <li key={piece.id} className="flex items-start gap-3.5 p-4">
                  <span className={piece.obligatoire ? 'mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white' : 'mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500'}>
                    <CheckCircle2 className="size-3.5" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-slate-900">{piece.libelle}</p>
                    {piece.description && <p className="mt-0.5 text-sm text-slate-500">{piece.description}</p>}
                  </div>
                  <span className={piece.obligatoire ? 'shrink-0 rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-800 ring-1 ring-brand-200' : 'shrink-0 rounded-full bg-slate-50 px-2.5 py-0.5 text-xs font-medium text-slate-600 ring-1 ring-slate-200'}>
                    {piece.obligatoire ? 'Obligatoire' : 'Si concerné'}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-sm text-slate-500">Formats acceptés lors du dépôt : PDF, JPG ou PNG, 5 Mo maximum par fichier.</p>
          </Section>

          <Section titre="Comment se déroule la démarche" icone={Clock}>
            <ol className="relative">
              {procedure.etapes.map((etape, i) => (
                <li key={etape.id} className="relative flex gap-4 pb-7 last:pb-0">
                  {i < procedure.etapes.length - 1 && <span className="absolute left-4 top-9 h-[calc(100%-2.25rem)] w-px bg-brand-200" aria-hidden />}
                  <span className="relative flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-800 text-sm font-semibold text-white ring-4 ring-brand-50">{i + 1}</span>
                  <div className="pt-1">
                    <p className="font-semibold text-slate-900">{etape.titre}</p>
                    {etape.description && <p className="mt-1 text-sm leading-relaxed text-slate-600">{etape.description}</p>}
                  </div>
                </li>
              ))}
            </ol>
          </Section>
        </div>

        {/* Colonne latérale */}
        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <div className="overflow-hidden rounded-2xl bg-brand-900 text-white shadow-flottant">
            <div className="motif-points p-6">
              <p className="text-sm font-medium text-brand-200">Prêt à commencer ?</p>
              <p className="mt-1 font-display text-2xl font-semibold">Déposez votre demande en ligne</p>
              <p className="mt-3 text-sm text-brand-100/80">
                Votre dossier reçoit une référence unique et vous suivez chaque étape depuis votre espace.
              </p>
              {peutDeposer ? (
                <Bouton
                  vers={utilisateur ? lienDemarche : '/connexion'}
                  state={utilisateur ? undefined : { depuis: lienDemarche }}
                  variante="or"
                  taille="lg"
                  className="mt-6 w-full"
                  iconeDroite={ArrowRight}
                >
                  Commencer ma démarche
                </Bouton>
              ) : (
                <p className="mt-6 rounded-xl bg-white/10 p-3 text-sm text-brand-100">Le dépôt de demande est réservé aux comptes citoyens.</p>
              )}
              {!utilisateur && (
                <p className="mt-3 text-center text-xs text-brand-200/80">
                  Pas de compte ? <Link to="/inscription" className="font-semibold text-white underline-offset-2 hover:underline">Inscrivez-vous en 2 minutes</Link>
                </p>
              )}
            </div>
          </div>

          {procedure.service && (
            <div className="carte p-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Service compétent</p>
              <div className="mt-3 flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700"><IconeService type={procedure.service.type} className="size-5" /></span>
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900">{procedure.service.nom}</p>
                  <p className="text-sm text-slate-500">{procedure.service.type_libelle}</p>
                </div>
              </div>
              <ul className="mt-5 space-y-2.5 text-sm text-slate-600">
                {procedure.service.adresse && <li className="flex gap-2.5"><MapPin className="mt-0.5 size-4 shrink-0 text-slate-400" aria-hidden />{procedure.service.adresse}, {procedure.service.commune}</li>}
                {procedure.service.horaires && <li className="flex gap-2.5"><Clock className="mt-0.5 size-4 shrink-0 text-slate-400" aria-hidden />{procedure.service.horaires}</li>}
                {procedure.service.telephone && <li className="flex gap-2.5"><Phone className="mt-0.5 size-4 shrink-0 text-slate-400" aria-hidden /><a href={`tel:${procedure.service.telephone.replace(/\s/g, '')}`} className="hover:text-brand-700">{procedure.service.telephone}</a></li>}
                {procedure.service.email && <li className="flex gap-2.5"><Mail className="mt-0.5 size-4 shrink-0 text-slate-400" aria-hidden /><span className="truncate">{procedure.service.email}</span></li>}
              </ul>
              <Link to={`/services?service=${procedure.service.id}`} className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-800">
                Voir sur la carte <ArrowRight className="size-4" aria-hidden />
              </Link>
            </div>
          )}

          <button onClick={() => window.print()} className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-medium text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50 print:hidden">
            <Printer className="size-4" aria-hidden /> Imprimer la liste des pièces
          </button>
        </aside>
      </div>

      <div className="conteneur pb-16">
        <Link to="/procedures" className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900">
          <ArrowLeft className="size-4" aria-hidden /> Retour au catalogue
        </Link>
      </div>
    </>
  )
}
