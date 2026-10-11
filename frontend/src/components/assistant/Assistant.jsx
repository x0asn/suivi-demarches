import { ArrowUp, MessageCircleQuestion, RotateCcw, Sparkles, Square, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { demanderAssistant } from '../../lib/assistant'
import { cx } from '../../lib/utils'
import TexteAssistant from './TexteAssistant'

const SUGGESTIONS = [
  'Quelles pièces pour un extrait de naissance ?',
  'Où faire un certificat de résidence ?',
  'Comment suivre mon dossier ?',
  'Combien de temps pour un passeport ?',
]
const PAGES_SANS_ASSISTANT = ['/connexion', '/inscription', '/mot-de-passe-oublie', '/reinitialiser-mot-de-passe']
const SUGGESTIONS_CITOYEN = ['Où en sont mes dossiers ?', ...SUGGESTIONS.slice(0, 3)]

/**
 * Assistant de la plateforme : une bulle en bas de l'écran ouvre une discussion.
 * Il explique les démarches en langage simple à partir du catalogue, oriente vers
 * l'administration compétente et, pour un citoyen connecté, indique où en sont ses dossiers.
 * Il informe et oriente : il ne prend aucune décision sur un dossier.
 */
export default function Assistant() {
  const { utilisateur } = useAuth()
  const { pathname } = useLocation()
  const [ouvert, setOuvert] = useState(false)
  const [messages, setMessages] = useState([])
  const [saisie, setSaisie] = useState('')
  const [enCours, setEnCours] = useState(false)
  const [secours, setSecours] = useState(false)
  const controleur = useRef(null)
  const fil = useRef(null)
  const champ = useRef(null)

  // Le fil suit la réponse à mesure qu'elle s'écrit.
  useEffect(() => {
    fil.current?.scrollTo({ top: fil.current.scrollHeight })
  }, [messages, ouvert])

  useEffect(() => {
    if (ouvert) champ.current?.focus()
  }, [ouvert])

  // La discussion se replie quand on change de page (par exemple en suivant un lien de la réponse).
  const page = useRef(pathname)
  useEffect(() => {
    if (page.current !== pathname && window.innerWidth < 640) setOuvert(false)
    page.current = pathname
  }, [pathname])

  const majDernier = (fn) => setMessages((liste) => liste.map((m, i) => (i === liste.length - 1 ? fn(m) : m)))

  const envoyer = async (question) => {
    const texte = question.trim()
    if (!texte || enCours) return
    const historique = [...messages.filter((m) => !m.erreur), { role: 'user', content: texte }]
    setMessages([...historique, { role: 'assistant', content: '' }])
    setSaisie('')
    setEnCours(true)
    controleur.current = new AbortController()
    try {
      const mode = await demanderAssistant(
        historique.map(({ role, content }) => ({ role, content })),
        { signal: controleur.current.signal, surTexte: (morceau) => majDernier((m) => ({ ...m, content: m.content + morceau })) },
      )
      setSecours(mode === 'secours')
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
    setSecours(false)
  }

  const suggestions = utilisateur?.role === 'citoyen' ? SUGGESTIONS_CITOYEN : SUGGESTIONS

  // L'assistant s'adresse aux visiteurs et aux citoyens ; il s'efface sur les pages de connexion.
  if (utilisateur && utilisateur.role !== 'citoyen') return null
  if (PAGES_SANS_ASSISTANT.some((p) => pathname.startsWith(p))) return null

  return (
    <>
      {!ouvert && (
        <button
          onClick={() => setOuvert(true)}
          className="fixed bottom-5 right-5 z-[1100] flex items-center gap-2.5 rounded-full bg-brand-800 py-3 pl-4 pr-5 text-sm font-semibold text-white shadow-flottant ring-4 ring-white/70 transition hover:bg-brand-900 print:hidden"
          aria-label="Ouvrir l’assistant"
        >
          <span className="flex size-8 items-center justify-center rounded-full bg-or-400 text-brand-950"><Sparkles className="size-4" aria-hidden /></span>
          Besoin d’aide ?
        </button>
      )}

      {ouvert && (
        <section
          className="fixed inset-0 z-[1100] flex flex-col bg-white shadow-flottant sm:inset-auto sm:bottom-5 sm:right-5 sm:h-[min(40rem,calc(100vh-2.5rem))] sm:w-[25rem] sm:rounded-2xl sm:ring-1 sm:ring-slate-200 print:hidden"
          aria-label="Assistant Suivi Démarches"
        >
          <header className="flex items-center gap-3 bg-brand-800 px-4 py-3.5 text-white sm:rounded-t-2xl">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-or-400 text-brand-950"><Sparkles className="size-4" aria-hidden /></span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold leading-tight">Assistant Suivi Démarches</p>
              <p className="text-xs text-brand-100">{secours ? 'Mode guidé (sans IA)' : 'Assistant IA · répond en quelques secondes'}</p>
            </div>
            {messages.length > 0 && (
              <button onClick={recommencer} className="rounded-lg p-2 text-brand-100 hover:bg-white/10 hover:text-white" aria-label="Nouvelle discussion" title="Nouvelle discussion">
                <RotateCcw className="size-4" />
              </button>
            )}
            <button onClick={() => setOuvert(false)} className="rounded-lg p-2 text-brand-100 hover:bg-white/10 hover:text-white" aria-label="Fermer l’assistant">
              <X className="size-5" />
            </button>
          </header>

          <div ref={fil} className="flex-1 space-y-4 overflow-y-auto bg-slate-50 px-4 py-5" aria-live="polite">
            {messages.length === 0 ? (
              <div>
                <div className="flex gap-2.5">
                  <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-800 text-white"><MessageCircleQuestion className="size-4" aria-hidden /></span>
                  <div className="rounded-2xl rounded-tl-md bg-white px-4 py-3 text-sm leading-relaxed text-slate-800 ring-1 ring-slate-200">
                    <p>Bonjour{utilisateur?.prenom ? ` ${utilisateur.prenom}` : ''} ! Je vous aide à comprendre vos démarches : pièces à fournir, délais, administration compétente, suivi de dossier.</p>
                    <p className="mt-2">Posez votre question avec vos mots.</p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2 pl-9">
                  {suggestions.map((s) => (
                    <button key={s} onClick={() => envoyer(s)} className="rounded-full bg-white px-3 py-1.5 text-left text-sm font-medium text-brand-800 ring-1 ring-brand-200 transition hover:bg-brand-50">
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((m, i) => {
                const dernier = i === messages.length - 1
                if (m.role === 'user') {
                  return (
                    <div key={i} className="flex justify-end">
                      <p className="max-w-[85%] whitespace-pre-line rounded-2xl rounded-br-md bg-brand-700 px-4 py-2.5 text-sm leading-relaxed text-white">{m.content}</p>
                    </div>
                  )
                }
                return (
                  <div key={i} className="flex gap-2.5">
                    <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-800 text-white"><Sparkles className="size-3.5" aria-hidden /></span>
                    <div className={cx('min-w-0 max-w-[88%] rounded-2xl rounded-tl-md px-4 py-3 text-sm leading-relaxed ring-1', m.erreur ? 'bg-red-50 text-red-800 ring-red-200' : 'bg-white text-slate-800 ring-slate-200')}>
                      {m.content ? (
                        <TexteAssistant texte={m.content} />
                      ) : (
                        <span className="flex items-center gap-1 py-1" aria-label="L’assistant écrit">
                          {[0, 150, 300].map((d) => <span key={d} className="size-2 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: `${d}ms` }} />)}
                        </span>
                      )}
                      {m.interrompu && <p className="mt-2 text-xs text-slate-500">Réponse interrompue.</p>}
                      {dernier && enCours && m.content && <span className="ml-0.5 inline-block h-4 w-1.5 animate-pulse rounded-sm bg-brand-600 align-middle" aria-hidden />}
                    </div>
                  </div>
                )
              })
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              envoyer(saisie)
            }}
            className="border-t border-slate-200 bg-white p-3 sm:rounded-b-2xl"
          >
            <div className="flex items-end gap-2 rounded-2xl bg-slate-50 p-1.5 ring-1 ring-slate-200 focus-within:ring-2 focus-within:ring-brand-600">
              <label htmlFor="question-assistant" className="sr-only">Votre question</label>
              <textarea
                id="question-assistant"
                ref={champ}
                rows={1}
                value={saisie}
                onChange={(e) => setSaisie(e.target.value)}
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
                <button type="button" onClick={() => controleur.current?.abort()} className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-white hover:bg-slate-900" aria-label="Arrêter la réponse">
                  <Square className="size-3.5 fill-current" />
                </button>
              ) : (
                <button type="submit" disabled={!saisie.trim()} className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-700 text-white hover:bg-brand-800 disabled:opacity-40" aria-label="Envoyer">
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
