import { cx, initiales } from '../../lib/utils'

export function Avatar({ prenom, nom, taille = 'md', className }) {
  const tailles = { sm: 'size-8 text-xs', md: 'size-10 text-sm', lg: 'size-16 text-xl' }
  return (
    <span
      className={cx(
        'inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-600 to-brand-800 font-semibold text-white ring-2 ring-white',
        tailles[taille],
        className,
      )}
      aria-hidden
    >
      {initiales(prenom, nom)}
    </span>
  )
}
