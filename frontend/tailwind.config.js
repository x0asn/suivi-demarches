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
      },
      animation: {
        apparition: 'apparition 0.5s cubic-bezier(0.22, 1, 0.36, 1) both',
        flotte: 'flotte 6s ease-in-out infinite',
        'assistant-ouvre': 'assistant-ouvre 0.32s cubic-bezier(0.22, 1, 0.36, 1) both',
        'assistant-ferme': 'assistant-ferme 0.18s ease-in both',
        message: 'message 0.35s cubic-bezier(0.22, 1, 0.36, 1) both',
        point: 'point 1.2s ease-in-out infinite',
        halo: 'halo 2.6s ease-out infinite',
      },
    },
  },
  plugins: [],
}
