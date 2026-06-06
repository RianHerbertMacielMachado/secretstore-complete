/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Paleta gótica principal
        dark: {
          50: '#1a1a1a',
          100: '#0d0d0d',
          200: '#000000',
        },
        neon: {
          pink: '#ff007f',
          rose: '#ff1493',
          light: '#ff69b4',
          glow: '#ff1493',
        },
      },
      fontFamily: {
        gothic: ['Cinzel', 'Georgia', 'serif'],
        display: ['Playfair Display', 'serif'],
        body: ['Inter', 'sans-serif'],
      },
      backgroundImage: {
        'gothic-gradient': 'linear-gradient(135deg, #000000 0%, #1a0a0f 50%, #0d0005 100%)',
        'neon-gradient': 'linear-gradient(135deg, #ff007f 0%, #ff1493 50%, #ff69b4 100%)',
        'card-overlay': 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.1) 100%)',
      },
      boxShadow: {
        'neon-sm': '0 0 5px #ff007f, 0 0 10px #ff007f40',
        'neon': '0 0 10px #ff007f, 0 0 20px #ff007f40, 0 0 40px #ff007f20',
        'neon-lg': '0 0 20px #ff007f, 0 0 40px #ff007f60, 0 0 80px #ff007f30',
        'neon-xl': '0 0 30px #ff1493, 0 0 60px #ff149360, 0 0 120px #ff149330',
      },
      animation: {
        'pulse-neon': 'pulseNeon 2s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'heart-float': 'heartFloat 4s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'spin-slow': 'spin 8s linear infinite',
      },
      keyframes: {
        pulseNeon: {
          '0%, 100%': { boxShadow: '0 0 10px #ff007f, 0 0 20px #ff007f40' },
          '50%': { boxShadow: '0 0 20px #ff007f, 0 0 40px #ff007f60, 0 0 80px #ff007f30' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        glow: {
          from: { textShadow: '0 0 10px #ff007f, 0 0 20px #ff007f, 0 0 30px #ff007f' },
          to: { textShadow: '0 0 20px #ff1493, 0 0 30px #ff1493, 0 0 40px #ff1493' },
        },
        heartFloat: {
          '0%': { transform: 'translateY(0) rotate(0deg)', opacity: '1' },
          '100%': { transform: 'translateY(-100vh) rotate(360deg)', opacity: '0' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
}
