import { BadgeCheck, ChevronRight, CreditCard, ExternalLink, Info, Lock, LoaderCircle, RefreshCw } from 'lucide-react'
import { useState } from 'react'
import logoOrangeMoney from '../../assets/paiement/orange-money.svg'
import logoWave from '../../assets/paiement/wave.png'
import { useToast } from '../../context/ToastContext'
import { api } from '../../lib/api'
import { cx, dates, nombre } from '../../lib/utils'
import { Bouton } from '../ui'

/** Les deux opérateurs proposés, avec leur logo et leurs couleurs (le code correspond à celui du serveur). */
const OPERATEURS = [
  {
    code: 'wave',
    libelle: 'Wave',
    logo: logoWave,
    tuile: 'bg-[#1dc8f1]', // le logo Wave est déjà une tuile bleue
    classe: 'bg-[#1dc8f1] text-slate-950 hover:bg-[#12b6de] focus-visible:ring-[#1dc8f1]',
  },
  {
    code: 'orange_money',
    libelle: 'Orange Money',
    logo: logoOrangeMoney,
    tuile: 'bg-white p-1.5',
    classe: 'bg-[#ff7900] text-white hover:bg-[#ec6f00] focus-visible:ring-[#ff7900]',
  },
]

const fcfa = (montant) => `${nombre(montant)} F CFA`

/**
 * Règlement des frais de la démarche, avant l'envoi (RG-019).
 * Le citoyen choisit Wave ou Orange Money, paie sur la page sécurisée de PayDunya, puis revient ici :
 * c'est le serveur qui confirme le paiement auprès de PayDunya, jamais le navigateur.
 */
export function BlocPaiement({ dossier, onVerifier, verification }) {
  const toast = useToast()
  const [operateur, setOperateur] = useState(null)
  const paiement = dossier.paiement

  if (paiement?.statut === 'paye') {
    return (
      <section className="carte overflow-hidden">
        <div className="flex flex-wrap items-center gap-4 bg-brand-50 p-5 sm:px-6">
          <span className="grid size-11 shrink-0 place-items-center rounded-full bg-brand-600 text-white"><BadgeCheck className="size-6" aria-hidden /></span>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-brand-900">Frais réglés : {fcfa(paiement.montant)}</p>
            <p className="text-sm text-brand-800">Payé par {paiement.operateur_libelle} le {dates.heure(paiement.paye_at)}.</p>
          </div>
          {paiement.url_recu && (
            <a href={paiement.url_recu} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-800">
              Reçu <ExternalLink className="size-3.5" aria-hidden />
            </a>
          )}
        </div>
      </section>
    )
  }

  // Paiement en ligne non activé : le citoyen est informé qu'il réglera au guichet.
  if (!dossier.paiement_en_ligne) {
    return (
      <section className="carte flex gap-3 p-5 sm:px-6">
        <Info className="mt-0.5 size-5 shrink-0 text-or-600" aria-hidden />
        <div className="text-sm">
          <p className="font-semibold text-slate-900">Frais de la démarche : {fcfa(dossier.frais)}</p>
          <p className="mt-1 text-slate-600">Ils se règlent au guichet de la mairie, au moment du retrait de votre document.</p>
        </div>
      </section>
    )
  }

  const payer = async (code) => {
    setOperateur(code)
    try {
      const r = await api(`/dossiers/${dossier.id}/paiements`, { method: 'POST', body: { operateur: code } })
      window.location.assign(r.data.url_paiement)
    } catch (err) {
      toast.erreur(err.message)
      setOperateur(null)
    }
  }

  const enAttente = paiement?.statut === 'en_attente'

  return (
    <section className="carte overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
        <h2 className="flex items-center gap-2.5 font-semibold text-slate-900">
          <CreditCard className="size-[1.1rem] text-brand-600" aria-hidden /> Frais de la démarche
        </h2>
        <span className="font-display text-lg font-semibold text-slate-900">{fcfa(dossier.frais)}</span>
      </div>
      <div className="p-5 sm:p-6">
        {enAttente ? (
          <div className="mb-5 rounded-xl bg-or-50 p-4 text-sm ring-1 ring-or-200">
            <p className="font-semibold text-slate-900">Paiement {paiement.operateur_libelle} en attente de confirmation</p>
            <p className="mt-1 text-slate-600">Si vous avez validé le paiement sur votre téléphone, vérifiez-le ici. Sinon, choisissez à nouveau votre moyen de paiement.</p>
            <Bouton taille="sm" variante="secondaire" icone={RefreshCw} className="mt-3" chargement={verification} onClick={() => onVerifier(paiement.id)}>
              J’ai payé, vérifier
            </Bouton>
          </div>
        ) : (
          <p className="mb-5 text-sm text-slate-600">
            Réglez les frais avant d’envoyer votre demande. Vous serez dirigé vers une page sécurisée pour valider le paiement sur votre téléphone.
          </p>
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          {OPERATEURS.map((o) => (
            <button
              key={o.code}
              type="button"
              disabled={operateur !== null}
              onClick={() => payer(o.code)}
              aria-label={`Payer avec ${o.libelle}`}
              className={cx(
                'group flex h-16 items-center gap-3.5 rounded-2xl pl-2.5 pr-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:translate-y-0 disabled:cursor-wait disabled:opacity-60 disabled:hover:translate-y-0',
                o.classe,
              )}
            >
              <span className={cx('grid size-11 shrink-0 place-items-center overflow-hidden rounded-xl shadow-sm ring-2 ring-white/80', o.tuile)}>
                <img src={o.logo} alt="" className="size-full object-contain" />
              </span>
              <span className="min-w-0 flex-1 leading-tight">
                <span className="block text-xs font-medium opacity-80">Payer avec</span>
                <span className="block truncate text-[1.05rem] font-semibold">{o.libelle}</span>
              </span>
              {operateur === o.code
                ? <LoaderCircle className="size-5 shrink-0 animate-spin" aria-hidden />
                : <ChevronRight className="size-5 shrink-0 opacity-70 transition group-hover:translate-x-0.5 group-hover:opacity-100" aria-hidden />}
            </button>
          ))}
        </div>
        <p className="mt-4 flex items-start gap-1.5 text-xs leading-4 text-slate-500">
          <Lock className="mt-px size-3.5 shrink-0" aria-hidden /> <span>Paiement sécurisé par PayDunya. Aucun code secret n’est saisi sur cette application.</span>
        </p>
      </div>
    </section>
  )
}

/** Ligne « Frais » des encadrés d'information (citoyen après l'envoi, agent). */
export function ResumePaiement({ dossier }) {
  if (!dossier.frais) return null
  const p = dossier.paiement
  const paye = p?.statut === 'paye'
  return (
    <div className="flex gap-3">
      <CreditCard className={cx('mt-0.5 size-4 shrink-0', paye ? 'text-brand-500' : 'text-slate-400')} aria-hidden />
      <div>
        <dt className="text-slate-500">Frais ({fcfa(dossier.frais)})</dt>
        <dd className={cx('font-medium', paye ? 'text-brand-700' : 'text-slate-900')}>
          {paye ? `Payé par ${p.operateur_libelle}${p.mode === 'test' ? ' (essai)' : ''}` : 'À régler au guichet'}
        </dd>
      </div>
    </div>
  )
}
