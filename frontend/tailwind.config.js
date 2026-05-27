/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Paleta da logo: grafite (fundo escuro), âmbar (laranja), branco e cinza-claro.
        graphite: '#353537',
        graphiteDark: '#2b2b2d',
        amber: '#f2a640',
        amberDark: '#d9831f',
        ink: '#2e2a27', // texto escuro (alto contraste)
        paper: '#ffffff',
        soft: '#f5f1ea', // fundo creme quente
        line: '#d9d9d9',
        danger: '#b91c1c',
      },
      fontSize: {
        // Fontes grandes para usuário de 60 anos.
        base: ['1.125rem', { lineHeight: '1.6' }], // 18px
        lg: ['1.375rem', { lineHeight: '1.5' }], // 22px
        xl: ['1.625rem', { lineHeight: '1.4' }], // 26px
        '2xl': ['2rem', { lineHeight: '1.3' }], // 32px
        '3xl': ['2.5rem', { lineHeight: '1.2' }], // 40px
      },
    },
  },
  plugins: [],
};
