import { BellOff, CheckCheck, ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Alerte, Bouton, EnTetePage, EtatVide, Pagination, Squelette } from '../../components/ui'
import { useToast } from '../../context/ToastContext'
import { useListe } from '../../hooks/useListe'
import { api } from '../../lib/api'
import { STATUTS_DOSSIER } from '../../lib/dossiers'
import { cx, dates } from '../../lib/utils'

/** RF-010 : centre de notifications (lu / non lu). */
export default function Notifications() {
  const navigate = useNavigate()
  const toast = useToast()
  const { donnees, setDonnees, meta, chargement, erreur, filtres, filtrer, allerPage } = useListe('/notifications', { non_lues: '' })

  const ouvrir = async (n) => {
    if (!n.lue) {
      await api(`/notifications/${n.id}/lire`, { method: 'PATCH' }).catch(() => {})
      window.dispatchEvent(new Event('sd:notifications'))
    }
    if (n.lien) navigate(n.lien)
    else setDonnees((l) => l.map((x) => (x.id === n.id ? { ...x, lue: true } : x)))
  }

  const toutLire = async () => {
    const r = await api('/notifications/tout-lire', { method: 'PATCH' })
    setDonnees((l) => l.map((x) => ({ ...x, lue: true })))
    window.dispatchEvent(new Event('sd:notifications'))
    toast.succes(r.message)
  }

  return (
    <>
      <EnTetePage
        surtitre="Mon espace"
        titre="Notifications"
        description="Chaque étape importante de vos dossiers fait l’objet d’une notification."
        actions={<Bouton variante="secondaire" icone={CheckCheck} onClick={toutLire}>Tout marquer comme lu</Bouton>}
      />

      <div className="mb-4 flex gap-1" role="tablist">
        {[['', 'Toutes'], ['1', 'Non lues']].map(([v, l]) => (
          <button
            key={v}
            role="tab"
            aria-selected={filtres.non_lues === v}
            onClick={() => filtrer({ non_lues: v })}
            className={cx('rounded-lg px-3.5 py-2 text-sm font-medium', filtres.non_lues === v ? 'bg-white text-brand-800 shadow-sm ring-1 ring-slate-200' : 'text-slate-600 hover:text-slate-900')}
          >
            {l}
          </button>
        ))}
      </div>

      <div className="carte overflow-hidden">
        {erreur ? (
          <div className="p-6"><Alerte type="erreur">{erreur.message}</Alerte></div>
        ) : chargement ? (
          <div className="divide-y divide-slate-100">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="p-5"><Squelette className="h-10" /></div>)}</div>
        ) : donnees.length === 0 ? (
          <EtatVide icone={BellOff} titre="Aucune notification" description={filtres.non_lues ? 'Vous avez tout lu.' : 'Vous serez notifié à chaque étape de vos démarches.'} />
        ) : (
          <ul className="divide-y divide-slate-100">
            {donnees.map((n) => (
              <li key={n.id}>
                <button onClick={() => ouvrir(n)} className={cx('flex w-full items-start gap-4 px-5 py-4 text-left transition hover:bg-slate-50 sm:px-6', !n.lue && 'bg-brand-50/40')}>
                  <span className={cx('mt-2 size-2.5 shrink-0 rounded-full', n.lue ? 'bg-slate-200' : STATUTS_DOSSIER[n.statut]?.point ?? 'bg-brand-500')} aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-baseline justify-between gap-x-4">
                      <span className={cx('text-sm', n.lue ? 'text-slate-700' : 'font-semibold text-slate-900')}>{n.titre}</span>
                      <time className="text-xs text-slate-400" dateTime={n.created_at}>{dates.heure(n.created_at)}</time>
                    </span>
                    <span className="mt-1 block text-sm text-slate-600">{n.message}</span>
                    {n.reference && <span className="mt-1.5 inline-block font-mono text-xs text-slate-400">{n.reference}</span>}
                  </span>
                  {n.lien && <ChevronRight className="mt-1 size-4 shrink-0 text-slate-300" aria-hidden />}
                  <span className="sr-only">{n.lue ? 'Lue' : 'Non lue'}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
        <Pagination meta={meta} onPage={allerPage} />
      </div>
    </>
  )
}
