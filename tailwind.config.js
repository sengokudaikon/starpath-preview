/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
       'cyber-pink': '#ff2a6d',
        'cyber-purple': '#d300c5',
        'cyber-blue': '#00fff5',
        'cyber-blue-metal': '#134176',
        'cyber-green': '#05ffa1',
        'cyber-yellow': '#f9f002',
        'fantasy-blood': '#a30000',
        'fantasy-crimson': '#dc2626',
        'fantasy-gold': '#ac8217',
        'fantasy-frost': '#2b34bf',
        'fantasy-ice': '#0891b2',
        'fantasy-malachite': '#0f562b',
      },
      backgroundImage: {
        'cyber-pattern': 'linear-gradient(to right, #0a0a2e 1px, transparent 1px), linear-gradient(to bottom, #0a0a2e 1px, transparent 1px)',
        'fantasy-texture': 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' viewBox=\'0 0 100 100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.8\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100\' height=\'100\' filter=\'url(%23noise)\' opacity=\'0.08\'/%3E%3C/svg%3E")',
      }
    },
  },
  plugins: [],
}
