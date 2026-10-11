import { cx } from '../../lib/utils'

export function EtatVide({ icone: Icone, titre, description, action, className }) {
  return (
    <div className={cx('flex flex-col items-center px-6 py-14 text-center', className)}>
      {Icone && (
        <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 ring-8 ring-brand-50/50">
          <Icone className="size-6" aria-hidden />
        </div>
      )}
      <h3 className="text-base font-semibold text-slate-900">{titre}</h3>
      {description && <p className="mt-1.5 max-w-sm text-sm text-slate-500">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
