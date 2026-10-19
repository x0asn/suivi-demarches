import { CheckCircle2, Info, TriangleAlert, X, XCircle } from 'lucide-react'
import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { cx } from '../lib/utils'

const ToastContext = createContext(null)

const STYLES = {
  succes: { icone: CheckCircle2, classe: 'text-brand-600' },
  erreur: { icone: XCircle, classe: 'text-red-600' },
  info: { icone: Info, classe: 'text-sky-600' },
  alerte: { icone: TriangleAlert, classe: 'text-or-600' },
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const fermer = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), [])

  const afficher = useCallback(
    (type, message, titre) => {
      // Pas de crypto.randomUUID : il n'existe pas sur une adresse http (téléphone sur le wifi).
      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`
      setToasts((t) => [...t.slice(-3), { id, type, message, titre }])
      setTimeout(() => fermer(id), 5000)
    },
    [fermer],
  )

  const api = useMemo(
    () => ({
      succes: (m, t) => afficher('succes', m, t),
      erreur: (m, t) => afficher('erreur', m, t),
      info: (m, t) => afficher('info', m, t),
      alerte: (m, t) => afficher('alerte', m, t),
    }),
    [afficher],
  )

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-20 z-[1200] flex flex-col items-center gap-2 p-4 sm:items-end sm:p-6"
      >
        {toasts.map(({ id, type, message, titre }) => {
          const { icone: Icone, classe } = STYLES[type]
          return (
            <div
              key={id}
              role="status"
              className="pointer-events-auto flex w-full max-w-sm animate-apparition items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-flottant"
            >
              <Icone className={cx('mt-0.5 size-5 shrink-0', classe)} aria-hidden />
              <div className="min-w-0 flex-1 text-sm">
                {titre && <p className="font-semibold text-slate-900">{titre}</p>}
                <p className="text-slate-600">{message}</p>
              </div>
              <button
                onClick={() => fermer(id)}
                className="rounded-md p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                aria-label="Fermer la notification"
              >
                <X className="size-4" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  return useContext(ToastContext)
}
