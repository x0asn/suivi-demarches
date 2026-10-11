/** Concatène des classes CSS en ignorant les valeurs vides. */
export function cx(...classes) {
  return classes.filter(Boolean).join(' ')
}

const formatDate = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
const formatDateCourte = new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
const formatDateHeure = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})
const formatRelatif = new Intl.RelativeTimeFormat('fr-FR', { numeric: 'auto' })

export const dates = {
  longue: (iso) => (iso ? formatDate.format(new Date(iso)) : '—'),
  courte: (iso) => (iso ? formatDateCourte.format(new Date(iso)) : '—'),
  heure: (iso) => (iso ? formatDateHeure.format(new Date(iso)) : '—'),
  relative: (iso) => {
    if (!iso) return '—'
    const secondes = (new Date(iso).getTime() - Date.now()) / 1000
    const unites = [
      ['year', 31536000],
      ['month', 2592000],
      ['week', 604800],
      ['day', 86400],
      ['hour', 3600],
      ['minute', 60],
    ]
    for (const [unite, s] of unites) {
      if (Math.abs(secondes) >= s) return formatRelatif.format(Math.round(secondes / s), unite)
    }
    return "à l'instant"
  },
}

export function initiales(prenom = '', nom = '') {
  return `${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase() || '?'
}

export function salutation() {
  const h = new Date().getHours()
  return h < 18 ? 'Bonjour' : 'Bonsoir'
}

export function tailleFichier(octets) {
  if (octets < 1024) return `${octets} o`
  if (octets < 1024 * 1024) return `${Math.round(octets / 1024)} Ko`
  return `${(octets / 1024 / 1024).toFixed(1).replace('.', ',')} Mo`
}

export const nombre = (n) => new Intl.NumberFormat('fr-FR').format(n ?? 0)
