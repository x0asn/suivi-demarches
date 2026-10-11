import { ChevronLeft, ChevronRight } from 'lucide-react'

export function Pagination({ meta, onPage }) {
  if (!meta || meta.derniere_page <= 1) return null
  const debut = (meta.page - 1) * meta.par_page + 1
  const fin = Math.min(meta.page * meta.par_page, meta.total)
  return (
    <nav className="flex items-center justify-between gap-4 border-t border-slate-100 px-4 py-3 sm:px-6" aria-label="Pagination">
      <p className="text-sm text-slate-500">
        <span className="font-medium text-slate-700">{debut}</span>–<span className="font-medium text-slate-700">{fin}</span> sur{' '}
        <span className="font-medium text-slate-700">{meta.total}</span>
      </p>
      <div className="flex gap-2">
        <button
          onClick={() => onPage(meta.page - 1)}
          disabled={meta.page <= 1}
          className="inline-flex h-9 items-center gap-1 rounded-lg px-3 text-sm font-medium text-slate-700 ring-1 ring-slate-300 ring-inset hover:bg-slate-50 disabled:opacity-40"
        >
          <ChevronLeft className="size-4" aria-hidden /> Précédent
        </button>
        <button
          onClick={() => onPage(meta.page + 1)}
          disabled={meta.page >= meta.derniere_page}
          className="inline-flex h-9 items-center gap-1 rounded-lg px-3 text-sm font-medium text-slate-700 ring-1 ring-slate-300 ring-inset hover:bg-slate-50 disabled:opacity-40"
        >
          Suivant <ChevronRight className="size-4" aria-hidden />
        </button>
      </div>
    </nav>
  )
}
