import {
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Circle,
  FileCheck2,
  History,
  Landmark,
  MessagesSquare,
  PartyPopper,
  Save,
  Send,
  Trash2,
  UserRound,
  XCircle,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ApercuDocument, BadgeDocument, BadgeStatut, BoutonApercu, FilEchanges, Frise, Historique } from '../../../components/dossiers/Elements'
import PieceDepot from '../../../components/dossiers/PieceDepot'
import { Bouton, Chargement, Modale, ZoneTexte } from '../../../components/ui'
import { useAuth } from '../../../context/AuthContext'
import { useToast } from '../../../context/ToastContext'
import { api } from '../../../lib/api'
import { STATUTS_DOSSIER } from '../../../lib/dossiers'
import { libelleDelai } from '../../../lib/icones'
import { cx, dates } from '../../../lib/utils'
import NonTrouve from '../../erreurs/NonTrouve'

function Carte({ titre, icone: Icone, children, actions, className }) {
  return (
    <section className={cx('carte', className)}>
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
        <h2 className="flex items-center gap-2.5 font-semibold text-slate-900">
          <Icone className="size-[1.1rem] text-brand-600" aria-hidden /> {titre}
        </h2>
        {actions}
      </div>
      {children}
    </section>
  )
}

/** Bandeau qui explique au citoyen où en est son dossier et ce qu'il doit faire. */
function Bandeau({ dossier }) {
  const derniereCorrection = [...dossier.historique].reverse().find((h) => h.nouveau_statut === 'correction_demandee')

  if (dossier.statut === 'correction_demandee') {
    return (
      <div className="rounded-2xl bg-orange-50 p-5 ring-1 ring-orange-200">
        <p className="flex items-center gap-2 font-semibold text-orange-900"><AlertTriangle className="size-5" aria-hidden /> Action requise de votre part</p>
        {derniereCorrection?.commentaire && <p className="mt-2 text-orange-900">« {derniereCorrection.commentaire} »</p>}
        <p className="mt-2 text-sm text-orange-800">Remplacez les pièces signalées ci-dessous, puis renvoyez votre dossier.</p>
      </div>
    )
  }
  if (dossier.statut === 'rejete' || dossier.statut === 'cloture') {
    return (
      <div className="rounded-2xl bg-red-50 p-5 ring-1 ring-red-200">
        <p className="flex items-center gap-2 font-semibold text-red-900"><XCircle className="size-5" aria-hidden /> Votre demande n’a pas pu aboutir</p>
        {dossier.motif_decision && <p className="mt-2 text-red-900"><b className="font-semibold">Motif :</b> {dossier.motif_decision}</p>}
        <p className="mt-2 text-sm text-red-800">
          Vous pouvez déposer une nouvelle demande, ou{' '}
          <Link to={`/espace/reclamations?dossier=${dossier.id}`} className="font-semibold underline underline-offset-2">faire une réclamation</Link> si vous contestez cette décision.
        </p>
      </div>
    )
  }
  if (dossier.statut === 'valide' || dossier.statut === 'termine') {
    return (
      <div className="rounded-2xl bg-brand-50 p-5 ring-1 ring-brand-200">
        <p className="flex items-center gap-2 font-semibold text-brand-900"><PartyPopper className="size-5" aria-hidden /> {dossier.statut === 'termine' ? 'Démarche terminée' : 'Bonne nouvelle : votre demande est validée'}</p>
        <p className="mt-2 text-sm text-brand-800">{STATUTS_DOSSIER[dossier.statut].citoyen} Décision rendue le {dates.longue(dossier.decision_at)}.</p>
      </div>
    )
  }
  return null
}

