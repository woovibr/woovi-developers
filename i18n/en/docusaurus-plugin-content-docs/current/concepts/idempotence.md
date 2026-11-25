---
id: idempotence
title: Idempotence
tags:
  - api
  - conceito
  - idempotencia
---

## Idempotence

Idempotence, in a development context, means that calling a given function once or many times must have the same effect on the state of the system.

A function being idempotent does not mean its return value is always the same, but that, if it has changed the state of the system, it makes no further change when called again right after with the same parameters.

So, for example, a function that returns an account balance is idempotent, even if it returns different values (because other functions may have changed the state of the system between one call and the next.)

### Idempotence in our APIs

To guarantee idempotent calls to our APIs, we use the pattern known as Idempotence-Key, which means that when you call our API, you should provide an ID that your system understands as corresponding to the operation.

E.g.:

> You want to use our API to create a charge
>
> In your system, you should have a table/collection that represents the charge creation; create a document and get its ID
>
> In the call to our API, add a `correlationID` property with that ID.

When using our webhooks, you must make sure the route that handles the webhooks is idempotent, since it is common practice to resend webhooks to ensure at least one of them arrived and was processed. At the end of this document there are examples of how you can implement this.

For payments (Pix Out), the `correlationID` is also the idempotency key: reuse the same `correlationID` on retries until the payment reaches a terminal state. See [Payment Idempotency](../payment/payment-idempotency.md) for details and examples.

### Why is idempotence relevant?

A recurring problem in event-driven systems is event duplication, which can happen for many reasons, such as communication failures, parallel invocations of the functions that generate the events, etc.

Resilient systems are built assuming these problems can and will happen frequently, and are prepared so that communication failures don't lead to a bad internal state.

So the main value of idempotence is making your system resilient and reliable.

### When should a function be idempotent?

As with everything in development, it depends heavily on the project's goals and business rules.

However, there are some patterns:

#### REST APIs

##### PUT routes

All routes with the PUT verb, which modify entities.

E.g.: A route that changes a customer's address.

As long as the new address is the same, it should make no difference to the state of the system how many times this route is called.

##### GET routes

All routes with the GET verb, which read information.

E.g.: A route that reads the current balance of a bank account.

Even if the balance changes over time, it is safe to call this route many times without it changing the state of the system.

##### DELETE routes

All routes with the DELETE verb, which delete entities.

E.g.: A route that deletes a charge.

Once called, the function deletes the bank account; subsequent calls must not delete other accounts, but return a message saying the account has already been deleted.

##### Public POST routes

Not every POST route needs to be idempotent.

It is worth considering whether external servers will call your API (as opposed to servers/applications you control), because if so, the same connection problems associated with webhooks will arise, and these routes should also be idempotent.

#### WebHooks and event-driven systems

It is normal for routes that handle webhooks or events to be invoked multiple times.

This happens to work around unreliable communication between the server that originated the event and the receiver of the message.

Because of this, routes that handle webhooks must be idempotent.

### How to implement idempotence?

These are some patterns for implementing idempotence:

#### getOrCreate pattern

The idea of this pattern is to check whether the entity the function is trying to create already has an equivalent in the database.

Given this function:

```js
const createCustomerBankAccount = function(customer, params){

    // Model validations
    ...

    // Creating the account in the database
    db.customerBankAccount.create({ ...params, customer: customer.id })
}
```

Applying this pattern, it can be rewritten as follows:

```js
const getOrCreateCustomerBankAccount = function(customer, params){

    // Before running the creation validations, we can look up the most important parameters in our database and return an existing account
    const existingCustomerBankAccount = db.customerBankAccount.get({
        customer: customer.id,
        bankId: params.bankId
    })

    if (existingCustomerBankAccount){
        return existingCustomerBankAccount;
    }

    // Model validations
    ...

    // Creating the account in the database
    db.customerBankAccount.create({ ...params, customer: customer.id })
}
```

#### Call history pattern

The idea of this pattern is to save every call made to the route that handles the events and, when a new call arrives, check whether an identical call was made before.

Given this function:

```js
const createCustomerBankAccount = function(customer, params){

    // Model validations
    ...

    // Creating the account in the database
    db.customerBankAccount.create({ ...params, customer: customer.id })
}
```

Applying this pattern, it can be rewritten as follows:

```js
const createCustomerBankAccount = function(customer, params){

    const newRequest = { customer, ...params }

    const existingRequest = db.events.get(newRequest);

    if (existingRequest){
        return;
    }

    // Model validations
    ...

    // Creating the account in the database
    db.customerBankAccount.create({ ...params, customer: customer.id })

    db.events.create({...newRequest})
}
```

Or, using hashing to save storage:

```js
const createCustomerBankAccount = function(customer, params){

    const newRequestHash = MD5(JSON.stringify({ customer, ...params }));

    const existingRequest = db.events.get(hash: newRequestHash);

    if (existingRequest){
        return;
    }

    // Model validations
    ...

    // Creating the account in the database
    db.customerBankAccount.create({ ...params, customer: customer.id })

    db.events.create({ hash: newRequestHash})
}
```

#### Idempotence-Key pattern

The idea of this pattern is to use a key to represent an operation and, when a duplicate key is received, not repeat the operation.

We use a pattern similar to this in our APIs through the `correlationID` property.

Given this function:

```js
const createCustomerBankAccount = function(customer, params){

    // Model validations
    ...

    // Creating the account in the database
    db.customerBankAccount.create({ ...params, customer: customer.id });
}
```

Applying this pattern, it can be rewritten as follows:

```js
const createCustomerBankAccount = function(customer, params){

    const { idempotenceKey } = params;

    // Check whether the user sent an idempotency key
    if (idempotenceKey){

        const existingBankAccount = db.customerBankAccount.get({
            idempotenceKey
        })

        // Check whether an account was already registered by this operation and return it if so
        if (existingBankAccount){
            return existingBankAccount;
        }

    }


    // Model validations
    ...

    // Creating the account in the database
    db.customerBankAccount.create({ ...params, customer: customer.id });
}
```
