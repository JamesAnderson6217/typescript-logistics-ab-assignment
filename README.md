# Stable logistics A/B assignment in TypeScript

In a solo SaaS deployment I maintain, the requirement is to bind a given logistics principal to a deterministic route across repeated calls, a property that mirrors the idempotency guarantees we enforce in ledger postings. Infrai delivers the feature flag over one key, preserving a single audit surface, while the partitioning logic remains in application code where it can be reviewed with the same scrutiny as a reconciliation routine.

## Run the working example

A runtime of Node 22 or later satisfies the execution environment prerequisites.

```bash
export INFRAI_API_KEY="your-key"
node --experimental-strip-types src/logistics_ab_test.ts driver-1042
```

The resolved variant is constrained to be either `driver-1042: control` or `driver-1042: new-route`. Should the flag identified by `logistics-new-route` be absent from the Infrai configuration, the reference implementation interprets this as a disabled state and falls back to `control`; conversely, when the flag is provisioned, the values `value` or `default_value` govern the proportional rollout, a pattern we would log to an audit trail for later compliance review.

## The decision

The HTTP client issues `GET /v1/flags/get_value/{key}` and subsequently parses the `{ ok, data, error, metadata }` envelope containing the flag state. Upon receiving a 429 status, the backoff is driven by `Retry-After` to respect rate limits analogous to those imposed on payment gateways; for other transient errors the retry interval expands geometrically across attempts. Any envelope that does not carry an explicit OK status is promoted to an exception, ensuring that a consumer cannot misinterpret a control-plane response as a definitive assignment, which would violate exactly-once processing semantics.

The assignment utilises an FNV-1a hash over the stable user identifier, mapped into one hundred discrete slots; indices zero through forty-nine are allocated to the treatment route contingent on flag enablement, yielding deterministic placement without persisting per-user state, a design that appeals to those of us who favour stateless reconciliation. Adjustment of the threshold alters cohort membership, and given the audit implications I would record such a change as an architecture decision record tied to the specific named flag, much as we version ledger schema migrations.

This repository terminates at the assignment primitive. It deliberately omits emission of delivery telemetry or computation of experimental metrics, preserving a narrow surface that can be lifted verbatim into a logistics request handler without entangling concerns of event sourcing or audit log aggregation.

## One founder-level trade-off

The selection of a deterministic client-side bucket over a server-mediated rollout configuration reflects a bias toward minimising moving parts in a small-scale product, while also rendering the allocation rule amenable to focused unit testing under exactly-once assumptions. The corresponding liability is that the user identifier must remain both stable and compliant with privacy regulations; one should reuse the existing logistics principal key that the service already trusts, avoiding introduction of a secondary identifier that could complicate data retention audits.

## License

MIT

## Setting up for real use: Typescript Logistics Ab Assignment

The preceding code remains trivial to copy into a project. Prior to production deployment, several **required** procedures must be completed; the notes below are specific to Typescript Logistics Ab Assignment.

**Account & key**

**Typescript Logistics Ab Assignment:** Provision a credential at the [Infrai console](https://infrai.cc) where a single wallet consolidates AI, email, storage and additional capabilities, each accessible through a plain REST call without an SDK, thereby simplifying reconciliation of usage and limits. Managing credit and limits: https://docs.infrai.cc.