---
id: stablecoin-acam212-compliance
sidebar_position: 8
title: 'ACAM 212: como ficar em conformidade'
sidebar_label: ACAM 212 — conformidade
description: 'O que a regulação de ativos virtuais do Banco Central exige das operações de stablecoin, o que é reportado no ACAM 212 e o que a sua integração precisa garantir para estar em conformidade.'
tags:
  - stablecoin
  - compliance
---

Esta página explica **o que** a regulação exige e **o que a sua plataforma precisa garantir**. O passo a passo da API (campos, rotas, erros) está em [ACAM 212: qualificação de carteiras e finalidade](./stablecoin-acam212.md).

## Resumo

- Desde **1º/11/2026**, toda operação de stablecoin que envolve uma carteira externa ou uma ponta no exterior é reportada ao Banco Central no **ACAM 212**.
- O reporte precisa dizer **quem está do outro lado** (a qualificação da carteira) e, quando a operação é internacional, **por quê** (a finalidade, `purposeCode`).
- A partir de **15/11/2026**, carteiras sem qualificação podem travar operações, e depósitos sem finalidade ficam **retidos** até a finalidade ser informada.
- A Woovi e a Avenia enviam o reporte, mas os dados vêm da sua plataforma, que conhece o cliente final. **A veracidade da informação é responsabilidade sua.**

## Base legal

| Norma | O que trata |
| --- | --- |
| **Lei 14.478/2022** | Marco legal dos ativos virtuais. Define os prestadores de serviços de ativos virtuais (PSAV) e os coloca sob as regras de prevenção à lavagem de dinheiro e ao financiamento do terrorismo. |
| **Resolução BCB 519/2025** | Autorização para funcionar como PSAV. |
| **Resolução BCB 520/2025** | Regras de funcionamento dos PSAV, entre elas conhecer o cliente e manter registros das operações. |
| **Resolução BCB 521/2025** | Quando uma operação com ativo virtual entra no mercado de câmbio: pagamentos e transferências internacionais com ativos virtuais, e envios para carteiras autocustodiadas ou recebimentos delas. |
| **Reporte ACAM 212** | O arquivo em que a Avenia, PSAV que liquida as operações de stablecoin da Woovi, informa essas operações ao Banco Central. |

## Quem faz o quê

| Quem | Papel |
| --- | --- |
| **Avenia** | PSAV autorizada. Liquida as operações e envia o ACAM 212 ao Banco Central. |
| **Woovi** | Recebe os dados pela API, valida o formato e repassa para a Avenia. Avisa quando falta alguma informação. |
| **Sua plataforma** | Conhece o cliente final e a operação. Informa quem é o beneficiário de cada carteira e a finalidade de cada operação internacional, e guarda a evidência do que declarou. |

## O que é reportado

### Qualificação da carteira

Toda carteira externa, de destino ou de origem, é qualificada uma vez e a qualificação vale para as próximas operações com ela.

| Informação | Pergunta que responde |
| --- | --- |
| Custódia (`isSelfCustody`) | O próprio beneficiário guarda as chaves, ou a carteira fica numa corretora ou instituição? |
| Beneficiário (`beneficiaryName`) | Quem é o dono dos recursos nessa carteira? |
| Custodiante (`custodianName`) | Se não é autocustódia, qual corretora ou instituição guarda a carteira? |
| País (`beneficiaryCountry`) | Onde o beneficiário reside ou tem sede? |
| Finalidade (`purposeCode`) | Se o beneficiário está fora do Brasil, qual é o motivo da operação? |

### Finalidade da operação

A finalidade (`purposeCode`) é o código de 5 dígitos da tabela de "fatos naturais" do Banco Central. Ela é obrigatória quando:

- a operação tem uma ponta em moeda estrangeira (USD, EUR, MXN, COP ou ARS), como o depósito por Wire/ACH ou a remessa em dólar;
- a outra parte de uma operação com stablecoin está fora do Brasil.

Operações entre real e stablecoin, ou entre stablecoins, com beneficiário no Brasil **não** levam finalidade.

O Banco Central separa os códigos em operações **até USD 50 mil** e **acima de USD 50 mil**. A lista válida vem de `GET /api/v1/stablecoin/qualification-options`. Não fixe essa lista no seu código.

## O que a sua integração precisa garantir

