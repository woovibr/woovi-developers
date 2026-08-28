type OpenApiRecord = Record<string, unknown>;

type StableSection = {
  name: 'On Ramp' | 'Off Ramp' | 'Wallets';
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
    name: 'Wallets',
    description:
      'Create and inspect stablecoin subaccounts, deposit addresses and available balances.',
  },
];

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
  if (
    path === `${STABLECOIN_PATH_PREFIX}/quote` ||
    path.startsWith(`${STABLECOIN_PATH_PREFIX}/deposit`)
  ) {
    return STABLE_SECTIONS[0];
  }

  if (path.startsWith(`${STABLECOIN_PATH_PREFIX}/payout`)) {
    return STABLE_SECTIONS[1];
  }

  return STABLE_SECTIONS[2];
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
        'APIs for BRL on-ramp, Pix off-ramp and stablecoin wallet infrastructure.',
    },
    tags: STABLE_SECTIONS,
    paths: Object.fromEntries(stablePaths),
    components: replaceWithStableScopes(document.components),
  };

  delete stableDocument.webhooks;

  return stableDocument;
};

export { buildStableOpenApi, STABLE_SECTIONS, STABLECOIN_PATH_PREFIX };
export type { StableSection };
