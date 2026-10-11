import { Building2, MapPin, Pencil, Plus } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { IconeService } from '../../../components/Icones'
import { Alerte, Badge, Bouton, Champ, EnTetePage, Modale, Selecteur, Squelette } from '../../../components/ui'
import { useToast } from '../../../context/ToastContext'
import { api } from '../../../lib/api'

const TYPES = { mairie: 'Mairie', tribunal: 'Tribunal', ministere: 'Ministère', prefecture: 'Préfecture', police: 'Police', agence: 'Agence publique' }
const VIDE = { nom: '', type: 'mairie', adresse: '', commune: '', region: '', telephone: '', email: '', horaires: '', latitude: '', longitude: '', actif: true }

function Formulaire({ service, onFermer, onEnregistre }) {
  const toast = useToast()
  const [champs, setChamps] = useState(service ? { ...VIDE, ...Object.fromEntries(Object.entries(service).map(([k, v]) => [k, v ?? ''])) } : VIDE)
  const [erreur, setErreur] = useState(null)
  const [envoi, setEnvoi] = useState(false)
  const modifier = (e) => setChamps((c) => ({ ...c, [e.target.name]: e.target.value }))

  const enregistrer = async (e) => {
    e.preventDefault()
    setEnvoi(true)
    setErreur(null)
    const corps = Object.fromEntries(Object.keys(VIDE).map((k) => [k, champs[k] === '' ? null : champs[k]]))
    corps.actif = Boolean(champs.actif)
    try {
      const r = service ? await api(`/admin/services/${service.id}`, { method: 'PUT', body: corps }) : await api('/admin/services', { method: 'POST', body: corps })
      toast.succes(r.message)
      onEnregistre()
    } catch (err) {
      setErreur(err)
      setEnvoi(false)
    }
  }

  const err = (k) => erreur?.champ(k)

  return (
    <Modale
      ouverte
      large
      onFermer={onFermer}
      titre={service ? 'Modifier le service' : 'Nouveau service'}
      description="Les coordonnées GPS permettent d'afficher le service sur la carte publique."
      pied={<><Bouton variante="secondaire" type="button" onClick={onFermer}>Annuler</Bouton><Bouton type="submit" form="form-service" chargement={envoi}>Enregistrer</Bouton></>}
    >
      <form id="form-service" onSubmit={enregistrer} className="grid gap-4 sm:grid-cols-2" noValidate>
        {erreur && erreur.status !== 422 && <Alerte type="erreur" className="sm:col-span-2">{erreur.message}</Alerte>}
        <Champ className="sm:col-span-2" label="Nom" name="nom" value={champs.nom} onChange={modifier} erreur={err('nom')} obligatoire />
        <Selecteur label="Type" name="type" value={champs.type} onChange={modifier} erreur={err('type')} obligatoire>
          {Object.entries(TYPES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </Selecteur>
        <Champ label="Région" name="region" value={champs.region} onChange={modifier} erreur={err('region')} />
        <Champ label="Commune" name="commune" value={champs.commune} onChange={modifier} erreur={err('commune')} />
        <Champ label="Adresse" name="adresse" value={champs.adresse} onChange={modifier} erreur={err('adresse')} />
        <Champ label="Téléphone" name="telephone" value={champs.telephone} onChange={modifier} erreur={err('telephone')} />
        <Champ label="E-mail" name="email" type="email" value={champs.email} onChange={modifier} erreur={err('email')} />
        <Champ className="sm:col-span-2" label="Horaires" name="horaires" value={champs.horaires} onChange={modifier} placeholder="Lun–Ven 8h–16h" erreur={err('horaires')} />
        <Champ label="Latitude" name="latitude" type="number" step="0.0001" value={champs.latitude} onChange={modifier} erreur={err('latitude')} />
        <Champ label="Longitude" name="longitude" type="number" step="0.0001" value={champs.longitude} onChange={modifier} erreur={err('longitude')} />
        <label className="flex items-center gap-2.5 text-sm text-slate-700 sm:col-span-2">
          <input type="checkbox" checked={Boolean(champs.actif)} onChange={(e) => setChamps((c) => ({ ...c, actif: e.target.checked }))} className="size-4 rounded accent-brand-700" />
          Service actif (visible dans la recherche publique)
        </label>
      </form>
    </Modale>
  )
}

/** M10 : référentiel des services administratifs. */
export default function ServicesAdmin() {
  const [services, setServices] = useState(null)
  const [edition, setEdition] = useState(null)

  const charger = useCallback(() => api('/admin/services').then((r) => setServices(r.data)), [])
  useEffect(() => {
    charger()
  }, [charger])

  return (
    <>
      <EnTetePage
        surtitre="Administration"
        titre="Services"
        description="Points d'accueil administratifs : coordonnées, horaires et localisation. Les agents sont rattachés à un service."
        actions={<Bouton icone={Plus} onClick={() => setEdition('nouveau')}>Nouveau service</Bouton>}
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {!services
          ? Array.from({ length: 6 }).map((_, i) => <Squelette key={i} className="h-44 rounded-2xl" />)
          : services.map((s) => (
              <article key={s.id} className="carte flex flex-col p-5">
                <div className="flex items-start justify-between gap-3">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700"><IconeService type={s.type} className="size-5" /></span>
                  <div className="flex items-center gap-1">
                    {!s.actif && <Badge className="bg-slate-100 text-slate-600 ring-slate-200">Inactif</Badge>}
                    <button onClick={() => setEdition(s)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label={`Modifier ${s.nom}`}><Pencil className="size-4" /></button>
                  </div>
                </div>
                <h2 className="mt-3 font-semibold text-slate-900">{s.nom}</h2>
                <p className="text-sm text-slate-500">{s.type_libelle}</p>
                <p className="mt-3 flex items-center gap-1.5 text-sm text-slate-600"><MapPin className="size-4 text-slate-400" aria-hidden /> {[s.commune, s.region].filter(Boolean).join(' · ') || '—'}</p>
                <div className="mt-auto flex gap-4 border-t border-slate-100 pt-3 text-xs text-slate-500">
                  <span><b className="font-semibold text-slate-800">{s.procedures_count}</b> procédure{s.procedures_count > 1 ? 's' : ''}</span>
                  <span><b className="font-semibold text-slate-800">{s.agents_count}</b> agent{s.agents_count > 1 ? 's' : ''}</span>
                  {s.latitude ? <span className="text-brand-700">Géolocalisé</span> : <span className="flex items-center gap-1"><Building2 className="size-3" aria-hidden /> Sans coordonnées</span>}
                </div>
              </article>
            ))}
      </div>
      {edition && (
        <Formulaire
          service={edition === 'nouveau' ? null : edition}
          onFermer={() => setEdition(null)}
          onEnregistre={() => {
            setEdition(null)
            charger()
          }}
        />
      )}
    </>
  )
}
