---
id: cashback-fidelity-apis
title: APIs de Cashback Fidelidade
tags:
  - api
  - cashback
  - fidelity
---

## Como dar cashback para um cliente via API?

Para dar cashback para um cliente via API, você utiliza o _endpoint_ `/api/v1/cashback-fidelity` da API.

Você pode acessar [aqui](/api#tag/cashback-fidelity/POST/api/v1/cashback-fidelity)
a documentação referente a esse _endpoint_.

Os campos obrigatórios para dar um cashback são os sequintes:

- **`value`**: O valor em centavos do cashback.
- **`taxID`**: TaxID (CPF/CNPJ) do client.

```bash
curl 'https://api.woovi.com/api/v1/cashback-fidelity' -X POST -H "Accept: application/json" -H "Content-Type: application/json" -H "user-agent: node-fetch" --data-binary '{"taxID":"cpf-cnpj","value":1500}
```

Obs.: O cliente precisa já ter sido criado na plataforma.

## Como verificar o saldo de cashback de cliente via API?

Para verificar o saldo de cashback para um cliente via API, você utiliza o _endpoint_ `/api/v1/cashback-fidelity/balance/:cpf-cnpj` da API.

Você pode acessar [aqui](/api#tag/cashback-fidelity/GET/api/v1/cashback-fidelity/balance/{taxID})
a documentação referente a esse _endpoint_.

[`/api/v1/cashback-fidelity/balance/{taxID}`](/api#tag/cashback-fidelity/GET/api/v1/cashback-fidelity/balance/{taxID})

```bash
curl 'https://api.woovi.com/api/v1/cashback-fidelity/balance/${cpf-cnpj}/balance' -X POST -H "Accept: application/json" -H "Content-Type: application/json" -H "user-agent: node-fetch" --data-binary '{"taxID":"cpf-cnpj","value":1500}
```