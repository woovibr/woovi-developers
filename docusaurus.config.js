import fs from 'node:fs';
import path from 'node:path';
import { themes } from 'prism-react-renderer';
import mdxMermaid from 'mdx-mermaid';
import remarkApiRefLinks from './plugins/remarkApiRefLinks.mjs';

const lightCodeTheme = themes.github;
const darkCodeTheme = themes.dracula;

const locales = ['pt-BR', 'en'];

const localeConfigs = {
  en: {
    label: 'English',
  },
  'pt-BR': {
    label: 'Português',
  },
};

const docsTrees = [
  'docs',
  ...locales.map((locale) => `i18n/${locale}/docusaurus-plugin-content-docs/current`),
];

// A relative .md link does not cross the translation boundary: the resolver only
// looks in the tree of the locale being built. facebook/docusaurus#10907
const resolveAcrossLocales = ({ sourceFilePath, url }) => {
  const [target, anchor] = url.split('#');
  if (!/\.mdx?$/.test(target)) return console.warn(`[links] unresolved ${url} in ${sourceFilePath}`);

  const filePath = path.posix.normalize(path.posix.join(path.posix.dirname(sourceFilePath), target));
  const tree = docsTrees.find((dir) => filePath.startsWith(`${dir}/`));
  if (!tree) return console.warn(`[links] unresolved ${url} in ${sourceFilePath}`);

  const docPath = filePath.slice(tree.length + 1);
  const found = docsTrees.map((dir) => path.join(dir, docPath)).find((file) => fs.existsSync(file));
  if (!found) return console.warn(`[links] ${url} in ${sourceFilePath} has no file in any locale`);

  // the route comes from the frontmatter id when it is set, not from the file name
  const [, frontmatter = ''] = fs.readFileSync(found, 'utf-8').split(/^---$/m);
  const id = frontmatter.match(/^id:\s*(\S+)/m);
  const route = id ? path.posix.join(path.posix.dirname(docPath), id[1]) : docPath.replace(/\.mdx?$/, '');

  return `/docs/${route}${anchor ? `#${anchor}` : ''}`;
};

