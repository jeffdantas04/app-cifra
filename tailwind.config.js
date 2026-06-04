/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        /**
         * PRIMARY — Violeta/Púrpura
         * Baseado em #8C7DFF (design system).
         * primary-500 (#7356E0) passa WCAG AA com texto branco (≈ 4.9:1).
         * primary-400 (#9C85FF) é a cor de exibição/marca (brand showcase).
         *
         * Uso recomendado:
         *   bg-primary-500 text-white        → botões, ações principais
         *   bg-primary-50  text-primary-700  → fundos suaves (light mode)
         *   bg-primary-900/30                → fundos suaves (dark mode)
         *   text-primary-500                 → links, ícones ativos (light)
         *   text-primary-400                 → links, ícones ativos (dark)
         */
        /**
         * PRIMARY — driven by CSS custom properties so themes can swap the
         * entire palette at runtime without rebuilding Tailwind.
         * Values are space-separated RGB triplets; opacity modifiers work fine.
         * See index.css for the per-theme variable definitions.
         */
        primary: {
          50:  'rgb(var(--p50)  / <alpha-value>)',
          100: 'rgb(var(--p100) / <alpha-value>)',
          200: 'rgb(var(--p200) / <alpha-value>)',
          300: 'rgb(var(--p300) / <alpha-value>)',
          400: 'rgb(var(--p400) / <alpha-value>)',
          500: 'rgb(var(--p500) / <alpha-value>)',
          600: 'rgb(var(--p600) / <alpha-value>)',
          700: 'rgb(var(--p700) / <alpha-value>)',
          800: 'rgb(var(--p800) / <alpha-value>)',
          900: 'rgb(var(--p900) / <alpha-value>)',
          950: 'rgb(var(--p950) / <alpha-value>)',
        },

        /**
         * ACCENT — Limão/Chartreuse
         * Baseado em #CFFF5E (design system).
         * ATENÇÃO: use sempre com TEXT ESCURO (text-gray-900).
         * Nunca use accent com text-white — não passa AA.
         *
         * Uso recomendado:
         *   bg-accent-400 text-gray-900   → badges, destaques, CTAs secundários
         *   bg-accent-300 text-gray-800   → chips, tags
         *   text-accent-500               → ícones sobre fundo escuro (dark mode)
         */
        accent: {
          50:  '#FDFFF0',
          100: '#F8FFC9',
          200: '#F0FF99',
          300: '#E5FF66',
          400: '#CFFF5E',   // ← brand showcase (original)
          500: '#B3EE00',
          600: '#8EBB00',
          700: '#6A8C00',
          800: '#475D00',
          900: '#273300',
          950: '#131A00',
        },

        /**
         * SECONDARY — Lavanda (cor de apoio)
         * Baseado em #B87EED (design system).
         * Útil para cards de destaque, estado informativo, ilustrações.
         * secondary-500 passa AA com texto branco (≈ 4.7:1).
         *
         * Uso recomendado:
         *   bg-secondary-400 text-white   → cards/badges informativos
         *   text-secondary-400            → ícones suaves (dark mode)
         */
        secondary: {
          50:  '#FAF0FF',
          100: '#F4E1FF',
          200: '#E9C3FF',
          300: '#D99FFF',
          400: '#C47EED',   // ← brand showcase (≈ #B87EED original)
          500: '#A85CCF',   // ← com text-white ✓ AA (4.7:1)
          600: '#8C43AE',
          700: '#6E308D',
          800: '#52206C',
          900: '#36124A',
          950: '#1C0828',
        },
      }
    },
  },
  plugins: [],
}
