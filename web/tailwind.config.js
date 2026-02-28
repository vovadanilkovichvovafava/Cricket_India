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
