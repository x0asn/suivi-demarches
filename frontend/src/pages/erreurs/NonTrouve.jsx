import { ArrowLeft, Compass } from 'lucide-react'
import { Bouton, Logo } from '../../components/ui'

/**
 * Page 404. Avec `integre`, elle s'affiche à l'intérieur d'une mise en page existante
 * (ex. : procédure introuvable dans le site public) ; sinon, en pleine page.
 */
export default function NonTrouve({ integre = false, titre = 'Page introuvable', message, retour = '/', libelleRetour = "Retour à l'accueil" }) {
  const contenu = (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-20 text-center">
      <span className="flex size-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-700 ring-8 ring-brand-50/50">
        <Compass className="size-7" aria-hidden />
      </span>
      <p className="mt-6 text-sm font-semibold text-brand-700">Erreur 404</p>
      <h1 className="titre-display mt-2 text-4xl font-semibold">{titre}</h1>
      <p className="mt-3 max-w-md text-slate-600">
        {message ?? "La page que vous cherchez n'existe pas ou a été déplacée. Vérifiez l'adresse ou revenez à l'accueil."}
      </p>
      <Bouton vers={retour} icone={ArrowLeft} className="mt-8">
        {libelleRetour}
      </Bouton>
    </div>
  )

  if (integre) return contenu

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <div className="conteneur py-6">
        <Logo />
      </div>
      {contenu}
    </div>
  )
}
