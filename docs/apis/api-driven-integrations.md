---
id: api-driven-integrations
title: Como construir integrações 100% via API com a Woovi
tags:
  - api
  - getting-started
  - webhook
  - idempotencia
---

Muitos fluxos da Woovi têm duas formas de uso: uma **tela hospedada** (link de onboarding, checkout, página de resposta de RFI) e a **API pura**, em que o seu sistema conduz cada passo e o seu cliente nunca sai do seu produto. Esta página junta os padrões que valem para qualquer integração do segundo tipo. Um exemplo completo é o [Onboarding KYC 100% via API](../baas/kyc/api-onboarding-full-api.mdx).

## 1. Autenticação: uma Aplicação, um AppID, escopos mínimos

- Crie uma Aplicação em `API/Plugins` e use o **AppID** no header `Authorization`, sem o prefixo `Bearer` ([Começando a Integração](./start-api-integration.md)).
- Dê ao AppID **só os escopos** que a integração usa ([Adicionando escopos ao seu AppID](./api-scopes.md)). Cada endpoint documenta o escopo que exige; sem ele a resposta é `403`.
- Use um AppID por ambiente e por integração. Em BaaS, os eventos de onboarding pertencem à [API Master](./api-master.md).
- Restrinja por IP quando puder ([IP Whitelist](./api-security-ip-whitelist.md)).

```bash
curl https://api.woovi.com/api/v1/kyc/representatives?correlationID=merchant-4417 \
  -H "Authorization: <APP_ID>"
```

## 2. Arquivos: primeiro o upload, depois o `fileId`

Nenhuma API de domínio recebe o arquivo em si. O padrão tem **duas chamadas**:

1. `POST /api/v1/files` (`multipart/form-data`) com o `file` e o `purpose` do uso — escopo `FILE_POST` ([Como fazer upload de um arquivo?](../arquivos/upload-de-arquivo.md)). Guarde o `file.id`.
2. O endpoint de domínio recebe esse id como `fileId`.

```bash
curl -X POST https://api.woovi.com/api/v1/files \
  -H "Authorization: <APP_ID>" \
  -F "file=@selfie.jpg" \
  -F "purpose=ACCOUNT_REGISTER_DOCUMENT" \
  -F "correlationID=merchant-4417-selfie-maria"
```

- O `fileId` só é válido para a **mesma empresa** que fez o upload e para o **mesmo `purpose`**. Um arquivo subido como `DISPUTE_EVIDENCE` não serve num KYC.
- Os endpoints resolvem todos os `fileId` antes de gravar: se um falhar, nada é gravado. Corrija e reenvie a requisição inteira.
- A `url` devolvida é temporária. Não a guarde como link permanente; peça o arquivo de novo quando precisar.

## 3. `correlationID`: o seu identificador em tudo

Envie sempre um `correlationID` gerado pelo **seu** sistema ([Correlation ID](../concepts/correlation-id.md)). Ele é:

- **A chave para endereçar o recurso depois.** No KYC, todo endpoint recebe o `correlationID` que você enviou ao criar o onboarding — não é preciso guardar ids internos da Woovi.
- **A chave de idempotência** da criação. Repetir a mesma criação com o mesmo `correlationID` devolve o recurso existente (normalmente `200` em vez de `201`), sem duplicar.

Guarde o `correlationID` antes de chamar a API, para conseguir reenviar a mesma requisição depois de um timeout.

## 4. Idempotência e retentativas

Assuma que toda chamada pode dar timeout sem que você saiba se ela foi processada. Por isso ([Idempotência](../concepts/idempotence.md)):

- Reenvie com o **mesmo** `correlationID` e o mesmo body — nunca gere um id novo para "tentar de novo".
- Prefira operações que a própria API já torna idempotentes. Exemplos no KYC: o `submit` de um cadastro que já está em análise responde `200` sem refazer nada; criar uma autenticação Pix com uma cerimônia aberta devolve o mesmo QR Code.
- Use _backoff_ exponencial em `429`, `502` e erros de rede. Quando a resposta traz uma data de retentativa (como `nextResendAt`), respeite-a.

## 5. Webhooks em vez de _polling_

Processos longos (análise de KYC, pagamentos, disputas) mudam de estado sem que você chame nada. Cadastre webhooks para esses eventos em vez de consultar em loop ([criando um webhook via API](../webhook/webhook-api.mdx), [tipos de evento](../webhook/webhook-events-type.md); para o KYC, [eventos do ciclo de vida do onboarding](../baas/kyc/webhooks-ciclo-de-vida.mdx)).

- Valide a assinatura em toda entrega (`x-webhook-signature`) antes de processar.
- Responda `200` rápido e processe de forma assíncrona.
- A entrega é "pelo menos uma vez" e **sem ordem garantida**: deduplique e ordene pelos campos do payload, não pela ordem de chegada.
- Use a API como fonte da verdade para reconciliar de tempos em tempos. _Polling_ curto só onde a própria documentação recomenda, como o resultado de um Pix de autenticação enquanto o QR Code está na tela.

## 6. Tratamento de erros

As respostas de erro seguem o formato:

```json
{
  "error": "This account register can no longer receive documents in its current status.",
  "code": "ACCOUNT_REGISTER_NOT_OPEN"
}
```

- **`error`** é uma mensagem para humanos, já traduzida. Pode mudar: não compare strings.
- **`code`**, quando presente, é estável: é nele que o seu código deve decidir.
- Erros de validação (`400`) podem trazer em `error` a lista de campos inválidos.

| HTTP | Significado | O que fazer |
| --- | --- | --- |
| `400` | Requisição inválida | Corrija o body; não repita igual |
| `401` | AppID ausente ou inválido | Verifique o header `Authorization` |
| `403` | Falta feature na empresa ou escopo no AppID | Habilite a feature / adicione o escopo |
| `404` | Recurso não existe **para a sua empresa** | Confira o `correlationID` |
| `409` | Conflito com o estado atual do recurso | Leia o `code`, resolva a pendência e tente de novo |
| `422` | Conteúdo recusado (ex.: documento ilegível) | Envie outro arquivo |
| `429` | Limite de requisições | Espere e tente de novo |
| `5xx` | Falha temporária | Retente com _backoff_, com o mesmo `correlationID` |

## 7. Link hospedado como complemento

Integração via API não precisa ser tudo ou nada. Os fluxos que têm tela hospedada gravam no mesmo recurso que a API, então você pode fazer pela API o que já tem no seu produto e mandar o link ao cliente só para o resto. No KYC, por exemplo, a RFI devolve um `link` para os itens que só se respondem pela tela.

## Próximos passos

- [Onboarding KYC 100% via API](../baas/kyc/api-onboarding-full-api.mdx)
- [Como fazer upload de um arquivo?](../arquivos/upload-de-arquivo.md)
- [API Reference](/api)
