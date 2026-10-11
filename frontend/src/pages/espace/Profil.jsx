import { KeyRound, LockKeyhole, Mail, MapPin, Phone, Save, UserRound } from 'lucide-react'
import { useState } from 'react'
import ForceMotDePasse from '../../components/auth/ForceMotDePasse'
import { Avatar, Badge, Bouton, Champ, ChampMotDePasse, EnTetePage, Selecteur } from '../../components/ui'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { api } from '../../lib/api'
import { localisation, REGIONS } from '../../lib/regions'
import { ROLES } from '../../lib/roles'
import { cx, dates } from '../../lib/utils'

function Informations() {
  const { utilisateur, setUtilisateur } = useAuth()
  const toast = useToast()
  const [champs, setChamps] = useState({
    prenom: utilisateur.prenom,
    nom: utilisateur.nom,
    email: utilisateur.email,
    telephone: utilisateur.telephone ?? '',
    region: utilisateur.region ?? '',
    commune: utilisateur.commune ?? '',
  })
  const [erreur, setErreur] = useState(null)
  const [envoi, setEnvoi] = useState(false)

  const modifier = (e) => setChamps((c) => ({ ...c, [e.target.name]: e.target.value }))

  const soumettre = async (e) => {
    e.preventDefault()
    setErreur(null)
    setEnvoi(true)
    try {
      const r = await api('/profile', { method: 'PATCH', body: { ...champs, telephone: champs.telephone || null, region: champs.region || null, commune: champs.commune || null } })
      setUtilisateur(r.data)
      toast.succes(r.message)
    } catch (err) {
      setErreur(err)
      if (err.status !== 422) toast.erreur(err.message)
    } finally {
      setEnvoi(false)
    }
  }

  return (
    <form onSubmit={soumettre} className="carte" noValidate>
      <div className="border-b border-slate-100 px-6 py-5">
        <h2 className="font-semibold text-slate-900">Informations personnelles</h2>
        <p className="mt-1 text-sm text-slate-500">Elles permettent à l'administration de vous identifier et de vous joindre.</p>
      </div>
      <div className="grid gap-5 px-6 py-6 sm:grid-cols-2">
        <Champ label="Prénom" name="prenom" icone={UserRound} value={champs.prenom} onChange={modifier} erreur={erreur?.champ('prenom')} obligatoire />
        <Champ label="Nom" name="nom" value={champs.nom} onChange={modifier} erreur={erreur?.champ('nom')} obligatoire />
        <Champ label="Adresse e-mail" name="email" type="email" icone={Mail} value={champs.email} onChange={modifier} erreur={erreur?.champ('email')} obligatoire />
        <Champ label="Téléphone" name="telephone" type="tel" icone={Phone} placeholder="+221 77 123 45 67" value={champs.telephone} onChange={modifier} erreur={erreur?.champ('telephone')} />
        <Selecteur label="Région" name="region" value={champs.region} onChange={modifier} erreur={erreur?.champ('region')} obligatoire={utilisateur.role === 'citoyen'}>
          <option value="">{utilisateur.role === 'citoyen' ? 'Choisir votre région…' : 'Non renseignée'}</option>
          {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
        </Selecteur>
        <Champ label="Commune" name="commune" icone={MapPin} value={champs.commune} onChange={modifier} erreur={erreur?.champ('commune')} maxLength={100} />
      </div>
      <div className="flex justify-end rounded-b-2xl border-t border-slate-100 bg-slate-50/60 px-6 py-4">
        <Bouton type="submit" chargement={envoi} icone={Save}>
          Enregistrer
        </Bouton>
      </div>
    </form>
  )
}

function MotDePasse() {
  const toast = useToast()
  const vide = { current_password: '', password: '', password_confirmation: '' }
  const [champs, setChamps] = useState(vide)
  const [erreur, setErreur] = useState(null)
  const [envoi, setEnvoi] = useState(false)

  const modifier = (e) => setChamps((c) => ({ ...c, [e.target.name]: e.target.value }))

  const soumettre = async (e) => {
    e.preventDefault()
    setErreur(null)
    setEnvoi(true)
    try {
      const r = await api('/profile/password', { method: 'PUT', body: champs })
      setChamps(vide)
      toast.succes('Vos autres sessions ont été fermées par sécurité.', r.message)
    } catch (err) {
      setErreur(err)
      if (err.status !== 422) toast.erreur(err.message)
    } finally {
      setEnvoi(false)
    }
  }

  return (
    <form onSubmit={soumettre} className="carte" noValidate>
      <div className="border-b border-slate-100 px-6 py-5">
        <h2 className="font-semibold text-slate-900">Mot de passe</h2>
        <p className="mt-1 text-sm text-slate-500">Choisissez un mot de passe que vous n'utilisez sur aucun autre site.</p>
      </div>
      <div className="grid gap-5 px-6 py-6">
        <ChampMotDePasse label="Mot de passe actuel" name="current_password" autoComplete="current-password" icone={LockKeyhole} value={champs.current_password} onChange={modifier} erreur={erreur?.champ('current_password')} obligatoire />
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <ChampMotDePasse label="Nouveau mot de passe" name="password" autoComplete="new-password" icone={KeyRound} value={champs.password} onChange={modifier} erreur={erreur?.champ('password')} obligatoire />
            <ForceMotDePasse valeur={champs.password} />
          </div>
          <ChampMotDePasse label="Confirmation" name="password_confirmation" autoComplete="new-password" icone={KeyRound} value={champs.password_confirmation} onChange={modifier} obligatoire />
        </div>
      </div>
      <div className="flex justify-end rounded-b-2xl border-t border-slate-100 bg-slate-50/60 px-6 py-4">
        <Bouton type="submit" chargement={envoi} icone={KeyRound}>
          Modifier le mot de passe
        </Bouton>
      </div>
    </form>
  )
}

/** RF-003 : gestion du profil. */
export default function Profil() {
  const { utilisateur } = useAuth()
  const role = ROLES[utilisateur.role]

  return (
    <>
      <EnTetePage surtitre="Mon compte" titre="Mon profil" description="Gérez vos informations personnelles et la sécurité de votre compte." />

      <div className="grid gap-8 lg:grid-cols-[18rem_1fr]">
        <aside className="carte h-fit p-6 text-center">
          <Avatar prenom={utilisateur.prenom} nom={utilisateur.nom} taille="lg" className="mx-auto ring-4 ring-brand-50" />
          <p className="mt-4 font-semibold text-slate-900">{utilisateur.nom_complet}</p>
          <p className="truncate text-sm text-slate-500">{utilisateur.email}</p>
          <Badge className={cx('mt-3', role?.couleur)}>{role?.libelle}</Badge>
          <dl className="mt-6 space-y-3 border-t border-slate-100 pt-5 text-left text-sm">
            {localisation(utilisateur) && (
              <div>
                <dt className="text-slate-500">Localisation</dt>
                <dd className="font-medium text-slate-800">{localisation(utilisateur)}</dd>
              </div>
            )}
            <div>
              <dt className="text-slate-500">Membre depuis</dt>
              <dd className="font-medium text-slate-800">{dates.longue(utilisateur.created_at)}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Dernière connexion</dt>
              <dd className="font-medium text-slate-800">{dates.heure(utilisateur.derniere_connexion_at)}</dd>
            </div>
          </dl>
        </aside>

        <div className="space-y-8">
          <Informations />
          <MotDePasse />
        </div>
      </div>
    </>
  )
}
