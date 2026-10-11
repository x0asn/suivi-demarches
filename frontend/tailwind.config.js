/**
 * Identité visuelle « Suivi Démarches » — sobre et institutionnelle.
 * Vert profond (confiance, service public) + or discret (accent) + neutres ardoise.
 * Tailwind 3 est utilisé pour rester compatible avec les navigateurs plus anciens (Chrome 96+).
 *
 * @type {import('tailwindcss').Config}
 */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Inter Variable"', 'ui-sans-serif', 'system-ui', '-apple-system', '"Segoe UI"', 'sans-serif'],
        display: ['"Fraunces Variable"', 'Georgia', '"Times New Roman"', 'serif'],
      },
      colors: {
        brand: {
          50: '#effaf4',
          100: '#d8f2e3',
          200: '#b4e4ca',
          300: '#82cfa9',
          400: '#4fb383',
          500: '#2c9767',
          600: '#1d7a52',
          700: '#186244',
          800: '#154e38',
          900: '#12402f',
          950: '#08241a',
        },
        or: {
          50: '#fbf7eb',
          100: '#f5ebcb',
          200: '#ebd592',
          300: '#dfba57',
          400: '#d4a12f',
          500: '#c08a23',
          600: '#a46c1c',
          700: '#83501a',
        },
      },
      spacing: {
        4.5: '1.125rem',
        18: '4.5rem',
        68: '17rem',
      },
      opacity: {
        8: '0.08',
        12: '0.12',
      },
      boxShadow: {
        carte: '0 1px 2px rgb(15 23 42 / 0.04), 0 4px 16px -4px rgb(15 23 42 / 0.08)',
        flottant: '0 12px 40px -12px rgb(8 36 26 / 0.35)',
      },
      keyframes: {
        apparition: {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'none' },
        },
        flotte: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        // Assistant : ouverture et fermeture de la fenêtre, arrivée des messages, points d'attente.
        'assistant-ouvre': {
          from: { opacity: '0', transform: 'translateY(18px) scale(0.94)' },
          to: { opacity: '1', transform: 'none' },
        },
        'assistant-ferme': {
          from: { opacity: '1', transform: 'none' },
          to: { opacity: '0', transform: 'translateY(14px) scale(0.95)' },
        },
        message: {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'none' },
        },
        point: {
          '0%, 60%, 100%': { opacity: '0.35', transform: 'translateY(0)' },
          '30%': { opacity: '1', transform: 'translateY(-4px)' },
        },
        halo: {
          '0%': { opacity: '0.6', transform: 'scale(1)' },
          '70%, 100%': { opacity: '0', transform: 'scale(1.9)' },
        },
        // Changement de page : le contenu arrive en douceur.
        page: {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'none' },
        },
        // Écran d'ouverture : le logo se dessine, puis le rideau se lève sur l'accueil.
        trace: {
          from: { strokeDashoffset: '1' },
          to: { strokeDashoffset: '0' },
        },
        eclot: {
          '0%': { opacity: '0', transform: 'scale(0)' },
          '70%': { opacity: '1', transform: 'scale(1.25)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        monte: {
          from: { opacity: '0', transform: 'translateY(14px)' },
          to: { opacity: '1', transform: 'none' },
        },
        deploie: {
          from: { transform: 'scaleX(0)' },
          to: { transform: 'scaleX(1)' },
        },
        rideau: {
          from: { transform: 'translateY(0)' },
          to: { transform: 'translateY(-100%)' },
        },
      },
      animation: {
        apparition: 'apparition 0.5s cubic-bezier(0.22, 1, 0.36, 1) both',
        flotte: 'flotte 6s ease-in-out infinite',
        'assistant-ouvre': 'assistant-ouvre 0.32s cubic-bezier(0.22, 1, 0.36, 1) both',
        'assistant-ferme': 'assistant-ferme 0.18s ease-in both',
        message: 'message 0.35s cubic-bezier(0.22, 1, 0.36, 1) both',
        point: 'point 1.2s ease-in-out infinite',
        halo: 'halo 2.6s ease-out infinite',
        page: 'page 0.45s cubic-bezier(0.22, 1, 0.36, 1) both',
        trace: 'trace 0.9s cubic-bezier(0.65, 0, 0.35, 1) both',
        eclot: 'eclot 0.45s cubic-bezier(0.22, 1, 0.36, 1) both',
        monte: 'monte 0.6s cubic-bezier(0.22, 1, 0.36, 1) both',
        deploie: 'deploie 0.6s cubic-bezier(0.22, 1, 0.36, 1) both',
        rideau: 'rideau 0.65s cubic-bezier(0.76, 0, 0.24, 1) both',
      },
    },
  },
  plugins: [],
}
