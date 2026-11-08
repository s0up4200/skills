# When to Mock

Mock at **system boundaries** only:

- External APIs (payment, email, etc.)
- Databases (sometimes - prefer test DB)
- Time/randomness
- File system (sometimes)

Don't mock:

- Your own classes/modules
- Internal collaborators
- Anything you control

## Where the mock's data comes from

A hand-written mock returns the shape that you believe the system sends, so it agrees with your bug. Feed the adapter's tests from responses recorded from the real system, saved as fixtures, one set for each version that you support (Evans, _Domain-Driven Design_, ch. 14, "Testing at the CONTEXT Boundaries"). Before you save a fixture, replace each token, key, and personal value with a fake one, so that no secret or customer data reaches the repository.

When one interface has two or more implementations (SQLite and Postgres, a fake and the real client), write one contract suite: the same tests check the state after each call, and they run against each implementation. A fake whose `Upsert` replaces a row where the real database merges it passes its own tests and fails in production (Evans, ch. 10, "Assertions").

## Designing for Mockability

At system boundaries, design interfaces that are easy to mock:

**1. Use dependency injection**

Pass external dependencies in rather than creating them internally:

```typescript
// Easy to mock
function processPayment(order, paymentClient) {
  return paymentClient.charge(order.total);
}

// Hard to mock
function processPayment(order) {
  const client = new StripeClient(process.env.STRIPE_KEY);
  return client.charge(order.total);
}
```

**2. Prefer SDK-style interfaces over generic fetchers**

Create specific functions for each external operation instead of one generic function with conditional logic:

```typescript
// GOOD: Each function is independently mockable
const api = {
  getUser: (id) => fetch(`/users/${id}`),
  getOrders: (userId) => fetch(`/users/${userId}/orders`),
  createOrder: (data) => fetch('/orders', { method: 'POST', body: data }),
};

// BAD: Mocking requires conditional logic inside the mock
const api = {
  fetch: (endpoint, options) => fetch(endpoint, options),
};
```

The SDK approach means:
- Each mock returns one specific shape
- No conditional logic in test setup
- Easier to see which endpoints a test exercises
- Type safety per endpoint
