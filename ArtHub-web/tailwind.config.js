/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        main: 'var(--main-color)',
        'main-light': 'var(--main-color-light)',
        'main-deep': 'var(--main-color-deep)',
        warm: 'var(--com-color-warm)',
        cold: 'var(--com-color-cold)',
        warn: 'var(--com-color-warn)',
        'text-primary': 'var(--main-text)',
        'text-secondary': 'var(--com-text)',
        'text-low': 'var(--low-color)',
        'page-back': 'var(--page-back)',
      },
      borderRadius: {
        'card': '8rpx',
      },
      borderWidth: {
        'thin': '2rpx',
        'medium': '4rpx',
        'thick': '6rpx',
      },
    },
  },
  plugins: [],
};