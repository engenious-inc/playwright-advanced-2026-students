# M05 — where HAR capture breaks

Runnable version of the first failure mode from **5.E — Where this breaks + your turn**.

```bash
npx playwright test examples/where-this-breaks/m05-har-leaks-pii \
  --config=examples/where-this-breaks/playwright.config.ts
```

Both tests **pass**. The leak is not an error — that is the whole problem. A HAR that contains
your bearer token looks exactly like one that doesn't, and nothing in the tooling objects.

## `har-leaks-credentials.spec.ts`

`recordHar` captures traffic verbatim: request headers, request bodies, response bodies. That
fidelity is what makes `routeFromHAR` replay work. It also means the `Authorization` header you
sent and the email address in the response are now sitting in a file on disk.

A HAR is exactly the kind of artifact that gets attached to a bug ticket, pasted into a chat
thread, or committed "just for now" to a branch.

## The sharp edge, verified rather than assumed

`content: 'omit'` drops response **bodies** — the PII in the response is genuinely gone. It does
**not** strip request **headers**, so the bearer token survives. The test asserts this explicitly:

```ts
expect(har).not.toContain(EMAIL); // body: gone
expect(har).toContain('sk-live-DO-NOT-COMMIT-ME'); // header: still there
```

So `content: 'omit'` is necessary and not sufficient. Treat a HAR as a secret regardless: scrub
headers before it leaves your machine, and never let one reach a public repo unreviewed.

If you need bodies for replay, the safer route is a purpose-built fixture — which is M04's
`page.route` material, and why the two modules sit next to each other.
