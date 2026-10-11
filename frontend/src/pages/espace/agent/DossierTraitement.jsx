import {
  AlarmClock,
  ArrowLeft,
  CalendarDays,
  Check,
  FileCheck2,
  FileWarning,
  History,
  Mail,
  MapPin,
  MessagesSquare,
  Phone,
  ShieldAlert,
  UserRound,
  X,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ApercuDocument, BadgeDocument, BadgeStatut, BoutonApercu, FilEchanges, Frise, Historique, IconeFichier } from '../../../components/dossiers'
import { Alerte, Avatar, Bouton, Chargement, Modale, ZoneTexte } from '../../../components/ui'
import { useAuth } from '../../../context/AuthContext'
import { useToast } from '../../../context/ToastContext'
import { api } from '../../../lib/api'
import { ACTIONS_AGENT } from '../../../lib/dossiers'
import { libelleDelai } from '../../../lib/icones'
import { cx, dates, tailleFichier } from '../../../lib/utils'
import NonTrouve from '../../erreurs/NonTrouve'

const DECISIONS_PIECE = {
  accepte: { libelle: 'Accepter', icone: Check, classe: 'text-brand-700 hover:bg-brand-50 ring-brand-200' },
  a_corriger: { libelle: 'À corriger', icone: FileWarning, classe: 'text-orange-700 hover:bg-orange-50 ring-orange-200' },
  refuse: { libelle: 'Refuser', icone: X, classe: 'text-red-700 hover:bg-red-50 ring-red-200' },
}

/** Fenêtre de décision sur une pièce (RF-014). Le motif est obligatoire si la pièce n'est pas acceptée (RG-007). */
function DecisionPiece({ document, decision, onFermer, onFait }) {
  const toast = useToast()
  const [motif, setMotif] = useState('')
  const [erreur, setErreur] = useState(null)
  const [envoi, setEnvoi] = useState(false)

  const valider = async () => {
    setEnvoi(true)
    setErreur(null)
    try {
      const r = await api(`/documents/${document.id}/verification`, { method: 'PATCH', body: { statut: decision, motif } })
      toast.succes(r.message)
      onFait()
    } catch (err) {
      setErreur(err.champ('motif') ?? err.message)
      setEnvoi(false)
    }
  }

  return (
    <Modale
      ouverte
      onFermer={onFermer}
      titre={decision === 'refuse' ? 'Refuser la pièce' : 'Demander une correction de la pièce'}
      description={document.piece_libelle}
      pied={
        <>
          <Bouton variante="secondaire" onClick={onFermer}>Annuler</Bouton>
          <Bouton variante={decision === 'refuse' ? 'danger' : 'primaire'} chargement={envoi} onClick={valider}>Confirmer</Bouton>
        </>
      }
    >
      <ZoneTexte
        label="Motif communiqué au citoyen"
        obligatoire
        rows={3}
        value={motif}
        onChange={(e) => setMotif(e.target.value)}
        erreur={erreur}
        placeholder={decision === 'refuse' ? 'Ex. : ce document n’est pas un justificatif de domicile.' : 'Ex. : la copie est illisible, merci d’en joindre une version nette.'}
        aide="Soyez précis : le citoyen doit savoir exactement quoi corriger."
      />
    </Modale>
  )
}

