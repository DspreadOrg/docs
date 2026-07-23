const withNextra = require('nextra')({
  theme: 'nextra-theme-docs',
  themeConfig: './theme.config.jsx'
})

// Set correct basePath for GitHub Pages
const isDev = process.env.NODE_ENV !== 'production'
const basePath = isDev ? '' : '/docs'

module.exports = withNextra({
  output: 'export',
  experimental: {
    esmExternals: 'loose',
  },
  images: {
    unoptimized: true,
  },
  basePath,
  assetPrefix: basePath,
  trailingSlash: true,
  transpilePackages: [
    '@copilotkit/react-core',
    '@copilotkit/react-ui',
    '@copilotkitnext/react',
    'react-syntax-highlighter',
  ],
  webpack: (config) => {
    // Allow importing global CSS from node_modules (needed by CopilotKit/KaTeX)
    const cssRules = config.module.rules.find(
      (rule) => typeof rule.oneOf === 'object'
    );
    if (cssRules) {
      cssRules.oneOf.forEach((rule) => {
        if (
          rule.sideEffects === false &&
          rule.test &&
          rule.test.toString().includes('css')
        ) {
          delete rule.sideEffects;
        }
      });
    }
    return config;
  },
})

// If you have other Next.js configurations, you can pass them as the parameter above
