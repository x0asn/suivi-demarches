import { ArrowRight, LockKeyhole, Mail, MapPin, Phone, UserRound } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import ForceMotDePasse from '../../components/auth/ForceMotDePasse'
import { Alerte, Bouton, Champ, ChampMotDePasse, Selecteur } from '../../components/ui'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { REGIONS } from '../../lib/regions'

const VIDE = { prenom: '', nom: '', email: '', telephone: '', region: '', commune: '', password: '', password_confirmation: '' }

/** RF-001 : création d'un compte citoyen. */
export default function Inscription() {
  const { inscription } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [champs, setChamps] = useState(VIDE)
  const [accepte, setAccepte] = useState(false)
  const [erreur, setErreur] = useState(null)
  const [erreursLocales, setErreursLocales] = useState({})
  const [envoi, setEnvoi] = useState(false)

  const modifier = (e) => {
    setChamps((c) => ({ ...c, [e.target.name]: e.target.value }))
    setErreursLocales((x) => ({ ...x, [e.target.name]: undefined }))
  }

  // Validation côté client (le serveur revalide tout).
  const valider = () => {
    const e = {}
    if (!champs.prenom.trim()) e.prenom = 'Le prénom est obligatoire.'
    if (!champs.nom.trim()) e.nom = 'Le nom est obligatoire.'
    if (!/^\S+@\S+\.\S+$/.test(champs.email)) e.email = 'Saisissez une adresse e-mail valide, par exemple nom@exemple.sn.'
    if (champs.telephone && !/^\+?[0-9 ]{9,20}$/.test(champs.telephone)) e.telephone = 'Format attendu : +221 77 123 45 67.'
    if (!champs.region) e.region = 'Choisissez votre région de résidence.'
    if (champs.password.length < 8 || !/[a-zA-Z]/.test(champs.password) || !/\d/.test(champs.password))
      e.password = 'Au moins 8 caractères, avec des lettres et des chiffres.'
    if (champs.password !== champs.password_confirmation) e.password_confirmation = 'Les deux mots de passe ne correspondent pas.'
    if (!accepte) e.accepte = 'Vous devez accepter les conditions pour créer un compte.'
    setErreursLocales(e)
    return Object.keys(e).length === 0
  }

  const soumettre = async (e) => {
    e.preventDefault()
    setErreur(null)
    if (!valider()) return
    setEnvoi(true)
    try {
      const user = await inscription(champs)
      toast.succes('Votre espace citoyen est prêt.', `Bienvenue, ${user.prenom} !`)
      navigate('/espace', { replace: true })
    } catch (err) {
      setErreur(err)
    } finally {
      setEnvoi(false)
    }
  }

  const err = (nom) => erreursLocales[nom] ?? erreur?.champ(nom)

  return (
    <>
      <h1 className="titre-display text-3xl font-semibold">Créer mon compte citoyen</h1>
      <p className="mt-2 text-slate-600">Gratuit, en deux minutes. Vous pourrez ensuite déposer et suivre vos demandes.</p>

      <form onSubmit={soumettre} className="mt-8 space-y-5" noValidate>
        {erreur && !Object.keys(erreur.errors ?? {}).length && <Alerte type="erreur">{erreur.message}</Alerte>}
        {erreur?.status === 422 && <Alerte type="erreur" titre="Certains champs sont à corriger">Vérifiez les messages sous les champs concernés.</Alerte>}

        <div className="grid gap-5 sm:grid-cols-2">
          <Champ label="Prénom" name="prenom" autoComplete="given-name" icone={UserRound} value={champs.prenom} onChange={modifier} erreur={err('prenom')} obligatoire />
          <Champ label="Nom" name="nom" autoComplete="family-name" value={champs.nom} onChange={modifier} erreur={err('nom')} obligatoire />
        </div>

        <Champ
          label="Adresse e-mail"
          name="email"
          type="email"
          autoComplete="email"
          icone={Mail}
          placeholder="vous@exemple.sn"
          value={champs.email}
          onChange={modifier}
          erreur={err('email')}
          aide="Elle servira à vous connecter et à recevoir vos notifications."
          obligatoire
        />

        <Champ
          label="Téléphone"
          name="telephone"
          type="tel"
          autoComplete="tel"
          icone={Phone}
          placeholder="+221 77 123 45 67"
          value={champs.telephone}
          onChange={modifier}
          erreur={err('telephone')}
          aide="Facultatif — utile si l'administration doit vous joindre."
        />

        <div className="grid gap-5 sm:grid-cols-2">
          <Selecteur
            label="Région"
            name="region"
            value={champs.region}
            onChange={modifier}
            erreur={err('region')}
            aide="Votre région de résidence au Sénégal."
            obligatoire
          >
            <option value="">Choisir votre région…</option>
            {REGIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </Selecteur>
          <Champ
            label="Commune"
            name="commune"
            icone={MapPin}
            placeholder="Ex. : Diamniadio, Mbour…"
            value={champs.commune}
            onChange={modifier}
            erreur={err('commune')}
            aide="Facultatif."
            maxLength={100}
          />
        </div>

        <div>
          <ChampMotDePasse
            label="Mot de passe"
            name="password"
            autoComplete="new-password"
            icone={LockKeyhole}
            value={champs.password}
            onChange={modifier}
            erreur={err('password')}
            obligatoire
          />
          <ForceMotDePasse valeur={champs.password} />
        </div>

        <ChampMotDePasse
          label="Confirmer le mot de passe"
          name="password_confirmation"
          autoComplete="new-password"
          icone={LockKeyhole}
          value={champs.password_confirmation}
          onChange={modifier}
          erreur={err('password_confirmation')}
          obligatoire
        />

        <div>
          <label className="flex items-start gap-3 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={accepte}
              onChange={(e) => {
                setAccepte(e.target.checked)
                setErreursLocales((x) => ({ ...x, accepte: undefined }))
              }}
              className="mt-0.5 size-4 rounded border-slate-300 text-brand-700 accent-brand-700"
            />
            <span>
              J’accepte que mes données soient utilisées uniquement pour le traitement de mes démarches, et consultées
              par les seuls agents habilités.
            </span>
          </label>
          {erreursLocales.accepte && <p className="mt-1.5 text-sm text-red-600" role="alert">{erreursLocales.accepte}</p>}
        </div>

        <Bouton type="submit" taille="lg" className="w-full" chargement={envoi} iconeDroite={ArrowRight}>
          Créer mon compte
        </Bouton>
      </form>

      <p className="mt-8 text-center text-sm text-slate-600">
        Déjà inscrit ?{' '}
        <Link to="/connexion" className="font-semibold text-brand-700 hover:text-brand-800">
          Se connecter
        </Link>
      </p>
    </>
  )
}
