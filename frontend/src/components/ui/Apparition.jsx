import { useEffect, useRef, useState } from 'react'
import { cx } from '../../lib/utils'

/**
 * Fait apparaître son contenu en douceur quand il entre dans l'écran, au défilement.
 * `delai` (en millisecondes) permet d'enchaîner les éléments d'une liste, l'un après l'autre.
 */
export default function Apparition({ as: Balise = 'div', delai = 0, className, children, ...props }) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return
    const observateur = new IntersectionObserver(
      ([entree]) => {
        if (entree.isIntersecting) {
          setVisible(true)
          observateur.disconnect()
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -32px 0px' },
    )
    observateur.observe(element)
    return () => observateur.disconnect()
  }, [])

  return (
    <Balise
      ref={ref}
      style={{ transitionDelay: visible ? `${delai}ms` : undefined }}
      className={cx(
        'transition-[opacity,transform] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none',
        visible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0 motion-reduce:translate-y-0 motion-reduce:opacity-100',
        className,
      )}
      {...props}
    >
      {children}
    </Balise>
  )
}