/** Fenêtre de changement de statut (RF-015). */
function ChangementStatut({ dossier, cible, onFermer, onFait }) {
  const toast = useToast()
  const action = ACTIONS_AGENT[cible]
  const [commentaire, setCommentaire] = useState('')
  const [erreur, setErreur] = useState(null)
  const [envoi, setEnvoi] = useState(false)
  const nonAcceptees = dossier.documents.filter((d) => d.statut !== 'accepte').length

  const valider = async () => {
    setEnvoi(true)
    setErreur(null)
    try {
      const r = await api(`/dossiers/${dossier.id}/status`, { method: 'PATCH', body: { statut: cible, commentaire: commentaire || null } })
      toast.succes('Le citoyen a été notifié.', r.message)
      onFait(r.data)
    } catch (err) {
      setErreur(err.champ('commentaire') ?? err.champ('statut') ?? err.message)
      setEnvoi(false)
    }
  }

  return (
    <Modale
      ouverte
      onFermer={onFermer}
      titre={`${action.libelle} — ${dossier.reference}`}
      description={action.description}
      pied={
        <>
          <Bouton variante="secondaire" onClick={onFermer}>Annuler</Bouton>
          <Bouton variante={cible === 'rejete' ? 'danger' : 'primaire'} chargement={envoi} onClick={valider}>{action.libelle}</Bouton>
        </>
      }
    >
      <div className="space-y-4">
        {cible === 'en_traitement' && nonAcceptees > 0 && (
          <Alerte type="alerte">
            {nonAcceptees} pièce{nonAcceptees > 1 ? 's n’ont' : ' n’a'} pas encore été acceptée{nonAcceptees > 1 ? 's' : ''}. Vérifiez les pièces avant de déclarer le dossier recevable.
          </Alerte>
        )}
        <ZoneTexte
          label={cible === 'rejete' ? 'Motif du rejet' : cible === 'correction_demandee' ? 'Ce que le citoyen doit corriger' : 'Commentaire (facultatif)'}
          obligatoire={Boolean(action.commentaire)}
          rows={3}
          value={commentaire}
          onChange={(e) => setCommentaire(e.target.value)}
          erreur={erreur}
          aide="Ce commentaire apparaît dans l’historique du dossier et dans la notification envoyée au citoyen."
        />
      </div>
    </Modale>
  )
}

