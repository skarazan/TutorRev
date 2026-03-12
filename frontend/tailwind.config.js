/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          900: '#0f0f1a',
          800: '#1a1a2e',
          700: '#242442',
          600: '#2e2e52',
        },
        coffee: {
          300: '#A67B5B',
          400: '#8B6914',
          500: '#6F4E37',
          600: '#5C3D2E',
          700: '#4A2C20',
        },
        java: {
          400: '#FF8A65',
          500: '#E76F51',
          600: '#EA2D2E',
          700: '#C62828',
        },
        cream: {
          100: '#FFF8F0',
          200: '#F5E6CC',
          300: '#E8D5B7',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
}
