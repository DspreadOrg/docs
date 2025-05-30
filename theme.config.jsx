import Image from 'next/image'
import { Analytics } from '@vercel/analytics/react';

const github = 'https://github.com/DspreadOrg/docs';

import { useConfig, useTheme } from 'nextra-theme-docs';
import { useRouter } from 'next/router';
import DspreadLogo from './public/dspread-logo.png';
const Logo = ({ height, width }) => {
  const { theme } = useTheme();
  const config = useConfig();
  return (
    <div style={{ alignItems: 'center', display: 'flex', gap: '8px' }}>
       <Image src={DspreadLogo} alt="Dspread logo" width={width} height={height} />
      <span style={{ fontWeight: 'bold', fontSize: 18 }}>Dspread Doc</span>
    </div>
  );
};

const config = {
  docsRepositoryBase: `${github}/blob/main`,
  chat: {
    link: 'https://discord.com/invite/n5BX8dh8rU',
  },
  banner: {
    key: 'docs-launch',
    text: (
      <div className="flex justify-center items-center gap-2">
        Welcome to the Dspread Documentation! 👋
      </div>
    ),
  },
  toc: {
    float: true,
  },
  project: {
    link: github,
  },
  darkMode: true,
  nextThemes: {
    defaultTheme: 'light',
  },
  primaryHue: {
    dark: 207,
    light: 212,
  },
  footer: {
    text: (
      <div>
        <span>{new Date().getFullYear()} © </span>
        <a href="#" target="_blank">
          Dspread
        </a>
      </div>
    ),
  },
  editLink: {
    text: 'Edit this page on GitHub',
  },
  logo() {
    return (
      <div className="flex items-center gap-2">
        <Logo width={28} height={28} />
      </div>
    );
  },
  useNextSeoProps() {
    return {
      titleTemplate: `%s - Dspread Documentation`,
    };
  },

  head() {
    const { frontMatter } = useConfig();
    const { theme } = useTheme();
    const config = useConfig();
    const basePath = config.basePath || '';
    const title = frontMatter?.title || 'Dspread Documentation';
    const description =
      frontMatter?.description ||
      'Dspread Documentation - Payment integration guide'
    const image = `https://raw.githubusercontent.com/DspreadOrg/docs/main/public/dspread-logo.png`;

    const composedTitle = `${title} – Dspread Documentation`;

    return (
      <>
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/docs/favicons/apple-touch-icon.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/docs/favicons/favicon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/docs/favicons/favicon-16x16.png"
        />
        <meta name="theme-color" content="#ffffff" />
        <meta name="msapplication-TileColor" content="#00a300" />
        <link rel="manifest" href="/docs/favicons/site.webmanifest" />
        <meta httpEquiv="Content-Language" content="en" />
        <meta name="title" content={composedTitle} />
        <meta name="description" content={description} />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@Dspread" />
        <meta name="twitter:image" content={image} />

        <meta property="og:description" content={description} />
        <meta property="og:title" content={composedTitle} />
        <meta property="og:image" content={image} />
        <meta property="og:type" content="website" />
        <meta
          name="apple-mobile-web-app-title"
          content="Dspread Documentation"
        />

      </>
    );
  },
  sidebar: {
    defaultMenuCollapseLevel: 1,
    toggleButton:true,
    autoCollapse: true,
    titleComponent: ({ title, type }) =>
      type === 'separator' ? (
        <div className="separator-title">
          {title}
        </div>
      ) : (
        <>{title}
        </>
      ),
  },

  gitTimestamp: ({ timestamp }) => (
    <>Last updated on {timestamp.toLocaleDateString()}</>
  ),
};

export default config;