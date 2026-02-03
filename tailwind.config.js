/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Cores principais do tema dark
        dark: {
          50: '#f5f3ff',   // Roxo muito claro
          100: '#ede9fe',  // Roxo claro
          200: '#ddd6fe',  
          300: '#c4b5fd',  
          400: '#a78bfa',  
          500: '#8b5cf6',  // Roxo principal
          600: '#7c3aed',  
          700: '#6d28d9',  
          800: '#5b21b6',  
          900: '#4c1d95',  // Roxo escuro
        },
        background: {
          primary: '#0a0a0f',    // Preto principal
          secondary: '#121218',  // Preto secundário
          tertiary: '#1a1a24',   // Preto terciário (cards)
        },
        surface: {
          dark: '#1e1e2e',
          medium: '#27273a',
          light: '#2f2f47',
        }
      },
    },
  },
  plugins: [],
}