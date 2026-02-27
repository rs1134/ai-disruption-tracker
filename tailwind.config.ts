import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        serif: ['var(--font-playfair)', 'Georgia', 'Cambria', 'Times New Roman', 'serif'],
        sans: ['var(--font-inter)', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        paper: {
          DEFAULT: '#FFFFFF',
          warm: '#F8F7F2',
          cream: '#F2F0E8',
          muted: '#ECEAE2',
        },
        ink: {
          DEFAULT: '#111111',
          secondary: '#333333',
          muted: '#666666',
          light: '#999999',
          faint: '#CCCCCC',
        },
        rule: {
          DEFAULT: '#D5D0C8',
          light: '#E8E5DE',
          heavy: '#111111',
        },
        wsj: {
          red: '#C9151E',
          'red-dark': '#A01018',
          'red-light': '#FFF0F1',
        },
      },
      borderRadius: {
        DEFAULT: '0px',
        sm: '2px',
        md: '3px',
        lg: '4px',
        xl: '4px',
        '2xl': '4px',
        full: '9999px',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-in',
        'pulse-slow': 'pulse 2s cubic-bezier(0.4,0,0.6,1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
