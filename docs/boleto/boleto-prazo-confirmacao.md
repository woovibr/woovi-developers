---
id: boleto-prazo-confirmacao
title: Prazo de confirmação do Boleto
sidebar_label: Prazo de confirmação
tags:
- boleto
- prazo
- confirmação
---

# Prazo de confirmação do Boleto

## Resumo

O boleto **não é instantâneo como o Pix**. Depois que o pagador paga, o banco
precisa **processar e confirmar** o pagamento antes de a cobrança mudar de
**pendente** para **paga** — e isso **não acontece na hora**.

:::info Boleto não é Pix
O Pix é confirmado em tempo real. O boleto depende do processamento bancário,
então é normal que a cobrança fique um tempo como **pendente** mesmo já tendo
sido paga. Se o seu cliente enviar o comprovante, **não é preciso reenviar nada
nem abrir chamado** — o status muda sozinho assim que a confirmação chega.
:::

---

## Quanto tempo leva para confirmar?

Não existe um prazo fixo — depende do banco e do meio usado pelo pagador. Como
referência:

| Situação | Prazo típico de confirmação |
| --- | --- |
| Fluxo normal | **1 a 2 dias úteis** |
| Média geral | **1 a 3 dias úteis** |
| Pagamento em lotérica | **no mínimo 1 dia útil** |

A cobrança muda de **pendente** para **paga** **automaticamente** assim que a
confirmação é recebida — sem nenhuma ação da sua parte.

---

## Confirmação ≠ dinheiro na conta

Confirmar o pagamento e ter o valor disponível no saldo são **dois momentos
diferentes**:

1. **Confirmação** — a cobrança muda para paga (status `COMPLETED`). É o prazo
   descrito acima.
2. **Liquidação** — o valor é compensado e **creditado na sua conta** (status
   `SETTLED`). Acontece **depois** da confirmação.

Ou seja, mesmo após o boleto ser confirmado, ainda há um prazo até o dinheiro
cair no saldo. Para entender a liquidação e como conciliar o recebimento, veja
**[Conciliação de liquidação do Boleto](/docs/boleto/boleto-reconciliation)**.

:::tip Precisa de confirmação imediata?
Para recebimento em tempo real, oriente seu cliente a pagar via **Pix**. Nas
cobranças que aceitam boleto e Pix, o cliente escolhe a opção mais rápida.
:::
