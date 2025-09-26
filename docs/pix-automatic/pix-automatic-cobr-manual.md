---
id: pix-automatic-cobr-manual
sidebar_position: 10
title: Criação manual de cobranças recorrente
tags:
  - pix-automatic
  - api
---

## Criação manual de cobranças recorrentes

Segundo a documentação do banco central, as cobranças recorrentes podem ser feitas de 2 a 10 dias antes da data da cobrança. Nós da woovi definimos que a partir do 4 dia vamos criar as cobranças para as parcelas que ainda não possuem. 

Dessa forma, caso você queria criar as cobranças manualmente, seja para ter um controle maior sobre as cobranças recorrentes, seja para criação com valores dinâmicos, terá entre 5 a 10 dias antes da data cobrança para realizar a criação.

A primeira etapa é buscar qual a parcela que você desejará criar a cobrança manual. Para isso recomendamos buscar a última parcela da assinaturas com a requisição, enviando o identificador da assinatura.

GET `/api/v1/subscriptions/{id}/installments`

Para realizar a criação, basta identificar o globalID da Parcela, normalmente será a última com o status `SCHEDULED`.

> As parcelas são criadas de forma incremental, sempre que a última for paga ou cancelada. Será feita a criação da próxima com antecedência para você conseguir alterar o valor da cobrança

POST `/api/v1/installments/{id}/cobr`

no body da requisição é opcional enviar o novo valor em centavos.

```json
{
  "value": 100
}
```

Você pode ver em mais detalhes pelo [link](https://developers.woovi.com/api#tag/CobR)

Caso a cobrança manual falhe, você poderá realizar novas retentativas de cobrança. 

POST `/api/v1/installments/{id}/cobr/retry`

no body da requisição é opcional enviar o novo valor em centavos.

```json
{
  "value": 100
}
```
