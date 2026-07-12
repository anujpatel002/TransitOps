/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0A0A0A',
        panel: '#141414',
        border: '#262626',
        sidebar: '#111111',
        'sidebar-border': '#1F1F1F',
        'text-primary': '#F5F5F5',
        'text-muted': '#8A8A8A',
        accent: '#D68910',
        'accent-hover': '#C2760C',
      },
    },
  },
  plugins: [],
};
