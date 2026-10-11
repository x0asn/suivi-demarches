import { AlertTriangle, Check, X } from 'lucide-react'
import { etapesFrise } from '../../lib/dossiers'
import { cx } from '../../lib/utils'

/** Frise d'avancement du dossier (RF-009 : statut lisible en un coup d'œil). */
export function Frise({ statut, compacte = false }) {
  const etapes = etapesFrise(statut)
  return (
    <ol className="flex items-start" aria-label="Avancement du dossier">
      {etapes.map((e, i) => (
        <li key={e.cle} className="relative flex flex-1 flex-col items-center text-center">
          {i > 0 && (
            <span
              className={cx('absolute right-1/2 top-3.5 h-0.5 w-full', e.etat === 'avenir' ? 'bg-slate-200' : 'bg-brand-500')}
              aria-hidden
            />
          )}
          <span
            className={cx(
              'relative z-10 flex items-center justify-center rounded-full ring-4 ring-white transition',
              compacte ? 'size-6' : 'size-7',
              e.etat === 'fait' && 'bg-brand-600 text-white',
              e.etat === 'actuel' && !e.alerte && 'bg-white ring-brand-100 outline outline-2 outline-brand-600',
              e.etat === 'actuel' && e.alerte && 'bg-orange-500 text-white ring-orange-100',
              e.etat === 'avenir' && 'bg-slate-100 text-slate-400',
            )}
          >
            {e.etat === 'fait' && <Check className="size-3.5" aria-hidden />}
            {e.etat === 'actuel' && !e.alerte && <span className="size-2.5 animate-pulse rounded-full bg-brand-600" />}
            {e.etat === 'actuel' && e.alerte && (statut === 'rejete' ? <X className="size-3.5" aria-hidden /> : <AlertTriangle className="size-3.5" aria-hidden />)}
          </span>
          {!compacte && (
            <span className={cx('mt-2 px-0.5 text-[0.62rem] font-medium leading-tight sm:text-xs', e.etat === 'avenir' ? 'text-slate-400' : 'text-slate-700', e.etat === 'actuel' && 'font-semibold text-slate-900')}>
              {e.libelle}
            </span>
          )}
          <span className="sr-only">{e.etat === 'fait' ? 'terminée' : e.etat === 'actuel' ? 'en cours' : 'à venir'}</span>
        </li>
      ))}
    </ol>
  )
}
