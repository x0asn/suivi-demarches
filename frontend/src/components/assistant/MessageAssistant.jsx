import { Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'
import { cx } from '../../lib/utils'
import TexteAssistant from './TexteAssistant'

const sansAnimation = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

/**
 * Pendant l'écriture, le texte peut s'arrêter au milieu d'un mot, d'un gras ou d'un lien :
 * on s'arrête au dernier mot complet et on retire les marques de mise en forme non refermées.
 */
function texteEnCours(texte) {
  let visible = texte.slice(0, texte.lastIndexOf(' ') + 1 || texte.length)
  visible = visible.replace(/\[([^\]]*)\]\([^)]*$/, '$1').replace(/\[([^\]]*)$/, '$1')
  if ((visible.match(/\*\*/g) ?? []).length % 2 === 1) visible = visible.replace(/\*\*(?![\s\S]*\*\*)/, '')
  return visible
}

/**
 * Une réponse de l'assistant. Le texte s'écrit progressivement, que la réponse arrive
 * d'un bloc ou par morceaux : l'écriture accélère quand il reste beaucoup à afficher.
 */
export default function MessageAssistant({ message, enAttente, onProgression }) {
  const texte = message.content
  // Un message créé vide vient d'être demandé : il s'animera. Un message déjà complet s'affiche tel quel.
  const [longueur, setLongueur] = useState(() => (sansAnimation() ? Infinity : texte.length))
  const fini = longueur >= texte.length

  useEffect(() => {
    if (fini) return
    const image = requestAnimationFrame(() => {
      setLongueur((l) => Math.min(texte.length, l + Math.max(2, Math.ceil((texte.length - l) / 70))))
      onProgression?.()
    })
    return () => cancelAnimationFrame(image)
  }, [longueur, texte, fini, onProgression])

  const ecrit = fini && !enAttente
  const visible = ecrit ? texte : texteEnCours(texte.slice(0, longueur))

  return (
    <div className="flex animate-message gap-2.5">
      <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-800 text-white">
        <Sparkles className={cx('size-3.5', !ecrit && 'animate-pulse')} aria-hidden />
      </span>
      <div
        className={cx(
          'min-w-0 max-w-[88%] rounded-2xl rounded-tl-md px-4 py-3 text-sm leading-relaxed ring-1 transition-colors duration-300',
          message.erreur ? 'bg-red-50 text-red-800 ring-red-200' : 'bg-white text-slate-800 ring-slate-200',
        )}
      >
        {visible ? (
          <TexteAssistant texte={visible} />
        ) : (
          <span className="flex items-center gap-1.5 py-1.5" role="status" aria-label="L’assistant écrit">
            {[0, 160, 320].map((delai) => (
              <span key={delai} className="size-2 animate-point rounded-full bg-brand-500" style={{ animationDelay: `${delai}ms` }} />
            ))}
          </span>
        )}
        {message.interrompu && <p className="mt-2 text-xs text-slate-500">Réponse interrompue.</p>}
      </div>
    </div>
  )
}
