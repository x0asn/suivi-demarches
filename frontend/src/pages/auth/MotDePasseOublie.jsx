import { ArrowLeft, Mail, MailCheck } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Alerte, Bouton, Champ } from '../../components/ui'
import { api } from '../../lib/api'

export default function MotDePasseOublie() {
  const [email, setEmail] = useState('')
  const [erreur, setErreur] = useState(null)
  const [envoi, setEnvoi] = useState(false)
  const [envoye, setEnvoye] = useState(false)

  const soumettre = async (e) => {
    e.preventDefault()
    setErreur(null)
    setEnvoi(true)
    try {
      await api('/auth/forgot-password', { method: 'POST', body: { email } })
      setEnvoye(true)
    } catch (err) {
      setErreur(err)
    } finally {
      setEnvoi(false)
    }
  }

  if (envoye) {
    return (
      <div className="text-center">
        <span className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-700 ring-8 ring-brand-50/50">
          <MailCheck className="size-7" aria-hidden />
        </span>
        <h1 className="titre-display mt-6 text-3xl font-semibold">Vérifiez votre boîte mail</h1>
        <p className="mt-3 text-slate-600">
          Si un compte existe pour <b className="font-semibold text-slate-800">{email}</b>, vous allez recevoir un lien
          pour choisir un nouveau mot de passe. Il est valable 60 minutes.
        </p>
        <Bouton vers="/connexion" variante="secondaire" className="mt-8" icone={ArrowLeft}>
          Retour à la connexion
        </Bouton>
      </div>
    )
  }

  return (
    <>
      <h1 className="titre-display text-3xl font-semibold">Mot de passe oublié ?</h1>
      <p className="mt-2 text-slate-600">
        Indiquez l’adresse e-mail de votre compte : nous vous enverrons un lien pour en choisir un nouveau.
      </p>

      <form onSubmit={soumettre} className="mt-8 space-y-5" noValidate>
        {erreur && erreur.status !== 422 && <Alerte type="erreur">{erreur.message}</Alerte>}
        <Champ
          label="Adresse e-mail"
          type="email"
          autoComplete="email"
          icone={Mail}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          erreur={erreur?.champ('email')}
          obligatoire
        />
        <Bouton type="submit" taille="lg" className="w-full" chargement={envoi}>
          Envoyer le lien
        </Bouton>
      </form>

      <Link to="/connexion" className="mt-8 flex items-center justify-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900">
        <ArrowLeft className="size-4" aria-hidden /> Retour à la connexion
      </Link>
    </>
  )
}
