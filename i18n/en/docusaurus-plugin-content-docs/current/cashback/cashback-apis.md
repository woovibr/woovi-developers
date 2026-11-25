---
id: cashback-apis
title: Cashback APIs
tags:
  - api
  - cashback
  - fidelity
---

## How to give cashback to a customer via API?

To give cashback to a customer via API, use the API's `/api/v1/cashback-fidelity` _endpoint_.

You can find the documentation for this _endpoint_ <ApiLink method="POST" path="/api/v1/cashback-fidelity">here</ApiLink>.

The required fields to give cashback are the following:

- **`value`**: The cashback amount in cents.
- **`taxID`**: The customer's TaxID (CPF/CNPJ).

```bash
curl 'https://api.woovi.com/api/v1/cashback-fidelity' -X POST -H "Accept: application/json" -H "Content-Type: application/json" -H "user-agent: node-fetch" --data-binary '{"taxID":"cpf-cnpj","value":1500}
```

Note: The customer must already have been created on the platform.

## How to check a customer's cashback balance via API?

To check a customer's cashback balance via API, use the API's `/api/v1/cashback-fidelity/balance/:cpf-cnpj` _endpoint_.

You can find the documentation for this _endpoint_ <ApiLink method="GET" path="/api/v1/cashback-fidelity/balance/{taxID}">here</ApiLink>.

[`/api/v1/cashback-fidelity/balance/{taxID}`](/api#tag/cashback-fidelity/GET/api/v1/cashback-fidelity/balance/{taxID})

```bash
curl 'https://api.woovi.com/api/v1/cashback-fidelity/balance/${cpf-cnpj}/balance' -X POST -H "Accept: application/json" -H "Content-Type: application/json" -H "user-agent: node-fetch" --data-binary '{"taxID":"cpf-cnpj","value":1500}
```
