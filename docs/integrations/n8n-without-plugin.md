---
id: n8n-without-plugin
title: Integração N8N com woovi sem o nosso Plugin
tags:
  - integration
  - n8n
  - http
---

:::info
Antes de começar, certifique-se de ter configurado seu acesso à API da woovi. 
Você pode encontrar o guia completo de como obter suas credenciais em nossa [documentação de API Getting Started](https://developers.woovi.com.br/docs/apis/api-getting-started).
:::

## Como integrar o N8N com a woovi sem usar o plugin?

Você pode integrar a woovi com o N8N utilizando o nó HTTP Request nativo do N8N. Este guia mostrará como configurar e usar os endpoints da API da woovi.

### Pré-requisitos

1. Uma conta N8N
2. Seu APP ID da woovi (disponível na aba de aplicações/plugins)
3. Acesso à API da woovi

## Criando um Workflow para Criar Cobranças

1. Crie um novo workflow no N8N
2. Adicione um nó "HTTP Request"
3. Configure o nó com as seguintes propriedades:
   - Authentication: Matennha em "none"
   - Method: POST
   - URL: `https://api.woovi.com.br/api/v1/charge`
   - Send Headers: true
    - Adicione o header "Authorization" com seu `appID`
   - Send Body: true
   - Body Parameters:
    - Body Content Type: Coloque em "JSON"
    - Specify Body: Use o JSON
   - Adicione o corpo da requisição
```json
{
  "correlationID": "meu-correlation-id",
  "value": 200,
  "comment": "meu comentario"
}
```
![](./__assets__/n8n-without-plugin/create-charge/body-and-header-configuration.png)

Ao clicar em "Test step" você receberá uma saida similar a esta confirmando a criação da cobrança
![](./__assets__/n8n-without-plugin/create-charge/output-create-charge.png)

## Criando um Workflow para Consultar Cobranças

1. Adicione um nó "HTTP Request"
2. Configure o nó com as seguintes propriedades:
   - Authentication: Mantenha em "none"
   - Method: GET
   - URL: `https://api.woovi.com.br/api/v1/charge/MEU_CORRELATION_ID`
    - Substituia na URL o `MEU_CORRELATION_ID` pelo seu id de correlação
   - Send Headers: true
    - Adicione o header "Authorization" com seu `appID`
  - Send Body: false

![](./__assets__/n8n-without-plugin/get-charge/body-and-header-configuration.png)

Ao clicar em "Test step" você receberá uma saida similar a esta confirmando a criação da cobrança
![](./__assets__/n8n-without-plugin/get-charge/output-get-charge.png)

## Criando um Workflow para Reembolsar Cobranças

1. Adicione um nó "HTTP Request"
2. Configure o nó com as seguintes propriedades:
   - Authentication: Mantenha em "none"
   - Method: POST
   - URL: `https://api.woovi.com.br/api/v1/charge/MEU_CORRELATION_ID/refund`
    - Substituia na URL o `MEU_CORRELATION_ID` pelo seu id de correlação
   - Send Headers: true
    - Adicione o header "Authorization" com seu `appID`
   - Send Body: true
   - Body Parameters:
    - Body Content Type: Coloque em "JSON"
    - Specify Body: Use o JSON
   - Adicione o corpo da requisição
     ```json
     {
       "correlationID": "meu-refund-correlation-id"
     }
     ```

![](./__assets__/n8n-without-plugin/refund-charge/body-and-header-configuration.png)

Ao clicar em "Test step" você receberá uma saida similar a esta confirmando o reembolso da cobrança
![](./__assets__/n8n-without-plugin/refund-charge/output-refund-charge.png)

## Criando um Workflow para Escutar Webhooks da woovi

O primeiro passo é adicionar um nó "Webhook" ao seu workflow. Este nó será responsável por receber as notificações da woovi.

1. Adicione um nó "Webhook" ao seu workflow
2. Configure o nó com as seguintes propriedades:
   - HTTP Method: POST
   - Path: `webhook` (ou qualquer outro caminho que você preferir)

![](./__assets__/n8n-without-plugin/webhooks/configuration.png)

## Configurando o novo Webhook na woovi

1. Copie a URL do webhook que o N8N gerou (você pode encontrar esta URL na aba "Test" do nó Webhook)
2. Acesse o [Dashboard da woovi](https://app.woovi.com)
3. Vá para a seção "API/Plugins" e clique em "Novo Webhook"
4. Garanta que a opção "Ativo" esteja habilitada, dê um nome para o webhook, configure o tipo de evento a ser escutado e cole a URL do webhook do N8N no campo "URL"
5. Selecione os eventos que você deseja receber notificações. Os eventos disponíveis são:
   - woovi:CHARGE_CREATED - Nova Cobrança Criada
   - woovi:CHARGE_COMPLETED - Cobrança Paga
   - woovi:CHARGE_EXPIRED - Cobrança Expirada
   - woovi:CHARGE_COMPLETED_NOT_SAME_CUSTOMER_PAYER - Cobrança Paga por Outra Pessoa
   - woovi:TRANSACTION_RECEIVED - Transação Pix Recebida
   - woovi:TRANSACTION_REFUND_RECEIVED - Reembolso Concluído
   - woovi:MOVEMENT_CONFIRMED - Pagamento Externo Confirmado (Pix Out)
   - woovi:MOVEMENT_FAILED - Pagamento Externo com Falha (Pix Out)
   - woovi:MOVEMENT_REMOVED - Pagamento Externo Removido (Pix Out)
   - woovi:DISPUTE_CREATED - Disputa Criada
   - woovi:DISPUTE_ACCEPTED - Disputa Aceita
   - woovi:DISPUTE_REJECTED - Disputa Rejeitada
6. Clique em "Salvar"

![](./__assets__/n8n-without-plugin/webhooks/woovi-create-webhook.png)

Ao receber um webhook da woovi, você verá uma saída similar a esta:
![](./__assets__/n8n-without-plugin/webhooks/output-webhook.png)

## Dicas Importantes

1. Sempre use o correlationID único para cada cobrança
2. O valor deve ser enviado em centavos (ex: R$ 10,00 = 1000)
3. O correlationID de refund deve ser diferente do correlationID usado na criação de uma cobrança
4. Teste seus workflows em ambiente de desenvolvimento antes de usar em produção

## Documentação Técnica

Para mais detalhes sobre os endpoints, payloads e respostas da API, consulte nossa [documentação técnica completa](https://developers.woovi.com.br/api).