---
id: pix-indirect-overview
title: Visão Geral - Pix Indireto
tags:
  - indireto
  - pix
---

# Visão geral - Pix Indireto

Cada participante indireto da Woovi terá uma URL diferente para acessar nossos serviços, que consiste em:

|     |     |
| --- | --- |
| Homologação | &lt;nome&gt;.indireto.dev.woovi.cloud |
| Produção | &lt;nome&gt;.indireto.woovi.cloud |

Essa URL será compartilhada com o indireto quando os serviços forem ativados e puderem ser acessados.

## DICT

O mais importante desses serviços é o DICT, que vai seguir a mesmas rotas e documentação definidas [aqui](https://www.bcb.gov.br/content/estabilidadefinanceira/pix/API-DICT.html).

Então se você quer criar uma nova chave pix, por exemplo, deverá usar a URL:

- &lt;nome&gt;.woovi.cloud/dict/api/v2/entries

Todas as mensagens do DICT são por meio de JSON, e vão seguir o mesmo padrão do DICT API. Por exemplo:

No endpoint de verificar existência de chaves, o request consiste de um XML com os seguintes campos:

```
<CheckKeysRequest>
    <Keys>
        <Key>mail@mail.com</Key>
        <Key>mail2@mail.com</Key>
        <Key>+5561999999999</Key>
        <Key>+5561888888888</Key>
        <Key>99999999999</Key>
        <Key>99999999999999</Key>
    </Keys>
</CheckKeysRequest>
```

Para a Woovi no seu endpoint de DICT só é necessário mandar:

```
{
  "CheckKeysRequest": {
    "Keys": {
      "Key": [
        "mail@mail.com",
        "mail2@mail.com",
        "+5561999999999",
        "+5561888888888",
        "99999999999",
        "99999999999999"
      ]
    }
  }
}
```

E a resposta será da seguinte forma:

```
{
  "CheckKeysResponse": {
    "ResponseTime": "2020-01-10T10:00:00.000Z",
    "CorrelationId": "a9f13566e19f5ca51329479a5bae60c5",
    "Keys": {
      "Key": [
        {
          "hasEntry": "true",
          "value": "mail@mail.com"
        },
        {
          "hasEntry": "false",
          "value": "mail2@mail.com"
        },
        {
          "hasEntry": "true",
          "value": "+5561999999999"
        },
        {
          "hasEntry": "false",
          "value": "+5561888888888"
        },
        {
          "hasEntry": "false",
          "value": "99999999999"
        },
        {
          "hasEntry": "true",
          "value": "99999999999999"
        }
      ]
    }
  }
}
```

Com isso o acesso ao DICT já será possível.

## Mensagens do SPI

Toda a comunicação entre participantes diretos e indiretos é feita por meio de mensagens, as mais conhecidas e utilizadas são a PACS002 e PACS008. A PACS008 representa o início de um Pix e a PACS002 representa a confirmação da chegada da mensagem.

As mensagens do SPI seguem o mesmo padrão, serão recebidas em formato JSON saindo de sua fila e serão mandadas por sua fila para você em formato JSON. Exemplo de mensagem:

```
{
  "Fr": {
    "FIId": {
      "FinInstnId": {
        "Othr": {
          "Id": "31985422"
        }
      }
    }
  },
  "To": {
    "FIId": {
      "FinInstnId": {
        "Othr": {
          "Id": "54811417"
        }
      }
    }
  },
  "BizMsgIdr": "M000381660M80LWKPP10W4YJSKTMJGIR",
  "MsgDefIdr": "pacs.002.spi.1.11",
  "CreDt": "2025-03-08T19:37:40.583Z",
  "FIToFIPmtStsRpt": {
    "GrpHdr": {
      "MsgId": "M000381660M80LWKPP10W4YJSKTMJGIR",
      "CreDtTm": "2025-03-08T19:37:40.583Z"
    },
    "TxInfAndSts": [
      {
        "OrgnlInstrId": "E13935893202503081937u9uwdcxH7FB",
        "OrgnlEndToEndId": "E13935893202503081937u9uwdcxH7FB",
        "TxSts": "ACCC",
        "FctvIntrBkSttlmDt": {
          "DtTm": "2025-03-08T19:37:40.515Z"
        },
        "OrgnlTxRef": {
          "IntrBkSttlmDt": "2025-03-10"
        }
      }
    ]
  }
}
```

A mensagem segue a mesma estrutura dos catálogos definidos [aqui](https://www.bcb.gov.br/estabilidadefinanceira/comunicacaodados).

## Cobrança e Location

Como a Woovi disponibiliza seu endpoint de QrCodes para participantes indiretos, é necessário criar uma nova cobrança e uma nova location sempre que um novo QrCode for gerado.

Por isso, na URL de serviços voltada para indiretos, estão disponíveis dois endpoints fundamentais:

- `<nome>.woovi.cloud/charge`: responsável pela criação da cobrança, incluindo informações como valor, devedor, chave Pix e o tipo de cobrança.
- `<nome>.woovi.cloud/location`: responsável por gerar a URL que os demais participantes utilizarão para acessar os dados da cobrança.

Esses dois serviços são indispensáveis para viabilizar e simplificar pagamentos via QrCode.

## Conta Liquidation

Antes de realizar qualquer operação de **PixOut**, é fundamental verificar se a conta **Liquidation** da sua instituição na Woovi possui saldo suficiente para cobrir o valor da transação.

A conta Liquidation representa o saldo agregado dos seus clientes, refletindo todo o dinheiro disponível para a sua instituição dentro do fluxo do Pix. Ela é essencial para garantir a liquidez e a segurança das operações.

Para acessar os serviços relacionados a essa conta, utilize a URL:

- `<nome>.woovi.cloud/liquidation`

Os principais endpoints disponíveis são:

- `GET <nome>.woovi.cloud/liquidation/api/v1/balance`  
    Retorna o saldo atual da conta Liquidation, permitindo a verificação em tempo real antes de qualquer movimentação.
- `GET <nome>.woovi.cloud/liquidation/api/v1/statements`  
    Fornece o extrato completo da conta, detalhando todas as entradas e saídas realizadas ao longo do tempo.

**Importante:** qualquer tentativa de operação que exceda o saldo disponível na conta Liquidation será automaticamente bloqueada pela Woovi, como medida de segurança e controle financeiro. Portanto, é responsabilidade da instituição acompanhar e gerenciar esse saldo continuamente.