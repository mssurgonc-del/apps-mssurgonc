/** @type {import('tailwindcss').Config} */
// Estilo común de las apps (shared/ms-ui.css): letra Plus Jakarta Sans, tarjetas con sombra suave.
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', '"Segoe UI"', 'Roboto', 'sans-serif'] },
      boxShadow: { ms: '0 1px 2px rgba(15,23,42,.06), 0 4px 14px rgba(15,23,42,.05)' },
      borderRadius: { card: '18px' },
    },
  },
  plugins: [],
};
