import { ArrowLeft, ShieldX } from 'lucide-react'
import { Bouton } from '../../components/ui'

export default function AccesRefuse() {
  return (
    <div className="flex flex-col items-center px-6 py-20 text-center">
      <span className="flex size-16 items-center justify-center rounded-2xl bg-red-50 text-red-600 ring-8 ring-red-50/50">
        <ShieldX className="size-7" aria-hidden />
      </span>
      <p className="mt-6 text-sm font-semibold text-red-600">Erreur 403</p>
      <h1 className="titre-display mt-2 text-3xl font-semibold">Accès non autorisé</h1>
      <p className="mt-3 max-w-md text-slate-600">
        Votre profil ne dispose pas des droits nécessaires pour consulter cette page. Si vous pensez qu'il s'agit d'une
        erreur, contactez l'administrateur de la plateforme.
      </p>
      <Bouton vers="/espace" variante="secondaire" icone={ArrowLeft} className="mt-8">
        Retour à mon espace
      </Bouton>
    </div>
  )
}
