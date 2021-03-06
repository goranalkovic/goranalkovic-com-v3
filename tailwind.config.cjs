const colors = require('tailwindcss/colors')

const config = {
  darkMode: 'class',
  content: ["./src/**/*.{html,js,svelte,ts,md,mdx}"],

  theme: {
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      black: colors.black,
      white: colors.white,
      gray: colors.neutral,
      'rich-purple': {
        300: '#7270FF',
        500: '#322EFF',
        900: '#12121D',
      },
    },
    fontSize: {
      '12': '0.75rem',
      '14': ['0.875rem', '1.5'],
      '14w': ['0.875rem', {
        letterSpacing: '0.13125em',
        lineHeight: '1',
      }],
      '16': ['1rem', '1.5'],
      '18': ['1.125rem', '1.5'],
      '24': ['1.5rem', {
        letterSpacing: '-0.03em',
        lineHeight: '0.95',
      }],
      '40': ['2.5rem', {
        letterSpacing: '-0.03em',
        lineHeight: '0.95',
      }],
      '48': ['3rem', {
        letterSpacing: '-0.03em',
        lineHeight: '0.95',
      }],
      '60': ['3.75rem', {
        letterSpacing: '-0.03em',
        lineHeight: '0.95',
      }],
      '80': ['5rem', {
        letterSpacing: '-0.03em',
        lineHeight: '0.95',
      }],
      '96': ['6rem', {
        letterSpacing: '-0.03em',
        lineHeight: '0.95',
      }],
    },
    spacing: {
      '0': '0',
      '0.5px': '0.5px',
      'px': '1px',
      '1.5px': '1.5px',
      '2px': '2px',
      '3px': '3px',
      '5': '0.3125rem',
      '10': '0.625rem',
      '15': '0.9375rem',
      '20': '1.25rem',
      '25': '1.625rem',
      '30': '1.875rem',
      '36': '2.25rem',
      '40': '2.5rem',
      '48': '3rem',
      '60': '3.75rem',
      '80': '5rem',
      '100': '6.25rem',
      '120': '7.5rem',
      '160': '10rem',
      '180': '11.25rem',
      '300': '18.75rem',
      '420': '26.25rem',
    },
    extend: {
      fontFamily: {
        'sans': '"Inter var", Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
      },
      fill: theme => ({
        'rich-purple-300': theme('colors.rich-purple.300'),
        'rich-purple-500': theme('colors.rich-purple.500'),
        'rich-purple-900': theme('colors.rich-purple.900'),
        current: 'currentColor',
        none: 'none',
        black: theme('colors.black'),
        white: theme('colors.white'),
      }),
      maxWidth: {
        '420': '26.25rem',
      }
    },
  },

  plugins: [],
};

module.exports = config;
