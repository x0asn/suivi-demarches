import { Bell, BellOff, CheckCheck } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { STATUTS_DOSSIER } from '../lib/dossiers'
import { cx, dates } from '../lib/utils'

const INTERVALLE = 30_000

/** M06 : cloche de notifications, actualisée régulièrement. */
export default function Cloche() {
  const [apercu, setApercu] = useState({ non_lues: 0, dernieres: [] })
  const [ouvert, setOuvert] = useState(false)
  const ref = useRef(null)
  const navigate = useNavigate()

  const charger = useCallback(() => api('/notifications/apercu').then((r) => setApercu(r.data)).catch(() => {}), [])

  useEffect(() => {
    charger()
    const minuteur = setInterval(() => document.visibilityState === 'visible' && charger(), INTERVALLE)
    window.addEventListener('sd:notifications', charger)
    return () => {
      clearInterval(minuteur)
      window.removeEventListener('sd:notifications', charger)
    }
  }, [charger])

  useEffect(() => {
    if (!ouvert) return
    const surClic = (e) => !ref.current?.contains(e.target) && setOuvert(false)
    const surTouche = (e) => e.key === 'Escape' && setOuvert(false)
    document.addEventListener('mousedown', surClic)
    document.addEventListener('keydown', surTouche)
    return () => {
      document.removeEventListener('mousedown', surClic)
      document.removeEventListener('keydown', surTouche)
    }
  }, [ouvert])

  const ouvrir = async (n) => {
    setOuvert(false)
    if (!n.lue) {
      await api(`/notifications/${n.id}/lire`, { method: 'PATCH' }).catch(() => {})
      charger()
    }
    if (n.lien) navigate(n.lien)
  }

  const toutLire = async () => {
    await api('/notifications/tout-lire', { method: 'PATCH' }).catch(() => {})
    charger()
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => {
          setOuvert((o) => !o)
          if (!ouvert) charger()
        }}
        className="relative rounded-xl p-2.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
        aria-label={`Notifications${apercu.non_lues ? ` : ${apercu.non_lues} non lue${apercu.non_lues > 1 ? 's' : ''}` : ''}`}
        aria-expanded={ouvert}
      >
        <Bell className="size-5" />
        {apercu.non_lues > 0 && (
          <span className="absolute right-1.5 top-1.5 flex min-w-[1.1rem] items-center justify-center rounded-full bg-red-500 px-1 text-[0.65rem] font-bold leading-[1.1rem] text-white ring-2 ring-white">
            {apercu.non_lues > 9 ? '9+' : apercu.non_lues}
          </span>
        )}
      </button>

      {ouvert && (
        <div className="absolute right-0 z-30 mt-2 w-[min(24rem,calc(100vw-2rem))] animate-apparition overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-flottant">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <p className="font-semibold text-slate-900">Notifications</p>
            {apercu.non_lues > 0 && (
              <button onClick={toutLire} className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 hover:text-brand-800">
                <CheckCheck className="size-3.5" aria-hidden /> Tout marquer comme lu
              </button>
            )}
          </div>
          {apercu.dernieres.length === 0 ? (
            <div className="flex flex-col items-center px-6 py-10 text-center text-sm text-slate-500">
              <BellOff className="mb-2 size-6 text-slate-300" aria-hidden /> Aucune notification pour le moment.
            </div>
          ) : (
            <ul className="max-h-96 divide-y divide-slate-100 overflow-y-auto">
              {apercu.dernieres.map((n) => (
                <li key={n.id}>
                  <button onClick={() => ouvrir(n)} className={cx('flex w-full gap-3 px-4 py-3 text-left transition hover:bg-slate-50', !n.lue && 'bg-brand-50/50')}>
                    <span className={cx('mt-1.5 size-2 shrink-0 rounded-full', n.lue ? 'bg-transparent' : STATUTS_DOSSIER[n.statut]?.point ?? 'bg-brand-500')} aria-hidden />
                    <span className="min-w-0 flex-1">
                      <span className={cx('block text-sm', n.lue ? 'text-slate-700' : 'font-semibold text-slate-900')}>{n.titre}</span>
                      <span className="mt-0.5 line-clamp-2 block text-xs text-slate-500">{n.message}</span>
                      <span className="mt-1 block text-[0.7rem] text-slate-400">{dates.relative(n.created_at)}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <Link to="/espace/notifications" onClick={() => setOuvert(false)} className="block border-t border-slate-100 py-3 text-center text-sm font-semibold text-brand-700 hover:bg-slate-50">
            Voir toutes les notifications
          </Link>
        </div>
      )}
    </div>
  )
}
