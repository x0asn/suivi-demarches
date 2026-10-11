import { BellRing, Mail, Pencil } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Badge, Bouton, Champ, EnTetePage, Modale, Squelette, ZoneTexte } from '../../../components/ui'
import { useToast } from '../../../context/ToastContext'
import { api } from '../../../lib/api'
import { cx } from '../../../lib/utils'

const VARIABLES = ['{reference}', '{procedure}', '{statut}', '{commentaire}', '{piece}', '{citoyen}']

function Edition({ modele, onFermer, onEnregistre }) {
  const toast = useToast()
  const [champs, setChamps] = useState({ titre: modele.titre, message: modele.message, actif: modele.actif, email: modele.email })
  const [erreur, setErreur] = useState(null)
  const [envoi, setEnvoi] = useState(false)

  const exemple = (t) =>
    t.replace(/\{(\w+)\}/g, (_, v) => ({ reference: 'DEM-2026-00042', procedure: 'Certificat de résidence', statut: 'Validé', commentaire: 'Pièce illisible', piece: "Pièce d'identité", citoyen: 'Fatou Ba' })[v] ?? `{${v}}`)

  const enregistrer = async () => {
    setEnvoi(true)
    setErreur(null)
    try {
      const r = await api(`/admin/modeles-notification/${modele.id}`, { method: 'PUT', body: champs })
      toast.succes(r.message)
      onEnregistre(r.data)
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
      titre={modele.libelle}
      description={`Événement : ${modele.evenement}`}
      pied={<><Bouton variante="secondaire" onClick={onFermer}>Annuler</Bouton><Bouton chargement={envoi} onClick={enregistrer}>Enregistrer</Bouton></>}
    >
      <div className="space-y-4">
        <Champ label="Titre" value={champs.titre} onChange={(e) => setChamps((c) => ({ ...c, titre: e.target.value }))} erreur={erreur?.champ('titre')} obligatoire />
        <ZoneTexte label="Message" rows={3} value={champs.message} onChange={(e) => setChamps((c) => ({ ...c, message: e.target.value }))} erreur={erreur?.champ('message')} obligatoire />
        <p className="text-xs text-slate-500">Variables disponibles : {VARIABLES.map((v) => <code key={v} className="mr-1 rounded bg-slate-100 px-1 py-0.5 text-slate-700">{v}</code>)}</p>
        <div className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Aperçu</p>
          <p className="mt-2 text-sm font-semibold text-slate-900">{exemple(champs.titre)}</p>
          <p className="text-sm text-slate-600">{exemple(champs.message)}</p>
        </div>
        <div className="flex flex-wrap gap-6 text-sm text-slate-700">
          <label className="flex items-center gap-2"><input type="checkbox" checked={champs.actif} onChange={(e) => setChamps((c) => ({ ...c, actif: e.target.checked }))} className="size-4 rounded accent-brand-700" /> Notification active</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={champs.email} onChange={(e) => setChamps((c) => ({ ...c, email: e.target.checked }))} className="size-4 rounded accent-brand-700" /> Envoyer aussi par e-mail</label>
        </div>
      </div>
    </Modale>
  )
}

/** RF-020 : modèles et règles de notification configurables. */
export default function ModelesNotification() {
  const [modeles, setModeles] = useState(null)
  const [edition, setEdition] = useState(null)
  const charger = useCallback(() => api('/admin/modeles-notification').then((r) => setModeles(r.data)), [])
  useEffect(() => {
    charger()
  }, [charger])

  const groupes = modeles && [
    ['Citoyens', modeles.filter((m) => !m.evenement.startsWith('agent.') && !m.evenement.startsWith('admin.'))],
    ['Administration', modeles.filter((m) => m.evenement.startsWith('agent.') || m.evenement.startsWith('admin.'))],
  ]

  return (
    <>
      <EnTetePage surtitre="Administration" titre="Notifications" description="Choisissez quels événements déclenchent une notification, et rédigez leur texte." />
      {!modeles ? (
        <Squelette className="h-96 rounded-2xl" />
      ) : (
        <div className="space-y-6">
          {groupes.map(([titre, liste]) => (
            <section key={titre} className="carte overflow-hidden">
              <h2 className="border-b border-slate-100 px-6 py-4 font-semibold text-slate-900">Notifications destinées aux {titre.toLowerCase()}</h2>
              <ul className="divide-y divide-slate-100">
                {liste.map((m) => (
                  <li key={m.id} className={cx('flex items-start gap-4 px-6 py-4', !m.actif && 'opacity-60')}>
                    <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700"><BellRing className="size-4" aria-hidden /></span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-slate-900">{m.libelle}</p>
                        {m.actif ? <Badge className="bg-brand-50 text-brand-800 ring-brand-200" point="bg-brand-500">Active</Badge> : <Badge className="bg-slate-100 text-slate-600 ring-slate-200">Désactivée</Badge>}
                        {m.email && <Badge className="bg-sky-50 text-sky-800 ring-sky-200"><Mail className="size-3" aria-hidden /> E-mail</Badge>}
                      </div>
                      <p className="mt-1 text-sm text-slate-600"><b className="font-medium text-slate-800">{m.titre}</b> — {m.message}</p>
                    </div>
                    <button onClick={() => setEdition(m)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label={`Modifier ${m.libelle}`}><Pencil className="size-4" /></button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
      {edition && <Edition modele={edition} onFermer={() => setEdition(null)} onEnregistre={(m) => { setEdition(null); setModeles((l) => l.map((x) => (x.id === m.id ? m : x))) }} />}
    </>
  )
}
