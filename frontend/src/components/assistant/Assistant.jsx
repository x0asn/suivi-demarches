import { ArrowUp, MessageCircleQuestion, RotateCcw, Sparkles, Square, X } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { demanderAssistant } from '../../lib/assistant'
import { cx } from '../../lib/utils'
import { BandeWax } from '../ui/Senegal'
import MessageAssistant from './MessageAssistant'

const SUGGESTIONS = [
  'Quelles pièces pour un extrait de naissance ?',
  'Où faire un certificat de résidence ?',
  'Comment suivre mon dossier ?',
  'Combien de temps pour un passeport ?',
]
const PAGES_SANS_ASSISTANT = ['/connexion', '/inscription', '/mot-de-passe-oublie', '/reinitialiser-mot-de-passe']
const SUGGESTIONS_CITOYEN = ['Où en sont mes dossiers ?', ...SUGGESTIONS.slice(0, 3)]

/** Durée de l'animation de fermeture (voir « assistant-ferme » dans tailwind.config.js). */
const DUREE_FERMETURE = 180

/**
 * Assistant de la plateforme : une bulle en bas de l'écran ouvre une discussion.
 * Il explique les démarches en langage simple à partir du catalogue, oriente vers
 * l'administration compétente et, pour un citoyen connecté, indique où en sont ses dossiers.
 * Il informe et oriente : il ne prend aucune décision sur un dossier.
 */
