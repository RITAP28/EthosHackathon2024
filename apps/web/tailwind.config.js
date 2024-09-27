const colors = require('tailwindcss/colors');

module.exports = {
  content: ['./src/renderer/**/*.{js,jsx,ts,tsx,ejs}'],
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {
      fontFamily: {
        Dmsans: ['DM Sans', 'sans-serif'],
        Philosopher: ['Philosopher', 'sans-serif'],
        SpaceGrotesk: ['SpaceGrotesk', 'sans-serif'],
        Dmserif: ['DM Serif Text', 'serif'],
        Code: ['Source Code Pro', 'monospace'],
      },
      colors: {
        sky: colors.sky,
        cyan: colors.cyan,
      },
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
};
