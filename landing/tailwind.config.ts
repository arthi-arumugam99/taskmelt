import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        beige: {
          DEFAULT: '#F5F1E8',
          light: '#FAF8F4',
          dark: '#E8E4DB',
        },
        taskmelt: {
          black: '#1A1A1A',
          gray: '#666666',
          pink: '#FFB3D9',
          peach: '#FFD4A8',
          blue: '#87CEEB',
          green: '#90EE90',
          red: '#FF6B6B',
        },
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
      },
      borderRadius: {
        'taskmelt': '24px',
      },
      borderWidth: {
        '3': '3px',
        '4': '4px',
      },
    },
  },
  plugins: [],
};

export default config;
