import { Check } from 'lucide-react'
import { cx } from '../lib/utils'

/** Indicateur de robustesse aligné sur les règles du serveur (8 caractères, lettres et chiffres). */
export default function ForceMotDePasse({ valeur }) {
  const criteres = [
    { ok: valeur.length >= 8, libelle: '8 caractères minimum' },
    { ok: /[a-zA-Z]/.test(valeur), libelle: 'Au moins une lettre' },
    { ok: /\d/.test(valeur), libelle: 'Au moins un chiffre' },
  ]
  const bonus = /[A-Z]/.test(valeur) && /[a-z]/.test(valeur) && /[^a-zA-Z0-9]/.test(valeur) && valeur.length >= 10
  const score = criteres.filter((c) => c.ok).length + (bonus ? 1 : 0)
  const niveaux = [
    { libelle: 'Trop faible', couleur: 'bg-red-500' },
    { libelle: 'Faible', couleur: 'bg-red-500' },
    { libelle: 'Moyen', couleur: 'bg-amber-500' },
    { libelle: 'Bon', couleur: 'bg-brand-500' },
    { libelle: 'Excellent', couleur: 'bg-brand-700' },
  ]
  const niveau = niveaux[score]

  if (!valeur) return null

  return (
    <div className="mt-2.5" aria-live="polite">
      <div className="flex gap-1.5">
        {[1, 2, 3, 4].map((i) => (
          <span key={i} className={cx('h-1.5 flex-1 rounded-full transition-colors', i <= score ? niveau.couleur : 'bg-slate-200')} />
        ))}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
        <span className="font-semibold text-slate-700">Robustesse : {niveau.libelle}</span>
        {criteres.map((c) => (
          <span key={c.libelle} className={cx('inline-flex items-center gap-1', c.ok ? 'text-brand-700' : 'text-slate-400')}>
            <Check className="size-3" aria-hidden /> {c.libelle}
          </span>
        ))}
      </div>
    </div>
  )
}
