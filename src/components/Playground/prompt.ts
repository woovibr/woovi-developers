import type { Field, PlaygroundConfig, Resource, Values } from './types';
import { API, brl, json } from './utils';

const SITE = 'https://developers.woovi.com';
const PROMPTS = 'https://github.com/woovibr/woovi-prompts/blob/main/prompts';

/** what the viewer picked in the playground form */
export type Selection = {
  values: Values;
  body: Record<string, unknown> | null;
  path: string;
  resource: Resource | null;
};

export type Stack = { id: string; label: string; detail: string };

export const stacks: Stack[] = [
  {
    id: 'node',
    label: 'Node.js',
    detail: 'Node.js 20+ com TypeScript, fetch nativo e Express',
  },
  { id: 'python', label: 'Python', detail: 'Python 3.11+ com FastAPI e httpx' },
  { id: 'php', label: 'PHP', detail: 'PHP 8.2+ com Laravel e Http client' },
  { id: 'java', label: 'Java', detail: 'Java 21 com Spring Boot e RestClient' },
  { id: 'go', label: 'Go', detail: 'Go 1.22+ com net/http' },
  { id: 'csharp', label: 'C#', detail: '.NET 8 com ASP.NET Core e HttpClient' },
];

/** matching prompt in github.com/woovibr/woovi-prompts, when there is one */
const reference: Record<string, string[]> = {
  'cobranca-pix': ['charge-pix.md'],
  'qrcode-pix': ['charge-pix.md', 'pix-qrcode-static.md'],
  'qrcode-estatico': ['pix-qrcode-static.md'],
  split: ['subaccount.md', 'charge-pix.md'],
  'transferencia-interna': ['subaccount.md'],
  'campanha-chave-pix': ['campaign-pix-key.md'],
  refund: ['refund.md'],
  webhook: ['webhooks.md'],
  baas: ['partner.md'],
  'embed-baas': ['partner.md'],
};

const actorName = (c: PlaygroundConfig, id?: string) =>
  c.actors.find((a) => a.id === id)?.title ?? id ?? '';

function shown(f: Field, v: Values[string]): string {
  if (f.type === 'cents') return `${v} (${brl(Number(v) || 0)})`;
  if (f.type === 'select') {
    const o = f.options?.find((x) => String(x.value) === String(v));
    return o ? `${o.label} → \`${v}\`` : String(v);
  }
  return String(v);
}

function events(c: PlaygroundConfig): string[] {
  const out = new Set<string>();
  c.scenarios.forEach((s) =>
    s.steps.forEach((st) => {
      for (const m of (st.code ?? '').matchAll(/"event":\s*"([A-Z_:]+)"/g)) {
        out.add(m[1]);
      }
    }),
  );
  return [...out];
}

const fence = (code: string, lang = 'json') =>
  '```' + lang + '\n' + code.trim() + '\n```';