/** UC-06 : traitement d'un dossier par un agent habilité. */
export default function DossierTraitement() {
  const { id } = useParams()
  const { utilisateur } = useAuth()
  const [dossier, setDossier] = useState(null)
  const [introuvable, setIntrouvable] = useState(false)
  const [apercu, setApercu] = useState(null)
  const [decision, setDecision] = useState(null) // { document, decision }
  const [transition, setTransition] = useState(null)
  const toast = useToast()

  const charger = useCallback(() => api(`/dossiers/${id}`).then((r) => setDossier(r.data)).catch(() => setIntrouvable(true)), [id])

  useEffect(() => {
    charger()
  }, [charger])

  if (introuvable) return <NonTrouve integre titre="Dossier inaccessible" message="Ce dossier n'existe pas ou ne relève pas de votre périmètre." retour="/espace/traitement" libelleRetour="Retour à la file" />
  if (!dossier) return <Chargement texte="Chargement du dossier…" />

  const peutTraiter = dossier.permissions?.traiter
  const peutVerifier = peutTraiter && ['en_verification', 'en_traitement'].includes(dossier.statut)
  const pieces = dossier.procedure.pieces ?? []
  const documentPour = (pieceId) => dossier.documents.find((d) => d.piece_requise_id === pieceId)

  const accepterRapide = async (document) => {
    try {
      const r = await api(`/documents/${document.id}/verification`, { method: 'PATCH', body: { statut: 'accepte' } })
      toast.succes(r.message)
      setApercu(null)
      charger()
    } catch (err) {
      toast.erreur(err.message)
    }
  }

  return (
    <>
      <Link to="/espace/traitement" className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800">
        <ArrowLeft className="size-4" aria-hidden /> {utilisateur.role === 'agent' ? 'File de travail' : 'Tous les dossiers'}
      </Link>

      {/* En-tête + actions */}
      <div className="carte mb-6 overflow-hidden">
        <div className="flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="rounded-lg bg-slate-900 px-2.5 py-1 font-mono text-xs font-semibold tracking-wide text-white">{dossier.reference}</span>
              <BadgeStatut statut={dossier.statut} />
              {dossier.en_retard && (
                <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700 ring-1 ring-red-200">
                  <AlarmClock className="size-3.5" aria-hidden /> Délai de {libelleDelai(dossier.procedure.delai_jours)} dépassé
                </span>
              )}
            </div>
            <h1 className="titre-display mt-3 text-2xl font-semibold sm:text-3xl">{dossier.procedure.titre}</h1>
            <p className="mt-1 text-sm text-slate-500">
              Déposé par <b className="font-medium text-slate-700">{dossier.citoyen.nom_complet}</b> · {dossier.soumis_at ? `soumis ${dates.relative(dossier.soumis_at)}` : 'non soumis'}
            </p>
          </div>

          {peutTraiter && dossier.permissions.transitions.length > 0 && (
            <div className="flex flex-wrap gap-2 lg:justify-end">
              {dossier.permissions.transitions.map((cible) => {
                const a = ACTIONS_AGENT[cible]
                return (
                  <Bouton key={cible} variante={a.variante} onClick={() => setTransition(cible)}>{a.libelle}</Bouton>
                )
              })}
            </div>
          )}
        </div>
        <div className="border-t border-slate-100 bg-slate-50/60 px-4 py-5 sm:px-8"><Frise statut={dossier.statut} /></div>
      </div>

      {!peutTraiter && (
        <Alerte type="info" className="mb-6" titre="Consultation seule">
          {utilisateur.role === 'agent' ? 'Ce dossier n’est plus modifiable.' : 'Le traitement des dossiers est réservé aux agents du service compétent.'}
        </Alerte>
      )}
      {dossier.statut === 'soumis' && peutTraiter && (
        <Alerte type="info" className="mb-6" titre="Nouveau dossier">Prenez le dossier en charge pour pouvoir contrôler les pièces.</Alerte>
      )}
      {dossier.statut === 'correction_demandee' && (
        <Alerte type="alerte" className="mb-6" titre="En attente du citoyen">Le citoyen a été invité à corriger son dossier. Vous serez notifié dès qu’il l’aura renvoyé.</Alerte>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="min-w-0 space-y-6">
          {/* Demande */}
          <section className="carte p-5 sm:p-6">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Objet de la demande</h2>
            <p className="mt-2 text-slate-900">{dossier.motif || '—'}</p>
            {dossier.precisions && <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">{dossier.precisions}</p>}
          </section>

          {/* Contrôle des pièces */}
          <section className="carte">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
              <h2 className="flex items-center gap-2.5 font-semibold text-slate-900"><FileCheck2 className="size-[1.1rem] text-brand-600" aria-hidden /> Contrôle des pièces</h2>
              <span className="text-sm text-slate-500">{dossier.documents.filter((d) => d.statut === 'accepte').length}/{dossier.documents.length} acceptées</span>
            </div>
            <ul className="divide-y divide-slate-100">
              {pieces.map((p) => {
                const d = documentPour(p.id)
                return (
                  <li key={p.id} className="px-5 py-4 sm:px-6">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900">
                          {p.libelle} {!p.obligatoire && <span className="text-xs font-normal text-slate-500">(facultative)</span>}
                        </p>
                        {p.description && <p className="text-sm text-slate-500">{p.description}</p>}
                      </div>
                      {d ? <BadgeDocument statut={d.statut} /> : <span className="text-sm text-slate-400">Non fournie</span>}
                    </div>
                    {d && (
                      <div className="mt-3 flex flex-wrap items-center gap-3 rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200/70">
                        <span className="flex size-10 items-center justify-center rounded-lg bg-white text-slate-600 ring-1 ring-slate-200"><IconeFichier mime={d.mime} className="size-5" /></span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-slate-800">{d.nom_original}</p>
                          <p className="text-xs text-slate-500">
                            {tailleFichier(d.taille)} · déposée {dates.relative(d.created_at)}
                            {d.verificateur && ` · vérifiée par ${d.verificateur}`}
                          </p>
                        </div>
                        <BoutonApercu onClick={() => setApercu({ ...d, piece_libelle: p.libelle })} />
                        {peutVerifier && (
                          <div className="flex gap-1.5">
                            {Object.entries(DECISIONS_PIECE).map(([cle, { libelle, icone: Icone, classe }]) =>
                              d.statut === cle ? null : (
                                <button
                                  key={cle}
                                  onClick={() => (cle === 'accepte' ? accepterRapide(d) : setDecision({ document: { ...d, piece_libelle: p.libelle }, decision: cle }))}
                                  className={cx('inline-flex items-center gap-1 rounded-lg bg-white px-2.5 py-1.5 text-xs font-semibold ring-1 transition', classe)}
                                >
                                  <Icone className="size-3.5" aria-hidden /> {libelle}
                                </button>
                              ),
                            )}
                          </div>
                        )}
                      </div>
                    )}
                    {d?.motif && <p className="mt-2 text-sm text-orange-800"><b className="font-semibold">Motif :</b> {d.motif}</p>}
                  </li>
                )
              })}
            </ul>
          </section>

          {/* Échanges */}
          <section className="carte">
            <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
              <h2 className="flex items-center gap-2.5 font-semibold text-slate-900"><MessagesSquare className="size-[1.1rem] text-brand-600" aria-hidden /> Observations et échanges</h2>
            </div>
            <div className="p-5 sm:p-6">
              <FilEchanges
                agent
                dossier={dossier}
                observations={dossier.observations}
                moi={utilisateur}
                onAjout={(o) => setDossier((x) => ({ ...x, observations: [...x.observations, o] }))}
              />
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="carte p-5">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Demandeur</h2>
            <div className="mt-4 flex items-center gap-3">
              <Avatar prenom={dossier.citoyen.prenom} nom={dossier.citoyen.nom} />
              <div className="min-w-0">
                <p className="font-semibold text-slate-900">{dossier.citoyen.nom_complet}</p>
                <p className="text-xs text-slate-500">Citoyen</p>
              </div>
            </div>
            <ul className="mt-4 space-y-2 text-sm text-slate-600">
              {dossier.citoyen.email && <li className="flex items-center gap-2"><Mail className="size-4 text-slate-400" aria-hidden /><span className="truncate">{dossier.citoyen.email}</span></li>}
              {dossier.citoyen.telephone && <li className="flex items-center gap-2"><Phone className="size-4 text-slate-400" aria-hidden />{dossier.citoyen.telephone}</li>}
              {dossier.citoyen.region && <li className="flex items-center gap-2"><MapPin className="size-4 text-slate-400" aria-hidden />{[dossier.citoyen.commune, dossier.citoyen.region].filter(Boolean).join(', ')}</li>}
            </ul>
          </section>

          <section className="carte p-5">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Dossier</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex gap-3"><CalendarDays className="mt-0.5 size-4 shrink-0 text-slate-400" aria-hidden /><div><dt className="text-slate-500">Soumis le</dt><dd className="font-medium text-slate-900">{dates.heure(dossier.soumis_at)}</dd></div></div>
              <div className="flex gap-3"><AlarmClock className="mt-0.5 size-4 shrink-0 text-slate-400" aria-hidden /><div><dt className="text-slate-500">Délai indicatif</dt><dd className="font-medium text-slate-900">{libelleDelai(dossier.procedure.delai_jours)} · {dossier.jours_depuis_soumission ?? 0} j écoulé{dossier.jours_depuis_soumission > 1 ? 's' : ''}</dd></div></div>
              <div className="flex gap-3"><UserRound className="mt-0.5 size-4 shrink-0 text-slate-400" aria-hidden /><div><dt className="text-slate-500">Agent en charge</dt><dd className="font-medium text-slate-900">{dossier.agent?.nom_complet ?? 'Non attribué'}</dd></div></div>
              {dossier.motif_decision && <div className="flex gap-3"><ShieldAlert className="mt-0.5 size-4 shrink-0 text-red-400" aria-hidden /><div><dt className="text-slate-500">Motif de décision</dt><dd className="font-medium text-slate-900">{dossier.motif_decision}</dd></div></div>}
            </dl>
          </section>

          <section className="carte p-5">
            <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500"><History className="size-4" aria-hidden /> Historique</h2>
            <div className="mt-5"><Historique historique={dossier.historique} /></div>
          </section>
        </aside>
      </div>

      {apercu && (
        <ApercuDocument
          document={apercu}
          onFermer={() => setApercu(null)}
          actions={peutVerifier && apercu.statut !== 'accepte' && (
            <>
              <Bouton variante="danger-doux" onClick={() => { setDecision({ document: apercu, decision: 'a_corriger' }); setApercu(null) }}>À corriger</Bouton>
              <Bouton icone={Check} onClick={() => accepterRapide(apercu)}>Accepter la pièce</Bouton>
            </>
          )}
        />
      )}
      {decision && (
        <DecisionPiece
          document={decision.document}
          decision={decision.decision}
          onFermer={() => setDecision(null)}
          onFait={() => {
            setDecision(null)
            charger()
          }}
        />
      )}
      {transition && (
        <ChangementStatut
          dossier={dossier}
          cible={transition}
          onFermer={() => setTransition(null)}
          onFait={(d) => {
            setTransition(null)
            setDossier(d)
          }}
        />
      )}
    </>
  )
}
