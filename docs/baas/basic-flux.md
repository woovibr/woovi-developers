---
id: basic-flux-baas
title: Fluxo básico de Baas
tags: 
  - baas 
  - api
---

Fluxo básico de Baas

Este documento irá ajuda-lo a entender o fluxo básico de baas

pré requisitos

antes de começar a utilizar a api baas é necessário duas coisas:

solicitar ativação das features: Baas e Criação de conta

gerar uma chave de api master

A API precisa ser do tipo MASTER porquê ela precisa ser capaz de criar novas integrações. A conta bancária relacionada a essa API será utilizada no processo de criação das novas contas bancárias, elas usarão os dados desta para serem criadas.

Assim estamos prontos para iniciar a sequencia de integração

Sequência da integração


![basic-flux-baas](__assets__/basic-flux-baas.png)


1. Registrando uma conta

Utilize o endpoint de registro de conta para registrar uma nova conta

Utilize a chave de api master para autenticar a requisição

Faça a requisição



curl --request POST \
  --url https://api.woovi.com/api/v1/kyc/onboarding \
  --header 'Authorization: Bearer REPLACE_BEARER_TOKEN' \
  --header 'content-type: application/json' \
  --data '{"taxID":"string","correlationID":"string","redirectUrl":"https://partner.example.com/kyc-done","representatives":[{"taxID":"string","name":"string"}]}'

Caso tudo ocorra corretamente, um código 201 será retornado.

No corpo da resposta terá:

{
  "linkOnboarding": "https://kyc.woovi.com/onboarding/QWNjb3VudFJlZ2lzdGVyOjY5...",
  "redirectUrl": "https://partner.example.com/kyc-done",
  "accountRegister": {
    "status": "PENDING",
    "officialName": "RAZAO_SOCIAL_DA_EMPRESA",
    "tradeName": "NOME_FANTASIA_DA_EMPRESA",
    "taxID": {
      "taxID": "XXXXXXXX0001XX",
      "type": "BR:CNPJ"
    },
    "correlationID": "my-unique-id",
    "representatives": [
      {
        "name": "NOME_DO_SOCIO",
        "taxID": {
          "taxID": "XXXXXXXXXXX",
          "type": "BR:CPF"
        }
      }
    ]
  }
}

2. Aguarde a aprovação da conta

Cadastre um webhook ouvindo o seguinte evento: "ACCOUNT_REGISTER_APPROVED"

Para cadastrar um webhook faça a seguinte request:

   curl --location --request POST 'https://api.woovi.com/api/openpix/v1/webhook' \
      --header 'Content-Type: application/json' \
      --header 'Authorization: <apiMasterKey>' \
      --data-raw '{
        "webhook": {
        "name": "webhook via api",
        "event": "ACCOUNT_REGISTER_APPROVED",
        "url": "https://minhaurl.test/webhook",
        "authorization": "auth_key",
        "isActive": true
      }
    }'

No corpo da resposta terá:

{
  "event": "ACCOUNT_REGISTER_APPROVED",
  "accountRegister": {
    "correlationID": "<CNPJ>",
    "officialName": "<NOME-COMPLETO>",
    "taxID": {
      "taxID": "<CNPJ>",
      "type": "BR:CNPJ"
    },
    "status": "APPROVED"
  },
  "account": {
    "status": "OPEN",
    "accountId": "6a1ec49c050ca1d11348008f",
    "account": "00000000000006588018",
    "branch": "0001"
  }
}

3. Gere uma chave de api padrão

Utilize o endpoint de application para gerar uma chave de api para a conta recém criada

Utilize a chave de api master para autenticar a requisição

Faça a requisição

{
  "accountId": "6a10805a342fd2a76aa0e5ac",
  "application":  {
    "name": "Teste API",
    "type": "API",
    "scopes": [
      "CHARGE_GET"
    ]
  }
}



Caso tudo ocorra corretamente, um código 201 será retornado.

No corpo da resposta terá:

{
    "application": {
        "name": "Teste API",
        "isActive": true,
        "type": "API",
        "clientId": "Client_Id_791f667b-c885-45e4-bbe1-468de247a9f6",
        "clientSecret": "Client_Secret_JgDrJ3fedGz9DXlBqPUogNy8HxAucm47l/FWwfSInl8=",
        "appID": "<APID>",
        "scopes": [
            "CHARGE_GET"
        ]
    }
}

4. Gere uma chave pix aleatória

Utilize o endpoint pix-keys para gerar uma chave para a conta

Utilize o appId gerado no passo anterior para autenticar a requisição

Faça a requisição:

   curl -X POST "https://api.woovi.com/api/v1/pix-keys" \
    -H "Authorization: <appId>" \
    -H "Content-Type: application/json" 
    --data-raw '{
      "key": "k1",
      "type": "EVP"
    }'

Caso tudo ocorra corretamente, um código 200 será retornado.

No corpo da resposta terá:

 {
   "pixKey": {
       "pixKey": "",
       "type": "EVP",
       "isDefault": false
   }
 }
 ```
