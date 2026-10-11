import { COULEURS_SENEGAL } from '../lib/senegal'
import { cx } from '../lib/utils'

/** Petit drapeau du Sénégal en SVG (les drapeaux emoji ne s'affichent pas sous Windows). */
export function DrapeauSenegal({ className }) {
  return (
    <svg viewBox="0 0 30 20" className={cx('shrink-0 overflow-hidden rounded-[3px] shadow-sm ring-1 ring-black/10', className)} aria-hidden>
      <rect width="10" height="20" fill={COULEURS_SENEGAL.vert} />
      <rect x="10" width="10" height="20" fill={COULEURS_SENEGAL.or} />
      <rect x="20" width="10" height="20" fill={COULEURS_SENEGAL.rouge} />
      <polygon
        fill={COULEURS_SENEGAL.vert}
        points="15,6.2 15.98,9.18 19.12,9.18 16.57,11.02 17.55,14 15,12.16 12.45,14 13.43,11.02 10.88,9.18 14.02,9.18"
      />
    </svg>
  )
}

/** Fin liseré aux couleurs nationales. */
export function LisereSenegal({ className }) {
  return (
    <div className={cx('flex h-1 w-full', className)} aria-hidden>
      <span className="flex-1" style={{ background: COULEURS_SENEGAL.vert }} />
      <span className="flex-1" style={{ background: COULEURS_SENEGAL.or }} />
      <span className="flex-1" style={{ background: COULEURS_SENEGAL.rouge }} />
    </div>
  )
}