/** UC-03 / UC-04 / UC-05 : dépôt, suivi et correction d'un dossier par le citoyen. */
export default function DossierCitoyen() {
  const { id } = useParams()
  const { utilisateur } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const [dossier, setDossier] = useState(null)
  const [introuvable, setIntrouvable] = useState(false)
  const [champs, setChamps] = useState({ motif: '', precisions: '' })
  const [sauvegarde, setSauvegarde] = useState(false)
  const [confirmation, setConfirmation] = useState(null) // 'soumettre' | 'supprimer'
  const [action, setAction] = useState(false)
  const [erreurSoumission, setErreurSoumission] = useState(null)
  const [apercu, setApercu] = useState(null)

  const charger = useCallback(async () => {
    try {
      const r = await api(`/dossiers/${id}`)
      setDossier(r.data)
      return r.data
    } catch {
      setIntrouvable(true)
    }
  }, [id])

  useEffect(() => {
    api(`/dossiers/${id}`)
      .then((r) => {
        setDossier(r.data)
        setChamps({ motif: r.data.motif ?? '', precisions: r.data.precisions ?? '' })
      })
      .catch(() => setIntrouvable(true))
  }, [id])

  if (introuvable) return <NonTrouve integre titre="Dossier introuvable" message="Ce dossier n'existe pas ou ne vous appartient pas." retour="/espace/dossiers" libelleRetour="Mes dossiers" />
  if (!dossier) return <Chargement texte="Chargement du dossier…" />

  const modifiable = dossier.permissions?.modifier
  const pieces = dossier.procedure.pieces ?? []
  const documentPour = (pieceId) => dossier.documents.find((d) => d.piece_requise_id === pieceId)
  const obligatoires = pieces.filter((p) => p.obligatoire)
  const fournies = obligatoires.filter((p) => !dossier.pieces_manquantes.includes(p.id)).length
  const champsModifies = champs.motif !== (dossier.motif ?? '') || champs.precisions !== (dossier.precisions ?? '')
  const pret = fournies === obligatoires.length && champs.motif.trim().length > 0

  const enregistrer = async () => {
    setSauvegarde(true)
    try {
      const r = await api(`/dossiers/${id}`, { method: 'PATCH', body: champs })
      setDossier(r.data)
      toast.succes(r.message)
    } catch (err) {
      toast.erreur(err.message)
    } finally {
      setSauvegarde(false)
    }
  }

  const soumettre = async () => {
    setAction(true)
    setErreurSoumission(null)
    try {
      if (champsModifies) await api(`/dossiers/${id}`, { method: 'PATCH', body: champs })
      const r = await api(`/dossiers/${id}/soumettre`, { method: 'POST' })
      setDossier(r.data)
      toast.succes('Vous serez notifié à chaque étape du traitement.', r.message)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      setErreurSoumission(Object.values(err.errors ?? {}).flat().join(' ') || err.message)
    } finally {
      setAction(false)
      setConfirmation(null)
    }
  }

  const supprimer = async () => {
    setAction(true)
    try {
      const r = await api(`/dossiers/${id}`, { method: 'DELETE' })
      toast.info(r.message)
      navigate('/espace/dossiers', { replace: true })
    } catch (err) {
      toast.erreur(err.message)
      setAction(false)
      setConfirmation(null)
    }
  }

  const statut = STATUTS_DOSSIER[dossier.statut]

  return (
    <>
      <Link to="/espace/dossiers" className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800">
        <ArrowLeft className="size-4" aria-hidden /> Mes dossiers
      </Link>

      {/* En-tête */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="rounded-lg bg-slate-900 px-2.5 py-1 font-mono text-xs font-semibold tracking-wide text-white">{dossier.reference}</span>
            <BadgeStatut statut={dossier.statut} />
          </div>
          <h1 className="titre-display mt-3 text-2xl font-semibold sm:text-3xl">{dossier.procedure.titre}</h1>
          <p className="mt-1.5 text-sm text-slate-500">{statut.citoyen}</p>
        </div>
        {dossier.permissions?.supprimer && (
          <Bouton variante="danger-doux" icone={Trash2} onClick={() => setConfirmation('supprimer')}>Supprimer le brouillon</Bouton>
        )}
      </div>

      {dossier.statut !== 'brouillon' && (
        <div className="carte mb-6 px-4 py-6 sm:px-8">
          <Frise statut={dossier.statut} />
        </div>
      )}

      <div className="mb-6"><Bandeau dossier={dossier} /></div>

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="min-w-0 space-y-6">
          {/* Votre demande */}
          <Carte
            titre="Votre demande"
            icone={UserRound}
            actions={modifiable && champsModifies && (
              <Bouton taille="sm" variante="secondaire" icone={Save} chargement={sauvegarde} onClick={enregistrer}>Enregistrer</Bouton>
            )}
          >
            <div className="space-y-4 p-5 sm:p-6">
              {modifiable ? (
                <>
                  <ZoneTexte label="Objet de la demande" obligatoire rows={2} value={champs.motif} onChange={(e) => setChamps((c) => ({ ...c, motif: e.target.value }))} maxLength={2000} />
                  <ZoneTexte label="Précisions" rows={2} value={champs.precisions} onChange={(e) => setChamps((c) => ({ ...c, precisions: e.target.value }))} maxLength={2000} />
                </>
              ) : (
                <dl className="space-y-3 text-sm">
                  <div><dt className="text-slate-500">Objet de la demande</dt><dd className="mt-0.5 text-slate-900">{dossier.motif || '—'}</dd></div>
                  {dossier.precisions && <div><dt className="text-slate-500">Précisions</dt><dd className="mt-0.5 text-slate-900">{dossier.precisions}</dd></div>}
                </dl>
              )}
            </div>
          </Carte>

          {/* Pièces justificatives */}
          <Carte
            titre="Pièces justificatives"
            icone={FileCheck2}
            actions={<span className={cx('text-sm font-medium', fournies === obligatoires.length ? 'text-brand-700' : 'text-slate-500')}>{fournies}/{obligatoires.length} obligatoires</span>}
          >
            <ul className="divide-y divide-slate-100">
              {modifiable
                ? pieces.map((p) => (
                    <PieceDepot key={p.id} dossierId={dossier.id} piece={p} document={documentPour(p.id)} modifiable onChange={charger} onApercu={setApercu} />
                  ))
                : pieces.filter((p) => documentPour(p.id)).map((p) => {
                    const d = documentPour(p.id)
                    return (
                      <li key={p.id} className="flex flex-wrap items-center gap-3 px-5 py-4 sm:px-6">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-slate-900">{p.libelle}</p>
                          <p className="truncate text-sm text-slate-500">{d.nom_original}</p>
                          {d.motif && <p className="mt-1 text-sm text-orange-800">{d.motif}</p>}
                        </div>
                        <BadgeDocument statut={d.statut} />
                        <BoutonApercu onClick={() => setApercu({ ...d, piece_libelle: p.libelle })} />
                      </li>
                    )
                  })}
            </ul>
          </Carte>

          {/* Soumission */}
          {modifiable && (
            <section className="overflow-hidden rounded-2xl bg-brand-900 text-white shadow-flottant">
              <div className="motif-points p-6">
                <h2 className="font-display text-xl font-semibold">{dossier.statut === 'correction_demandee' ? 'Renvoyer mon dossier corrigé' : 'Vérifier et envoyer ma demande'}</h2>
                <ul className="mt-4 space-y-2 text-sm">
                  {[
                    [champs.motif.trim().length > 0, 'Objet de la demande renseigné'],
                    [fournies === obligatoires.length, `Pièces obligatoires fournies (${fournies}/${obligatoires.length})`],
                  ].map(([ok, texte]) => (
                    <li key={texte} className="flex items-center gap-2">
                      {ok ? <CheckCircle2 className="size-4 text-or-300" aria-hidden /> : <Circle className="size-4 text-brand-300" aria-hidden />}
                      <span className={ok ? 'text-white' : 'text-brand-200'}>{texte}</span>
                    </li>
                  ))}
                </ul>
                {erreurSoumission && <p className="mt-4 rounded-lg bg-red-500/20 px-3 py-2 text-sm text-red-100" role="alert">{erreurSoumission}</p>}
                <Bouton variante="or" taille="lg" className="mt-6 w-full sm:w-auto" icone={Send} disabled={!pret} onClick={() => setConfirmation('soumettre')}>
                  {dossier.statut === 'correction_demandee' ? 'Renvoyer le dossier' : 'Soumettre ma demande'}
                </Bouton>
                {!pret && <p className="mt-3 text-xs text-brand-200">Complétez les éléments ci-dessus pour pouvoir envoyer votre demande.</p>}
              </div>
            </section>
          )}

          {/* Échanges */}
          {dossier.statut !== 'brouillon' && (
            <Carte titre="Échanges avec l’administration" icone={MessagesSquare}>
              <div className="p-5 sm:p-6">
                <FilEchanges
                  dossier={dossier}
                  observations={dossier.observations}
                  moi={utilisateur}
                  onAjout={(o) => setDossier((d) => ({ ...d, observations: [...d.observations, o] }))}
                />
              </div>
            </Carte>
          )}
        </div>

        {/* Colonne latérale */}
        <aside className="space-y-6">
          <section className="carte p-5">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Informations</h2>
            <dl className="mt-4 space-y-3.5 text-sm">
              <div className="flex gap-3"><CalendarDays className="mt-0.5 size-4 shrink-0 text-slate-400" aria-hidden /><div><dt className="text-slate-500">Créé le</dt><dd className="font-medium text-slate-900">{dates.longue(dossier.created_at)}</dd></div></div>
              {dossier.soumis_at && <div className="flex gap-3"><Send className="mt-0.5 size-4 shrink-0 text-slate-400" aria-hidden /><div><dt className="text-slate-500">Soumis le</dt><dd className="font-medium text-slate-900">{dates.heure(dossier.soumis_at)}</dd></div></div>}
              <div className="flex gap-3"><History className="mt-0.5 size-4 shrink-0 text-slate-400" aria-hidden /><div><dt className="text-slate-500">Délai indicatif</dt><dd className="font-medium text-slate-900">{libelleDelai(dossier.procedure.delai_jours)}</dd></div></div>
              {dossier.service && <div className="flex gap-3"><Landmark className="mt-0.5 size-4 shrink-0 text-slate-400" aria-hidden /><div><dt className="text-slate-500">Service</dt><dd className="font-medium text-slate-900">{dossier.service.nom}</dd></div></div>}
              {dossier.agent && <div className="flex gap-3"><UserRound className="mt-0.5 size-4 shrink-0 text-slate-400" aria-hidden /><div><dt className="text-slate-500">Agent en charge</dt><dd className="font-medium text-slate-900">{dossier.agent.nom_complet}</dd></div></div>}
            </dl>
          </section>

          <section className="carte p-5">
            <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500"><History className="size-4" aria-hidden /> Historique</h2>
            <div className="mt-5"><Historique historique={dossier.historique} /></div>
          </section>
        </aside>
      </div>

      {apercu && <ApercuDocument document={apercu} onFermer={() => setApercu(null)} />}

      {confirmation === 'soumettre' && (
        <Modale
          ouverte
          onFermer={() => setConfirmation(null)}
          titre={dossier.statut === 'correction_demandee' ? 'Renvoyer votre dossier ?' : 'Soumettre votre demande ?'}
          pied={
            <>
              <Bouton variante="secondaire" onClick={() => setConfirmation(null)}>Relire encore</Bouton>
              <Bouton icone={Send} chargement={action} onClick={soumettre}>Confirmer l’envoi</Bouton>
            </>
          }
        >
          <p className="text-sm text-slate-600">
            Votre dossier <b className="font-semibold text-slate-900">{dossier.reference}</b> sera transmis au service compétent.
            Vous ne pourrez plus le modifier, sauf si l’agent vous demande une correction.
          </p>
        </Modale>
      )}

      {confirmation === 'supprimer' && (
        <Modale
          ouverte
          onFermer={() => setConfirmation(null)}
          titre="Supprimer ce brouillon ?"
          pied={
            <>
              <Bouton variante="secondaire" onClick={() => setConfirmation(null)}>Annuler</Bouton>
              <Bouton variante="danger" chargement={action} onClick={supprimer}>Supprimer définitivement</Bouton>
            </>
          }
        >
          <p className="text-sm text-slate-600">Le brouillon et les pièces déjà déposées seront définitivement supprimés.</p>
        </Modale>
      )}
    </>
  )
}
