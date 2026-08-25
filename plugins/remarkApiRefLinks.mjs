import { visit } from 'unist-util-visit';

/**
 * Keeps links into the API reference pointing at the right place.
 *
 * The Scalar anchor embeds the tag slug, and a tag is presentation rather than
 * contract — it has been renamed twice here, both times for access gating, and
 * both times every doc link to it went stale in silence. Method and path are in
 * the anchor though, so the current tag can be looked up in the served spec and
 * written in at build time.
 *
 * The tag in the link is ignored and recomputed:
 *
 *   [label](/api#tag/<anything>/GET/api/v1/payment/{id})
 *
 * An operation the served spec does not have fails the build.
 *
 * Webhook events are deliberately not handled yet. Their anchor carries a lossy
 * slug of the event name (`OPENPIX:CHARGE_COMPLETED` -> `openpixcharge_completed`),
 * which needs a reverse index of the spec — and the served spec has no
 * `webhooks` section until entria/woovi-openapi#72 ships and a release goes out,
 * so that path cannot be exercised yet.
 */

const STRIP = /[\0-\x1F!-,./:-@[-^`{-\xA9]/g;
const slugify = (value) => value.toLowerCase().replace(STRIP, '').replace(/ /g, '-');

const METHODS = 'GET|POST|PUT|PATCH|DELETE';
const REFERENCE = new RegExp(`^(/(?:en/)?api)#tag/[^/]+/(${METHODS})(/.*)$`);

let pending;

const loadSpec = (specUrl) => {
  pending ??= fetch(specUrl).then(async (res) => {
    if (!res.ok) {
      throw new Error(`remarkApiRefLinks: ${specUrl} answered ${res.status}`);
    }
    return res.json();
  });

  return pending;
};

export default function remarkApiRefLinks({ specUrl }) {
  return async (tree, file) => {
    const links = [];

    visit(tree, 'link', (node) => {
      if (typeof node.url !== 'string') {
        return;
      }
      if (REFERENCE.test(node.url)) {
        links.push(node);
      }
    });

    if (!links.length) {
      return;
    }

    const spec = await loadSpec(specUrl);
    const where = file?.path ?? '<unknown file>';

    for (const node of links) {
      const [, base, method, path] = REFERENCE.exec(node.url);
      const operation = spec.paths?.[path]?.[method.toLowerCase()];

      if (!operation?.tags?.length) {
        throw new Error(`remarkApiRefLinks: ${where} links to ${method} ${path}, which the served spec does not have`);
      }

      node.url = `${base}#tag/${slugify(operation.tags[0])}/${method}${path}`;
    }
  };
}
