import qrcode from 'qrcode-generator';

export const API = 'https://api.woovi.com';

export const uuid = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        return (c === 'x' ? r : (r & 3) | 8).toString(16);
      });

export const hex = (n: number): string =>
  Array.from({ length: n }, () => ((Math.random() * 16) | 0).toString(16)).join(
    '',
  );

export const brl = (cents: number): string =>
  (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export const now = (): string => new Date().toISOString();

export const addSeconds = (s: number): string =>
  new Date(Date.now() + s * 1000).toISOString();

export const addDays = (d: number): string =>
  new Date(Date.now() + d * 86400000).toISOString();

export const json = (o: unknown): string => JSON.stringify(o, null, 2);

export const fakeSignature = (): string =>
  btoa(hex(128)).replace(/=+$/, '').slice(0, 171) + '=';

export const endToEndId = (): string => 'E' + hex(31);

/* ---------- EMV / BR Code ---------- */

export const tlv = (id: string, value: string): string =>
  id + String(value.length).padStart(2, '0') + value;

export function crc16(payload: string): string {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

export type BrCodeInput = {
  key?: string;
  url?: string;
  value?: number;
  name: string;
  city: string;
  txid?: string;
  info?: string;
};

export function buildBrCode(i: BrCodeInput): string {
  const account =
    tlv('00', 'br.gov.bcb.pix') +
    (i.url ? tlv('25', i.url) : tlv('01', i.key || '')) +
    (i.info && !i.url ? tlv('02', i.info) : '');
  const body =
    tlv('00', '01') +
    (i.url ? tlv('01', '12') : '') +
    tlv('26', account) +
    tlv('52', '0000') +
    tlv('53', '986') +
    (i.value ? tlv('54', (i.value / 100).toFixed(2)) : '') +
    tlv('58', 'BR') +
    tlv('59', i.name.slice(0, 25)) +
    tlv('60', i.city.slice(0, 15)) +
    tlv('62', tlv('05', (i.txid || '***').slice(0, 25))) +
    '6304';
  return body + crc16(body);
}

/** BR Code for a simulated dynamic charge */
export const chargeBrCode = (value: number, identifier: string): string =>
  buildBrCode({
    url: 'api.woovi.com/api/testaccount/qr/v1/' + identifier.slice(0, 16),
    value,
    name: 'LOJA EXEMPLO',
    city: 'SAO PAULO',
    txid: identifier,
  });

export type EmvNode = {
  id: string;
  length: number;
  value: string;
  start: number;
  children?: EmvNode[];
  error?: string;
};

const TEMPLATES = new Set(['26', '27', '28', '29', '62', '80']);

export function parseEmv(src: string, offset = 0, nested = false): EmvNode[] {
  const out: EmvNode[] = [];
  let i = 0;
  while (i < src.length) {
    const id = src.slice(i, i + 2);
    const lenStr = src.slice(i + 2, i + 4);
    const length = Number(lenStr);
    if (id.length < 2 || lenStr.length < 2 || Number.isNaN(length)) {
      out.push({
        id: id || '??',
        length: 0,
        value: src.slice(i),
        start: offset + i,
        error: 'campo truncado',
      });
      break;
    }
    const value = src.slice(i + 4, i + 4 + length);
    const node: EmvNode = { id, length, value, start: offset + i };
    if (value.length < length)
      node.error = `esperava ${length} caracteres, achou ${value.length}`;
    if (!nested && TEMPLATES.has(id) && !node.error) {
      node.children = parseEmv(value, offset + i + 4, true);
    }
    out.push(node);
    i += 4 + length;
  }
  return out;
}

export function qrSvg(text: string): string {
  try {
    const q = qrcode(0, 'M');
    q.addData(text);
    q.make();
    return q.createSvgTag({ cellSize: 4, margin: 2, scalable: true });
  } catch {
    return '';
  }
}

/* ---------- request snippets ---------- */

export type Snippet = { label: string; language: string; code: string };

export function snippets(
  method: string,
  path: string,
  body: Record<string, unknown> | null,
): Snippet[] {
  const url = API + path;
  const hasBody = body && method !== 'GET' && method !== 'DELETE';
  const one = hasBody ? JSON.stringify(body) : '';
  const pretty = hasBody ? JSON.stringify(body, null, 2) : '';
  const curl = [
    `curl -X ${method} '${url}' \\`,
    `  -H 'Authorization: <SEU_APP_ID>'${hasBody ? ' \\' : ''}`,
    ...(hasBody
      ? [`  -H 'Content-Type: application/json' \\`, `  -d '${one}'`]
      : []),
  ].join('\n');
  const node = [
    `const res = await fetch('${url}', {`,
    `  method: '${method}',`,
    `  headers: {`,
    `    Authorization: process.env.WOOVI_APP_ID,`,
    ...(hasBody ? [`    'Content-Type': 'application/json',`] : []),
    `  },`,
    ...(hasBody
      ? [`  body: JSON.stringify(${pretty.replace(/\n/g, '\n  ')}),`]
      : []),
    `});`,
    ``,
    `const data = await res.json();`,
  ].join('\n');
  const php = [
    `$ch = curl_init('${url}');`,
    `curl_setopt_array($ch, [`,
    `  CURLOPT_CUSTOMREQUEST => '${method}',`,
    `  CURLOPT_RETURNTRANSFER => true,`,
    `  CURLOPT_HTTPHEADER => [`,
    `    'Authorization: ' . getenv('WOOVI_APP_ID'),`,
    ...(hasBody ? [`    'Content-Type: application/json',`] : []),
    `  ],`,
    ...(hasBody
      ? [`  CURLOPT_POSTFIELDS => '${one.replace(/'/g, "\\'")}',`]
      : []),
    `]);`,
    `$data = json_decode(curl_exec($ch), true);`,
  ].join('\n');
  const py = [
    `import os, requests`,
    ``,
    `res = requests.${method.toLowerCase()}(`,
    `    '${url}',`,
    `    headers={'Authorization': os.environ['WOOVI_APP_ID']},`,
    ...(hasBody ? [`    json=${pythonLiteral(body)},`] : []),
    `)`,
    `data = res.json()`,
  ].join('\n');
  return [
    { label: 'cURL', language: 'bash', code: curl },
    { label: 'Node.js', language: 'js', code: node },
    { label: 'PHP', language: 'php', code: php },
    { label: 'Python', language: 'python', code: py },
  ];
}

function pythonLiteral(o: unknown): string {
  return JSON.stringify(o)
    .replace(/\btrue\b/g, 'True')
    .replace(/\bfalse\b/g, 'False')
    .replace(/\bnull\b/g, 'None');
}

/* ---------- webhook delivery helpers ---------- */

export const hook = (
  event: string,
  payload: Record<string, unknown>,
  extra: { note?: string; code?: number; delay?: number } = {},
) => ({
  kind: 'hook' as const,
  title: event,
  code: extra.code ?? 200,
  note: extra.note,
  delay: extra.delay,
  body: { event, ...payload },
});

export const api = (
  title: string,
  body: unknown,
  extra: { note?: string; code?: number; delay?: number } = {},
) => ({
  kind: 'api' as const,
  title,
  code: extra.code ?? 200,
  note: extra.note,
  delay: extra.delay,
  body,
});
