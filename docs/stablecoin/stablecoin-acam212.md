---
id: stablecoin-acam212
sidebar_position: 8
title: 'ACAM 212: qualificação de carteiras e finalidade'
sidebar_label: ACAM 212
description: 'Como cumprir o reporte ACAM 212 do Banco Central na API de Stablecoin da Woovi: qualificação de carteiras externas, finalidade (purposeCode) das operações internacionais e pendências.'
tags:
  - stablecoin
  - api
  - compliance
---

A partir de **1º de novembro de 2026**, as operações com ativos virtuais entram no reporte **ACAM 212** do Banco Central do Brasil. A Avenia, PSAV parceira que liquida as operações de stablecoin da Woovi, passa a enviar esse reporte e precisa de dois dados que a API não pedia antes:

- **Qualificação da carteira**: quem é o beneficiário de cada carteira externa que envia ou recebe stablecoin, se a carteira fica numa corretora (custodiante) e em que país está o beneficiário.
- **Finalidade da operação** (`purposeCode`): o motivo de cada operação internacional, pelo código de 5 dígitos da tabela de "fatos naturais" do Banco Central.

Esta página mostra onde mandar cada dado, como tratar as pendências e o que conferir antes de 15/11.

:::info A responsabilidade pela informação é sua
A Woovi repassa à Avenia o que você manda. Os dados precisam descrever a carteira e a operação reais. Quando nenhuma qualificação é mandada, a Avenia aplica valores padrão que **não** são uma qualificação de verdade (veja [Valores padrão da Avenia](#valores-padrão-da-avenia)).
:::

## Prazos

| Data | O que acontece |
| --- | --- |
| **1º/11/2026** | O reporte começa. A API já aceita os campos novos. Mande-os desde já. |
| **15/11/2026** | Carteiras cadastradas antes de novembro precisam estar qualificadas. Depósitos recebidos sem finalidade passam a ficar **retidos** até você informá-la. |

Carteiras cadastradas antes de novembro continuam funcionando, mas ficam com a qualificação pendente (`qualificationStatus: PENDING`) até receberem os dados. Operações já creditadas sem finalidade viram pendências que você regulariza depois (veja [Pendências de finalidade](#pendências-de-finalidade)).

## Como ficar em conformidade

### Base legal

- **Lei 14.478/2022**, o marco legal dos ativos virtuais: define os prestadores de serviços de ativos virtuais (PSAV) e põe o setor sob as regras de prevenção à lavagem de dinheiro.
- **Resoluções BCB 519, 520 e 521/2025**: tratam da autorização e do funcionamento dos PSAV e de quando uma operação com ativo virtual entra no mercado de câmbio. Pagamentos e transferências internacionais com ativos virtuais, e envios para carteiras autocustodiadas ou recebimentos delas, passam a ser reportados ao Banco Central.
- **Reporte ACAM 212**: o arquivo em que a Avenia, como PSAV, informa essas operações ao Banco Central. Cada operação precisa dizer **quem está do outro lado** (a qualificação da carteira) e, quando é internacional, **por quê** (a finalidade).

A Woovi e a Avenia mandam o reporte, mas os dados vêm da sua plataforma, que conhece o cliente final. Por isso a qualidade da informação é responsabilidade sua.

### O que a sua integração precisa garantir

1. **Nenhuma carteira externa sem qualificação.** Qualifique cada carteira de destino (na requisição ou salvando a carteira) e cada carteira remetente. Os valores padrão da Avenia mantêm a operação funcionando, mas **não** cumprem a exigência.
2. **Informação real, do seu cadastro.** O `beneficiaryName` é o titular verdadeiro dos recursos, conferido no seu processo de conheça seu cliente. Não use o nome da plataforma, um texto fixo ou o nome do seu cliente quando o dono da carteira for outra pessoa.
3. **Custódia declarada corretamente.** Use `isSelfCustody: true` só quando o próprio beneficiário guarda as chaves. Carteira de corretora é sempre `isSelfCustody: false`, com o nome da corretora em `custodianName`.
4. **País do beneficiário, e não da corretora.** `beneficiaryCountry` é onde o beneficiário reside ou tem sede. Uma carteira na Binance de um cliente brasileiro é `BR`.
5. **Finalidade em toda operação internacional.** Beneficiário fora do Brasil, ou uma ponta em moeda estrangeira (USD, EUR...), exige `purposeCode`. Escolha o código pela natureza **real** da operação e pela faixa de valor (até ou acima de USD 50 mil). Não use um único código para tudo.
6. **Pendências respondidas.** Consulte as pendências com frequência e responda cada uma. Comece pelas `DEPOSIT_HOLD`, que retêm o dinheiro do cliente.
7. **Registro do que foi declarado.** Guarde, junto com a operação, de onde veio cada informação (o cadastro do cliente ou o que ele declarou). Isso vale como evidência numa fiscalização ou num pedido de informação.

### Situações comuns

| Situação | Qualificação |
| --- | --- |
| Cliente compra stablecoin e envia para a própria MetaMask, morando no Brasil | `isSelfCustody: true`, `beneficiaryName` = nome do cliente |
| Cliente envia para a própria conta numa corretora, morando no Brasil | `isSelfCustody: false`, `custodianName` = corretora, `beneficiaryCountry: "BR"` |
| Empresa paga um fornecedor no exterior em stablecoin | `isSelfCustody` conforme a carteira do fornecedor, `beneficiaryName` = fornecedor, país do fornecedor, `purposeCode` da natureza do pagamento (ex.: serviço, mercadoria) |
| Cliente envia para carteira própria no exterior (recursos próprios) | `beneficiaryName` = nome do cliente, país onde está a carteira do titular, `purposeCode` de transferência entre contas do mesmo titular, consultado em `/qualification-options` |

:::caution
Esta página explica o que a API pede para atender ao reporte. Ela não substitui a análise do seu jurídico e do seu compliance sobre as obrigações da sua empresa.
:::

## O que muda em cada operação

| Operação | Qualificar a carteira | Finalidade (`purposeCode`) | Onde mandar |
| --- | --- | --- | --- |
| Pix → stablecoin enviada para carteira externa | Sim, a carteira de destino | Se o beneficiário estiver fora do Brasil | `destinationWalletQualification` no [`POST /deposit`](/stable#tag/on-ramp/POST/api/v1/stablecoin/deposit), ou carteira salva |
| Troca (swap) com envio para carteira externa | Sim, a carteira de destino | Se o beneficiário estiver fora do Brasil | `destinationWalletQualification` no [`POST /swap`](/stable#tag/wallets/POST/api/v1/stablecoin/swap), ou carteira salva |
| Stablecoin recebida de carteira externa | Sim, uma vez por carteira remetente | Se o beneficiário estiver fora do Brasil | [`PATCH /deposit-sender-wallets/{id}`](/stable#tag/acam-212/PATCH/api/v1/stablecoin/deposit-sender-wallets/{id}) |
| Dólar recebido (Wire/ACH) → stablecoin | Sim, a carteira de destino | Sim | `purposeCode` e `destinationWalletQualification` no `POST /deposit` com `inputCurrency: USD` |
| Pix → pagamento em dólar (Wire/ACH) | Não | Sim | Console (remessa em dólar) |
| Stablecoin → Pix (payout no Brasil) | Não | Não | Nada muda |

Todas as rotas desta página ficam sob `/api/v1/stablecoin/` e usam o mesmo `Authorization` (AppID) das demais rotas de stablecoin.

## A qualificação de carteira

A qualificação é o mesmo objeto em todos os lugares: no `destinationWalletQualification` de depósitos e trocas, no campo `qualification` ao salvar uma carteira (`POST /beneficiary-wallets`) e como o próprio corpo dos dois `PATCH` (`/beneficiary-wallets/{id}` e `/deposit-sender-wallets/{id}`).

| Campo | Tipo | Regra |
| --- | --- | --- |
| `isSelfCustody` | boolean | Sempre obrigatório. `true` quando o próprio beneficiário guarda as chaves (MetaMask, carteira de hardware). `false` quando a carteira fica numa corretora ou instituição. |
| `beneficiaryName` | string, até 100 caracteres | Sempre obrigatório. Pessoa ou empresa dona dos recursos na carteira. |
| `beneficiaryCountry` | string, ISO 3166-1 alfa-2, maiúsculas | País do beneficiário (`BR`, `US`, `AR`...). Obrigatório quando `isSelfCustody` é `false`. Em carteira própria é opcional e vira `BR`. |
| `custodianName` | string, até 100 caracteres | Corretora ou instituição que guarda a carteira (ex.: `Binance`). Obrigatório quando `isSelfCustody` é `false`; **proibido** quando é `true`. |
| `purposeCode` | string, 5 dígitos | Finalidade, pela tabela do Banco Central. Obrigatório quando o país **não** é `BR`; **proibido** quando é `BR`. |

### Quais campos mandar

| `isSelfCustody` | País do beneficiário | Obrigatórios | Não mande |
| --- | --- | --- | --- |
| `true` | Brasil (ou omitido) | `isSelfCustody`, `beneficiaryName` | `custodianName`, `purposeCode` |
| `true` | Fora do Brasil | `isSelfCustody`, `beneficiaryName`, `beneficiaryCountry`, `purposeCode` | `custodianName` |
| `false` | Brasil | `isSelfCustody`, `beneficiaryName`, `custodianName`, `beneficiaryCountry: "BR"` | `purposeCode` |
| `false` | Fora do Brasil | `isSelfCustody`, `beneficiaryName`, `custodianName`, `beneficiaryCountry`, `purposeCode` | — |

Carteira própria de alguém no Brasil:

```json
{
  "isSelfCustody": true,
  "beneficiaryName": "Maria Silva"
}
```

Carteira própria de alguém fora do Brasil:

```json
{
  "isSelfCustody": true,
  "beneficiaryName": "John Doe",
  "beneficiaryCountry": "US",
  "purposeCode": "46002"
}
```

Carteira numa corretora, beneficiário no Brasil:

```json
{
  "isSelfCustody": false,
  "beneficiaryName": "Acme Comércio Ltda",
  "custodianName": "Mercado Bitcoin",
  "beneficiaryCountry": "BR"
}
```

Carteira numa corretora, beneficiário fora do Brasil:

```json
{
  "isSelfCustody": false,
  "beneficiaryName": "Acme Trading LLC",
  "custodianName": "Binance",
  "beneficiaryCountry": "US",
  "purposeCode": "46002"
}
```

Os países aceitos e os códigos de finalidade vêm de [`GET /api/v1/stablecoin/qualification-options`](/stable#tag/acam-212/GET/api/v1/stablecoin/qualification-options). Não fixe essas listas no seu código.

A qualificação é validada antes de a Avenia ser chamada e antes de qualquer valor ser debitado. Uma qualificação inválida responde `400` com a mensagem em `error` e o campo em `path`, uma string com o caminho separado por pontos a partir da raiz do corpo:

```json
{
  "error": "purposeCode is required when beneficiaryCountry is not BR",
  "path": "destinationWalletQualification.purposeCode"
}
```

| Onde a qualificação vai | Exemplo de `path` |
| --- | --- |
| `POST /deposit`, `POST /swap` | `destinationWalletQualification.purposeCode` |
| `POST /beneficiary-wallets` | `qualification.custodianName` |
| `PATCH /beneficiary-wallets/{id}`, `PATCH /deposit-sender-wallets/{id}` (o corpo é a qualificação) | `custodianName` |

Mensagens possíveis:

| `error` | Causa |
| --- | --- |
| `isSelfCustody is required and must be a boolean` | `isSelfCustody` ausente ou não booleano |
| `beneficiaryName is required` | `beneficiaryName` ausente ou vazio |
| `beneficiaryName must have at most 100 characters` | nome longo demais |
| `custodianName is required when isSelfCustody is false` | carteira de corretora sem `custodianName` |
| `custodianName is not allowed when isSelfCustody is true` | carteira própria com `custodianName` |
| `beneficiaryCountry is required when isSelfCustody is false` | carteira de corretora sem país |
| `beneficiaryCountry must be an uppercase ISO 3166-1 alpha-2 code (e.g. US)` | país fora do formato |
| `purposeCode is required when beneficiaryCountry is not BR` | beneficiário fora do Brasil sem finalidade |
| `purposeCode is not allowed when beneficiaryCountry is BR` | beneficiário no Brasil com finalidade |
| `purposeCode must be a 5-digit code` | finalidade fora do formato |

### Valores padrão da Avenia

Se uma carteira chega à Avenia sem qualificação, ela registra **custodiante Avenia LLC, país `US` e finalidade `67995`**. Esses valores mantêm a operação funcionando, mas não descrevem a carteira real e não contam como qualificação. Mande sempre a qualificação.

## Carteiras de destino

São as carteiras para onde a Woovi envia stablecoin: no depósito via Pix, no depósito em dólar e na troca com entrega on-chain. Há duas formas de qualificá-las.

### 1. Na própria requisição

Mande `destinationWalletQualification` junto com `destinationWalletAddress` em:

- [`POST /api/v1/stablecoin/deposit`](/stable#tag/on-ramp/POST/api/v1/stablecoin/deposit) (BRL e USD)
- [`POST /api/v1/stablecoin/swap`](/stable#tag/wallets/POST/api/v1/stablecoin/swap)

O campo só vale com `destinationWalletAddress`.

```bash
curl --request POST \
  --url 'https://api.woovi.com/api/v1/stablecoin/deposit' \
  --header 'Authorization: <SEU_APP_ID>' \
  --header 'Content-Type: application/json' \
  --data '{
    "grossAmount": 10000,
    "currency": "USDT",
    "network": "POLYGON",
    "destinationWalletAddress": "0x28C6c06298d514Db089934071355E5743bf21d60",
    "correlationId": "order-123",
    "destinationWalletQualification": {
      "isSelfCustody": false,
      "beneficiaryName": "John Doe",
      "custodianName": "Binance",
      "beneficiaryCountry": "US",
      "purposeCode": "46002"
    }
  }'
```

Na troca:

```json
{
  "value": 20000,
  "from": "BRLA",
  "to": "USDC",
  "network": "BASE",
  "destinationWalletAddress": "0xbd374a94d88F19b80F6aD8A3AE418e3f1eb054AE",
  "correlationId": "my-unique-id",
  "destinationWalletQualification": {
    "isSelfCustody": true,
    "beneficiaryName": "Maria Silva"
  }
}
```

### 2. Carteiras salvas (beneficiary wallets)

Salve as carteiras que você usa sempre, já qualificadas. Quando a requisição não traz `destinationWalletQualification`, a Woovi usa a qualificação da carteira salva com a **mesma rede e o mesmo endereço**. É a mesma lista de carteiras liberadas que aparece no console.

| Ação | Rota |
| --- | --- |
| Listar | [`GET /api/v1/stablecoin/beneficiary-wallets`](/stable#tag/acam-212/GET/api/v1/stablecoin/beneficiary-wallets) |
| Salvar (com ou sem qualificação) | [`POST /api/v1/stablecoin/beneficiary-wallets`](/stable#tag/acam-212/POST/api/v1/stablecoin/beneficiary-wallets) |
| Qualificar ou corrigir | [`PATCH /api/v1/stablecoin/beneficiary-wallets/{id}`](/stable#tag/acam-212/PATCH/api/v1/stablecoin/beneficiary-wallets/{id}) |
| Remover | [`DELETE /api/v1/stablecoin/beneficiary-wallets/{id}`](/stable#tag/acam-212/DELETE/api/v1/stablecoin/beneficiary-wallets/{id}) |
| Bloquear envios para carteiras não salvas | [`PUT /api/v1/stablecoin/beneficiary-wallets/enforcement`](/stable#tag/acam-212/PUT/api/v1/stablecoin/beneficiary-wallets/enforcement) |

Um AppID ligado a uma conta bancária só alcança as subcontas cobertas por essa conta. Sem `subAccountId`, as rotas atuam na mais recente delas. Para escolher outra, mande `subAccountId` (no corpo do `POST` e do `PUT`, na query do `GET`, `PATCH` e `DELETE`). Um `subAccountId` fora desse alcance devolve lista vazia no `GET`, `404 STABLE_SUBACCOUNT_NOT_FOUND` no `POST` e no `PUT`, e `404 STABLE_BENEFICIARY_WALLET_NOT_FOUND` no `PATCH` e no `DELETE`. O `label` aceita até 100 caracteres. São no máximo 10 carteiras por subconta.

O `PUT /beneficiary-wallets/enforcement` com `{ "enforce": true }` faz a subconta recusar todo envio on-chain para carteira que não esteja salva (com a lista vazia, todo envio é recusado). O estado atual vem em `enforceWalletWhitelist` na listagem. Ligar o bloqueio não é exigência do ACAM 212; serve para garantir que todo destino tenha qualificação salva.

Salvar uma carteira:

```json
{
  "network": "POLYGON",
  "address": "0x28C6c06298d514Db089934071355E5743bf21d60",
  "label": "Binance - tesouraria",
  "qualification": {
    "isSelfCustody": false,
    "beneficiaryName": "Acme Trading LLC",
    "custodianName": "Binance",
    "beneficiaryCountry": "US",
    "purposeCode": "46002"
  }
}
```

Resposta (`201`):

```json
{
  "beneficiaryWallet": {
    "id": "UE9MWUdPTjoweDI4YzZjMDYyOThkNTE0ZGIwODk5MzQwNzEzNTVlNTc0M2JmMjFkNjA",
    "network": "POLYGON",
    "address": "0x28c6c06298d514db089934071355e5743bf21d60",
    "label": "Binance - tesouraria",
    "qualification": {
      "isSelfCustody": false,
      "beneficiaryName": "Acme Trading LLC",
      "beneficiaryCountry": "US",
      "custodianName": "Binance",
      "purposeCode": "46002"
    },
    "qualificationStatus": "QUALIFIED",
    "qualifiedAt": "2026-11-03T14:10:00.000Z",
    "createdAt": "2026-11-03T14:10:00.000Z"
  },
  "providerSync": "QUALIFIED"
}
```

O `id` identifica a carteira pela rede e pelo endereço (endereços EVM são gravados em minúsculas). Use o valor devolvido pela API e não o monte você mesmo.

Para qualificar uma carteira que já estava salva (por exemplo, uma das cadastradas antes de novembro, que aparecem com `qualificationStatus: PENDING`), use o `PATCH`. Como no `PATCH /deposit-sender-wallets/{id}`, o corpo **é** a qualificação (sem envelope), e ela é substituída inteira a cada chamada:

```bash
curl --request PATCH \
  --url 'https://api.woovi.com/api/v1/stablecoin/beneficiary-wallets/UE9MWUdPTjoweDI4YzZjMDYyOThkNTE0ZGIwODk5MzQwNzEzNTVlNTc0M2JmMjFkNjA' \
  --header 'Authorization: <SEU_APP_ID>' \
  --header 'Content-Type: application/json' \
  --data '{
    "isSelfCustody": true,
    "beneficiaryName": "Maria Silva"
  }'
```

Rede, endereço e rótulo não mudam por essa rota. Qualquer campo que não seja da qualificação responde `400` com `path` igual ao nome do campo:

```json
{
  "error": "Only the qualification can be updated; remove: label",
  "errorCode": "STABLE_BENEFICIARY_WALLET_INVALID",
  "path": "label"
}
```

Para trocar rede ou endereço, remova a carteira e salve outra. A resposta do `PATCH` traz a carteira em `beneficiaryWallet` e o resultado do repasse em `providerSync`.

A qualificação é gravada na Woovi e repassada à Avenia na mesma chamada (no `POST` e no `PATCH`). Se o repasse falhar, a chamada não falha e nunca responde `502`: o resultado vem em `providerSync` e a qualificação gravada é usada no próximo envio.

| `providerSync` | Significado |
| --- | --- |
| `QUALIFIED` | A Avenia recebeu a qualificação. |
| `UNCHANGED` | A Avenia já tinha essa qualificação. |
| `NOT_REGISTERED` | A carteira ainda não existe na Avenia. Ela é registrada, já qualificada, no primeiro envio. |
| `FAILED` | A Avenia não pôde ser atualizada agora. A qualificação gravada vai no próximo envio. |
| `SKIPPED` | Nada a repassar (carteira salva sem qualificação). |

### Qual qualificação vale

Num envio para carteira externa, a Woovi usa, nesta ordem:

1. `destinationWalletQualification` da requisição;
2. a qualificação da carteira salva com a mesma rede e endereço;
3. nenhuma: a operação segue e a Avenia aplica os [valores padrão](#valores-padrão-da-avenia).

## Carteiras remetentes

Toda carteira externa que envia stablecoin para uma subconta sua é registrada no primeiro depósito. O registro é por família de rede: o mesmo endereço EVM conta como uma carteira só em todas as redes EVM (`EVM`), e TRON é outra família (`TRON`). Carteiras de outras contas Avenia com cadastro aprovado chegam como `INTERNAL`, já qualificadas.

O depósito **nunca é bloqueado** por falta de qualificação da carteira remetente. Ela fica `PENDING` até você qualificá-la. Consulte as pendentes periodicamente.

| Ação | Rota |
| --- | --- |
| Listar as pendentes | [`GET /api/v1/stablecoin/deposit-sender-wallets?qualificationStatus=PENDING`](/stable#tag/acam-212/GET/api/v1/stablecoin/deposit-sender-wallets) |
| Qualificar ou corrigir | [`PATCH /api/v1/stablecoin/deposit-sender-wallets/{id}`](/stable#tag/acam-212/PATCH/api/v1/stablecoin/deposit-sender-wallets/{id}) |

A listagem aceita `qualificationStatus`, `subAccountId`, `limit` (1 a 100, padrão 50) e `cursor`. Para ler a próxima página, mande o `cursor` da resposta anterior; ele vem `null` na última.

No `PATCH`, o corpo **é** a qualificação (sem envelope), e a qualificação inteira é substituída a cada chamada:

```bash
curl --request PATCH \
  --url 'https://api.woovi.com/api/v1/stablecoin/deposit-sender-wallets/6650abc1234def567890aaaa' \
  --header 'Authorization: <SEU_APP_ID>' \
  --header 'Content-Type: application/json' \
  --data '{
    "isSelfCustody": false,
    "custodianName": "Binance",
    "beneficiaryName": "John Doe",
    "beneficiaryCountry": "AR",
    "purposeCode": "46002"
  }'
```

A resposta traz a carteira em `depositSenderWallet`, agora `QUALIFIED`.

## Finalidade da operação (`purposeCode`)

O `purposeCode` diz ao Banco Central o motivo de uma operação internacional: pagamento a fornecedor no exterior, serviço contratado lá fora, transferência entre contas do mesmo titular e assim por diante. Mande só o código de 5 dígitos.

| Onde | Campo |
| --- | --- |
| Depósito em dólar: [`POST /deposit`](/stable#tag/on-ramp/POST/api/v1/stablecoin/deposit) com `inputCurrency: USD` | `purposeCode` |
| Cotação em dólar: [`GET /quote`](/stable#tag/on-ramp/GET/api/v1/stablecoin/quote) com `inputCurrency=USD` | `purposeCode` (query) |
| Envio para carteira de beneficiário fora do Brasil | `purposeCode` dentro de `destinationWalletQualification` ou da carteira salva |
| Carteira remetente de beneficiário fora do Brasil | `purposeCode` no corpo do `PATCH /deposit-sender-wallets/{id}` |
| Remessa em dólar (Pix → Wire/ACH) | No console |

A API confere só o formato (5 dígitos) e responde `400` se ele estiver errado. Quem decide se o código serve para a operação é a Avenia. Hoje o `purposeCode` do depósito e da cotação em dólar é opcional na API; a Avenia passa a exigi-lo a partir de 1º/11 e, a partir de 15/11, retém depósitos que chegam sem ele.

O Banco Central classifica os códigos separadamente para operações de **até USD 50 mil** e **acima de USD 50 mil**. Escolha o código pela natureza e pelo valor da operação. A lista válida, com grupo e descrição em português, inglês e espanhol, e a lista de países aceitos vêm de [`GET /api/v1/stablecoin/qualification-options`](/stable#tag/acam-212/GET/api/v1/stablecoin/qualification-options):

```json
{
  "purposeCodes": [
    {
      "code": "46002",
      "group": {
        "pt": "Serviços diversos",
        "en": "Miscellaneous services",
        "es": "Servicios diversos"
      },
      "description": {
        "pt": "Serviços de computação e de informação",
        "en": "Computer and information services",
        "es": "Servicios de informática y de información"
      }
    }
  ],
  "countries": [
    { "code": "BR", "name": "Brazil" },
    { "code": "US", "name": "United States" }
  ]
}
```

A resposta fica em cache por 6 horas. Se a Avenia não responder, a rota devolve `503` com `errorCode: STABLE_QUALIFICATION_OPTIONS_UNAVAILABLE`; tente de novo depois.

:::warning Sujeito a ajuste
A Avenia ainda vai publicar a seção "International Transfers (ACAM)" do guia de integração dela. Os contratos de **finalidade por operação** (onde o `purposeCode` vai em cada tipo de operação) e de **regularização** (pendências abaixo) podem mudar quando essa seção sair. Esta página e a [referência da API](/stable) serão atualizadas.
:::

## Pendências de finalidade

Quando a Avenia precisa da finalidade de uma operação que você não informou, a Woovi abre uma pendência (`purposeCodeRequest`). Consulte as pendências periodicamente. Há dois tipos:

| `kind` | O que é | Efeito |
| --- | --- | --- |
| `TICKET` | Operação já creditada sem finalidade | Nada fica parado. Você regulariza depois. |
| `DEPOSIT_HOLD` | Depósito recebido sem finalidade, a partir de 15/11 | O depósito fica **retido** até você informar a finalidade. A Avenia o libera quando aceitar o código. |

| Ação | Rota |
| --- | --- |
| Listar | [`GET /api/v1/stablecoin/purpose-code-requests?status=PENDING`](/stable#tag/acam-212/GET/api/v1/stablecoin/purpose-code-requests) |
| Informar a finalidade | [`PATCH /api/v1/stablecoin/purpose-code-requests/{id}`](/stable#tag/acam-212/PATCH/api/v1/stablecoin/purpose-code-requests/{id}) |

A listagem aceita `status` (`PENDING`, `RESOLVED`, `FAILED`), `limit` (1 a 100, padrão 50) e `cursor`, igual à de carteiras remetentes, e devolve as pendências das mais novas para as mais antigas em `purposeCodeRequests`. Para ler a próxima página, mande o `cursor` da resposta anterior; ele vem `null` na última:

```json
{
  "purposeCodeRequests": [
    {
      "id": "6650abc1234def567890cccc",
      "kind": "DEPOSIT_HOLD",
      "status": "PENDING",
      "subAccountId": "6965563f1ad794345eb3ee3a",
      "aveniaTicketId": null,
      "aveniaDepositHoldId": "b8a6e1c2-0f3d-4d1e-9a7b-2c3d4e5f6a7b",
      "linkedEntity": null,
      "purposeCode": null,
      "failureReason": null,
      "resolvedAt": null,
      "createdAt": "2026-11-15T13:02:11.000Z"
    }
  ],
  "cursor": null
}
```

Um parâmetro inválido responde `400` com `error` e `path` (ex.: `path: "limit"`). Quando a Woovi encontra a operação por trás da pendência, ela vem em `linkedEntity` (`StableDeposit`, `StableUsdRemittance`, `StablePayout` ou `StableSwap`).

```bash
curl --request PATCH \
  --url 'https://api.woovi.com/api/v1/stablecoin/purpose-code-requests/6650abc1234def567890cccc' \
  --header 'Authorization: <SEU_APP_ID>' \
  --header 'Content-Type: application/json' \
  --data '{ "purposeCode": "46002" }'
```

Resposta (`200`), a pendência resolvida:

```json
{
  "id": "6650abc1234def567890cccc",
  "kind": "DEPOSIT_HOLD",
  "status": "RESOLVED",
  "subAccountId": "6965563f1ad794345eb3ee3a",
  "aveniaTicketId": null,
  "aveniaDepositHoldId": "b8a6e1c2-0f3d-4d1e-9a7b-2c3d4e5f6a7b",
  "linkedEntity": null,
  "purposeCode": "46002",
  "failureReason": null,
  "resolvedAt": "2026-11-15T13:20:00.000Z",
  "createdAt": "2026-11-15T13:02:11.000Z"
}
```

- Responder de novo uma pendência `RESOLVED` com o mesmo código devolve a pendência sem mudança. Com outro código, a resposta é `409`.
- Uma pendência `FAILED` (a Avenia recusou o código ou não respondeu) pode ser respondida de novo. O motivo vem em `failureReason`.

## Escopos

| Rota | Escopo do AppID |
| --- | --- |
| `GET /qualification-options` | `STABLECOIN_DEPOSIT_CREATE` |
| `GET /beneficiary-wallets`, `GET /deposit-sender-wallets`, `GET /purpose-code-requests` | `STABLECOIN_SUBACCOUNT_LIST` |
| `POST`, `PATCH`, `DELETE /beneficiary-wallets`, `PUT /beneficiary-wallets/enforcement`, `PATCH /deposit-sender-wallets/{id}`, `PATCH /purpose-code-requests/{id}` | `STABLECOIN_SUBACCOUNT_CREATE` |

## Erros

Erros de validação respondem `400` com `error` e `path`. As demais falhas trazem `errorCode`.

| HTTP | `errorCode` | Rota | Quando |
| --- | --- | --- | --- |
| 400 | — (`path` indica o campo) | `POST /deposit`, `POST /swap` | `destinationWalletQualification` inválida |
| 400 | `STABLE_BENEFICIARY_WALLET_INVALID` (com `path`) | `/beneficiary-wallets` | Corpo ou query inválidos (a qualificação no `POST`, ex.: `path: qualification.custodianName`; no `PATCH`, ex.: `path: custodianName`), endereço inválido para a rede, ou campo fora da qualificação no `PATCH` (`path` é o campo, ex.: `label`) |
| 400 | — (`path` indica o campo) | `PATCH /deposit-sender-wallets/{id}` | Qualificação inválida (ex.: `path: purposeCode`) |
| 400 | — (`path` indica o parâmetro) | `GET /deposit-sender-wallets`, `GET /purpose-code-requests` | Query inválida (`status`, `qualificationStatus`, `limit`) |
| 400 | `STABLE_DEPOSIT_SENDER_WALLET_QUALIFICATION_REJECTED` | `PATCH /deposit-sender-wallets/{id}` | A Avenia recusou a qualificação |
| 400 | `STABLE_PURPOSE_CODE_INVALID` | `PATCH /purpose-code-requests/{id}` | `purposeCode` não tem 5 dígitos |
| 404 | `STABLE_BENEFICIARY_WALLET_NOT_FOUND` | `PATCH`, `DELETE /beneficiary-wallets/{id}` | Carteira não salva nesta subconta, ou `id` que não veio da API |
| 404 | `STABLE_SUBACCOUNT_NOT_FOUND` | `POST /beneficiary-wallets`, `PUT /beneficiary-wallets/enforcement` | A subconta não é alcançada por este AppID |
| 404 | `STABLE_DEPOSIT_SENDER_WALLET_NOT_FOUND` | `PATCH /deposit-sender-wallets/{id}` | Carteira fora das subcontas do AppID |
| 404 | `STABLE_PURPOSE_CODE_REQUEST_NOT_FOUND` | `PATCH /purpose-code-requests/{id}` | Pendência de outra empresa ou inexistente |
| 409 | `STABLE_BENEFICIARY_WALLET_ALREADY_EXISTS` | `POST /beneficiary-wallets` | Carteira já salva |
| 409 | `STABLE_PURPOSE_CODE_REQUEST_ALREADY_RESOLVED` | `PATCH /purpose-code-requests/{id}` | Já resolvida com outro código |
| 409 | `STABLE_PURPOSE_CODE_REQUEST_IN_PROGRESS` | `PATCH /purpose-code-requests/{id}` | Outra resposta para a mesma pendência está em andamento |
| 422 | `STABLE_BENEFICIARY_WALLET_LIMIT_REACHED` | `POST /beneficiary-wallets` | A subconta já tem 10 carteiras |
| 422 | `STABLE_PURPOSE_CODE_PROVIDER_REJECTED` | `PATCH /purpose-code-requests/{id}` | A Avenia recusou o código; a pendência fica `FAILED` |
| 422 | `STABLE_PURPOSE_CODE_REQUEST_MISSING_PROVIDER_ID` | `PATCH /purpose-code-requests/{id}` | O aviso da Avenia veio sem o identificador da operação; fale com o suporte |
| 502 | `STABLE_DEPOSIT_SENDER_WALLET_PROVIDER_ERROR` | `PATCH /deposit-sender-wallets/{id}` | A Avenia não respondeu; tente de novo |
| 502 | `STABLE_PURPOSE_CODE_PROVIDER_UNAVAILABLE` | `PATCH /purpose-code-requests/{id}` | A Avenia não respondeu; a pendência fica `FAILED` e pode ser respondida de novo |
| 503 | `STABLE_QUALIFICATION_OPTIONS_UNAVAILABLE` | `GET /qualification-options` | A Avenia não respondeu; tente de novo |

## Checklist até 15/11

- [ ] Ler a lista de países e códigos de `GET /qualification-options` em vez de fixá-la no código.
- [ ] Mandar `destinationWalletQualification` em todo `POST /deposit` e `POST /swap` com `destinationWalletAddress`, ou salvar e qualificar a carteira em `/beneficiary-wallets`.
- [ ] Qualificar as carteiras salvas antes de novembro: `GET /beneficiary-wallets?qualificationStatus=PENDING` e um `PATCH` para cada uma.
- [ ] Qualificar as carteiras remetentes pendentes (`GET /deposit-sender-wallets?qualificationStatus=PENDING`).
- [ ] Mandar `purposeCode` na cotação e no depósito em dólar.
- [ ] Consultar `GET /purpose-code-requests?status=PENDING` e responder as pendências, começando pelas `DEPOSIT_HOLD`, que retêm dinheiro.
- [ ] Tratar os `400` com `path` mostrando ao seu usuário qual campo corrigir.
- [ ] Conferir que o AppID tem os escopos `STABLECOIN_SUBACCOUNT_LIST` e `STABLECOIN_SUBACCOUNT_CREATE`.

Base: anexo técnico da Avenia sobre o reporte ACAM 212 (vigência 1º/11/2026) e guia de integração da Avenia, seções Wallet's Guide e Deposit Sender Wallets.