export default function Assistant() {
  const { utilisateur } = useAuth()
  const { pathname } = useLocation()
  // 'ferme' → 'ouvert' → 'fermeture' (le temps de l'animation) → 'ferme'
  const [etat, setEtat] = useState('ferme')
  const [messages, setMessages] = useState([])
  const [saisie, setSaisie] = useState('')
  const [enCours, setEnCours] = useState(false)
  const [mode, setMode] = useState(null)
  const controleur = useRef(null)
  const fil = useRef(null)
  const champ = useRef(null)
  // Le fil ne suit la réponse que si la personne n'est pas remontée lire plus haut.
  const colleEnBas = useRef(true)

  const ouvrir = () => setEtat('ouvert')
  const fermer = useCallback(() => {
    setEtat((e) => (e === 'ouvert' ? 'fermeture' : e))
    setTimeout(() => setEtat((e) => (e === 'fermeture' ? 'ferme' : e)), DUREE_FERMETURE)
  }, [])

  const suivreLeFil = useCallback(() => {
    if (colleEnBas.current && fil.current) fil.current.scrollTop = fil.current.scrollHeight
  }, [])

  // Un nouveau message ramène toujours en bas, en douceur.
  useEffect(() => {
    colleEnBas.current = true
    fil.current?.scrollTo({ top: fil.current.scrollHeight, behavior: 'smooth' })
  }, [messages.length, etat])

  useEffect(() => {
    if (etat !== 'ouvert') return
    champ.current?.focus({ preventScroll: true })
    const surTouche = (e) => e.key === 'Escape' && fermer()
    document.addEventListener('keydown', surTouche)
    return () => document.removeEventListener('keydown', surTouche)
  }, [etat, fermer])

  // Sur téléphone, la discussion se replie quand on suit un lien de la réponse.
  const page = useRef(pathname)
  useEffect(() => {
    if (page.current !== pathname && window.innerWidth < 640) fermer()
    page.current = pathname
  }, [pathname, fermer])

  const majDernier = (fn) => setMessages((liste) => liste.map((m, i) => (i === liste.length - 1 ? fn(m) : m)))

  const ajusterChamp = () => {
    const zone = champ.current
    if (!zone) return
    zone.style.height = 'auto'
    zone.style.height = `${Math.min(zone.scrollHeight, 112)}px`
  }

  const envoyer = async (question) => {
    const texte = question.trim()
    if (!texte || enCours) return
    const historique = [...messages.filter((m) => !m.erreur), { role: 'user', content: texte }]
    setMessages([...historique, { role: 'assistant', content: '' }])
    setSaisie('')
    if (champ.current) champ.current.style.height = 'auto'
    setEnCours(true)
    controleur.current = new AbortController()
    try {
      const recu = await demanderAssistant(
        historique.map(({ role, content }) => ({ role, content })),
        { signal: controleur.current.signal, surTexte: (morceau) => majDernier((m) => ({ ...m, content: m.content + morceau })) },
      )
      setMode(recu)
    } catch (e) {
      if (e.name === 'AbortError') majDernier((m) => ({ ...m, interrompu: true }))
      else majDernier((m) => ({ ...m, content: m.content || e.message, erreur: true }))
    } finally {
      setEnCours(false)
    }
  }

  const recommencer = () => {
    controleur.current?.abort()
    setMessages([])
  }

  const suggestions = utilisateur?.role === 'citoyen' ? SUGGESTIONS_CITOYEN : SUGGESTIONS

  // L'assistant s'adresse aux visiteurs et aux citoyens ; il s'efface sur les pages de connexion.
  if (utilisateur && utilisateur.role !== 'citoyen') return null
  if (PAGES_SANS_ASSISTANT.some((p) => pathname.startsWith(p))) return null

  return (
    <>
      {etat !== 'ouvert' && (
        <button
          onClick={ouvrir}
          className="group fixed bottom-4 right-4 z-[1100] flex animate-apparition items-center gap-2.5 rounded-full bg-brand-800 p-3 text-sm font-semibold text-white shadow-flottant ring-4 ring-white/70 transition duration-300 ease-out hover:-translate-y-0.5 hover:bg-brand-900 hover:shadow-[0_18px_44px_-12px_rgb(8_36_26_/_0.55)] active:translate-y-0 active:scale-95 sm:bottom-5 sm:right-5 sm:py-3 sm:pl-3.5 sm:pr-5 print:hidden"
          aria-label="Ouvrir l’assistant"
        >
          <span className="relative flex size-8 items-center justify-center">
            <span className="absolute inset-0 animate-halo rounded-full bg-or-400" aria-hidden />
            <span className="relative flex size-8 items-center justify-center rounded-full bg-or-400 text-brand-950 transition-transform duration-300 group-hover:rotate-12">
              <Sparkles className="size-4" aria-hidden />
            </span>
          </span>
          <span className="hidden sm:inline">Besoin d’aide ?</span>
        </button>
      )}

      {etat !== 'ferme' && (
        <section
          className={cx(
            'fixed inset-0 z-[1100] flex origin-bottom-right flex-col overflow-hidden bg-white shadow-flottant sm:inset-auto sm:bottom-5 sm:right-5 sm:h-[min(40rem,calc(100vh-2.5rem))] sm:w-[25rem] sm:rounded-2xl sm:ring-1 sm:ring-slate-200 print:hidden',
            etat === 'fermeture' ? 'animate-assistant-ferme' : 'animate-assistant-ouvre',
          )}
          aria-label="Assistant Suivi Démarches"
        >
          <header className="flex items-center gap-3 bg-gradient-to-r from-brand-900 to-brand-700 px-4 py-3.5 text-white">
            <span className="relative flex size-9 shrink-0 items-center justify-center rounded-full bg-or-400 text-brand-950">
              <Sparkles className="size-4" aria-hidden />
              <span className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full bg-emerald-400 ring-2 ring-brand-800" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold leading-tight">Assistant Suivi Démarches</p>
              <p className="text-xs text-brand-100 transition-opacity duration-300">
                {enCours ? 'Écrit une réponse…' : mode === 'ia' ? 'Assistant IA · en ligne' : 'En ligne · répond en quelques secondes'}
              </p>
            </div>
            <button
              onClick={recommencer}
              disabled={messages.length === 0}
              className="rounded-lg p-2 text-brand-100 transition duration-200 hover:bg-white/10 hover:text-white active:scale-90 disabled:pointer-events-none disabled:opacity-0"
              aria-label="Nouvelle discussion"
              title="Nouvelle discussion"
            >
              <RotateCcw className="size-4" />
            </button>
            <button
              onClick={fermer}
              className="rounded-lg p-2 text-brand-100 transition duration-200 hover:rotate-90 hover:bg-white/10 hover:text-white active:scale-90"
              aria-label="Fermer l’assistant"
            >
              <X className="size-5" />
            </button>
          </header>

          <BandeWax className="shrink-0" />
          <div
            ref={fil}
            onScroll={(e) => {
              const zone = e.currentTarget
              colleEnBas.current = zone.scrollHeight - zone.scrollTop - zone.clientHeight < 48
            }}
            className="flex-1 space-y-4 overflow-y-auto overscroll-contain bg-slate-50 px-4 py-5"
            aria-live="polite"
          >
            {messages.length === 0 ? (
              <div>
                <div className="flex animate-message gap-2.5">
                  <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-800 text-white"><MessageCircleQuestion className="size-4" aria-hidden /></span>
                  <div className="rounded-2xl rounded-tl-md bg-white px-4 py-3 text-sm leading-relaxed text-slate-800 ring-1 ring-slate-200">
                    <p>Bonjour{utilisateur?.prenom ? ` ${utilisateur.prenom}` : ''} ! Je vous aide à comprendre vos démarches : pièces à fournir, délais, mairie compétente, suivi de dossier.</p>
                    <p className="mt-2">Posez votre question avec vos mots. Si ma réponse n’est pas claire, dites-le-moi : je vous l’explique autrement.</p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2 pl-9">
                  {suggestions.map((s, i) => (
                    <button
                      key={s}
                      onClick={() => envoyer(s)}
                      style={{ animationDelay: `${180 + i * 70}ms` }}
                      className="animate-message rounded-full bg-white px-3 py-1.5 text-left text-sm font-medium text-brand-800 ring-1 ring-brand-200 transition duration-200 hover:-translate-y-0.5 hover:bg-brand-50 hover:shadow-sm hover:ring-brand-300 active:translate-y-0 active:scale-95"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((m, i) =>
                m.role === 'user' ? (
                  <div key={i} className="flex animate-message justify-end">
                    <p className="max-w-[85%] whitespace-pre-line rounded-2xl rounded-br-md bg-brand-700 px-4 py-2.5 text-sm leading-relaxed text-white shadow-sm">{m.content}</p>
                  </div>
                ) : (
                  <MessageAssistant key={i} message={m} enAttente={enCours && i === messages.length - 1} onProgression={suivreLeFil} />
                ),
              )
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              envoyer(saisie)
            }}
            className="border-t border-slate-200 bg-white p-3"
          >
            <div className="flex items-end gap-2 rounded-2xl bg-slate-50 p-1.5 ring-1 ring-slate-200 transition-shadow duration-200 focus-within:bg-white focus-within:shadow-sm focus-within:ring-2 focus-within:ring-brand-600">
              <label htmlFor="question-assistant" className="sr-only">Votre question</label>
              <textarea
                id="question-assistant"
                ref={champ}
                rows={1}
                value={saisie}
                onChange={(e) => {
                  setSaisie(e.target.value)
                  ajusterChamp()
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    envoyer(saisie)
                  }
                }}
                maxLength={1000}
                placeholder="Écrivez votre question…"
                className="max-h-28 min-h-[2.5rem] flex-1 resize-none border-0 bg-transparent px-2.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0"
              />
              {enCours ? (
                <button
                  type="button"
                  onClick={() => controleur.current?.abort()}
                  className="flex size-10 shrink-0 animate-message items-center justify-center rounded-xl bg-slate-800 text-white transition duration-200 hover:bg-slate-900 active:scale-90"
                  aria-label="Arrêter la réponse"
                >
                  <Square className="size-3.5 fill-current" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!saisie.trim()}
                  className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-700 text-white transition duration-200 hover:-translate-y-0.5 hover:bg-brand-800 hover:shadow-md active:translate-y-0 active:scale-90 disabled:translate-y-0 disabled:scale-90 disabled:bg-slate-300 disabled:shadow-none"
                  aria-label="Envoyer"
                >
                  <ArrowUp className="size-5" />
                </button>
              )}
            </div>
            <p className="mt-2 px-1 text-[0.7rem] leading-snug text-slate-500">
              L’assistant informe et oriente : il peut se tromper et ne prend aucune décision sur votre dossier. N’y écrivez pas de données sensibles.
            </p>
          </form>
        </section>
      )}
    </>
  )
}
