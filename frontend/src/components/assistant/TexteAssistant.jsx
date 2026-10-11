import { Link } from 'react-router-dom'

/** Gras (**texte**) et liens ([texte](adresse)) à l'intérieur d'une ligne. */
function enLigne(texte, cle) {
  const morceaux = texte.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\([^)\s]+\))/g)
  return morceaux.map((m, i) => {
    const gras = m.match(/^\*\*([^*]+)\*\*$/)
    if (gras) return <strong key={`${cle}-${i}`} className="font-semibold">{gras[1]}</strong>
    const lien = m.match(/^\[([^\]]+)\]\(([^)\s]+)\)$/)
    if (lien) {
      const [, libelle, adresse] = lien
      const classe = 'font-semibold text-brand-700 underline underline-offset-2 hover:text-brand-800'
      // Seuls les liens internes à la plateforme et les liens https sont rendus cliquables.
      if (adresse.startsWith('/')) return <Link key={`${cle}-${i}`} to={adresse} className={classe}>{libelle}</Link>
      if (adresse.startsWith('https://')) return <a key={`${cle}-${i}`} href={adresse} target="_blank" rel="noreferrer" className={classe}>{libelle}</a>
      return libelle
    }
    return m
  })
}

/**
 * Affiche une réponse de l'assistant : paragraphes, listes à puces ou numérotées, gras et liens.
 * Le texte n'est jamais injecté comme HTML : il est découpé puis rendu par React.
 */
export default function TexteAssistant({ texte }) {
  const blocs = []
  let liste = null

  texte.split('\n').forEach((ligne) => {
    const puce = ligne.match(/^\s*[-•*]\s+(.*)$/)
    const numero = ligne.match(/^\s*\d+[.)]\s+(.*)$/)
    const element = puce ?? numero
    if (element) {
      const type = puce ? 'ul' : 'ol'
      if (!liste || liste.type !== type) {
        liste = { type, elements: [] }
        blocs.push(liste)
      }
      liste.elements.push(element[1])
      return
    }
    liste = null
    if (ligne.trim()) blocs.push({ type: 'p', texte: ligne.replace(/^#+\s*/, '') })
  })

  return (
    <div className="space-y-2">
      {blocs.map((bloc, i) => {
        if (bloc.type === 'p') return <p key={i}>{enLigne(bloc.texte, i)}</p>
        const Liste = bloc.type
        return (
          <Liste key={i} className={bloc.type === 'ul' ? 'list-disc space-y-1 pl-5' : 'list-decimal space-y-1 pl-5'}>
            {bloc.elements.map((e, k) => <li key={k}>{enLigne(e, `${i}-${k}`)}</li>)}
          </Liste>
        )
      })}
    </div>
  )
}
