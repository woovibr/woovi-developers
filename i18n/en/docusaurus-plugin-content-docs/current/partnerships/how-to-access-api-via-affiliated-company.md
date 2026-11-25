---
id: how-to-access-api-via-affiliated-company
title: How to access the API with an affiliated company?
tags:
  - partnership
  - partner
  - api
---

## Creating access via API

We provide the `/api/openpix/v1/partner/application` _endpoint_ so that
you can create a new _application_ for the respective affiliated company.

You can find the documentation for this _endpoint_ [here](/api#tag/partner-request-access/POST/api/v1/partner/application).

As part of the request `body`, we expect the following items: `application` and `taxID`,
which consist of the following:

- **`application`:** information about the `application` you want to create, that is: its name and type.
  The application type can be one of the following values: `API`, `ORACLE` or `PLUGIN`.
- **`name`**: The name of your `application`, which makes it easier to identify the new `application`.

As a practical example, your request body would look similar to this:

```json
{
  "application": {
    "name": "MyAPIAccess",
    "type": "API",
  },
  "taxID": {
    "taxID": "65914571000187",
    "type": "BR:CNPJ",
  }
}
```

After making the request, if everything went well, the request _status code_ will be `2xx` and the response `body`
will contain the information about the newly created `application`.

For example, this would be our response:

```json
{
  "application": {
    "name": "MyAPIAccess",
    "isActive": true,
    "type": "API",
    "clientId": "Client_Id_xxxx",
    "clientSecret": "Client_Secret_xxxx"
  }
}
```

### Using the appID
After creating your new `application`, you can get your `AppID` by converting the `clientId`
and `clientSecret` values to [Base64](https://en.wikipedia.org/wiki/Base64). Here is a JavaScript example of 
how to do this:

```js
const appID = Buffer.from(`${clientId}:${clientSecret}`, 'utf8').toString('base64');
```

The `appID` is the value you will use in the `Authorization` _header_ to call the Woovi APIs.
