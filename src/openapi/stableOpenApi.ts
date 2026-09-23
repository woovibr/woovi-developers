type OpenApiRecord = Record<string, unknown>;

type StableSectionName =
  'On Ramp' | 'Off Ramp' | 'KYB' | 'KYB USD' | 'Limits' | 'Wallets';

type StableSection = {
  name: StableSectionName;
  description: string;
};

const STABLECOIN_PATH_PREFIX = '/api/v1/stablecoin';

const STABLE_SCOPES = {
  STABLECOIN_DEPOSIT_CREATE: 'Quote, create and approve stablecoin deposits',
  STABLECOIN_PAYOUT_CREATE: 'Quote, create and inspect stablecoin payouts',
  STABLECOIN_SUBACCOUNT_CREATE: 'Request a stablecoin subaccount and KYB',
  STABLECOIN_SUBACCOUNT_LIST:
    'Inspect stablecoin subaccounts, wallets and balances',
};

const STABLE_SECTIONS: StableSection[] = [
  {
    name: 'On Ramp',
    description:
      'Convert BRL received through Pix into stablecoins, from quote to on-chain settlement.',
  },
  {
    name: 'Off Ramp',
    description:
      'Convert a stablecoin balance into BRL and pay it out to a Pix destination.',
  },
  {
    name: 'KYB',
    description:
      'Request a stablecoin subaccount and follow its KYB review until it is confirmed.',
  },
  {
    name: 'KYB USD',
    description:
      'Submit and follow the KYB for the USD fiat rail of a confirmed stablecoin subaccount.',
  },
  {
    name: 'Limits',
    description:
      'Request a higher monthly stablecoin limit and attach the supporting documents.',
  },
  {
    name: 'Wallets',
    description:
      'Inspect deposit addresses and balances, and swap assets, optionally delivering them on-chain.',
  },
];

const getSection = (name: StableSectionName): StableSection => {
  const section = STABLE_SECTIONS.find((item) => item.name === name);

  if (!section) throw new Error(`Unknown stablecoin section: ${name}`);

  return section;
};

// First match wins, so more specific prefixes must come before broader ones.
const SECTION_RULES: Array<{ prefix: string; section: StableSectionName }> = [
  { prefix: '/quote', section: 'On Ramp' },
  { prefix: '/deposit', section: 'On Ramp' },
  { prefix: '/payout', section: 'Off Ramp' },
  { prefix: '/subaccount/kyb/usd', section: 'KYB USD' },
  { prefix: '/limit', section: 'Limits' },
  { prefix: '/wallets', section: 'Wallets' },
  { prefix: '/swap', section: 'Wallets' },
];

const SUBACCOUNT_WALLET_PATH = /^\/subaccount\/[^/]+\/(wallets|balances)$/;

const HTTP_METHODS = new Set([
  'delete',
  'get',
  'head',
  'options',
  'patch',
  'post',
  'put',
  'trace',
]);

const isRecord = (value: unknown): value is OpenApiRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const getStableSection = (path: string): StableSection => {
  const relativePath = path.slice(STABLECOIN_PATH_PREFIX.length);

  if (SUBACCOUNT_WALLET_PATH.test(relativePath)) return getSection('Wallets');

  const rule = SECTION_RULES.find(({ prefix }) =>
    relativePath.startsWith(prefix),
  );

  if (rule) return getSection(rule.section);

  if (relativePath.startsWith('/subaccount')) return getSection('KYB');

  return getSection('Wallets');
};

const tagOperations = (path: string, pathItem: unknown): unknown => {
  if (!isRecord(pathItem)) return pathItem;

  const section = getStableSection(path);

  return Object.fromEntries(
    Object.entries(pathItem).map(([key, value]) => {
      if (!HTTP_METHODS.has(key) || !isRecord(value)) return [key, value];

      return [key, { ...value, tags: [section.name] }];
    }),
  );
};

const replaceWithStableScopes = (components: unknown): unknown => {
  if (!isRecord(components) || !isRecord(components.securitySchemes)) {
    return components;
  }

  const securitySchemes = Object.fromEntries(
    Object.entries(components.securitySchemes).map(([name, scheme]) => {
      if (!isRecord(scheme) || !isRecord(scheme.flows)) return [name, scheme];

      const flows = Object.fromEntries(
        Object.entries(scheme.flows).map(([flowName, flow]) => [
          flowName,
          isRecord(flow) ? { ...flow, scopes: STABLE_SCOPES } : flow,
        ]),
      );

      return [name, { ...scheme, flows }];
    }),
  );

  return { ...components, securitySchemes };
};

/**
 * Creates the focused document rendered at /stable from the canonical Woovi
 * OpenAPI document. Components are intentionally preserved so every $ref in a
 * stablecoin operation keeps resolving, while unrelated paths and webhooks are
 * removed from the reference.
 */
const buildStableOpenApi = (document: unknown): OpenApiRecord => {
  if (!isRecord(document) || !isRecord(document.paths)) {
    throw new Error('The Woovi OpenAPI document is invalid.');
  }

  const stablePaths = Object.entries(document.paths)
    .filter(([path]) => path.startsWith(STABLECOIN_PATH_PREFIX))
    .sort(([pathA], [pathB]) => {
      const sectionA = STABLE_SECTIONS.indexOf(getStableSection(pathA));
      const sectionB = STABLE_SECTIONS.indexOf(getStableSection(pathB));

      return sectionA - sectionB;
    })
    .map(([path, pathItem]) => [path, tagOperations(path, pathItem)]);

  if (stablePaths.length === 0) {
    throw new Error(
      'No stablecoin endpoints were found in the Woovi OpenAPI document.',
    );
  }

  const stableDocument: OpenApiRecord = {
    ...document,
    info: {
      ...(isRecord(document.info) ? document.info : {}),
      title: 'Woovi Stablecoin API',
      description:
        'APIs for BRL on-ramp, Pix off-ramp, subaccount KYB (BRL and USD), monthly limits and stablecoin wallets.',
    },
    tags: STABLE_SECTIONS,
    paths: Object.fromEntries(stablePaths),
    components: replaceWithStableScopes(document.components),
  };

  delete stableDocument.webhooks;

  return stableDocument;
};

export { buildStableOpenApi, STABLE_SECTIONS, STABLECOIN_PATH_PREFIX };
export type { StableSection, StableSectionName };
