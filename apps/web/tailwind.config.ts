import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Heebo', 'Rubik', 'system-ui', '-apple-system', 'Segoe UI', 'Arial', 'sans-serif'],
      },
      colors: {
        brand: { DEFAULT: '#14161c' },
        accent: { DEFAULT: '#f4a52a', soft: '#fff1d6' },
        danger: { DEFAULT: '#ef4444', soft: '#fff1f2' },
      },
      maxWidth: {
        tablet: '820px',
      },
    },
  },
  plugins: [],
};

export default config;
