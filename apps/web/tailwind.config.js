/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'system-ui', '-apple-system', 'sans-serif'],
      },
      fontSize: {
        xs:   ['0.8rem',   { lineHeight: '1.5' }],
        sm:   ['0.925rem', { lineHeight: '1.5' }],
        base: ['1.0625rem',{ lineHeight: '1.6' }],
        lg:   ['1.175rem', { lineHeight: '1.5' }],
        xl:   ['1.3rem',   { lineHeight: '1.4' }],
        '2xl':['1.55rem',  { lineHeight: '1.3' }],
      },
      colors: {
        bg:              'var(--color-bg)',
        panel:           'var(--color-panel)',
        border:          'var(--color-border)',
        sidebar:         'var(--color-sidebar)',
        'sidebar-border':'var(--color-sidebar-border)',
        'text-primary':  'var(--color-text-primary)',
        'text-muted':    'var(--color-text-muted)',
        accent:          '#D68910',
        'accent-hover':  '#C2760C',
      },
    },
  },
  plugins: [],
};
