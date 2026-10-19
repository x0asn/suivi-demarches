import { cx } from '../../lib/utils'

/**
 * Filtres d'une liste (Tous, En cours…).
 * Téléphone : une grille de boutons, tous visibles et alignés (le premier prend toute la largeur
 * si leur nombre est impair). Ordinateur : une rangée d'onglets.
 */
export function Filtres({ options, valeur, onChange, label, className }) {
  const impair = options.length % 2 === 1

  return (
    <div className={className}>
      <div className="grid grid-cols-2 gap-2 sm:hidden" role="group" aria-label={label}>
        {options.map((o, i) => {
          const actif = valeur === o.valeur
          return (
            <button
              key={o.valeur}
              type="button"
              aria-pressed={actif}
              onClick={() => onChange(o.valeur)}
              className={cx(
                'flex h-11 items-center justify-center rounded-xl px-3 text-sm font-medium ring-1 ring-inset transition active:scale-[0.97]',
                impair && i === 0 && 'col-span-2',
                actif ? 'bg-brand-800 text-white ring-brand-800' : 'bg-white text-slate-700 ring-slate-200',
              )}
            >
              <span className="truncate">{o.libelle}</span>
            </button>
          )
        })}
      </div>
      <div className="hidden flex-wrap gap-1 sm:flex" role="tablist" aria-label={label}>
        {options.map((o) => (
          <button
            key={o.valeur}
            type="button"
            role="tab"
            aria-selected={valeur === o.valeur}
            onClick={() => onChange(o.valeur)}
            className={cx(
              'shrink-0 rounded-lg px-3.5 py-2 text-sm font-medium transition',
              valeur === o.valeur ? 'bg-white text-brand-800 shadow-sm ring-1 ring-slate-200' : 'text-slate-600 hover:text-slate-900',
            )}
          >
            {o.libelle}
          </button>
        ))}
      </div>
    </div>
  )
}
