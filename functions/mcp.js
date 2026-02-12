import { createCloudflareHandler } from 'docusaurus-plugin-mcp-server/adapters';

let cachedHandler = null;

async function getHandler(env) {
  if (cachedHandler) return cachedHandler;

  const [docsRes, indexRes] = await Promise.all([
    env.ASSETS.fetch(new URL('https://placeholder/mcp/docs.json')),
    env.ASSETS.fetch(new URL('https://placeholder/mcp/search-index.json')),
  ]);

  const docs = await docsRes.json();
  const searchIndexData = await indexRes.json();

  cachedHandler = createCloudflareHandler({
    docs,
    searchIndexData,
    name: 'woovi-developers',
    version: '1.0.0',
    baseUrl: 'https://developers.woovi.com',
  });

  return cachedHandler;
}

export async function onRequest(context) {
  const handler = await getHandler(context.env);
  return handler(context.request);
}
