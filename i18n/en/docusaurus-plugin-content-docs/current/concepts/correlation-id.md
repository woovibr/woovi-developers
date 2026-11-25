---
id: correlation-id
title: Correlation ID
description: What the correlationID is on Woovi, the recommended format, and why it works as the idempotency key for charges and payments.
tags:
  - api
  - conceito
  - idempotencia
---

When dealing with communication between distributed systems and services in an application, a critical aspect is identifying and tracking specific transactions. The Correlation ID plays a fundamental role in this process. Let's look at the proper format for a Correlation ID and walk through a practical example of its implementation.

## What is a Correlation ID?

A Correlation ID is a unique identifier associated with a specific transaction or request that follows the entire lifecycle of the operation, from entering to leaving the system. This is essential for tracking and correlating events and logs related to a given transaction, making it easier to debug and monitor complex systems.

On the Woovi platform, the `correlationID` is also the **idempotency key** of our APIs: it ensures that a charge or a payment is created only once, even if the request is sent again. For payments (Pix Out), this means **reusing the same `correlationID` on every attempt until the payment reaches a terminal state** — generating a new ID for the same payment creates a duplicate. See [Idempotence](./idempotence.md) for details and examples.

## Recommended Format

The Correlation ID format should be consistent and easy to generate, parse and compare. We recommend using a unique alphanumeric sequence, such as a UUID (Universally Unique Identifier) or a GUID (Globally Unique Identifier). These formats usually have a structure similar to:

Examples:
123e4567-e89b-12d3-a456-426655440000

Where each character is a hexadecimal digit.

## Practical Example

Consider a scenario where we are building a payment service in a microservices environment, where many requests are processed concurrently. When a payment request is received, we generate a unique Correlation ID for that transaction. Here is an example implementation in Python:

```python
import uuid

def process_payment(request):
    correlation_id = str(uuid.uuid4())
    # Rest of the request processing using the Correlation ID
```

In this example, Python's UUID library is used to create a unique Correlation ID every time a payment request is received. This ID can be included in log records, request headers and responses, allowing the transaction to be tracked across the whole system.

## Conclusion

The Correlation ID plays a crucial role in the traceability and monitoring of distributed systems. By adopting a consistent format, such as UUID or GUID, developers can ensure effective transaction tracking on the Woovi platform, simplifying debugging and improving operational visibility. Make sure to follow best practices when implementing the Correlation ID in your application.