module.exports = {
  markdown: {
    mermaid: true,
    hooks: {
      onBrokenMarkdownLinks: resolveAcrossLocales,
    },
  },
  themes: ['@docusaurus/theme-mermaid'],
  future: {
    v4: {
      removeLegacyPostBuildHeadAttribute: true,
    },
    faster: {
      swcJsLoader: true,
      swcJsMinimizer: true,
      swcHtmlMinimizer: true,
      lightningCssMinimizer: true,
      rspackBundler: true,
      rspackPersistentCache: true,
      mdxCrossCompilerCache: true,
      ssgWorkerThreads: true,
    },
  },
  i18n: {
    defaultLocale: 'pt-BR',
    locales,
    localeConfigs,
  },
  title: 'Woovi Developers',
  tagline: 'Instant payments Docs, APIs, SDKs',
  url: 'https://developers.woovi.com',
  baseUrl: '/',
  organizationName: 'woovi',
  projectName: 'developer-portal',
  scripts: [],
  favicon: 'img/icons/woovi.svg',
  onBrokenLinks: 'throw',
  trailingSlash: false,
  plugins: [
    [
      'docusaurus-plugin-llms',
      {
        generateLLMsTxt: true,
        generateLLMsFullTxt: true,
        docsDir: 'docs',
        title: 'Woovi Developers',
        description: 'Instant payments Docs, APIs, SDKs',
      },
    ],
    // [
    //   'docusaurus-plugin-mcp-server',
    //   {
    //     outputDir: 'mcp',
    //     server: {
    //       name: 'woovi-developers',
    //       version: '1.0.0',
    //     },
    //     excludeRoutes: ['/404*', '/search*', '/api-redoc*', '/pix*', '/dict*', '/indirect*'],
    //   },
    // ],
    [
      '@gracefullight/docusaurus-plugin-microsoft-clarity',
      { projectId: 'j6ihzvjzvu' },
    ],
    require.resolve('./webpack/sitePlugin'),
    [
      require.resolve('@cmfcmf/docusaurus-search-local'),
      {
        language: ['pt', 'en'],
      },
    ],
    [
      '@docusaurus/plugin-client-redirects',
      {
        redirects: [
          {
            from: '/docs/baas/documents-nescessary',
            to: '/docs/baas/documentos-kyc',
          },
          {
            from: '/docs/baas/baas-compliance',
            to: '/docs/baas/documentos-kyc',
          },
          {
            from: '/docs/ecommerce/woocommerce-plugin',
            to: '/docs/ecommerce/woocommerce/woocommerce-plugin',
          },
          {
            from: '/docs/ecommerce/woocommerce-subscriptions',
            to: '/docs/ecommerce/woocommerce/woocommerce-subscriptions',
          },
          {
            from: '/docs/ecommerce/magento1-plugin',
            to: '/docs/ecommerce/magento1/magento1-plugin',
          },
          {
            from: '/docs/ecommerce/magento2-plugin',
            to: '/docs/ecommerce/magento2/magento2-plugin',
          },
          {
            from: '/docs/ecommerce/oracle-commerce-cloud',
            to: '/docs/ecommerce/oracle/occ-getting-started',
          },
          {
            from: '/docs/getting-started',
            to: '/docs/intro/getting-started',
          },
          {
            from: '/docs/pix-automatic/pix-automatic-in-sandbox',
            to: '/docs/test-environment/pix-automatic-in-sandbox',
          },
          {
            from: '/docs/charge/refund/charge-refund-create-api',
            to: '/docs/refund/charge-refund-create-api',
          },
          {
            from: '/docs/charge/refund/charge-refund-get-all-api',
            to: '/docs/refund/charge-refund-get-all-api',
          },
          {
            from: '/docs/category/segurança',
            to: '/docs/category/security',
          },
          {
            from: '/docs/category/segurança-1',
            to: '/docs/category/security',
          },
          {
            from: '/docs/category/reembolso-de-cobrança',
            to: '/docs/category/refund',
          },
          {
            from: '/docs/category/reembolso-de-cobrança-1',
            to: '/docs/category/refund',
          },
          {
            from: '/docs/category/how-to',
            to: '/docs/category/charge-how-to',
          },
          {
            from: '/docs/category/how-to-1',
            to: '/docs/plugin/how-to-render-plugin-without-modal',
          },
          {
            from: '/docs/category/webhooks',
            to: '/docs/category/pix-automatic-webhooks',
          },
          {
            from: '/docs/category/webhook-1',
            to: '/docs/category/webhook',
          },
          {
            from: '/docs/category/webhook-2',
            to: '/docs/category/webhook',
          },
          {
            from: '/docs/webhook/api/webhook-api',
            to: '/docs/webhook/webhook-api',
          },
          {
            from: '/docs/category/api',
            to: '/docs/webhook/webhook-api',
          },
          {
            from: '/docs/plugin/how-to/how-to-render-plugin-without-modal',
            to: '/docs/plugin/how-to-render-plugin-without-modal',
          },
          {
            from: '/docs/flows/webhook/flow-create-webhook',
            to: '/docs/webhook/platform/webhook-platform-api',
          },
          {
            from: '/docs/category/flows-webhook',
            to: '/docs/webhook/platform/webhook-platform-api',
          },
          {
            from: '/docs/category/plugin-how-to',
            to: '/docs/plugin/how-to-render-plugin-without-modal',
          },
        ],
      },
    ],
  ],
  themeConfig: {
    mermaid: {
      options: {
        securityLevel: 'loose',
      },
    },
    navbar: {
      title: 'Woovi Developers',
      logo: {
        alt: 'Woovi Developers',
        src: 'img/icons/woovi.svg',
      },
      items: [
        {
          to: 'docs/intro/getting-started',
          label: 'Documentação',
          position: 'left',
        },
        {
          to: '/api',
          label: 'API',
          position: 'left',
        },
        {
          to: '/stable',
          label: 'Stable',
          position: 'left',
        },
        {
          to: 'docs/apis/api-explorer',
          label: 'API Explorer',
          position: 'left',
        },
        {
          to: 'docs/webhook/webhook-events-explorer',
          label: 'Webhook Explorer',
          position: 'left',
        },
        {
          to: 'docs/plugin',
          label: 'Plugin',
          position: 'left',
        },
        {
          to: 'docs/tags',
          position: 'left',
          label: 'Tags',
        },
        {
          href: 'https://woovi.com/',
          label: 'Woovi',
          position: 'right',
        },
        {
          href: 'https://github.com/Open-Pix/woovi-developers',
          label: 'Github',
          position: 'right',
        },
        // {
        //   to: 'docs/help',
        //   label: 'Help',
        //   position: 'right',
        // },
        {
          type: 'localeDropdown',
          position: 'right',
        },
      ],
    },
    prism: {
      theme: lightCodeTheme,
      darkTheme: darkCodeTheme,
      additionalLanguages: ['php'],
    },
    footer: {
      links: [
        {
          label: 'Woovi',
          href: 'https://woovi.com',
        },
        {
          label: 'OpenPix',
          href: 'https://openpix.com.br',
        },
      ],
      copyright: 'Copyright © Woovi / OpenPix',
    },
  },
  presets: [
    [
      '@docusaurus/preset-classic',
      {
        docs: {
          showLastUpdateAuthor: true,
          showLastUpdateTime: true,
          path: './docs',
          sidebarPath: './sidebars.js',
          editUrl: ({ versionDocsDirPath, docPath }) => {
            return `https://github.com/Open-Pix/woovi-developers/edit/main/${versionDocsDirPath}/${docPath}`;
          },
          editCurrentVersion: true,
          remarkPlugins: [
            mdxMermaid,
            [
              remarkApiRefLinks,
              { specUrl: 'https://api.woovi.com/api/openapi.json' },
            ],
          ],
        },
        // "blog": {
        //   "path": "blog"
        // },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
        googleAnalytics: {
          trackingID: 'G-DFFLN19210',
        },
      },
    ],
    [
      'redocusaurus',
      {
        specs: [
          {
            route: '/pix/',
            spec: './static/swaggers/bacen-pix.yaml',
          },
          {
            route: '/dict/',
            spec: './static/swaggers/bacen-dict.json',
          },
          {
            // `id` names the plugin instance whose global data <ApiLink> reads;
            // without it the id is positional (`plugin-redoc-<index>`).
            id: 'woovi',
            route: '/api-redoc/',
            spec: 'https://api.woovi.com/api/openapi.json',
          },
          {
            route: '/indirect/',
            spec: './static/swaggers/pixIndirect.json',
          },
        ],
      },
    ],
  ],
};
