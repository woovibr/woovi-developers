---
id: funds-recovery
sidebar_position: 1
title: O que é a Recuperação de fundos (MED)?
tags:
  - funds-recovery
  - med
  - api
---

A **Recuperação de fundos** (_Funds Recovery_) é a implementação do **MED** (Mecanismo Especial de Devolução) do Banco Central. Ela permite que você solicite a devolução de uma transação Pix enviada pela sua conta em casos de **golpe ou fraude**.

Ao abrir uma recuperação de fundos, o Banco Central rastreia o caminho do dinheiro entre as instituições participantes do Pix e abre solicitações de devolução nas contas por onde os fundos passaram. Os valores localizados são bloqueados nas contas de destino e devolvidos para a sua conta.

## Pré-requisitos

Para usar a API de recuperação de fundos você precisa:

- Ter a funcionalidade **MED API** habilitada na sua conta. Caso ainda não tenha, entre em contato com o nosso suporte.
- Um [AppID](../apis/api-getting-started.md) para autenticar as requisições, enviado no header `Authorization`.

## Endpoints

| Endpoint                                                                       | Método | Descrição                                |
| ------------------------------------------------------------------------------ | ------ | ---------------------------------------- |
| [`/api/v1/funds-recovery`](./funds-recovery-create-api.mdx)                     | POST   | Abrir uma recuperação de fundos           |
| [`/api/v1/funds-recovery/{id}`](./funds-recovery-get-api.mdx)                   | GET    | Consultar uma recuperação de fundos       |
| [`/api/v1/funds-recovery/{id}/cancel`](./funds-recovery-cancel-api.mdx)         | POST   | Cancelar uma recuperação de fundos        |

## Ciclo de vida

Uma recuperação de fundos passa pelos seguintes status:

- **`CREATED`**: a recuperação de fundos foi registrada no Banco Central.
- **`TRACKED`**: o rastreamento do caminho do dinheiro foi concluído.
- **`AWAITING_ANALYSIS`**: aguardando a análise do Banco Central.
- **`ANALYSED`**: análise concluída; as solicitações de devolução são abertas nas instituições por onde os fundos passaram.
- **`REFUNDING`**: devoluções em andamento.
- **`COMPLETED`**: processo concluído. Os valores recuperados foram devolvidos.
- **`CANCELLED`**: a recuperação de fundos foi cancelada.

`COMPLETED` e `CANCELLED` são status finais — após atingi-los a recuperação de fundos não pode mais ser alterada.

:::info
O valor devolvido depende do saldo encontrado nas contas rastreadas. A recuperação pode ser **total**, **parcial** ou pode não haver fundos disponíveis para devolução.
:::
