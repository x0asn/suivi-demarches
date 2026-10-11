/** En-tête de page de l'espace connecté. */
export function EnTetePage({ surtitre, titre, description, actions }) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {surtitre && <p className="mb-1 text-sm font-medium text-brand-700">{surtitre}</p>}
        <h1 className="titre-display text-2xl font-semibold sm:text-3xl">{titre}</h1>
        {description && <p className="mt-2 max-w-2xl text-sm text-slate-500 sm:text-base">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </div>
  )
}
