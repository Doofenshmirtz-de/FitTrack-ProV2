import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: 'class',
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // FitTrack Pro Color Palette (Whoop-inspired Dark Mode)
        background: '#0a0a0a',
        elevated: '#141414',
        overlay: '#1a1a1a',
        border: {
          DEFAULT: '#262626',
          focus: '#404040',
        },
        // Text colors
        foreground: {
          DEFAULT: '#ffffff',
          secondary: '#a1a1aa',
          tertiary: '#71717a',
        },
        // Accent colors
        accent: {
          primary: '#10b981',   // Emerald - Success, Recovery
          secondary: '#3b82f6', // Blue - Info, Training
          warning: '#f59e0b',   // Amber - Warning, Moderate Strain
          danger: '#ef4444',    // Red - Error, High Strain, Neglected
          purple: '#8b5cf6',    // Violet - PR, Personal Bests, AI Coach
          cyan: '#06b6d4',      // Cyan - Additional chart color
          orange: '#f97316',    // Orange - Additional chart color
          pink: '#ec4899',      // Pink - Additional chart color
        },
        // Status colors for muscle map
        muscle: {
          neglected: '#ef4444',      // >7 days
          recovering: '#f97316',     // 1-2 days + high volume
          fresh: '#22c55e',          // 3-5 days
          trained_light: '#3b82f6', // 1-2 days + low volume
          trained_heavy: '#8b5cf6', // Today
        },
        // Chart colors (8 distinguishable)
        chart: {
          1: '#10b981',
          2: '#3b82f6',
          3: '#f59e0b',
          4: '#ef4444',
          5: '#8b5cf6',
          6: '#06b6d4',
          7: '#f97316',
          8: '#ec4899',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        'display': ['2.5rem', { lineHeight: '1.1', fontWeight: '700' }],
        'h1': ['1.5rem', { lineHeight: '1.2', fontWeight: '600' }],
        'h2': ['1.25rem', { lineHeight: '1.3', fontWeight: '600' }],
        'h3': ['1.125rem', { lineHeight: '1.3', fontWeight: '500' }],
        'body': ['1rem', { lineHeight: '1.5', fontWeight: '400' }],
        'body-sm': ['0.875rem', { lineHeight: '1.5', fontWeight: '400' }],
        'caption': ['0.75rem', { lineHeight: '1.4', fontWeight: '500' }],
        'mono-lg': ['1.5rem', { lineHeight: '1.0', fontWeight: '500' }],
        'mono-sm': ['0.875rem', { lineHeight: '1.0', fontWeight: '400' }],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      maxWidth: {
        'app': '640px',
      },
      animation: {
        'shimmer': 'shimmer 1.5s ease-in-out infinite',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.2s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out',
        'scale-in': 'scaleIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        slideUp: {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.8)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      transitionTimingFunction: {
        'app': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      transitionDuration: {
        'app': '300ms',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
