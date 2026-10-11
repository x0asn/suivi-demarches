import { ArrowRight, FolderOpen, Plus, Search } from 'lucide-react'
import { Link } from 'react-router-dom'
import { BadgeStatut, Frise } from '../../../components/dossiers/Elements'
import { IconeCategorie } from '../../../components/Icones'
import { Alerte, Bouton, EnTetePage, EtatVide, Pagination, Squelette } from '../../../components/ui'
import { useListe } from '../../../hooks/useListe'
import { STATUTS_DOSSIER } from '../../../lib/dossiers'
import { cx, dates } from '../../../lib/utils'

const ONGLETS = [
  { valeur: '', libelle: 'Tous' },
  { valeur: 'en_cours', libelle: 'En cours' },
  { valeur: 'correction_demandee', libelle: 'Action requise' },
  { valeur: 'brouillon', libelle: 'Brouillons' },
  { valeur: 'termines', libelle: 'Terminés' },
]

/** RF-011 : liste personnelle des dossiers, filtrable par statut. */
export default function MesDossiers() {
  const { donnees, meta, chargement, erreur, filtres, filtrer, allerPage } = useListe('/dossiers', { statut: '', q: '' })

  return (
    <>
      <EnTetePage
        surtitre="Mon espace"
        titre="Mes dossiers"
        description="Retrouvez toutes vos démarches et suivez leur avancement."
        actions={<Bouton vers="/procedures" icone={Plus}>Nouvelle démarche</Bouton>}
      />

      <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="-mx-4 flex gap-1 overflow-x-auto px-4 lg:mx-0 lg:px-0" role="tablist" aria-label="Filtrer mes dossiers">
          {ONGLETS.map((o) => (
            <button
              key={o.valeur}
              role="tab"
              aria-selected={filtres.statut === o.valeur}
              onClick={() => filtrer({ statut: o.valeur })}
              className={cx(
                'shrink-0 rounded-lg px-3.5 py-2 text-sm font-medium transition',
                filtres.statut === o.valeur ? 'bg-white text-brand-800 shadow-sm ring-1 ring-slate-200' : 'text-slate-600 hover:text-slate-900',
              )}
            >
              {o.libelle}
            </button>
          ))}
        </div>
        <div className="relative lg:w-72">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden />
          <input
            value={filtres.q}
            onChange={(e) => filtrer({ q: e.target.value })}
            placeholder="Référence ou procédure…"
            aria-label="Rechercher un dossier"
            className="block w-full rounded-xl border-0 bg-white py-2.5 pl-10 pr-3.5 text-sm shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-600"
          />
        </div>
      </div>

      {erreur ? (
        <Alerte type="erreur">{erreur.message}</Alerte>
      ) : chargement ? (
        <div className="space-y-4">{Array.from({ length: 4 }).map((_, i) => <Squelette key={i} className="h-36 rounded-2xl" />)}</div>
      ) : donnees.length === 0 ? (
        <div className="carte">
          <EtatVide
            icone={FolderOpen}
            titre={filtres.statut || filtres.q ? 'Aucun dossier dans cette catégorie' : 'Vous n’avez encore aucun dossier'}
            description="Choisissez une procédure dans le catalogue pour commencer votre première démarche en ligne."
            action={<Bouton vers="/procedures" icone={Plus}>Parcourir les procédures</Bouton>}
          />
        </div>
      ) : (
        <ul className="space-y-4">
          {donnees.map((d) => (
            <li key={d.id}>
              <Link
                to={`/espace/dossiers/${d.id}`}
                className={cx(
                  'carte group block p-5 transition hover:border-brand-200 hover:shadow-flottant sm:p-6',
                  d.statut === 'correction_demandee' && 'border-orange-200 ring-1 ring-orange-100',
                )}
              >
                <div className="flex flex-col gap-5 md:flex-row md:items-center">
                  <div className="flex min-w-0 flex-1 gap-4">
                    <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700 ring-1 ring-brand-100">
                      <IconeCategorie nom={d.procedure?.categorie?.icone} className="size-5" />
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-slate-500">{d.reference}</span>
                        <BadgeStatut statut={d.statut} />
                      </div>
                      <p className="mt-1 truncate text-lg font-semibold text-slate-900 group-hover:text-brand-800">{d.procedure?.titre}</p>
                      <p className="mt-0.5 text-sm text-slate-500">
                        {d.soumis_at ? `Soumis le ${dates.longue(d.soumis_at)}` : `Créé le ${dates.longue(d.created_at)}`}
                        {' · '}mis à jour {dates.relative(d.updated_at)}
                      </p>
                    </div>
                  </div>
                  <div className="md:w-80">
                    {d.statut === 'brouillon' ? (
                      <p className="text-sm text-slate-600">{STATUTS_DOSSIER.brouillon.citoyen}</p>
                    ) : (
                      <Frise statut={d.statut} compacte />
                    )}
                  </div>
                  <ArrowRight className="hidden size-5 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-brand-600 md:block" aria-hidden />
                </div>
                {d.statut === 'correction_demandee' && (
                  <p className="mt-4 rounded-lg bg-orange-50 px-3 py-2 text-sm font-medium text-orange-800">Action requise : l’administration vous demande de compléter ce dossier.</p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}

      {meta?.derniere_page > 1 && (
        <div className="carte mt-6 overflow-hidden">
          <Pagination meta={meta} onPage={allerPage} />
        </div>
      )}
    </>
  )
}
