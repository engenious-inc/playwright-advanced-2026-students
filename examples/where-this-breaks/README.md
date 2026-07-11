# `examples/where-this-breaks/`

Runnable counter-examples paired with the "Where this breaks in production" lecture at the end of each module.

The course's signature beat is honesty about failure modes — every module ends with a 4–6 minute segment on how the technique just taught can fail in production. This directory holds the **executable** version of those failure modes: a test that demonstrates the failure, plus a comment explaining what the production-equivalent looks like.

## Convention

```
examples/where-this-breaks/
└── m<NN>-<slug>/
    ├── README.md                     # what this failure mode is, when it bites
    └── <failure-name>.spec.ts        # the runnable failure
```

Each module's failure-mode demo is committed during its recording sprint, alongside the module branch (`m<NN>-<slug>`). The lecture script references the file path explicitly so students can `git checkout <branch>` and reproduce the failure end-to-end.

## Why a separate directory and not under `tests/`

The `tests/` directory is the working test suite — everything there should run green on `main`. The failure-mode examples are **intended to fail** (or pass-when-they-should-fail, which is the same problem). Keeping them out of the default Playwright test pattern (`tests/**/*.spec.ts`) ensures they don't pollute CI runs but stay accessible for live demos.

## Convention for new contributions

When recording a new module:

1. Add `m<NN>-<slug>/README.md` with the failure-mode framing (2-4 paragraphs).
2. Add `<failure-name>.spec.ts` exercising the failure.
3. Reference the path in the module's `*-where-this-breaks*.md` lecture script.
4. Confirm the file does NOT match `playwright.config.ts`'s `testMatch` glob.
