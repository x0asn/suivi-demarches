import { ArrowRight, Building2, LockKeyhole, Mail, ShieldCheck, UserRound, UsersRound } from 'lucide-react'
import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Alerte, Bouton, Champ, ChampMotDePasse } from '../../components/ui'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'

/** Comptes de démonstration (seeders) : affichés uniquement en développement, pour la soutenance. */
const COMPTES_DEMO = [
  { role: 'Citoyen', email: 'citoyen@suivi-demarches.sn', icone: UserRound },
  { role: 'Agent', email: 'agent@suivi-demarches.sn', icone: UsersRound },
  { role: 'Admin', email: 'admin@suivi-demarches.sn', icone: ShieldCheck },
  { role: 'Responsable', email: 'responsable@suivi-demarches.sn', icone: Building2 },
]

export default function Connexion() {
  const { connexion } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const [champs, setChamps] = useState({ email: '', password: '' })
  const [erreur, setErreur] = useState(null)
  const [envoi, setEnvoi] = useState(false)

  const modifier = (e) => setChamps((c) => ({ ...c, [e.target.name]: e.target.value }))

  const soumettre = async (e) => {
    e.preventDefault()
    setErreur(null)
    setEnvoi(true)
    try {
      const user = await connexion(champs.email, champs.password)
      toast.succes(`Ravi de vous revoir, ${user.prenom}.`, 'Connexion réussie')
      navigate(location.state?.depuis ?? '/espace', { replace: true })
    } catch (err) {
      setErreur(err)
    } finally {
      setEnvoi(false)
    }
  }

  return (
    <>
      <h1 className="titre-display text-3xl font-semibold">Bon retour parmi nous</h1>
      <p className="mt-2 text-slate-600">Connectez-vous pour suivre vos dossiers et vos démarches.</p>

      <form onSubmit={soumettre} className="mt-8 space-y-5" noValidate>
        {erreur && (
          <Alerte type="erreur" titre="Connexion impossible">
            {erreur.status === 422 ? 'Merci de renseigner votre adresse e-mail et votre mot de passe.' : erreur.message}
          </Alerte>
        )}

        <Champ
          label="Adresse e-mail"
          name="email"
          type="email"
          autoComplete="email"
          icone={Mail}
          placeholder="vous@exemple.sn"
          value={champs.email}
          onChange={modifier}
          erreur={erreur?.champ('email')}
          obligatoire
        />

        <ChampMotDePasse
          label="Mot de passe"
          name="password"
          autoComplete="current-password"
          icone={LockKeyhole}
          placeholder="Votre mot de passe"
          value={champs.password}
          onChange={modifier}
          erreur={erreur?.champ('password')}
          obligatoire
          actionLabel={
            <Link to="/mot-de-passe-oublie" className="text-sm font-medium text-brand-700 hover:text-brand-800">
              Mot de passe oublié ?
            </Link>
          }
        />

        <Bouton type="submit" taille="lg" className="w-full" chargement={envoi} iconeDroite={ArrowRight}>
          Se connecter
        </Bouton>
      </form>

      <p className="mt-8 text-center text-sm text-slate-600">
        Pas encore de compte ?{' '}
        <Link to="/inscription" className="font-semibold text-brand-700 hover:text-brand-800">
          Créer un compte citoyen
        </Link>
      </p>

      {import.meta.env.DEV && (
        <div className="mt-10 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4">
          <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Comptes de démonstration</p>
          <p className="mt-1 text-xs text-slate-500">
            Mot de passe : <code className="rounded bg-white px-1.5 py-0.5 font-semibold text-slate-700 ring-1 ring-slate-200">Demo2026</code>
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {COMPTES_DEMO.map(({ role, email, icone: Icone }) => (
              <button
                key={email}
                type="button"
                onClick={() => setChamps({ email, password: 'Demo2026' })}
                className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-left text-sm font-medium text-slate-700 ring-1 ring-slate-200 transition hover:ring-brand-400"
              >
                <Icone className="size-4 text-brand-600" aria-hidden />
                {role}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
