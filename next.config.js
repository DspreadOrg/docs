const withNextra = require('nextra')({
  theme: 'nextra-theme-docs',
  themeConfig: './theme.config.jsx'
})

// Set correct basePath for GitHub Pages
const isDev = process.env.NODE_ENV !== 'production'
const basePath = isDev ? '' : '/docs'

module.exports = withNextra({
  output: 'export',
  images: {
    unoptimized: true,
  },
  basePath,
  assetPrefix: basePath,
  trailingSlash: true,
})

// If you have other Next.js configurations, you can pass them as the parameter above
