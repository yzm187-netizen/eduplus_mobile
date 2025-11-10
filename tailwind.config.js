/** @type {import('tailwindcss').Config} */

module.exports = {
  // Keep content globs tight so Tailwind scanning is fast.
  // Only include files that actually use `className`.
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        brand: {
          purple: '#2B0D52', // deep purple base
          purpleAlt: '#3A136A',
          teal: '#00AFC8', // glow center
          tealDark: '#007A8C',
        },
      },
      backgroundImage: {
        'brand-noise': 'radial-gradient(circle at 30% 50%, rgba(0,175,200,0.35), rgba(43,13,82,0.9) 60%)',
      },
    },
  },
  safelist: [
    // Ensure critical classes exist while we validate the scan coverage
    'h-2',
    'bg-red-500',
    'flex-1',
    'bg-neutral-50',
    'dark:bg-black',
    'rounded-3xl',
    'bg-emerald-600',
    'dark:bg-emerald-700',
    'border',
    'border-neutral-200',
    'dark:border-neutral-800',
    'bg-white',
    'dark:bg-neutral-900',
    'text-neutral-500',
    'dark:text-neutral-400',
  ],
  plugins: [],
};

