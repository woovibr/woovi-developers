---
id: person-statistic
title: Estatísticas de Pessoa (CPF/CNPJ)
sidebar_label: Estatísticas de Pessoa (CPF/CNPJ)
description: Consultar estatísticas de fraude e indicadores de risco para pessoas físicas e jurídicas
unlisted: true
sidebar_class_name: sidebar-hidden
---

# Estatísticas de Pessoa (CPF/CNPJ)

A API de Estatísticas de Pessoa permite consultar dados estatísticos de fraude e indicadores de risco associados a uma pessoa física (CPF) ou jurídica (CNPJ). Este endpoint fornece informações sobre liquidações, marcadores de fraude, relatórios de infração e vínculos com chaves PIX.

## Visão Geral

Esta API retorna estatísticas associadas ao proprietário (pessoa) identificado pelo CPF ou CNPJ, incluindo:

- **SPI**: Liquidações como recebedor no Sistema de Pagamentos Instantâneos
- **Marcadores de Fraude**: Histórico de fraudes associadas à pessoa
- **Relatórios de Infração**: Notificações de infração abertas e rejeitadas
- **Entradas**: Contas associadas a chaves PIX registradas

## API Endpoint

Consultar estatísticas por CPF/CNPJ:

```
GET /api/v1/fraud-validation/taxId/{taxId}
```

**📖 [Ver documentação completa da API](https://developers.woovi.com/en/api#tag/fraudValidation)**

## Parâmetros da Requisição

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `taxId` | string | Sim | CPF (11 dígitos) ou CNPJ (14 dígitos) da pessoa a ser consultada |

## Estrutura da Resposta

### SPI (Sistema de Pagamentos Instantâneos)

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `watermark` | string | Data da última atualização dos dados |
| `settlements` | object | Número de liquidações como recebedor no SPI |
| `settlements.d90` | string | Últimos 90 dias |
| `settlements.m12` | string | Últimos 12 meses |
| `settlements.m60` | string | Últimos 60 meses (5 anos) |

### Marcadores de Fraude (`fraudMarkers`)

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `watermark` | string | Data da última atualização dos dados de fraude |
| `applicationFrauds` | object | Marcações de fraude do tipo APPLICATION_FRAUD por período |
| `muleAccounts` | object | Marcações de fraude do tipo MULE_ACCOUNT (contas intermediárias para recursos ilícitos) |
| `scammerAccounts` | object | Marcações de fraude do tipo SCAMMER_ACCOUNT (contas de golpistas) |
| `otherFrauds` | object | Marcações de fraude do tipo OTHER |
| `unknownFrauds` | object | Marcações de fraude sem classificação de tipo, criadas na API v1 |
| `totalFraudTransactionAmount` | object | Valor total das transações liquidadas no SPI associadas a marcações de fraude (exclui APPLICATION_FRAUD e UNKNOWN) |
| `distinctFraudReporters` | object | Número de participantes distintos que geraram marcações de fraude (exclui tipo UNKNOWN) |

### Relatórios de Infração (`infractionReports`)

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `watermark` | string | Data da última atualização dos dados de infração |
| `openReports` | string | Número de notificações de infração ainda não concluídas nem canceladas |
| `openReportsDistinctReporters` | string | Número de participantes distintos criadores de notificações abertas |
| `rejectedReports` | object | Número de notificações de infração concluídas com rejeição por período |

### Entradas (`entries`)

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `watermark` | string | Data da última atualização dos dados de entrada |
| `registeredAccounts` | string | Número de contas da pessoa associadas a chaves atualmente registradas |

## Períodos de Tempo

A API utiliza os seguintes indicadores de período:

- **d90**: Últimos 90 dias
- **m12**: Últimos 12 meses
- **m60**: Últimos 60 meses (5 anos)

## Exemplo de Requisição

### cURL
```bash
curl -X GET "https://api.openpix.com.br/api/v1/fraud-validation/taxId/12345678901" \
  -H "Authorization: SEU_APP_ID_AQUI"
```

## Exemplo de Resposta

```json
{
  "success": true,
  "data": {
    "personStatistics": {
      "spi": {
        "watermark": "2025-04-08T10:19:11.308Z",
        "settlements": {
          "d90": "0",
          "m12": "9",
          "m60": "9"
        }
      },
      "fraudMarkers": {
        "watermark": "1970-01-01T00:00:00Z",
        "applicationFrauds": {
          "d90": "0",
          "m12": "0",
          "m60": "0"
        },
        "muleAccounts": {
          "d90": "0",
          "m12": "0",
          "m60": "0"
        },
        "scammerAccounts": {
          "d90": "0",
          "m12": "0",
          "m60": "0"
        },
        "otherFrauds": {
          "d90": "0",
          "m12": "0",
          "m60": "0"
        },
        "unknownFrauds": {
          "d90": "0",
          "m12": "0",
          "m60": "0"
        },
        "totalFraudTransactionAmount": {
          "d90": "0",
          "m12": "0",
          "m60": "0"
        },
        "distinctFraudReporters": {
          "d90": "0",
          "m12": "0",
          "m60": "0"
        }
      },
      "infractionReports": {
        "watermark": "1970-01-01T00:00:00Z",
        "openReports": "0",
        "openReportsDistinctReporters": "0",
        "rejectedReports": {
          "d90": "0",
          "m12": "0",
          "m60": "0"
        }
      },
      "entries": {
        "watermark": "2025-05-24T19:38:15.063Z",
        "registeredAccounts": "1"
      }
    }
  }
}
```

## Entendendo a Resposta

### Valores Zero
Todos os valores que mostram "0" indicam que não há registros de fraudes, infrações ou problemas associados à pessoa consultada.

### Datas Watermark
- **Datas recentes** (ex: "2025-04-08T10:19:11.308Z") indicam atualizações recentes de dados
- **Datas epoch** (ex: "1970-01-01T00:00:00Z") indicam que não há dados disponíveis para essa categoria

### Diferença entre Estatísticas de Pessoa e de Chave PIX

| Aspecto | Estatísticas de Pessoa | Estatísticas de Chave PIX |
|---------|----------------------|---------------------------|
| Identificador | CPF ou CNPJ | Chave PIX (CPF, CNPJ, email, telefone, aleatória) |
| Escopo | Todas as chaves e contas da pessoa | Chave PIX específica |
| Entradas | `registeredAccounts` (contas registradas) | `distinctAccounts` (contas distintas por período) |
| Endpoint | `/fraud-validation/taxId/{taxId}` | `/fraud-validation/pix-key/{pix-key}` |

## Casos de Uso

- **KYC (Know Your Customer)**: Verificar o histórico de fraude de uma pessoa antes de aprovar cadastro
- **Avaliação de Risco**: Avaliar o nível de risco de transações com base no histórico do destinatário
- **Conformidade Regulatória**: Atender aos requisitos do Banco Central para prevenção de fraude
- **Monitoramento**: Acompanhar indicadores de fraude de contrapartes em transações PIX

## Tratamento de Erros

A API retornará respostas de erro apropriadas para requisições inválidas. Cenários de erro comuns incluem:

- Formato de CPF/CNPJ inválido
- CPF/CNPJ não encontrado
- Erros de autenticação/autorização
- Rate limit
