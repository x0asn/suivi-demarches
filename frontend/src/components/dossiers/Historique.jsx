import { STATUTS_DOSSIER } from '../../lib/dossiers'
import { cx, dates } from '../../lib/utils'

/** RG-005 : historique daté des changements de statut. */
export function Historique({ historique }) {
  return (
    <ol className="relative space-y-6">
      {[...historique].reverse().map((h, i, liste) => {
        const s = STATUTS_DOSSIER[h.nouveau_statut]
        return (
          <li key={h.id} className="relative flex gap-4">
            {i < liste.length - 1 && <span className="absolute left-[0.6875rem] top-7 h-[calc(100%+0.5rem)] w-px bg-slate-200" aria-hidden />}
            <span className={cx('relative mt-1 size-[1.375rem] shrink-0 rounded-full ring-4 ring-white', s?.point)} aria-hidden />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                <p className="font-semibold text-slate-900">{h.nouveau_statut_libelle}</p>
                <time className="text-xs text-slate-500" dateTime={h.created_at}>{dates.heure(h.created_at)}</time>
              </div>
              {h.auteur && (
                <p className="text-sm text-slate-500">
                  par {h.auteur.nom_complet}
                  {h.auteur.role !== 'citoyen' && ' · Administration'}
                </p>
              )}
              {h.commentaire && <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700 ring-1 ring-slate-200/70">« {h.commentaire} »</p>}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
