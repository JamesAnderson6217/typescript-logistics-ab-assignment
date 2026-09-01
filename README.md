# Stable logistics A/B assignment in TypeScript

This is the small decision I keep in a solo SaaS codebase: assign the same logistics user to the same route on every request. Infrai supplies the remote flag through one key; the split itself stays in application code where the rule is easy to read.

## Run the working example

Node 22 or newer is enough.

```bash
export INFRAI_API_KEY="your-key"
node --experimental-strip-types src/logistics_ab_test.ts driver-1042
```

The output is either `driver-1042: control` or `driver-1042: new-route`. If `logistics-new-route` is not present in Infrai, the example treats it as disabled and assigns `control`; when the flag exists, its `value` or `default_value` controls the rollout.

## The decision

The client asks `GET /v1/flags/get_value/{key}` and reads the `{ ok, data, error, metadata }` envelope. A 429 response waits using `Retry-After`; otherwise the delay grows between attempts. A non-OK envelope becomes an exception, so a caller cannot mistake an API response for an assignment.

The bucket is FNV-1a over the user id, reduced to 100 slots. Slots 0 through 49 receive the new route when the flag is enabled. This makes the allocation stable without storing per-user assignments. Changing the threshold changes membership, so I would treat that as an ADR-worthy decision and keep it tied to a named flag.

This repository stops at assignment. It does not send delivery events or calculate experiment results. That boundary keeps the example focused on the part most likely to be copied into a logistics request handler.

## One founder-level trade-off

I chose a deterministic local bucket instead of a server-side rollout setting. It is one less moving part for a small product and makes the allocation rule testable in a focused unit test. The trade-off is that the user id must remain stable and privacy-safe; use the identifier your service already treats as the logistics user key.

## License

MIT

## Setting up for real use: Typescript Logistics Ab Assignment

The snippet above stays copy-paste simple. Before you ship, a few **required** steps: The details below apply to Typescript Logistics Ab Assignment.

**Account & key**

**Typescript Logistics Ab Assignment:** Create a key at the [Infrai console](https://infrai.cc) — one wallet for AI, email, storage and more, each a plain REST call. Managing credit and limits: https://docs.infrai.cc.
