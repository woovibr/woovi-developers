import React from 'react';
import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import { usePluginData } from '@docusaurus/useGlobalData';

/**
 * Links into the API reference without anyone writing the URL.
 *
 * The anchor is Scalar's, and it embeds the tag slug — presentation, not
 * contract — so a renamed or merged tag silently breaks a hand-written link.
 * Resolving it from the spec at build time makes that a no-op, and an operation
 * that no longer exists fails the build instead of shipping a dead link.
 *
 *   <ApiLink method="POST" path="/api/v1/payment">Create a Payment Request</ApiLink>
 *   <ApiLink webhook="OPENPIX:CHARGE_COMPLETED">Charge completed</ApiLink>
 */

// Scalar's own slug: lowercase, drop the characters in its punctuation class,
// spaces to hyphens. `payment (request access)` -> `payment-request-access`.
const slugify = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[\0-\x1F!-,./:-@[-^`{-\xA9]/g, '')
    .replace(/ /g, '-');

type SpecOperation = { tags?: string[] };
type Spec = {
  paths?: Record<string, Record<string, SpecOperation>>;
  webhooks?: Record<string, Record<string, SpecOperation>>;
};

type Props = {
  /** HTTP method of the operation, with `path`. */
  method?: string;
  /** Path exactly as the spec declares it, e.g. `/api/v1/payment/{id}`. */
  path?: string;
  /** Webhook event name, e.g. `OPENPIX:CHARGE_COMPLETED`. */
  webhook?: string;
  children: React.ReactNode;
};

export default function ApiLink({ method, path, webhook, children }: Props) {
  const data = usePluginData('docusaurus-plugin-redoc', 'woovi') as
    | { spec?: Spec }
    | undefined;
  const spec = data?.spec;

  const target = webhook ? spec?.webhooks?.[webhook]?.post : spec?.paths?.[path]?.[method?.toLowerCase()];
  const describe = webhook ?? `${method?.toUpperCase()} ${path}`;

  if (!spec) {
    throw new Error(
      '<ApiLink>: the woovi spec is not in the build. Does the redocusaurus entry still carry `id: woovi`?',
    );
  }

  if (!target?.tags?.length) {
    throw new Error(`<ApiLink>: ${describe} is not in the served spec`);
  }

  const tag = slugify(target.tags[0]);
  const anchor = webhook
    ? `#tag/${tag}/webhook/POST/${slugify(webhook)}`
    : `#tag/${tag}/${method.toUpperCase()}${path}`;

  return <Link to={useBaseUrl(`/api${anchor}`)}>{children}</Link>;
}
