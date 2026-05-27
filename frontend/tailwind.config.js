/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Alto contraste: fundo claro, texto escuro, ação em verde forte.
        ink: '#1a1a1a',
        paper: '#ffffff',
        soft: '#f5f7f5',
        brand: '#15803d', // verde 700
        brandDark: '#166534',
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