/** one-shot prompt: everything an agent needs to implement this flow */
export function buildPrompt(
  c: PlaygroundConfig,
  scenarioId: string,
  stack: Stack,
  sel: Selection | null,
): string {
  const sc = c.scenarios.find((s) => s.id === scenarioId) ?? c.scenarios[0];
  const lab = c.lab;
  const url = `${SITE}/docs/playground/playground-${c.id}`;
  const out: string[] = [];
  const add = (...lines: string[]) => out.push(...lines, '');

  add(`# Prompt — ${c.title} com a API Woovi`);

  add(
    '## Papel',
    `Você é um engenheiro sênior especialista na API da Woovi. Implemente no meu backend (${stack.detail}) a integração **${c.title}**, exatamente como descrita abaixo. Ela foi configurada no playground ${url} e cada valor aqui é o que eu escolhi lá.`,
  );

  add(
    '## Regra crítica',
    'Use somente os endpoints, campos, eventos e estados listados neste prompt e na documentação linkada. Não invente campos, não renomeie nada e nunca chame a API Woovi a partir do navegador ou do app: o AppID é um segredo e só vive no backend.',
  );

  add('## Contexto', c.lede);

  const picked = [`- Cenário: **${sc.label}**`];
  if (lab && sel) {
    lab.fields.forEach((f) =>
      picked.push(
        `- ${f.label}${f.api ? ` (\`${f.api}\`)` : ''}: ${shown(f, sel.values[f.id])}`,
      ),
    );
    if (sel.resource) {
      picked.push(
        `- Estado em que parei no playground: \`${sel.resource.status}\``,
      );
    }
  }
  add('## O que eu escolhi no playground', ...picked);

  if (lab) {
    const path = sel?.path ?? lab.path;
    const req = [
      '## Requisição',
      `\`${lab.method} ${API}${path}\``,
      '',
      'Headers:',
      '- `Authorization: <WOOVI_APP_ID>` (lido de variável de ambiente; gere em app.woovi.com → API/Plugins)',
      '- `Content-Type: application/json`',
    ];
    if (sel?.body) {
      req.push(
        '',
        'Body com os valores que escolhi (gere identificadores novos em produção):',
        fence(json(sel.body)),
      );
    }
    add(...req);
  }

  const steps = sc.steps.map((st, i) => {
    const who = st.note
      ? `nota sobre ${actorName(c, st.note)}`
      : st.from === st.to
        ? actorName(c, st.from)
        : `${actorName(c, st.from)} → ${actorName(c, st.to)}`;
    const lines = [
      `${i + 1}. **${st.title}** (${who}: ${st.label})${st.optional ? ' — opcional' : ''}`,
    ];
    if (st.text) lines.push(`   ${st.text}`);
    if (st.callout) lines.push(`   > ${st.callout.text}`);
    // request samples are replaced by the body built from the viewer's form
    const sample = st.kind === 'evt' || (st.kind === 'req' && !lab);
    if (st.code && sample) {
      lines.push(
        fence(st.code, st.lang ?? 'json')
          .split('\n')
          .map((l) => '   ' + l)
          .join('\n'),
      );
    }
    return lines.join('\n');
  });
  add(`## Fluxo (cenário "${sc.label}")`, ...steps);

  if (c.states?.length) {
    const st = c.states.map(
      (s) => `- \`${s.id}\` — ${s.sub}${s.terminal ? ' (terminal)' : ''}`,
    );
    const tr = (c.transitions ?? []).map(
      (t) =>
        `- ${t.from === 'start' ? 'início' : `\`${t.from}\``} → \`${t.to}\`: ${t.label}`,
    );
    add(
      '## Máquina de estados',
      'Persista o status de cada recurso e só avance pelas transições abaixo:',
      ...st,
      '',
      'Transições:',
      ...tr,
    );
  }

  const evs = events(c);
  if (evs.length) {
    add(
      '## Webhooks',
      `Eventos que este fluxo recebe: ${evs.map((e) => `\`${e}\``).join(', ')}.`,
      'Cadastre o webhook (POST /api/v1/webhook ou no painel) apontando para uma rota HTTPS do backend.',
    );
  }

  const handler =
    lab?.handler?.find((h) =>
      h.label.toLowerCase().startsWith(stack.label.toLowerCase()),
    ) ?? lab?.handler?.[0];
  if (handler) {
    add(
      `Handler de referência (${handler.label}${handler.label.toLowerCase().startsWith(stack.label.toLowerCase()) ? '' : `; traduza para ${stack.label}`}):`,
      fence(handler.code, handler.language),
    );
  }

  add(
    '## Regras de implementação',
    '1. Valores monetários sempre inteiros, em centavos.',
    '2. `correlationID` único por recurso (UUID v4 guardado junto do seu pedido) e reutilizado em retentativas: é a chave de idempotência.',
    '3. AppID em variável de ambiente, nunca no código, no repositório ou no frontend.',
    '4. No webhook: valide `x-webhook-signature` sobre o corpo bruto com a chave pública da Woovi, responda 200 rápido e processe de forma idempotente (o mesmo evento pode chegar mais de uma vez).',
    '5. Trate erros HTTP da Woovi (4xx/5xx) com retentativa só quando for seguro (mesmo correlationID) e logue o corpo da resposta.',
    '6. Use o webhook como fonte da verdade; consulta periódica (GET) só como fallback.',
  );

  add(
    '## Entregáveis',
    '1. Cliente da API Woovi com a chamada acima, tipada.',
    '2. Rota que inicia o fluxo a partir do meu sistema.',
    evs.length
      ? '3. Rota de webhook com validação de assinatura e atualização de status.'
      : '3. Atualização de status a partir da resposta da API.',
    '4. Persistência do recurso e do status (modelo/tabela).',
    '5. Testes cobrindo o cenário escolhido, idempotência e os caminhos de erro.',
    '6. Um README curto com variáveis de ambiente e como testar.',
  );

  const refs = [
    `- Playground: ${url}`,
    ...c.docs.map(
      (d) =>
        `- ${d.label}: ${d.href.startsWith('http') ? d.href : SITE + d.href}`,
    ),
    ...(reference[c.id] ?? []).map((f) => `- Prompt base: ${PROMPTS}/${f}`),
    `- Autenticação e segurança: ${PROMPTS}/auth-and-security.md`,
    `- Documentação completa para LLMs: ${SITE}/llms.txt`,
  ];
  add('## Referências', ...refs);

  return out.join('\n').trim() + '\n';
}
