/** @type {import('tailwindcss').Config} */
// Estilo común de las apps (shared/ms-ui.css): letra Plus Jakarta Sans, tarjetas con sombra suave.
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', '"Segoe UI"', 'Roboto', 'sans-serif'] },
      boxShadow: { ms: '0 1px 2px rgba(15,23,42,.06), 0 4px 14px rgba(15,23,42,.05)' },
      borderRadius: { card: '18px' },
      // Letra «A intermedia»: un 7 % más grande y grises más oscuros para leer de cerca.
      fontSize: { xs: ['13px', '1.15rem'], sm: ['15px', '1.4rem'], base: ['17px', '1.55rem'] },
      colors: { slate: { 500: '#566579', 600: '#3B4A5E' } },
    },
  },
  plugins: [],
};