1. **Nenhuma carteira externa sem qualificação.** Qualifique cada carteira de destino, na requisição ou salvando a carteira, e cada carteira remetente. A Avenia aplica valores padrão a quem não foi qualificado (custodiante Avenia LLC, país `US`, finalidade `67995`). Eles mantêm a operação funcionando, mas **não** cumprem a exigência.
2. **Informação real, do seu cadastro.** O beneficiário é o titular verdadeiro dos recursos, conferido no seu processo de conheça seu cliente. Não use o nome da plataforma, um texto fixo ou o nome do seu cliente quando o dono da carteira for outra pessoa.
3. **Custódia declarada corretamente.** Autocustódia (`isSelfCustody: true`) só quando o próprio beneficiário guarda as chaves, como numa MetaMask ou carteira de hardware. Carteira de corretora é sempre `isSelfCustody: false`, com o nome da corretora.
4. **País do beneficiário, e não da corretora.** Uma carteira na Binance de um cliente que mora no Brasil é `BR`.
5. **Finalidade real em toda operação internacional.** Escolha o código pela natureza da operação e pela faixa de valor. Não use um único código para tudo.
6. **Pendências respondidas.** Consulte com frequência as carteiras remetentes pendentes e as pendências de finalidade, e responda cada uma. Comece pelos depósitos retidos (`DEPOSIT_HOLD`), que seguram o dinheiro do cliente.
7. **Carteiras antigas qualificadas até 15/11.** As carteiras salvas antes de novembro aparecem com `qualificationStatus: PENDING`.
8. **Registro do que foi declarado.** Guarde, junto com cada operação, de onde veio cada informação (o cadastro do cliente ou a declaração dele). Isso é a sua evidência numa fiscalização ou num pedido de informação.

## Situações comuns

| Situação | Custódia | Beneficiário | País | Finalidade |
| --- | --- | --- | --- | --- |
| Cliente no Brasil compra stablecoin e envia para a própria MetaMask | autocustódia | o cliente | `BR` | não vai |
| Cliente no Brasil envia para a própria conta numa corretora | corretora (`custodianName`) | o cliente | `BR` | não vai |
| Empresa paga um fornecedor no exterior em stablecoin | conforme a carteira do fornecedor | o fornecedor | país do fornecedor | a do pagamento (serviço, mercadoria...) |
| Cliente envia para carteira própria no exterior (recursos próprios) | conforme a carteira | o cliente | onde está o titular | a de transferência entre contas do mesmo titular |
| Cliente recebe stablecoin de um terceiro no exterior | conforme a carteira remetente | o remetente | país do remetente | a do recebimento |
| Depósito em dólar (Wire/ACH) convertido em stablecoin | conforme a carteira de destino | quem recebe | conforme o beneficiário | sempre |

## O que não fazer

- Deixar a qualificação vazia para cair nos valores padrão da Avenia.
- Usar a mesma finalidade em todas as operações, sem olhar a natureza de cada uma.
- Declarar autocustódia para uma carteira de corretora, ou o contrário.
- Pôr o país da corretora no lugar do país do beneficiário.
- Usar o nome do seu cliente como beneficiário quando os recursos são de outra pessoa.
- Ignorar as pendências. Um depósito retido só é liberado quando a finalidade é informada.

## Prazos

| Data | O que acontece |
| --- | --- |
| **1º/11/2026** | O reporte começa. A API já aceita os campos novos. |
| **15/11/2026** | Carteiras salvas antes de novembro precisam estar qualificadas. Depósitos recebidos sem finalidade passam a ficar retidos. |

## Checklist

- [ ] Qualificação mandada em todo depósito e troca com envio para carteira externa, ou carteira salva já qualificada.
- [ ] Carteiras salvas antes de novembro qualificadas.
- [ ] Carteiras remetentes pendentes qualificadas, com uma rotina que consulta as novas.
- [ ] Finalidade mandada na cotação e no depósito em dólar.
- [ ] Rotina que consulta e responde as pendências de finalidade, com prioridade para depósitos retidos.
- [ ] Lista de países e finalidades lida da API, e não fixa no código.
- [ ] Dados de qualificação tirados do cadastro do cliente, com registro da origem.
- [ ] AppID com os escopos `STABLECOIN_SUBACCOUNT_LIST` e `STABLECOIN_SUBACCOUNT_CREATE`.

:::caution
Esta página explica o que a API pede para atender ao reporte. Ela não substitui a análise do seu jurídico e do seu compliance sobre as obrigações da sua empresa.
:::
