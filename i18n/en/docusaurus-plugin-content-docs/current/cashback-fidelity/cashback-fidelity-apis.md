---
id: cashback-fidelity-apis
title: Loyalty Cashback APIs
tags:
  - api
  - cashback
  - fidelity
---

## How to give cashback to a customer via API?

To give cashback to a customer via API, use the API _endpoint_ `/api/v1/cashback-fidelity`.

You can find the documentation for this _endpoint_ [here](/api#tag/cashback-fidelity/POST/api/v1/cashback-fidelity).

The required fields to give cashback are:

- **`value`**: The cashback amount in cents.
- **`taxID`**: TaxID (CPF/CNPJ) of the customer.

```bash
curl 'https://api.woovi.com/api/v1/cashback-fidelity' -X POST -H "Accept: application/json" -H "Content-Type: application/json" -H "user-agent: node-fetch" --data-binary '{"taxID":"cpf-cnpj","value":1500}
```

Note: The customer must already exist on the platform.

## How to check a customer's cashback balance via API?

To check a customer's cashback balance via API, use the API _endpoint_ `/api/v1/cashback-fidelity/balance/:cpf-cnpj`.

You can find the documentation for this _endpoint_ [here](/api#tag/cashback-fidelity/GET/api/v1/cashback-fidelity/balance/{taxID}).

[`/api/v1/cashback-fidelity/balance/{taxID}`](/api#tag/cashback-fidelity/GET/api/v1/cashback-fidelity/balance/{taxID})

```bash
curl 'https://api.woovi.com/api/v1/cashback-fidelity/balance/${cpf-cnpj}/balance' -X POST -H "Accept: application/json" -H "Content-Type: application/json" -H "user-agent: node-fetch" --data-binary '{"taxID":"cpf-cnpj","value":1500}
```
