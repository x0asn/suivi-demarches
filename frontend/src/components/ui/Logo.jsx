import { Link } from 'react-router-dom'
import { cx } from '../../lib/utils'

export function Logo({ clair = false, compact = false, className }) {
  return (
    <Link to="/" className={cx('group inline-flex items-center gap-2.5', className)} aria-label="Suivi Démarches — accueil">
      <svg viewBox="0 0 64 64" className="size-9 shrink-0 transition-transform group-hover:-rotate-3" aria-hidden>
        <rect width="64" height="64" rx="16" fill={clair ? '#ffffff' : '#154e38'} />
        <path
          d="M17 44 L28 33 L36 39 L47 24"
          fill="none"
          stroke={clair ? '#154e38' : '#ffffff'}
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="17" cy="44" r="4.5" fill="#d4a12f" />
        <circle cx="28" cy="33" r="4" fill={clair ? '#154e38' : '#ffffff'} />
        <circle cx="36" cy="39" r="4" fill={clair ? '#154e38' : '#ffffff'} />
        <circle cx="47" cy="24" r="5.5" fill="#d4a12f" />
      </svg>
      {!compact && (
        <span className="whitespace-nowrap leading-none">
          <span className={cx('block font-display text-[1.2rem] font-semibold tracking-tight', clair ? 'text-white' : 'text-slate-900')}>
            Suivi Démarches
          </span>
          <span className={cx('mt-0.5 block text-[0.65rem] font-medium tracking-[0.14em] uppercase', clair ? 'text-brand-200' : 'text-brand-700')}>
            Guichet numérique
          </span>
        </span>
      )}
    </Link>
  )
}
