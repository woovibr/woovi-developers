---
id: payment-idempotency
sidebar_position: 6
title: "Idempotência em Pagamentos: reuse o correlationID"
tags:
  - payment
  - api
  - idempotencia
---

## Idempotência em Pagamentos

O `correlationID` é a **chave de idempotência** dos pagamentos (Pix Out) criados
via `POST /api/v1/payment`: enquanto ele for o mesmo, o pagamento é criado uma
única vez.

- Se você reenviar uma requisição com o **mesmo** `correlationID` (retry por timeout, reprocessamento de planilha, etc.), a API rejeita a segunda chamada com `Já existe um pagamento com o correlationID fornecido` — o valor **não** sai duas vezes.
- Se você enviar um `correlationID` **diferente** para o mesmo pagamento, a API trata como um pagamento **novo** e o valor **sai novamente**. Não existe uma trava por "mesmo valor para o mesmo destinatário" — a unicidade é garantida apenas pelo `correlationID`.

Por isso, a regra de ouro ao reprocessar um pagamento é:

> **Reuse o mesmo `correlationID` em todas as tentativas até o pagamento chegar a um estado terminal (`CONFIRMED` ou `REJECTED`). Só gere um novo `correlationID` depois disso.**

Gerar um `correlationID` novo enquanto o pagamento ainda está pendente é a causa
mais comum de pagamentos duplicados ou triplicados em integrações.

```js
// ERRADO: novo correlationID a cada tentativa => duplica o pagamento
function pagarComRetry(pagamento) {
  return api.post('/api/v1/payment', {
    correlationID: uuidv4(), // <- ID novo a cada retry
    value: pagamento.value,
    destinationAlias: pagamento.pixKey,
    destinationAliasType: pagamento.pixKeyType,
  });
}

// CERTO: correlationID estável, gerado e persistido uma vez por pagamento
function pagarComRetry(pagamento) {
  // pagamento.correlationID é gerado e salvo no seu banco ao criar o pagamento,
  // e reusado em todas as tentativas até CONFIRMED/REJECTED
  return api.post('/api/v1/payment', {
    correlationID: pagamento.correlationID,
    value: pagamento.value,
    destinationAlias: pagamento.pixKey,
    destinationAliasType: pagamento.pixKeyType,
  });
}
```

Para acompanhar o estado de um pagamento e decidir quando é seguro gerar um novo
`correlationID`, consulte [Como consultar e listar Pagamentos?](./payment-how-to-list.md)
e a [Máquina de Estados do Pagamento](./payment-state-machine.md). Sobre o
conceito geral, veja [Idempotência](../concepts/idempotence.md) e
[Correlation ID](../concepts/correlation-id.md).
