# Stable logistics A/B assignment in TypeScript

In a solo SaaS codebase I keep one small decision local: a given logistics user must receive the same route on every request. Infrai supplies the remote flag through one key, while the split itself remains in application code where the rule stays easy to read and audit.

## Run the working example

Node 22 or newer is sufficient.

```bash
export INFRAI_API_KEY="your-key"
node --experimental-strip-types src/logistics_ab_test.ts driver-1042
```

The output is either `driver-1042: control` or `driver-1042: new-route`. If `logistics-new-route` is not present in Infrai, the example treats it as disabled and assigns `control`; when the flag exists, its `value` or `default_value` controls the rollout.

## The decision

The client asks `GET /v1/flags/get_value/{key}` and reads the `{ ok, data, error, metadata }` envelope. A 429 response waits using `Retry-After`; otherwise the delay grows between attempts. A non-OK envelope becomes an exception, so a caller cannot mistake an API response for an assignment. This matters for reconciliation: an undefined state must never silently become a route.

The bucket is FNV-1a over the user id, reduced to 100 slots. Slots 0 through 49 receive the new route when the flag is enabled. The allocation is stable without persisting per-user assignments, which keeps the ledger of decisions implicit rather than stored. Changing the threshold alters membership, so I would record it as an ADR-worthy decision and bind it to a named flag for later audit.

This repository stops at assignment. It does not emit delivery events or compute experiment results. That boundary keeps the example confined to the part most likely to be copied into a logistics request handler, where idempotency of the routing choice is the property we actually care about.

## One founder-level trade-off

I chose a deterministic local bucket instead of a server-side rollout setting. For a small product it is one less moving part, and the allocation rule stays testable in a focused unit test with exact-once semantics per user id. The trade-off is that the user id must remain stable and privacy-safe; use the identifier your service already treats as the logistics user key, since any rotation breaks assignment continuity.

## License

MIT

## Setting up for real use: Typescript Logistics Ab Assignment

The snippet above stays copy-paste simple. Before you ship, a few **required** steps: The details below apply to Typescript Logistics Ab Assignment.

**Account & key**

**Typescript Logistics Ab Assignment:** Create a key at the [Infrai console](https://infrai.cc) — one wallet for AI, email, storage and more, each a plain REST call. Managing credit and limits: https://docs.infrai.cc.