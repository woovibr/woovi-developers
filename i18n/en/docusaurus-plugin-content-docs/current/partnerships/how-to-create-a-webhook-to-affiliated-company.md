---
id: how-to-create-a-webhook-to-affiliated-company
title: How to create a webhook for an affiliated company?
tags:
  - partnership
  - partner
  - webhook
  - api
---

## Creating the webhook via API

To create a webhook, you **must** have previously created an `AppID`
for the affiliated company. If you haven't done that yet, follow this tutorial: 
[**How to access the API with an affiliated company?**](./how-to-access-api-via-affiliated-company.md)

After creating your new `application`, you can get your `AppID` by converting the `clientId`
and `clientSecret` values to [Base64](https://en.wikipedia.org/wiki/Base64). Here is a JavaScript example of 
how to do this:

```js
const appID = Buffer.from(`${clientId}:${clientSecret}`, 'utf8').toString('base64');
```

The `appID` is the value you will use in the `Authorization` _header_ to make sure you are creating the
webhook for the correct company.

---

Once you have the `appID`, you can call the `/api/openpix/v1/webhook` endpoint with the `POST` method
to create a new webhook for the affiliated company. You can find the documentation for this endpoint [here](/api#tag/webhook/POST/api/v1/webhook)
if you wish.

In the request `body`, we expect the following values:

- **`name`**: The name you want to use to identify this new webhook;
- **`event`**: The event that will _trigger_ the webhook. There are currently 6 possible triggers:
  - `OPENPIX:CHARGE_CREATED`: when a new charge is created;
  - `OPENPIX:CHARGE_COMPLETED`: when a charge has been paid;
  - `OPENPIX:CHARGE_COMPLETED_NOT_SAME_CUSTOMER_PAYER`: when a charge is paid and the payer is different from the customer associated with the charge;
  - `OPENPIX:CHARGE_EXPIRED `: when a charge has expired;
  - `OPENPIX:TRANSACTION_RECEIVED`: when a new Pix transaction is received;
  - `OPENPIX:TRANSACTION_REFUND_RECEIVED`: when a Pix transaction is refunded;
- **`url`**: The URL the webhook will call;
- **`isActive`**: whether the webhook is active; if not, it will not be triggered;
- **`authorization`**: the `Authorization` header value, if the URL requires one;

As a practical example, your request `body` would follow this format: 

```json
{
  "webhook": {
    "name": "webhookName",
    "event": "OPENPIX:CHARGE_CREATED",
    "url": "https://mycompany.com.br/webhook",
    "authorization": "openpix",
    "isActive": true
  }
}
```

Remember that the affiliated company's `appID` must be in your request _header_.

If everything went well, you will receive a response with a `2xx` _status code_, and the response `body`
will contain the information about the newly created webhook.

Here is an example response:

```json
{
  "webhook": {
    "id": "V2ViaG9vazo2MDNlYmUxZWRlYjkzNWU4NmQyMmNmMTg=",
    "name": "webhookName",
    "url": "https://mycompany.com.br/webhook",
    "authorization": "openpix",
    "isActive": true,
    "event": "OPENPIX:CHARGE_CREATED",
    "createdAt": "2023-01-04T22:29:10.720Z",
    "updatedAt": "2021-01-04T22:29:10.720Z"
  }
}
```
