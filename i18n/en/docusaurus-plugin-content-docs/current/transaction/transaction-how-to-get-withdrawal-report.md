---
id: transaction-how-to-get-withdrawal-report
title: How to get the Withdrawal Report through the API?
tags:
  - transaction
  - api
---

## Withdrawal Report through the API

We provide the `/api/v1/transaction` _endpoint_ so you can fetch the
_transactions_ of the respective affiliated company.

You can find the documentation for this _endpoint_ [here](/api#tag/transactions/GET/api/v1/transaction).

With this endpoint, getting the withdrawal report is very simple: just pass the `endToEndId` of the withdrawal you want the report for in the `withdrawal` parameter

Example: `withdrawal=E18236120202012032010s01345689XBY`

After making the request, if everything went well, the request _status code_ will be `2xx` and the response `body`
will contain a list of all transactions that belong to the given withdrawal.

For example, this will be our response:

```json
{
  "pageInfo": {
    "skip": 0,
    "limit": 10,
    "totalCount": 20,
    "hasPreviousPage": false,
    "hasNextPage": true
  },
  "transactions": [
    {
      "customer": {
        "name": "Dan",
        "email": "email0@example.com",
        "phone": "5511999999999",
        "taxID": {
          "taxID": "31324227036",
          "type": "BR:CPF"
        },
        "correlationID": "9134e286-6f71-427a-bf00-241681624586"
      },
      "payer": {
        "name": "Dan",
        "email": "email0@example.com",
        "phone": "5511999999999",
        "taxID": {
          "taxID": "31324227036",
          "type": "BR:CPF"
        },
        "correlationID": "9134e286-6f71-427a-bf00-241681624586"
      },
      "charge": {
        "status": "ACTIVE",
        "customer": "603f81fcc6bccc24326ffb43",
        "correlationID": "9134e286-6f71-427a-bf00-241681624586",
        "createdAt": "2021-03-03T12:33:00.546Z",
        "updatedAt": "2021-03-03T12:33:00.546Z"
      },
      "withdraw": {
        "value": 100,
        "time": "2021-03-03T12:33:00.536Z",
        "infoPagador": "payer info 1",
        "endToEndId": "E18236120202012032010s01345689XBY"
      },
      "type": "PAYMENT",
      "infoPagador": "payer info 0",
      "value": 100,
      "time": "2021-03-03T12:33:00.536Z",
      "transactionID": "transactionID",
      "endToEndId": "E18236120202012032010s0133872GZA"
    }
  ]
}
```
