import { ChevronDown, MessageSquarePlus, MessageSquareWarning, Reply } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Alerte, Badge, Bouton, Champ, EnTetePage, EtatVide, Modale, Pagination, Selecteur, Squelette, ZoneTexte } from '../../components/ui'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { useListe } from '../../hooks/useListe'
import { api } from '../../lib/api'
import { cx, dates } from '../../lib/utils'

const STYLES = {
  ouverte: { classe: 'bg-indigo-50 text-indigo-700 ring-indigo-200', point: 'bg-indigo-500' },
  en_cours: { classe: 'bg-amber-50 text-amber-800 ring-amber-200', point: 'bg-amber-500' },
  resolue: { classe: 'bg-brand-50 text-brand-800 ring-brand-200', point: 'bg-brand-500' },
  rejetee: { classe: 'bg-slate-100 text-slate-700 ring-slate-200', point: 'bg-slate-400' },
}

function NouvelleReclamation({ options, dossierInitial, onFermer, onCree }) {
  const toast = useToast()
  const [champs, setChamps] = useState({ motif: dossierInitial ? 'retard' : '', sujet: '', description: '', dossier_id: dossierInitial ?? '' })
  const [erreur, setErreur] = useState(null)
  const [envoi, setEnvoi] = useState(false)
  const modifier = (e) => setChamps((c) => ({ ...c, [e.target.name]: e.target.value }))

  const envoyer = async (e) => {
    e.preventDefault()
    setEnvoi(true)
    setErreur(null)
    try {
      const r = await api('/reclamations', { method: 'POST', body: { ...champs, dossier_id: champs.dossier_id ? Number(champs.dossier_id) : null } })
      toast.succes('Vous serez notifié de la réponse.', r.message)
      onCree()
    } catch (err) {
      setErreur(err)
      setEnvoi(false)
    }
  }

  return (
    <Modale
      ouverte
      large
      onFermer={onFermer}
      titre="Nouvelle réclamation"
      description="Signalez un problème sur une démarche ou sur la plateforme. Une réponse vous sera apportée."
      pied={
        <>
          <Bouton variante="secondaire" type="button" onClick={onFermer}>Annuler</Bouton>
          <Bouton type="submit" form="form-reclamation" chargement={envoi}>Envoyer la réclamation</Bouton>
        </>
      }
    >
      <form id="form-reclamation" onSubmit={envoyer} className="grid gap-5 sm:grid-cols-2" noValidate>
        {erreur && erreur.status !== 422 && <Alerte type="erreur" className="sm:col-span-2">{erreur.message}</Alerte>}
        <Selecteur label="Motif" name="motif" value={champs.motif} onChange={modifier} erreur={erreur?.champ('motif')} obligatoire>
          <option value="">Choisir…</option>
          {Object.entries(options.motifs).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </Selecteur>
        <Selecteur label="Dossier concerné" name="dossier_id" value={champs.dossier_id} onChange={modifier} erreur={erreur?.champ('dossier_id')} aide="Facultatif">
          <option value="">Aucun dossier en particulier</option>
          {options.dossiers.map((d) => <option key={d.id} value={d.id}>{d.reference} — {d.procedure}</option>)}
        </Selecteur>
        <Champ className="sm:col-span-2" label="Sujet" name="sujet" value={champs.sujet} onChange={modifier} erreur={erreur?.champ('sujet')} obligatoire maxLength={255} />
        <ZoneTexte className="sm:col-span-2" label="Description" name="description" rows={5} value={champs.description} onChange={modifier} erreur={erreur?.champ('description')} obligatoire maxLength={3000} aide="Expliquez la situation et ce que vous attendez de l’administration." />
      </form>
    </Modale>
  )
}

function Traitement({ reclamation, onFermer, onTraite }) {
  const toast = useToast()
  const [statut, setStatut] = useState('resolue')
  const [reponse, setReponse] = useState(reclamation.reponse ?? '')
  const [erreur, setErreur] = useState(null)
  const [envoi, setEnvoi] = useState(false)

  const valider = async () => {
    setEnvoi(true)
    setErreur(null)
    try {
      const r = await api(`/reclamations/${reclamation.id}`, { method: 'PATCH', body: { statut, reponse } })
      toast.succes(r.message)
      onTraite(r.data)
    } catch (err) {
      setErreur(err.champ('reponse') ?? err.message)
      setEnvoi(false)
    }
  }

  return (
    <Modale
      ouverte
      large
      onFermer={onFermer}
      titre={`Répondre à ${reclamation.reference}`}
      description={reclamation.sujet}
      pied={
        <>
          <Bouton variante="secondaire" onClick={onFermer}>Annuler</Bouton>
          <Bouton chargement={envoi} onClick={valider} icone={Reply}>{statut === 'en_cours' ? 'Prendre en charge' : 'Envoyer la réponse'}</Bouton>
        </>
      }
    >
      <div className="space-y-5">
        <blockquote className="rounded-xl bg-slate-50 p-4 text-sm text-slate-700 ring-1 ring-slate-200">
          <p className="mb-1 text-xs font-semibold text-slate-500">{reclamation.citoyen?.nom_complet} · {dates.heure(reclamation.created_at)}</p>
          {reclamation.description}
        </blockquote>
        <Selecteur label="Décision" value={statut} onChange={(e) => setStatut(e.target.value)}>
          <option value="resolue">Résolue — une solution est apportée</option>
          <option value="rejetee">Non fondée — la réclamation est écartée</option>
          {reclamation.statut === 'ouverte' && <option value="en_cours">En cours d’examen — prendre en charge</option>}
        </Selecteur>
        <ZoneTexte label="Réponse au citoyen" rows={5} value={reponse} onChange={(e) => setReponse(e.target.value)} erreur={erreur} obligatoire={statut !== 'en_cours'} maxLength={3000} />
      </div>
    </Modale>
  )
}

/** RF-012 / UC-09 : création et suivi (citoyen), traitement (administration). */
export default function Reclamations() {
  const { utilisateur } = useAuth()
  const [params, setParams] = useSearchParams()
  const estCitoyen = utilisateur.role === 'citoyen'
  const { donnees, setDonnees, meta, chargement, erreur, filtres, filtrer, allerPage, recharger } = useListe('/reclamations', { statut: '' })
  const [options, setOptions] = useState(null)
  const [creation, setCreation] = useState(Boolean(params.get('dossier')))
  const [ouverte, setOuverte] = useState(null)
  const [aTraiter, setATraiter] = useState(null)

  useEffect(() => {
    api('/reclamations/options').then((r) => setOptions(r.data)).catch(() => {})
  }, [])

  return (
    <>
      <EnTetePage
        surtitre={estCitoyen ? 'Mon espace' : 'Relation usagers'}
        titre="Réclamations"
        description={estCitoyen ? 'Un problème avec une démarche ? Signalez-le : chaque réclamation reçoit une référence et une réponse.' : 'Réclamations des citoyens à examiner et à clôturer.'}
        actions={estCitoyen && <Bouton icone={MessageSquarePlus} onClick={() => setCreation(true)}>Nouvelle réclamation</Bouton>}
      />

      <div className="mb-4 flex flex-wrap gap-1" role="tablist">
        {[['', 'Toutes'], ['ouverte', 'Ouvertes'], ['en_cours', 'En cours'], ['resolue', 'Résolues'], ['rejetee', 'Non fondées']].map(([v, l]) => (
          <button key={v} role="tab" aria-selected={filtres.statut === v} onClick={() => filtrer({ statut: v })} className={cx('rounded-lg px-3.5 py-2 text-sm font-medium', filtres.statut === v ? 'bg-white text-brand-800 shadow-sm ring-1 ring-slate-200' : 'text-slate-600 hover:text-slate-900')}>{l}</button>
        ))}
      </div>

      <div className="carte overflow-hidden">
        {erreur ? (
          <div className="p-6"><Alerte type="erreur">{erreur.message}</Alerte></div>
        ) : chargement ? (
          <div className="divide-y divide-slate-100">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="p-5"><Squelette className="h-12" /></div>)}</div>
        ) : donnees.length === 0 ? (
          <EtatVide
            icone={MessageSquareWarning}
            titre="Aucune réclamation"
            description={estCitoyen ? 'Vous n’avez déposé aucune réclamation. Nous espérons que tout se passe bien !' : 'Aucune réclamation dans cette catégorie.'}
          />
        ) : (
          <ul className="divide-y divide-slate-100">
            {donnees.map((r) => {
              const deplie = ouverte === r.id
              return (
                <li key={r.id}>
                  <button onClick={() => setOuverte(deplie ? null : r.id)} className="flex w-full items-start gap-4 px-5 py-4 text-left transition hover:bg-slate-50 sm:px-6" aria-expanded={deplie}>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-slate-500">{r.reference}</span>
                        <Badge className={STYLES[r.statut].classe} point={STYLES[r.statut].point}>{r.statut_libelle}</Badge>
                        <span className="text-xs text-slate-500">{r.motif_libelle}</span>
                      </div>
                      <p className="mt-1 font-medium text-slate-900">{r.sujet}</p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {!estCitoyen && `${r.citoyen?.nom_complet} · `}déposée {dates.relative(r.created_at)}
                        {r.dossier && ` · dossier ${r.dossier.reference}`}
                      </p>
                    </div>
                    <ChevronDown className={cx('mt-1 size-5 shrink-0 text-slate-400 transition', deplie && 'rotate-180')} aria-hidden />
                  </button>
                  {deplie && (
                    <div className="space-y-4 px-5 pb-5 sm:px-6">
                      <p className="whitespace-pre-line rounded-xl bg-slate-50 p-4 text-sm leading-relaxed text-slate-700">{r.description}</p>
                      {r.dossier && (
                        <Link to={estCitoyen ? `/espace/dossiers/${r.dossier.id}` : `/espace/traitement/${r.dossier.id}`} className="inline-block text-sm font-semibold text-brand-700 hover:text-brand-800">
                          Voir le dossier {r.dossier.reference} ({r.dossier.procedure}) →
                        </Link>
                      )}
                      {r.reponse ? (
                        <div className="rounded-xl border-l-4 border-brand-500 bg-brand-50/60 p-4 text-sm">
                          <p className="font-semibold text-brand-900">Réponse de l’administration{r.traitee_at && ` · ${dates.longue(r.traitee_at)}`}</p>
                          <p className="mt-1 whitespace-pre-line text-slate-700">{r.reponse}</p>
                        </div>
                      ) : estCitoyen && (
                        <p className="text-sm text-slate-500">Votre réclamation est en cours d’examen. Vous serez notifié dès qu’une réponse sera apportée.</p>
                      )}
                      {r.peut_traiter && !['resolue', 'rejetee'].includes(r.statut) && (
                        <div>
                          <Bouton icone={Reply} onClick={() => setATraiter(r)}>Répondre</Bouton>
                        </div>
                      )}
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}
        <Pagination meta={meta} onPage={allerPage} />
      </div>

      {creation && options && (
        <NouvelleReclamation
          options={options}
          dossierInitial={params.get('dossier')}
          onFermer={() => {
            setCreation(false)
            if (params.get('dossier')) setParams({}, { replace: true })
          }}
          onCree={() => {
            setCreation(false)
            setParams({}, { replace: true })
            recharger()
          }}
        />
      )}
      {aTraiter && (
        <Traitement
          reclamation={aTraiter}
          onFermer={() => setATraiter(null)}
          onTraite={(r) => {
            setATraiter(null)
            setDonnees((l) => l.map((x) => (x.id === r.id ? r : x)))
          }}
        />
      )}
    </>
  )
}
