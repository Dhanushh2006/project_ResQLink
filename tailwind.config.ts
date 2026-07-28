import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // Layered deep-green surfaces (editorial monochrome)
        bg: '#0E1608',
        surface: '#16210D',
        raised: '#1E2C12',
        overlay: '#273818',
        line: '#35481F',
        'line-soft': '#233110',
        ink: {
          DEFAULT: '#EEF3E6',
          muted: '#AEBE97',
          faint: '#7E8E64',
          dim: '#586743',
        },
        // Accent = bright lime/green
        brand: {
          50: '#f5fbe8',
          100: '#e8f6c8',
          200: '#d3ec96',
          300: '#bef264',
          400: '#a3e635',
          500: '#84cc16',
          600: '#65a30d',
          700: '#4d7c0f',
        },
        // Functional status colors (kept for operational clarity)
        sev: {
          critical: '#F0475A',
          high: '#FB8A3C',
          moderate: '#F5C147',
          low: '#4ADE80',
          info: '#a3e635',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'Inter', 'Segoe UI', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
        display: ['var(--font-display)', 'Archivo', 'Inter', 'system-ui', 'sans-serif'],
        poster: ['var(--font-poster)', 'Anton', 'Impact', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
      },
      borderRadius: {
        xl: '0.75rem',
        '2xl': '1rem',
      },
      boxShadow: {
        panel: '0 1px 0 0 rgba(255,255,255,0.03) inset, 0 12px 40px -12px rgba(0,0,0,0.6)',
        raised: '0 1px 0 0 rgba(255,255,255,0.04) inset, 0 2px 8px rgba(0,0,0,0.4)',
        drawer: '-24px 0 60px -20px rgba(0,0,0,0.75)',
      },
      keyframes: {
        pulseRing: {
          '0%': { boxShadow: '0 0 0 0 rgba(240,71,90,0.5)' },
          '70%': { boxShadow: '0 0 0 12px rgba(240,71,90,0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(240,71,90,0)' },
        },
        fadeIn: { from: { opacity: '0', transform: 'translateY(6px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        slideInRight: { from: { opacity: '0', transform: 'translateX(24px)' }, to: { opacity: '1', transform: 'translateX(0)' } },
        slideInUp: { from: { opacity: '0', transform: 'translateY(16px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        scaleIn: { from: { opacity: '0', transform: 'scale(0.97)' }, to: { opacity: '1', transform: 'scale(1)' } },
        shimmer: { '0%': { backgroundPosition: '100% 50%' }, '100%': { backgroundPosition: '0 50%' } },
        countPop: { '0%': { transform: 'scale(1)' }, '40%': { transform: 'scale(1.18)', color: '#a3e635' }, '100%': { transform: 'scale(1)' } },
        blink: { '0%, 100%': { opacity: '1' }, '50%': { opacity: '0.35' } },
      },
      animation: {
        pulseRing: 'pulseRing 2s infinite',
        fadeIn: 'fadeIn 0.28s cubic-bezier(0.16,1,0.3,1)',
        slideInRight: 'slideInRight 0.32s cubic-bezier(0.16,1,0.3,1)',
        slideInUp: 'slideInUp 0.3s cubic-bezier(0.16,1,0.3,1)',
        scaleIn: 'scaleIn 0.2s cubic-bezier(0.16,1,0.3,1)',
        countPop: 'countPop 0.5s ease-out',
        blink: 'blink 1.6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
export default config;
