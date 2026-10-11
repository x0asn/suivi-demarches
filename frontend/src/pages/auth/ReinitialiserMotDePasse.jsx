import { CheckCircle2, LockKeyhole } from 'lucide-react'
import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import ForceMotDePasse from '../../components/auth/ForceMotDePasse'
import { Alerte, Bouton, ChampMotDePasse } from '../../components/ui'
import { api } from '../../lib/api'

export default function ReinitialiserMotDePasse() {
  const [params] = useSearchParams()
  const token = params.get('token')
  const email = params.get('email')
  const [champs, setChamps] = useState({ password: '', password_confirmation: '' })
  const [erreur, setErreur] = useState(null)
  const [envoi, setEnvoi] = useState(false)
  const [termine, setTermine] = useState(false)

  const modifier = (e) => setChamps((c) => ({ ...c, [e.target.name]: e.target.value }))

  const soumettre = async (e) => {
    e.preventDefault()
    setErreur(null)
    setEnvoi(true)
    try {
      await api('/auth/reset-password', { method: 'POST', body: { ...champs, token, email } })
      setTermine(true)
    } catch (err) {
      setErreur(err)
    } finally {
      setEnvoi(false)
    }
  }

  if (!token || !email) {
    return (
      <Alerte type="erreur" titre="Lien incomplet">
        Ce lien de réinitialisation est incomplet. <Link to="/mot-de-passe-oublie" className="font-semibold underline">Demandez-en un nouveau</Link>.
      </Alerte>
    )
  }

  if (termine) {
    return (
      <div className="text-center">
        <span className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-700 ring-8 ring-brand-50/50">
          <CheckCircle2 className="size-7" aria-hidden />
        </span>
        <h1 className="titre-display mt-6 text-3xl font-semibold">Mot de passe modifié</h1>
        <p className="mt-3 text-slate-600">Par sécurité, toutes vos sessions ont été fermées. Vous pouvez maintenant vous reconnecter.</p>
        <Bouton vers="/connexion" className="mt-8">
          Se connecter
        </Bouton>
      </div>
    )
  }

  return (
    <>
      <h1 className="titre-display text-3xl font-semibold">Choisir un nouveau mot de passe</h1>
      <p className="mt-2 text-slate-600">
        Pour le compte <b className="font-semibold text-slate-800">{email}</b>.
      </p>

      <form onSubmit={soumettre} className="mt-8 space-y-5" noValidate>
        {erreur && !erreur.champ('password') && <Alerte type="erreur">{erreur.message}</Alerte>}
        <div>
          <ChampMotDePasse label="Nouveau mot de passe" name="password" autoComplete="new-password" icone={LockKeyhole} value={champs.password} onChange={modifier} erreur={erreur?.champ('password')} obligatoire />
          <ForceMotDePasse valeur={champs.password} />
        </div>
        <ChampMotDePasse label="Confirmer le mot de passe" name="password_confirmation" autoComplete="new-password" icone={LockKeyhole} value={champs.password_confirmation} onChange={modifier} obligatoire />
        <Bouton type="submit" taille="lg" className="w-full" chargement={envoi}>
          Enregistrer le mot de passe
        </Bouton>
      </form>
    </>
  )
}
