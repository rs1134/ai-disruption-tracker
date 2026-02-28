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
        // Surface
        paper: {
          DEFAULT: '#FFFFFF',
          warm: '#F8FAFC',
          muted: '#F1F5F9',
        },
        ink: {
          DEFAULT: '#0F172A',
          secondary: '#334155',
          muted: '#64748B',
          light: '#94A3B8',
          faint: '#CBD5E1',
        },
        rule: {
          DEFAULT: '#E2E8F0',
          light: '#F1F5F9',
          heavy: '#0F172A',
        },
        // Category accent colors
        cat: {
          layoffs:    '#EF4444', // red-500
          funding:    '#10B981', // emerald-500
          product:    '#3B82F6', // blue-500
          regulation: '#F59E0B', // amber-500
          breakthrough:'#8B5CF6',// purple-500
          acquisition:'#06B6D4', // cyan-500
          general:    '#64748B', // slate-500
        },
        // Brand
        brand: {
          DEFAULT: '#6366F1', // indigo-500
          dark:    '#4F46E5',
          light:   '#A5B4FC',
        },
      },
      borderRadius: {
        DEFAULT: '8px',
        sm:   '4px',
        md:   '6px',
        lg:   '8px',
        xl:   '12px',
        '2xl':'16px',
        '3xl':'20px',
        full: '9999px',
      },
      boxShadow: {
        'card':     '0 1px 3px 0 rgb(0 0 0 / 0.08), 0 1px 2px -1px rgb(0 0 0 / 0.05)',
        'card-md':  '0 4px 6px -1px rgb(0 0 0 / 0.08), 0 2px 4px -2px rgb(0 0 0 / 0.05)',
        'card-hover':'0 10px 15px -3px rgb(0 0 0 / 0.10), 0 4px 6px -4px rgb(0 0 0 / 0.06)',
        'hero':     '0 20px 25px -5px rgb(0 0 0 / 0.12), 0 8px 10px -6px rgb(0 0 0 / 0.08)',
      },
      animation: {
        'fade-in':    'fadeIn 0.25s ease-out',
        'slide-up':   'slideUp 0.3s ease-out',
        'pulse-slow': 'pulse 2s cubic-bezier(0.4,0,0.6,1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
