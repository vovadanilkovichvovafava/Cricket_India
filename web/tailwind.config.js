/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eef7ff', 100: '#d9edff', 200: '#bbdfff', 300: '#8bcbff',
          400: '#54adff', 500: '#2b8aff', 600: '#1a6bf5', 700: '#1054e1',
          800: '#1444b6', 900: '#163c8f', 950: '#122757',
        },
        // Indian flag-inspired palette (subtle accents)
        saffron: {
          50: '#fff8f0', 100: '#fff0db', 200: '#ffddb3', 300: '#ffc580',
          400: '#ffaa4d', 500: '#FF9933', 600: '#e68529', 700: '#cc7020',
          800: '#a35a1a', 900: '#7a4315', 950: '#522d0e',
        },
        'india-green': {
          50: '#f0faf3', 100: '#d6f2df', 200: '#ade5c0', 300: '#77d196',
          400: '#40b86a', 500: '#1e9e4e', 600: '#138808', 700: '#107006',
          800: '#0d5905', 900: '#0a4204', 950: '#062b03',
        },
        navy: {
          50: '#f0f0ff', 100: '#ddddf8', 200: '#b8b8f0', 300: '#8888e0',
          400: '#5555cc', 500: '#2b2bb3', 600: '#1a1a99', 700: '#000080',
          800: '#000066', 900: '#00004d', 950: '#000033',
        },
        cricket: {
          pitch: '#2d6a4f', ball: '#c1121f', bat: '#e8d5b7', field: '#40916c',
          six: '#ffd60a', four: '#00b4d8', wicket: '#e63946', run: '#52b788',
        },
        ipl: {
          csk: '#FCCA06', mi: '#004BA0', rcb: '#EC1C24', kkr: '#3A225D',
          dc: '#004C93', srh: '#F7A721', rr: '#EA1A85', pbks: '#ED1B24',
          lsg: '#A72056', gt: '#1C1C1C',
        },
      },
    },
  },
  plugins: [],
};
